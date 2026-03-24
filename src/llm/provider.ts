import type {
  RawItem,
  EventRecord,
  ExpandedAnalysis,
  AnalyzeCandidateResult,
  LLMProvider,
} from '../types/index.js';

/**
 * Mock LLM provider — returns deterministic analysis for demo / offline use.
 * Real providers (OpenAI, Anthropic, etc.) will implement the same interface.
 */
export class MockLLMProvider implements LLMProvider {
  async analyzeCandidate(item: RawItem): Promise<AnalyzeCandidateResult> {
    return mockAnalyze(item);
  }

  async expandEvent(event: EventRecord): Promise<ExpandedAnalysis> {
    return mockExpand(event);
  }
}

/* ── mock analysis logic ─────────────────────────────── */

function mockAnalyze(item: RawItem): AnalyzeCandidateResult {
  const lower = (item.title + ' ' + item.rawText).toLowerCase();

  const category = inferCategory(lower);
  const scores = inferScores(lower);

  return {
    category,
    fact: truncateAtSentence(item.rawText, 220),
    whyItMatters: generateWhyItMatters(item, category),
    affectedPlayers: inferAffectedPlayers(lower),
    whatToWatch: generateWhatToWatch(item, category),
    scores,
    economicMechanism: inferMechanism(category),
    signalVerdict: scores.total >= 16 ? '结构性信号' : scores.total >= 12 ? '值得跟踪' : '噪音',
    nextSignal: generateWhatToWatch(item, category),
  };
}

function truncateAtSentence(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastPeriod = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('. '));
  if (lastPeriod > maxLen * 0.5) return cut.slice(0, lastPeriod + 1);
  return cut + '…';
}

function inferCategory(text: string): AnalyzeCandidateResult['category'] {
  if (/launch|release|ship|announc|introduce|beta/.test(text))
    return 'products_launches';
  if (/model|infra|gpu|training|benchmark|context/.test(text))
    return 'infra_models';
  if (/revenue|enterprise|deploy|commercial|acqui|funding|raise/.test(text))
    return 'commercial_signals';
  if (/open.?source|community|hugging|arena|benchmark/.test(text))
    return 'open_source_momentum';
  if (/risk|regulat|eu|safety|alignment|friction|ban/.test(text))
    return 'risks_frictions';
  return 'products_launches';
}

function inferScores(text: string): AnalyzeCandidateResult['scores'] {
  let importance = 3;
  let businessRelevance = 3;
  let novelty = 3;
  let followUpValue = 3;

  if (/major|significant|first|breakthrough/.test(text)) importance += 1;
  if (/enterprise|revenue|billion|million|commercial/.test(text)) businessRelevance += 1;
  if (/new|novel|first.ever|unprecedented/.test(text)) novelty += 1;
  if (/roadmap|beta|preview|upcoming|signal/.test(text)) followUpValue += 1;

  if (/openai|anthropic|google|microsoft|meta/.test(text)) importance += 1;
  if (/agent|autonomous|orchestrat/.test(text)) businessRelevance += 1;

  const clamp = (n: number) => Math.min(5, Math.max(1, n));
  importance = clamp(importance);
  businessRelevance = clamp(businessRelevance);
  novelty = clamp(novelty);
  followUpValue = clamp(followUpValue);

  return {
    importance,
    businessRelevance,
    novelty,
    followUpValue,
    total: importance + businessRelevance + novelty + followUpValue,
  };
}

function inferAffectedPlayers(text: string): string[] {
  const players: string[] = [];
  if (/openai/.test(text)) players.push('OpenAI');
  if (/anthropic|claude/.test(text)) players.push('Anthropic');
  if (/google|gemini|deepmind/.test(text)) players.push('Google');
  if (/microsoft|copilot/.test(text)) players.push('Microsoft');
  if (/langchain/.test(text)) players.push('LangChain');
  if (/hugging.?face/.test(text)) players.push('Hugging Face');
  if (/aws|bedrock/.test(text)) players.push('AWS');
  if (/salesforce/.test(text)) players.push('Salesforce');
  if (/stripe/.test(text)) players.push('Stripe');
  if (/nvidia/.test(text)) players.push('NVIDIA');
  if (/apple/.test(text)) players.push('Apple');
  if (/crewai/.test(text)) players.push('CrewAI');
  if (players.length === 0) players.push('AI Agent ecosystem participants');
  return players;
}

function generateWhyItMatters(
  item: RawItem,
  category: AnalyzeCandidateResult['category'],
): string {
  const map: Record<string, string> = {
    products_launches:
      `${item.sourceName} 发布的新产品/功能直接改变了开发者和企业用户的可用工具集，可能重新分配市场注意力和采购预算。`,
    infra_models:
      `底层模型或基础设施的变动影响整个 agent 技术栈的能力上限和成本结构，所有下游应用都需要重新评估技术选型。`,
    commercial_signals:
      `商业化信号反映真实市场需求和付费意愿，是判断 agent 技术从实验走向生产的关键证据。`,
    open_source_momentum:
      `开源生态的动向决定了中小团队的技术可及性，也影响商业产品的竞争壁垒高度。`,
    risks_frictions:
      `监管与风险事件可能改变行业的合规成本和部署边界，需要提前评估对现有方案的影响。`,
  };
  return map[category] ?? map.products_launches;
}

function generateWhatToWatch(
  item: RawItem,
  category: AnalyzeCandidateResult['category'],
): string {
  const map: Record<string, string> = {
    products_launches: '关注开发者采用率、社区反馈和竞品跟进速度。',
    infra_models: '关注基准测试结果、定价变化和下游框架适配进度。',
    commercial_signals: '关注后续财报数据、客户案例公开和竞争对手的定价响应。',
    open_source_momentum: '关注 GitHub star 增速、贡献者数量变化和企业采用案例。',
    risks_frictions: '关注执法案例、行业协会响应和企业合规方案调整。',
  };
  return map[category] ?? map.products_launches;
}

function inferMechanism(category: AnalyzeCandidateResult['category']): string {
  const map: Record<string, string> = {
    products_launches: '降低部署摩擦',
    infra_models: '提升能力边界',
    commercial_signals: '强化商业化证据',
    open_source_momentum: '改善成本结构',
    risks_frictions: '暴露风险合规摩擦',
  };
  return map[category] ?? '证据不足';
}

function mockExpand(event: EventRecord): ExpandedAnalysis {
  return {
    eventId: event.id,
    coreThesis: `${event.sourceName} 的这一动作本质上是对 ${event.category === 'commercial_signals' ? '需求端信号' : '供给端能力'} 的重要验证。`,
    factRestatement: `${event.sourceName} 近期动态：${event.fact}`,
    economicMechanismDetail: `核心经济机制为 ${event.economicMechanism ?? '降低部署摩擦'}，通过改变现有工具链的可用性和成本结构影响下游采购决策。`,
    businessImplication:
      `从商业角度看，此事件反映的是 ${event.category === 'commercial_signals' ? '需求端' : '供给端'} 的结构性变化。` +
      `${event.affectedPlayers.join('、')} 等玩家将直接受到影响。` +
      `如果趋势持续，可能改变现有的采购决策和技术选型逻辑。`,
    competitionAngle:
      `当前 AI Agent 市场仍处于基础设施竞争阶段，${event.sourceName} 的这一动作` +
      `${event.scores.importance >= 4 ? '可能加速市场整合' : '短期内对竞争格局影响有限'}。` +
      `关键变量在于其他头部玩家是否会在 1-2 个季度内做出对应响应。`,
    industryStructureNote: event.scores.importance >= 4
      ? `此事件可能加速 AI Agent 市场从碎片化向平台化整合，头部玩家的先发优势正在转化为生态壁垒。`
      : `短期内对行业格局影响有限，但值得监测竞品的跟进节奏。`,
    frictionsAndRisks:
      `主要摩擦：1) 企业采用的集成成本和学习曲线；2) 与现有工具链的兼容性；3) 数据安全和合规要求。`,
    uncertainty:
      `主要不确定性：1) 实际采用率是否匹配发布时的市场预期；` +
      `2) 技术成熟度是否足以支撑生产环境部署；` +
      `3) 定价和商业模式是否可持续。当前证据不足以做出确定性判断。`,
    scenarioNote:
      `乐观：6个月内出现大型企业标杆案例并引发同业跟进。` +
      `中性：产品在开发者社区获得关注但企业采用缓慢。` +
      `谨慎：产品定位与市场需求存在偏差，采用停留在实验阶段。`,
    nextSignals: [
      '90 天内的开发者采用数据或 API 调用量变化',
      '竞品是否发布对标产品或功能',
      '企业客户公开案例或大规模部署消息',
      '后续融资、收购或合作伙伴关系变动',
    ],
    oneLineTake:
      event.scores.total >= 16
        ? '高优信号——建议持续追踪并纳入周报。'
        : event.scores.total >= 12
          ? '中等信号——值得关注但需等待更多验证数据。'
          : '低优信号——记录在案，暂不需要投入额外研究资源。',
    createdAt: new Date().toISOString(),
  };
}
