import crypto from 'node:crypto';
import type {
  RawItem,
  EventRecord,
  LLMProvider,
  RunContext,
} from '../../types/index.js';

const LLM_CONCURRENCY = 3;

export async function classifyAndScore(
  items: RawItem[],
  provider: LLMProvider,
  ctx: RunContext,
): Promise<EventRecord[]> {
  const results: EventRecord[] = [];

  for (let i = 0; i < items.length; i += LLM_CONCURRENCY) {
    const batch = items.slice(i, i + LLM_CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((item) => analyzeOne(item, provider, ctx)),
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) {
        results.push(r.value);
      } else if (r.status === 'rejected') {
        console.error('  ✗ analysis error:', r.reason);
      }
    }
  }

  return results;
}

async function analyzeOne(
  item: RawItem,
  provider: LLMProvider,
  ctx: RunContext,
): Promise<EventRecord | null> {
  try {
    const analysis = await provider.analyzeCandidate(item);

    const verdict =
      analysis.scores.total >= 16
        ? 'feature'
        : analysis.scores.total >= 12
          ? 'watch'
          : 'ignore';

    return {
      id: crypto.randomUUID().slice(0, 8),
      runId: ctx.runId,
      title: item.title,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      url: item.url,
      publishedAt: item.publishedAt,
      category: analysis.category,
      fact: analysis.fact,
      whyItMatters: analysis.whyItMatters,
      affectedPlayers: analysis.affectedPlayers,
      whatToWatch: analysis.whatToWatch,
      scores: analysis.scores,
      verdict,
      rawExcerpt: item.rawText.slice(0, 300),
      createdAt: ctx.timestamp,
      economicMechanism: analysis.economicMechanism,
      signalVerdict: analysis.signalVerdict,
      nextSignal: analysis.nextSignal,
    };
  } catch (err) {
    console.error(`  ✗ analysis failed for "${item.title}":`, err);
    return null;
  }
}
