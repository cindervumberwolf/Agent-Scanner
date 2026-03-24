# agent_scanner.md

## 0. 这份文档是给 Cursor 的

你正在帮助我做一个 **48 小时内必须跑通的作品集项目**。项目名暂定为 **Agent Scanner / AI Agent Industry Radar**。

请不要把它做成一个大而全的资讯平台，也不要做成一个花哨但空心的 dashboard。这个项目的目标非常明确：

**做出一个能跑通的研究型行业雷达 MVP。**

它必须满足三件事：
1. 能从少量白名单来源里抓到 AI Agent 相关信息。
2. 能筛选并输出一份短小但有判断力的 `Daily Radar`。
3. 用户能针对其中某一条继续追问，拿到更深一层的结构化分析。

这是一个求职作品集项目，不是商业化产品首发。优先级永远是：

**功能打通 > 架构优雅 > 功能丰富**

---

## 1. 项目定位

### 1.1 一句话定义
Agent Scanner 是一个研究型行业雷达 agent。它从少量可信来源中提取 AI Agent 行业动态，筛选出当天最值得看的 3–5 条，并把它们转化成带有商业意义的简明研究笔记。用户可以继续对其中某一条做对话式展开。

### 1.2 这不是新闻聚合器
不要把项目做成“抓新闻 + 自动摘要”。

这个项目的卖点不是“自动获取信息”，而是：
- 从碎片信息中做初步筛选
- 给出“为什么重要”的判断
- 明确影响对象
- 给出后续跟踪信号

输出风格应更像一页研究 memo 的 mini version，而不是一个 RSS 阅读器。

---

## 2. 48 小时 MVP 的硬边界

### 2.1 P0 必做
只做下面这两个闭环：

#### A. Daily Radar
一次运行后，系统输出一份当日简报：
- 只包含 **3–5 条** 精选动态
- 每条动态只输出固定字段：
  - 发生了什么
  - 为什么重要
  - 影响谁
  - 下一步看什么
- 输出结果保存到本地 `events.json`

#### B. Expand Analysis
用户可以对某一条动态继续追问，例如：
- `expand 2`
- `展开第 2 条`
- `expand <event_id>`

系统返回更深一层的结构化分析，至少覆盖：
- 事实重述
- 商业意义
- 竞争/行业结构角度
- 不确定性
- 下一步要看的验证信号

### 2.2 P1 只留接口，不强做
可以提前预留数据结构，但先不真正做完：
- watchlist
- weekly memo
- Telegram / 飞书 / 邮件推送
- scheduler / cron
- approval flow

### 2.3 明确不做
48 小时内不要碰：
- dashboard
- 登录/权限系统
- 数据库
- 复杂前端
- 全网抓取
- X / Discord / Reddit 深度接入
- 复杂评分面板
- 自动生成长篇投资备忘录
- 多步人工审批链路
- 图像识别 / OCR
- 任何会拖慢 demo 打通的“高级能力”

---

## 3. 交付物定义

### 3.1 最终必须交付的东西
到第一版结束时，项目里必须有：

1. 一个可以运行的 `daily radar` 命令或工作流
2. 一个可以运行的 `expand event` 命令或工作流
3. 一个本地持久化文件 `data/events.json`
4. 一个 `mock mode`，确保即使线上抓取失败，demo 仍能跑通
5. 一个最小 README，能让别人 5 分钟内跑起来

### 3.2 演示时的理想流程
演示时只需要走这 4 步：

1. 运行 `daily radar`
2. 展示生成的 3–5 条结果
3. 继续执行 `expand 2`
4. 打开 `events.json`，证明它不是一次性输出，而是有状态沉淀

只要这 4 步顺畅，这个项目就成立。

---

## 4. 技术实现原则

### 4.1 优先做一个“核心引擎 + 薄适配层”
核心逻辑不要绑死在某个框架里。请按下面结构组织：

- `core`：抓取、清洗、分类、评分、输出、持久化
- `adapter/cli`：本地命令行入口，保证一定能跑
- `adapter/openclaw`：如果当前仓库已存在 OpenClaw 约定，则把 daily / expand 暴露为工作流或命令

也就是说：

**先把核心逻辑做成普通 TypeScript/Node 模块，再给 OpenClaw 做一个很薄的接入层。**

这样有两个好处：
- 本地调试快，不被框架细节卡死
- 简历里仍然可以说自己把能力接到了 OpenClaw 风格的 agent / workflow 上

### 4.2 默认技术栈
除非仓库已有明确约定，否则默认：
- Node.js
- TypeScript
- pnpm
- fetch / RSS parser / cheerio 级别的轻抓取
- JSON file persistence
- 一个 LLM provider 抽象层

### 4.3 依赖控制
依赖尽量少。第一版不要引入重型基础设施。

允许的依赖方向：
- RSS/HTML 解析
- schema 校验
- 日志
- CLI 参数解析

不建议第一版引入：
- ORM
- 向量数据库
- 重型消息队列
- headless browser（除非某个关键源非它不可，但默认不要用）

---

## 5. 来源策略

### 5.1 只做白名单来源
第一版只接 **5–8 个白名单来源**，并且尽量选官方博客 / changelog / 稳定页面，不要做野路子抓取。

建议优先接这几类来源：
- 模型公司官方博客 / 新闻页
- agent framework / runtime 官方博客或 changelog
- 开源生态发布页
- 少量稳定的 AI/tech 新闻 RSS

### 5.2 默认配置建议
可以在 `config/sources.ts` 或 `config/sources.json` 里先放一组默认源，格式可配置。默认源不要求完美，但要便于抓取。

建议初始来源按类别覆盖，而不是追求很多站点：
- `model_vendor_1`
- `model_vendor_2`
- `big_tech_ai`
- `agent_tooling`
- `open_source_ecosystem`
- `ai_business_news`

### 5.3 抓取策略
来源抓取只需要做到“足够可用”：
- 优先 RSS
- 其次稳定 HTML 页面
- 不做登录态抓取
- 不做翻页全量历史回溯
- 每次只抓最近若干条
- 某个来源失败时，记录日志并跳过，不要让整次流程崩溃

### 5.4 Mock 模式
必须支持 `mock mode`。

在 `data/mock/raw_items.json` 里准备 10–15 条模拟输入。哪怕网络、源站、API 都出问题，仍然能完整演示：
- 抓取
- 筛选
- 生成 radar
- expand
- 持久化

这个是硬要求。

---

## 6. 产品逻辑与筛选规则

### 6.1 只保留“值得研究”的动态
不是所有动态都应该进 radar。请用一个轻量但稳定的筛选框架。

每条候选动态至少需要判断四个维度，每项 1–5 分：
- `importance`：重要性
- `business_relevance`：商业相关性
- `novelty`：新颖性
- `follow_up_value`：后续跟踪价值

总分直接相加即可，范围 4–20。

### 6.2 入选规则
建议逻辑：
- 先去重
- 再分类
- 再评分
- 默认只保留 `total_score >= 12` 的候选
- 最后选 Top 3–5 条

### 6.3 类别枚举
第一版只允许以下 5 个一级类目：
- `products_launches`
- `infra_models`
- `commercial_signals`
- `open_source_momentum`
- `risks_frictions`

不要扩展到十几个类。第一版分类越少越稳。

---

## 7. 输出风格要求

### 7.1 Daily Radar 的每条结果必须包含
每条结果固定输出下面这些字段：
- `title`
- `category`
- `source_name`
- `source_url`
- `published_at`
- `fact`
- `why_it_matters`
- `affected_players`
- `what_to_watch`
- `score_total`

### 7.2 输出语言
默认输出中文，但要保留原始英文标题或原链接。

### 7.3 风格要求
语言风格要像“简明研究笔记”，不是营销文案。

禁止出现空话式表达：
- “值得关注”
- “前景广阔”
- “有望改变行业”

除非后面立刻补上具体机制。

### 7.4 Daily Radar 渲染格式
建议输出成 markdown：

```md
# AI Agent Daily Radar | YYYY-MM-DD

## 1. Title Here
- Category: infra_models
- Score: 16/20
- Fact: ...
- Why it matters: ...
- Affected players: ...
- What to watch: ...
- Source: ...
```

### 7.5 Expand 输出格式
建议固定为下面 5 段：
- Fact restatement
- Business implication
- Competition / industry structure angle
- Uncertainty / caveat
- Next signals to validate

这样更适合演示，也更容易写 prompt。

---

## 8. 数据结构

### 8.1 RawItem
```ts
interface RawItem {
  sourceName: string;
  sourceUrl: string;
  title: string;
  url: string;
  publishedAt?: string;
  rawText: string;
  fetchedAt: string;
}
```

### 8.2 EventRecord
```ts
interface EventRecord {
  id: string;
  runId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  url: string;
  publishedAt?: string;
  category:
    | 'products_launches'
    | 'infra_models'
    | 'commercial_signals'
    | 'open_source_momentum'
    | 'risks_frictions';
  fact: string;
  whyItMatters: string;
  affectedPlayers: string[];
  whatToWatch: string;
  scores: {
    importance: number;
    businessRelevance: number;
    novelty: number;
    followUpValue: number;
    total: number;
  };
  verdict: 'ignore' | 'watch' | 'feature';
  rawExcerpt: string;
  createdAt: string;
}
```

### 8.3 ExpandedAnalysis
```ts
interface ExpandedAnalysis {
  eventId: string;
  factRestatement: string;
  businessImplication: string;
  competitionAngle: string;
  uncertainty: string;
  nextSignals: string[];
  oneLineTake: string;
  createdAt: string;
}
```

### 8.4 存储文件
建议至少有：
- `data/events.json`
- `data/runs/<run_id>.md`
- `data/mock/raw_items.json`

后续如果要扩展 weekly memo / watchlist，可以再加：
- `data/watchlist.json`
- `data/memos/`

但第一版先不要真正实现 watchlist 逻辑。

---

## 9. Prompt / LLM 契约

### 9.1 分析器的职责
LLM 不是拿来写花活的，而是做下面几件事：
- 判断这条是否与 AI Agent 行业相关
- 给一级分类
- 生成事实描述
- 解释为什么重要
- 指出影响对象
- 指出下一步验证信号
- 打四维分数并给出简要理由

### 9.2 分析输出必须结构化
分析结果必须要求模型输出 JSON，不要让模型自由发挥散文。

目标是得到一个稳定的结构化对象，然后再由本地代码渲染成 markdown。

### 9.3 Prompt 约束
Prompt 里必须明确：
- 事实和判断分开
- 不得把公司自述直接当结论
- 如果证据不足，要承认不确定性
- 商业意义要尽量落到需求、供给、成本、分发、采购、替换成本等机制上
- 不要用空泛词替代分析

### 9.4 Expand Prompt 约束
Expand 模式不是“重写更长版摘要”，而是对某条已入选事件做二次分析。

必须重点回答：
- 这件事反映的是需求变化、供给变化、竞争变化，还是商业化变化？
- 对哪类玩家更敏感？
- 这是短期噪音还是值得持续跟踪的信号？
- 下一次应该看什么证据来验证判断？

---

## 10. 模块拆分建议

建议按照下面模块划分，命名可略调，但边界尽量保留：

```text
src/
  adapters/
    cli/
      commands.ts
    openclaw/
      dailyRadar.ts
      expandEvent.ts
  config/
    sources.ts
  core/
    ingest/
      fetchSources.ts
      parseRss.ts
      parseHtml.ts
      normalizeRawItems.ts
    analysis/
      dedupe.ts
      classifyAndScore.ts
      selectTopEvents.ts
      expandAnalysis.ts
    storage/
      eventStore.ts
      runStore.ts
    render/
      renderDailyRadar.ts
      renderExpandedAnalysis.ts
  llm/
    provider.ts
    prompts/
      analyzeCandidate.md
      expandEvent.md
  types/
    index.ts
  index.ts
```

### 10.1 边界要求
- `ingest` 只负责拿到原始内容
- `analysis` 只负责去重、分类、评分、筛选
- `storage` 只负责读写文件
- `render` 只负责 markdown 输出
- `adapter` 只负责接收命令并调用 core

不要把一切都写进一个 `scanner.ts` 里。

---

## 11. 命令与入口

至少提供一个本地 CLI。命令名称可以自行调整，但必须包含这两个能力：

```bash
pnpm radar:run
pnpm radar:run --mock
pnpm radar:expand 2
pnpm radar:expand <event_id>
```

### 11.1 radar:run 行为
流程：
1. 读取来源配置
2. 拉取原始 items
3. 去重
4. 调用分析器生成结构化候选
5. 过滤低分项
6. 选 Top 3–5
7. 持久化到 `events.json`
8. 生成一份 markdown radar
9. 在终端打印结果路径和摘要

### 11.2 radar:expand 行为
流程：
1. 从 `events.json` 读取最近一轮结果
2. 根据 index 或 event_id 找到目标事件
3. 生成结构化展开分析
4. 输出 markdown
5. 可选持久化到 `data/runs/expanded_<id>.md`

---

## 12. OpenClaw 接入建议

如果当前仓库已经存在 OpenClaw 或类似 agent runtime 约定，请做一个很薄的接入层：

- `dailyRadar`：调用 core 的 run pipeline
- `expandEvent`：调用 core 的 expand pipeline

接入层不要重新实现任何业务逻辑，只做参数解析和结果返回。

### 12.1 接入目标
演示时只需要能说明两点：
- 这个能力可以被 agent/workflow 调用
- 它不是一次性脚本，而是一个可复用的扫描动作

### 12.2 如果接入卡住
如果 OpenClaw 适配花太多时间，立刻退回 CLI 版本，先保证 demo 跑通。然后再补一个极薄的 adapter。

---

## 13. 实现顺序（强约束）

请严格按这个顺序推进，不要乱开战线。

### Phase 1：先把骨架搭起来
- 初始化项目结构
- 定义 types
- 写文件存储层
- 写 mock 数据
- 写 CLI 空壳命令

### Phase 2：先打通 mock pipeline
- `radar:run --mock` 能输出 3–5 条 radar
- `radar:expand <id>` 能展开其中一条
- `events.json` 能正确落盘

### Phase 3：再接真实来源
- 接入 2–3 个最稳的真实源
- 支持部分失败不崩
- 去重逻辑可用

### Phase 4：补 OpenClaw adapter
- 保持 adapter 很薄
- 不改 core 的边界

### Phase 5：补 README 和 demo 文案
- 写运行说明
- 准备演示步骤
- 保证别人拿到仓库能本地复现

这个顺序不要反。

---

## 14. 验收标准

只有满足下面这些条件，才算第一版完成：

### 14.1 功能验收
- `radar:run --mock` 必须稳定成功
- `radar:run` 在部分来源失败时仍可产出结果
- `radar:expand` 能对某一条事件做展开分析
- `events.json` 中能看到最新一次产物
- 输出 markdown 清晰可读

### 14.2 工程验收
- 核心逻辑和 adapter 分层明确
- 没有把所有逻辑塞进一个文件
- 错误处理基本存在
- README 至少包含安装、配置、运行、demo 说明

### 14.3 产品验收
最终输出要让人感觉这是“研究型雷达”，而不是“几条新闻摘要”。

只要看到结果的人能直观理解：
- 系统帮我筛过了
- 系统能说出为什么重要
- 我还能继续对某一条深入追问

这个 MVP 就成立。

---

## 15. Demo 模式文案建议

演示时尽量不要花太多时间解释架构，重点展示闭环。

建议 demo 顺序：

1. `pnpm radar:run --mock`
2. 展示生成的 3–5 条 radar
3. 打开其中一条，执行 `pnpm radar:expand 2`
4. 展示本地 `events.json`
5. 如果 OpenClaw adapter 已接好，再补一句：同一能力也能作为 agent/workflow 被调用

---

## 16. 后续扩展钩子（先留，不实现）

为了和 V1 愿景保持一致，第一版数据结构里可以预留下面这些未来能力，但不要真的做完：
- `watchlist`
- `weekly memo`
- `distribution channels`
- `approval step`

第一版最重要的是把 `daily radar + expand + persistence` 跑通。

---

## 17. 给 Cursor 的最后提醒

做这个项目时，任何时候都不要忘记下面这三条：

1. **少即是多。** 3 个功能打通，胜过 10 个功能半成品。
2. **先有 mock mode，再接真实源。** 没有 mock，demo 风险太大。
3. **把它做成“研究 agent”，不是“摘要机器人”。**

如果实现过程中出现选择困难，优先保住这条主线：

**从来源抓到信息 -> 产出 Daily Radar -> 用户展开某条 -> 本地持久化。**

只要这条链路通了，这个项目就已经足够拿来讲故事、写简历、做面试展示。
