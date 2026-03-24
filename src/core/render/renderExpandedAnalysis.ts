import type { EventRecord, ExpandedAnalysis } from '../../types/index.js';

export function renderExpandedAnalysis(
  event: EventRecord,
  analysis: ExpandedAnalysis,
): string {
  const lines: string[] = [
    `# Expanded Analysis: ${event.title}`,
    '',
    `> Event ID: ${event.id} | Source: ${event.sourceName} | Score: ${event.scores.total}/20`,
    '',
  ];

  if (analysis.coreThesis) {
    lines.push(`> **核心判断**: ${analysis.coreThesis}`, '');
  }

  lines.push('## 1. 事实重述');
  lines.push('', analysis.factRestatement, '');

  lines.push('## 2. 经济机制');
  lines.push('', analysis.economicMechanismDetail ?? analysis.businessImplication, '');

  lines.push('## 3. 竞争与行业结构');
  lines.push('', analysis.competitionAngle);
  if (analysis.industryStructureNote) {
    lines.push('', analysis.industryStructureNote);
  }
  lines.push('');

  lines.push('## 4. 摩擦与不确定性');
  lines.push('', analysis.frictionsAndRisks ?? analysis.uncertainty);
  if (analysis.frictionsAndRisks && analysis.uncertainty && analysis.frictionsAndRisks !== analysis.uncertainty) {
    lines.push('', analysis.uncertainty);
  }
  lines.push('');

  if (analysis.scenarioNote) {
    lines.push('## 5. 情景展望');
    lines.push('', analysis.scenarioNote, '');
  }

  const signalSection = analysis.scenarioNote ? '6' : '5';
  lines.push(`## ${signalSection}. 后续验证信号`);
  lines.push('');
  for (let i = 0; i < analysis.nextSignals.length; i++) {
    lines.push(`${i + 1}. ${analysis.nextSignals[i]}`);
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push(`**One-line take**: ${analysis.oneLineTake}`);
  lines.push('');
  lines.push(`*Generated at ${analysis.createdAt} by Agent Scanner*`);

  return lines.join('\n');
}
