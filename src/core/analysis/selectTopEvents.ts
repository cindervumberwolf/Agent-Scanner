import type { EventRecord } from '../../types/index.js';

const DEFAULT_MIN_SCORE = 12;
const DEFAULT_TOP_N = 5;

export function selectTopEvents(
  candidates: EventRecord[],
  minScore = DEFAULT_MIN_SCORE,
  topN = DEFAULT_TOP_N,
): EventRecord[] {
  return candidates
    .filter((e) => e.scores.total >= minScore)
    .sort((a, b) => b.scores.total - a.scores.total)
    .slice(0, topN);
}
