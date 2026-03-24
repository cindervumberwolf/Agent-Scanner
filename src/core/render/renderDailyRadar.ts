import type { EventRecord } from '../../types/index.js';

export function renderDailyRadar(events: EventRecord[], date: string): string {
  const lines: string[] = [
    `# AI Agent Daily Radar | ${date}`,
    '',
    `> 本期共筛选出 ${events.length} 条值得关注的行业动态。`,
    '',
  ];

  events.forEach((event, i) => {
    const idx = i + 1;
    lines.push(`## ${idx}. ${event.title}`);
    lines.push('');
    lines.push(`- **Category**: ${formatCategory(event.category)}`);
    lines.push(`- **Score**: ${event.scores.total}/20`);
    lines.push(`- **Fact**: ${event.fact}`);
    lines.push(`- **Why it matters**: ${event.whyItMatters}`);
    lines.push(`- **Affected players**: ${event.affectedPlayers.join(', ')}`);
    lines.push(`- **What to watch**: ${event.whatToWatch}`);

    const analysis = compactAnalysisLine(event);
    if (analysis) lines.push(`- **Analysis**: ${analysis}`);

    lines.push(`- **Source**: [${event.sourceName}](${event.url})`);
    lines.push('');
  });

  lines.push('---');
  lines.push(`*Generated at ${new Date().toISOString()} by Agent Scanner*`);

  return lines.join('\n');
}

function compactAnalysisLine(event: EventRecord): string | null {
  const parts: string[] = [];

  if (event.economicMechanism)
    parts.push(`机制：${event.economicMechanism}`);
  if (event.signalVerdict)
    parts.push(`判断：${event.signalVerdict}`);
  if (event.nextSignal)
    parts.push(`下个信号：${event.nextSignal}`);

  return parts.length > 0 ? parts.join(' ｜ ') : null;
}

const CATEGORY_LABELS: Record<string, string> = {
  products_launches: '产品发布',
  infra_models: '基础设施 & 模型',
  commercial_signals: '商业化信号',
  open_source_momentum: '开源生态',
  risks_frictions: '风险 & 摩擦',
};

function formatCategory(cat: string): string {
  return `${CATEGORY_LABELS[cat] ?? cat} (${cat})`;
}
