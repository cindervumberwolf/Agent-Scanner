# Agent Radar — AI Agent 行业研究雷达

从白名单来源抓取 AI Agent 行业动态，筛选出每日最值得关注的 3–5 条，输出带商业判断的结构化研究笔记。支持对单条事件做交互式深度展开分析。

## 快速开始

```bash
# 安装
pnpm install

# 配置 LLM（复制并填入你的 API key）
cp .env.example .env

# 用 mock 数据跑一次（不需要网络和 API）
pnpm radar:run --mock

# 用真实 RSS + 真实 LLM 跑
pnpm radar:run --llm real

# 展开第 1 条做深度分析
pnpm radar:expand 1 --llm real
```

## 它不是什么

这不是新闻聚合器，不是 RSS 阅读器，不是"抓新闻 + 自动摘要"。

它是一个**研究型行业雷达**。输出的每条动态都带有：
- 事实描述（fact）
- 为什么重要（whyItMatters）—— 落到具体经济机制
- 经济机制标注（economicMechanism）—— 如"降低部署摩擦""强化商业化证据"
- 信号分级（signalVerdict）—— 噪音 / 值得跟踪 / 结构性信号
- 影响对象 + 后续验证信号

## Pipeline

```
RSS / Mock JSON
      │
      ▼
  fetchSources()         → RawItem[]
      │
      ▼
  normalizeRawItems()    → RawItem[] (cleaned)
      │
      ▼
  dedupeRawItems()       → RawItem[] (unique)
      │
      ▼
  classifyAndScore()     → EventRecord[] (LLM 四维评分 + 经济机制 + 信号分级)
      │
      ▼
  selectTopEvents()      → EventRecord[] (top 3–5, score ≥ 12)
      │
      ├──▶ events.json         持久化
      ├──▶ runs/<id>.md        Markdown 归档
      └──▶ runs/<id>.raw.json  原始数据快照
```

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm radar:run --mock` | Mock 数据 + Mock 分析器 |
| `pnpm radar:run --mock --llm real` | Mock 数据 + 真实 LLM 分析 |
| `pnpm radar:run --llm real` | 真实 RSS + 真实 LLM |
| `pnpm radar:expand <N> --llm real` | 展开第 N 条事件 |
| `pnpm typecheck` | TypeScript 类型检查 |

## Demo 流程

```bash
# 1. 运行 radar
pnpm radar:run --llm real

# 2. 查看输出的 3–5 条精选动态

# 3. 展开某条做深度分析
pnpm radar:expand 1 --llm real

# 4. 查看 data/events.json — 证明有状态沉淀
```

## OpenClaw 集成

项目可通过 [OpenClaw](https://openclaw.ai) 作为 agent skill 调用。

```bash
# 通过 wrapper 调用
node scripts/agent-scanner-openclaw.mjs run
node scripts/agent-scanner-openclaw.mjs latest
node scripts/agent-scanner-openclaw.mjs expand 2
```

Wrapper 只暴露 3 个白名单动作（run / latest / expand），不接受任意参数。详见 [openclaw/README.md](openclaw/README.md)。

## 技术栈

- TypeScript + Node.js
- 3 个运行时依赖：`commander`、`dotenv`、`rss-parser`
- LLM：OpenAI-compatible API（当前接 DeepSeek）
- 持久化：JSON 文件 + Markdown 归档
- 零前端、零数据库、零 SDK 大包

## 项目结构

```
src/
  adapters/cli/        CLI 入口（commander）
  config/              来源配置 + 环境变量
  core/
    ingest/            RSS 抓取 + 清洗
    analysis/          去重 → 分类评分 → 筛选 → 展开
    storage/           events.json + runs/ 读写
    render/            Markdown 渲染
  llm/
    provider.ts        MockLLMProvider
    factory.ts         Provider 工厂
    providers/         OpenAI-compatible 实现
    prompts/           结构化 prompt
  types/               领域类型定义
scripts/               OpenClaw wrapper
openclaw/              Skill 定义 + 集成文档
data/mock/             12 条模拟数据
```

## License

MIT
