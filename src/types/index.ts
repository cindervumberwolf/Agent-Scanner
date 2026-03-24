/* ── Domain types for Agent Scanner ── */

export type Category =
  | 'products_launches'
  | 'infra_models'
  | 'commercial_signals'
  | 'open_source_momentum'
  | 'risks_frictions';

export type Verdict = 'ignore' | 'watch' | 'feature';

export type SignalVerdict = '噪音' | '值得跟踪' | '结构性信号';

export interface RawItem {
  sourceName: string;
  sourceUrl: string;
  title: string;
  url: string;
  publishedAt?: string;
  rawText: string;
  fetchedAt: string;
}

export interface Scores {
  importance: number;       // 1-5
  businessRelevance: number; // 1-5
  novelty: number;          // 1-5
  followUpValue: number;    // 1-5
  total: number;            // 4-20
}

export interface EventRecord {
  id: string;
  runId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  url: string;
  publishedAt?: string;
  category: Category;
  fact: string;
  whyItMatters: string;
  affectedPlayers: string[];
  whatToWatch: string;
  scores: Scores;
  verdict: Verdict;
  rawExcerpt: string;
  createdAt: string;
  economicMechanism?: string;
  signalVerdict?: SignalVerdict;
  nextSignal?: string;
}

export interface ExpandedAnalysis {
  eventId: string;
  factRestatement: string;
  businessImplication: string;
  competitionAngle: string;
  uncertainty: string;
  nextSignals: string[];
  oneLineTake: string;
  createdAt: string;
  coreThesis?: string;
  economicMechanismDetail?: string;
  industryStructureNote?: string;
  frictionsAndRisks?: string;
  scenarioNote?: string;
}

/* ── LLM abstraction ── */

export interface AnalyzeCandidateResult {
  category: Category;
  fact: string;
  whyItMatters: string;
  affectedPlayers: string[];
  whatToWatch: string;
  scores: Scores;
  economicMechanism?: string;
  signalVerdict?: SignalVerdict;
  nextSignal?: string;
}

export interface LLMProvider {
  analyzeCandidate(item: RawItem): Promise<AnalyzeCandidateResult>;
  expandEvent(event: EventRecord): Promise<ExpandedAnalysis>;
}

/* ── Source config ── */

export interface SourceConfig {
  name: string;
  url: string;
  type: 'rss' | 'html';
  category: string;
  enabled: boolean;
  maxItems?: number;
}

/* ── Pipeline context ── */

export interface RunContext {
  runId: string;
  mock: boolean;
  timestamp: string;
}

/* ── Future hooks (data structures only, not implemented) ── */

export interface WatchlistEntry {
  keyword: string;
  addedAt: string;
  reason?: string;
}

export interface WeeklyMemoStub {
  weekOf: string;
  eventIds: string[];
  generatedAt?: string;
}
