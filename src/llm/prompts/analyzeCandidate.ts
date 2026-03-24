import type { RawItem } from '../../types/index.js';

export interface ChatMessage {
  role: string;
  content: string;
}

export function buildAnalyzeCandidateMessages(item: RawItem): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: userPrompt(item) },
  ];
}

const SYSTEM = `你是一个专注于 AI Agent 行业的研究分析员。你的任务是分析一条行业动态，输出结构化分析结果。

分析思路（内部使用，不要在输出中写出框架名称）：
1. 先判断事件属于哪个层次：产品发布 / 基础设施 / 商业化 / 融资合作 / 风险摩擦
2. 再判断它影响的核心经济机制：扩大需求、提升能力边界、降低部署摩擦、改善成本结构、强化分发杠杆、提高留存/切换成本、强化商业化证据、暴露风险/合规摩擦
3. 再判断这条动态更像噪音、值得跟踪的信号、还是结构性信号
4. 识别后续最值得看的一个验证证据

输出规则：
1. category 只能从以下 5 个中选一个：products_launches, infra_models, commercial_signals, open_source_momentum, risks_frictions
2. fact 只陈述客观事实，不掺杂判断
3. whyItMatters 必须落到具体机制（需求、供给、成本、分发、替换成本等），禁止"值得关注""前景广阔"等空话
4. economicMechanism 用一个简短短语概括核心经济机制，从以下方向选最贴近的：扩大需求 / 提升能力边界 / 降低部署摩擦 / 改善成本结构 / 强化分发杠杆 / 提高留存切换成本 / 强化商业化证据 / 暴露风险合规摩擦。如果证据不足，写"证据不足"
5. signalVerdict 只允许三选一：噪音 / 值得跟踪 / 结构性信号
6. nextSignal 写一句很短的话，说明后续最值得看的一个验证信号
7. 四维评分每项 1–5 整数，total 是四项之和
8. affectedPlayers 最多列 5 个，优先写具体公司名
9. 如果证据不足，要在分析中承认不确定性，不要硬套结论

严格只输出 JSON。不要 markdown 代码块，不要解释，不要任何额外文本。`;

function userPrompt(item: RawItem): string {
  return `请分析以下 AI Agent 行业动态：

来源：${item.sourceName}
标题：${item.title}
原文：
${item.rawText}

输出如下 JSON（字段名不可改）：
{
  "category": "五选一",
  "fact": "简明事实描述，中文，1-2句",
  "whyItMatters": "为什么重要，中文，落到具体机制",
  "affectedPlayers": ["玩家1", "玩家2"],
  "whatToWatch": "后续验证信号，中文",
  "economicMechanism": "核心经济机制短语",
  "signalVerdict": "噪音/值得跟踪/结构性信号 三选一",
  "nextSignal": "后续最值得看的一个验证信号",
  "scores": {
    "importance": 1,
    "businessRelevance": 1,
    "novelty": 1,
    "followUpValue": 1,
    "total": 4
  }
}`;
}
