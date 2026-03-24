# Agent Scanner — Phase 1 & 2 Code Review 文档

> 生成时间: 2026-03-24 | 版本: 0.1.0 | 状态: Phase 2 完成，pipeline 端到端打通

---

## 1. 仓库结构

```
agent-scanner/
├── package.json              # 项目配置、scripts 定义
├── tsconfig.json             # TypeScript 编译配置
├── pnpm-lock.yaml            # 依赖锁定
├── .gitignore
├── agent_scanner.md          # 原始需求 spec
├── REVIEW.md                 # ← 本文件
│
├── src/
│   ├── index.ts              # 公共导出入口
│   │
│   ├── types/
│   │   └── index.ts          # 所有领域类型定义
│   │
│   ├── config/
│   │   └── sources.ts        # 白名单来源配置（6个默认源）
│   │
│   ├── llm/
│   │   └── provider.ts       # LLMProvider 接口 + MockLLMProvider 实现
│   │
│   ├── core/
│   │   ├── pipeline.ts       # ★ 核心编排：runDailyRadar / runExpandEvent
│   │   │
│   │   ├── ingest/
│   │   │   ├── fetchSources.ts       # mock/live 来源获取
│   │   │   └── normalizeRawItems.ts  # 原始数据清洗
│   │   │
│   │   ├── analysis/
│   │   │   ├── dedupe.ts             # 标题级去重
│   │   │   ├── classifyAndScore.ts   # 分类 + 四维评分 + verdict
│   │   │   ├── selectTopEvents.ts    # 阈值过滤 + Top-N 选择
│   │   │   └── expandAnalysis.ts     # 展开分析入口
│   │   │
│   │   ├── storage/
│   │   │   ├── eventStore.ts         # events.json CRUD
│   │   │   └── runStore.ts           # runs/ 目录 markdown 写入
│   │   │
│   │   └── render/
│   │       ├── renderDailyRadar.ts         # Radar → markdown
│   │       └── renderExpandedAnalysis.ts   # Expand → markdown
│   │
│   └── adapters/
│       └── cli/
│           └── commands.ts   # CLI 入口（commander）
│
└── data/
    ├── mock/
    │   └── raw_items.json    # 12 条模拟行业动态
    ├── events.json           # ★ 持久化产物（运行后生成）
    └── runs/                 # 每次运行 / 展开的 markdown 存档
```

---

## 2. 关键命令

| 命令 | 说明 | 状态 |
|------|------|------|
| `pnpm radar:run --mock` | 用 mock 数据跑完整 pipeline | ✅ 已打通 |
| `pnpm radar:run` | 用真实来源跑 pipeline | ⬜ Phase 3 |
| `pnpm radar:expand <N>` | 对第 N 条事件做展开分析 | ✅ 已打通 |
| `pnpm radar:expand <id>` | 按 event ID 展开 | ✅ 已打通 |
| `pnpm typecheck` | TypeScript 类型检查 | ✅ 零错误 |

---

## 3. 关键文件说明

### 3.1 `src/types/index.ts` — 领域类型

定义了 spec 要求的全部数据结构：

- **RawItem**: 来源原始数据（fetch 阶段产物）
- **EventRecord**: 分析后的事件记录（含四维评分、verdict、category）
- **ExpandedAnalysis**: 展开分析结果（5 段式结构）
- **LLMProvider**: LLM 抽象接口（`analyzeCandidate` + `expandEvent`）
- **SourceConfig**: 来源配置
- **RunContext**: pipeline 运行上下文
- 预留了 `WatchlistEntry` 和 `WeeklyMemoStub` 未来钩子

### 3.2 `src/llm/provider.ts` — Mock LLM Provider

当前唯一的 LLM 实现，纯规则驱动，不依赖任何 API：

- **inferCategory**: 基于关键词匹配分配一级类目
- **inferScores**: 基于关键词加分的四维评分（importance / businessRelevance / novelty / followUpValue）
- **inferAffectedPlayers**: 提取涉及玩家
- **mockExpand**: 生成 5 段式展开分析

**Review 注意点**:
- Mock 逻辑目前偏简单，大部分事件落入 `products_launches`
- `whyItMatters` 和 `whatToWatch` 是基于 category 的模板，差异化不够
- Phase 3/4 接入真实 LLM 后会自然解决

### 3.3 `src/core/pipeline.ts` — 核心编排

两个主函数：

**runDailyRadar(provider, mock)**:
1. fetchSources → 2. normalize → 3. dedupe → 4. classifyAndScore → 5. selectTopEvents → 6. appendEvents → 7. renderDailyRadar → 8. saveRunMarkdown

**runExpandEvent(query, provider)**:
1. findEventByIndexOrId → 2. expandAnalysis → 3. renderExpandedAnalysis → 4. saveExpandedMarkdown

### 3.4 `src/core/analysis/classifyAndScore.ts` — 分类评分

- 逐条调用 LLMProvider.analyzeCandidate
- 根据 total score 自动设置 verdict: ignore(<12) / watch(12-15) / feature(≥16)
- 单条失败不阻断整个 pipeline（catch + log）

### 3.5 `src/core/storage/eventStore.ts` — 事件持久化

- `loadEvents` / `saveEvents` / `appendEvents`: JSON 文件读写
- `getLatestRunEvents`: 按 runId 取最近一次结果
- `findEventByIndexOrId`: 支持数字索引（1-based）和 UUID 前缀查找

### 3.6 `data/mock/raw_items.json` — Mock 数据

12 条模拟 AI Agent 行业动态，覆盖：
- 模型厂商: Anthropic MCP v2, OpenAI Codex Agent, Google Gemini 2.5
- 大厂 AI: Microsoft Copilot Studio, AWS Bedrock
- 商业信号: Salesforce Agentforce 增长, CrewAI 融资, Stripe Agent Commerce
- 开源生态: Hugging Face Agent Arena
- 监管风险: EU AI Act Article 52
- 基础设施: NVIDIA NIM Agent Blueprints

---

## 4. 数据流示意

```
[Sources / Mock JSON]
        │
        ▼
   fetchSources()        → RawItem[]
        │
        ▼
   normalizeRawItems()   → RawItem[] (cleaned)
        │
        ▼
   dedupeRawItems()      → RawItem[] (unique)
        │
        ▼
   classifyAndScore()    → EventRecord[] (with scores & verdict)
        │                   uses LLMProvider.analyzeCandidate()
        ▼
   selectTopEvents()     → EventRecord[] (top 3-5, score ≥ 12)
        │
        ├──▶ appendEvents()       → data/events.json
        │
        └──▶ renderDailyRadar()   → markdown string
                │
                └──▶ saveRunMarkdown() → data/runs/<runId>.md
```

---

## 5. 依赖清单

| 包名 | 版本 | 用途 |
|------|------|------|
| commander | ^13.1.0 | CLI 参数解析 |
| typescript | ^5.7.0 | 类型系统 (devDep) |
| tsx | ^4.19.0 | 直接运行 TS (devDep) |
| @types/node | ^22.0.0 | Node.js 类型 (devDep) |

零运行时重依赖，符合 spec 的"依赖尽量少"要求。

---

## 6. 已知限制 & 二轮收敛建议

### 6.1 Mock 分析器精度
- 当前评分为关键词匹配规则，非 LLM 驱动
- 大部分事件被归入 `products_launches`，category 多样性不足
- **建议**: Phase 3/4 接入真实 LLM 后自然解决；短期可微调关键词权重

### 6.2 Expand 内容模板化
- mock expand 输出结构正确但内容相似度高
- **建议**: 接入真实 LLM 后每条 expand 会有实质差异

### 6.3 真实来源 (Phase 3 TODO)
- `fetchSources` 的 live 模式只有空壳
- **建议**: 优先接 RSS（rss-parser 包），其次稳定 HTML（cheerio）

### 6.4 OpenClaw Adapter (Phase 4 TODO)
- `src/adapters/openclaw/` 目录尚未创建
- **建议**: 创建极薄的 adapter 调用 pipeline.ts 的两个主函数即可

### 6.5 错误处理
- 单条分析失败会 catch + log，不阻断 pipeline ✅
- 文件读写失败有 try-catch 兜底 ✅
- **建议**: 后续可加结构化日志

### 6.6 幂等性
- 多次运行 `radar:run` 会 append 到 events.json
- `getLatestRunEvents` 按 runId 隔离，查询无问题
- **建议**: 可考虑加 `--clean` 参数或按日期覆盖

---

## 7. 验收检查表

| 验收项 | 状态 |
|--------|------|
| `radar:run --mock` 稳定成功 | ✅ |
| 输出 3-5 条精选 radar | ✅ (5 条) |
| 每条含 fact / why / affected / watch / score | ✅ |
| `radar:expand <N>` 能展开某条 | ✅ |
| Expand 输出 5 段式结构 | ✅ |
| events.json 正确落盘 | ✅ |
| runs/ 目录 markdown 存档 | ✅ |
| TypeScript 零类型错误 | ✅ |
| 核心逻辑与 adapter 分层明确 | ✅ |
| 没有把所有逻辑塞进一个文件 | ✅ (15 个模块文件) |
| 依赖控制在最小范围 | ✅ (2 个 runtime dep) |

---

## 8. Phase 3A 新增：真实 LLM Provider

> 完成时间: 2026-03-24 | 数据源仍使用 mock，仅替换分析器

### 8.1 新增文件

| 文件 | 职责 |
|------|------|
| `src/config/env.ts` | 从 `.env` + `process.env` 读取 LLM 配置，mock 模式不校验 key |
| `src/llm/factory.ts` | 根据 `llmMode` 返回 Mock 或 Real provider |
| `src/llm/providers/openaiCompatible.ts` | OpenAI-compatible 真实 LLM，含重试 / JSON 清洗 / mock fallback |
| `src/llm/prompts/analyzeCandidate.ts` | 分析 prompt，要求模型输出严格 JSON，中文叙述 |
| `src/llm/prompts/expandEvent.ts` | 展开 prompt，5 段式深度分析 |
| `.env.example` | 环境变量模板 |

### 8.2 修改文件

| 文件 | 改动 |
|------|------|
| `src/adapters/cli/commands.ts` | 新增 `--llm <mock\|real>` 参数，接入 env + factory |
| `src/core/analysis/classifyAndScore.ts` | 改为 batch 并发（3 路），支持 `Promise.allSettled` |
| `package.json` | 新增 `dotenv` 依赖 |
| `.gitignore` | 新增 `.env.local` |

### 8.3 命令矩阵

| 命令 | 数据源 | 分析器 | 状态 |
|------|--------|--------|------|
| `pnpm radar:run --mock` | mock | 默认(env/mock) | ✅ |
| `pnpm radar:run --mock --llm mock` | mock | MockLLMProvider | ✅ |
| `pnpm radar:run --mock --llm real` | mock | DeepSeek (real) | ✅ |
| `pnpm radar:expand 1 --llm real` | events.json | DeepSeek (real) | ✅ |
| `pnpm radar:expand 1 --llm mock` | events.json | MockLLMProvider | ✅ |

### 8.4 Real vs Mock 输出对比

| 维度 | Mock | Real (DeepSeek) |
|------|------|-----------------|
| Category 分布 | 全部 products_launches | 4 个类别覆盖 |
| Fact | 截断英文原文 | 中文重述，聚焦关键事实 |
| Why it matters | category 模板 | 落到需求/供给/成本/分发机制 |
| Affected players | 仅 1 个 | 3-5 个含竞争对手 |
| Expand 深度 | 模板 5 段 | 深度研究，含产业结构判断 |

### 8.5 容错机制

- HTTP 429 / 5xx → 重试 1 次（2s 延迟）
- 请求超时 60s → AbortController 中断
- JSON parse 失败 → 重新请求 1 次
- 两次都失败 → fallback 到 MockLLMProvider + console.warn
- 单条分析失败不阻断 pipeline（Promise.allSettled）
- 并发控制: 3 路 batch，避免 rate limit

### 8.6 依赖变化

| 包名 | 版本 | 用途 |
|------|------|------|
| dotenv | ^16.4.0 | 读取 .env 文件 |

仍然只有 2 个 runtime 依赖（commander + dotenv），零 SDK 大包。
