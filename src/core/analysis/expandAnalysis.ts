import type {
  EventRecord,
  ExpandedAnalysis,
  LLMProvider,
} from '../../types/index.js';

export async function expandAnalysis(
  event: EventRecord,
  provider: LLMProvider,
): Promise<ExpandedAnalysis> {
  return provider.expandEvent(event);
}
