import type { EventRecord } from '../../types/index.js';
import type { ChatMessage } from './analyzeCandidate.js';

export function buildExpandEventMessages(event: EventRecord): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: userPrompt(event) },
  ];
}

const SYSTEM = `你是一个专注于 AI Agent 行业的深度研究分析员。你的任务是对一条已入选事件做二次深度分析。

这不是"重写更长版摘要"，而是像初级行业研究员给 PM 写的一页研究备忘。

分析思路（内部使用，不要在输出中暴露框架名称）：
- 先给出核心判断：这件事的本质是什么
- 再分析经济机制：影响的是需求、供给、成本、分发还是留存
- 再看行业结构：对竞争格局和玩家定位有什么影响
- 再评估摩擦与风险：采用障碍、监管风险、技术不成熟
- 最后给后续验证信号：接下来该看什么证据

规则：
- 事实和判断分开，先事实后判断
- 商业意义落到具体机制，不要空泛词
- 只有在信息支持时才展开分析，不要机械套框架
- 对不确定性要诚实：如果证据不足，就写"证据不足以判断"
- scenarioNote 写一段简短的情景展望（乐观/中性/谨慎），不要写成长文
- nextSignals 给 2-3 条，每条一句话

严格只输出 JSON。不要 markdown 代码块，不要解释，不要任何额外文本。`;

function userPrompt(event: EventRecord): string {
  const mechanism = event.economicMechanism ? `\n经济机制：${event.economicMechanism}` : '';
  const signal = event.signalVerdict ? `\n信号判断：${event.signalVerdict}` : '';

  return `请对以下事件做深度展开分析：

标题：${event.title}
来源：${event.sourceName}
分类：${event.category}
事实：${event.fact}
重要性：${event.whyItMatters}
影响对象：${event.affectedPlayers.join('、')}
评分：${event.scores.total}/20${mechanism}${signal}

输出如下 JSON（字段名不可改）：
{
  "coreThesis": "核心判断，一句话概括这件事的本质含义",
  "factRestatement": "事实重述，中文，补充产业语境",
  "economicMechanismDetail": "经济机制详解：影响的是需求/供给/成本/分发/留存中的哪一环，具体如何影响",
  "competitionAngle": "竞争与行业结构分析，中文",
  "industryStructureNote": "对行业格局的结构性影响，如果证据不足写'证据不足以判断'",
  "frictionsAndRisks": "采用摩擦、技术风险、监管风险等，中文",
  "scenarioNote": "情景展望（乐观/中性/谨慎各一句）",
  "nextSignals": ["验证信号1", "验证信号2", "验证信号3"],
  "oneLineTake": "一句话判断，中文"
}`;
}
