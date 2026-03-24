import type {
  RawItem,
  EventRecord,
  ExpandedAnalysis,
  AnalyzeCandidateResult,
  LLMProvider,
  Category,
  SignalVerdict,
} from '../../types/index.js';
import { MockLLMProvider } from '../provider.js';
import { buildAnalyzeCandidateMessages } from '../prompts/analyzeCandidate.js';
import { buildExpandEventMessages } from '../prompts/expandEvent.js';
import type { ChatMessage } from '../prompts/analyzeCandidate.js';

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  debug: boolean;
}

const VALID_CATEGORIES: readonly Category[] = [
  'products_launches',
  'infra_models',
  'commercial_signals',
  'open_source_momentum',
  'risks_frictions',
];

const TIMEOUT_MS = 60_000;
const HTTP_RETRIES = 1;
const RETRY_DELAY_MS = 2_000;
const PARSE_ATTEMPTS = 2;

export class OpenAICompatibleProvider implements LLMProvider {
  private config: ProviderConfig;
  private fallback = new MockLLMProvider();
  private endpoint: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  }

  async analyzeCandidate(item: RawItem): Promise<AnalyzeCandidateResult> {
    const messages = buildAnalyzeCandidateMessages(item);
    const label = `analyze("${item.title.slice(0, 40)}…")`;

    for (let attempt = 0; attempt < PARSE_ATTEMPTS; attempt++) {
      try {
        const raw = await this.chat(messages, label);
        return this.parseAnalyzeResult(raw);
      } catch (err) {
        if (attempt < PARSE_ATTEMPTS - 1) {
          if (this.config.debug)
            console.warn(`[LLM] ⚠ ${label} attempt ${attempt + 1} failed: ${(err as Error).message}, retrying…`);
          continue;
        }
        console.warn(`[LLM] ⚠ ${label} failed after ${PARSE_ATTEMPTS} attempts → mock fallback`);
        return this.fallback.analyzeCandidate(item);
      }
    }

    return this.fallback.analyzeCandidate(item);
  }

  async expandEvent(event: EventRecord): Promise<ExpandedAnalysis> {
    const messages = buildExpandEventMessages(event);
    const label = `expand("${event.title.slice(0, 40)}…")`;

    for (let attempt = 0; attempt < PARSE_ATTEMPTS; attempt++) {
      try {
        const raw = await this.chat(messages, label);
        return this.parseExpandResult(raw, event.id);
      } catch (err) {
        if (attempt < PARSE_ATTEMPTS - 1) {
          if (this.config.debug)
            console.warn(`[LLM] ⚠ ${label} attempt ${attempt + 1} failed: ${(err as Error).message}, retrying…`);
          continue;
        }
        console.warn(`[LLM] ⚠ ${label} failed after ${PARSE_ATTEMPTS} attempts → mock fallback`);
        return this.fallback.expandEvent(event);
      }
    }

    return this.fallback.expandEvent(event);
  }

  /* ── HTTP layer ─────────────────────────────── */

  private async chat(messages: ChatMessage[], label: string): Promise<string> {
    if (this.config.debug) console.log(`[LLM] → ${label}`);

    let lastError: Error | null = null;

    for (let retry = 0; retry <= HTTP_RETRIES; retry++) {
      if (retry > 0) {
        if (this.config.debug) console.log(`[LLM]   http retry #${retry}`);
        await sleep(RETRY_DELAY_MS);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            temperature: 0.15,
            max_tokens: 2048,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
          continue;
        }

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
        }

        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response content from LLM');

        if (this.config.debug) console.log(`[LLM] ← ${label} (${content.length} chars)`);
        return content;
      } catch (err) {
        clearTimeout(timer);
        lastError =
          (err as Error).name === 'AbortError'
            ? new Error(`Timeout after ${TIMEOUT_MS}ms`)
            : (err as Error);
      }
    }

    throw lastError ?? new Error('Unknown LLM error');
  }

  /* ── Parsing & validation ───────────────────── */

  private parseAnalyzeResult(raw: string): AnalyzeCandidateResult {
    const obj = parseJson(raw);

    const category: Category = VALID_CATEGORIES.includes(obj.category as Category)
      ? (obj.category as Category)
      : 'products_launches';

    const clamp = (v: unknown) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));
    const scores = (obj.scores ?? {}) as Record<string, unknown>;
    const importance = clamp(scores.importance);
    const businessRelevance = clamp(scores.businessRelevance);
    const novelty = clamp(scores.novelty);
    const followUpValue = clamp(scores.followUpValue);

    const affectedPlayers = Array.isArray(obj.affectedPlayers)
      ? (obj.affectedPlayers as unknown[]).filter((p): p is string => typeof p === 'string').slice(0, 5)
      : ['AI Agent 生态参与者'];

    return {
      category,
      fact: String(obj.fact ?? ''),
      whyItMatters: String(obj.whyItMatters ?? ''),
      affectedPlayers,
      whatToWatch: String(obj.whatToWatch ?? ''),
      scores: { importance, businessRelevance, novelty, followUpValue, total: importance + businessRelevance + novelty + followUpValue },
      economicMechanism: truncate(String(obj.economicMechanism ?? ''), 30) || undefined,
      signalVerdict: normalizeSignalVerdict(obj.signalVerdict),
      nextSignal: truncate(String(obj.nextSignal ?? ''), 80) || undefined,
    };
  }

  private parseExpandResult(raw: string, eventId: string): ExpandedAnalysis {
    const obj = parseJson(raw);

    const nextSignals = Array.isArray(obj.nextSignals)
      ? (obj.nextSignals as unknown[]).filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 6)
      : [];

    return {
      eventId,
      factRestatement: String(obj.factRestatement ?? ''),
      businessImplication: String(obj.businessImplication ?? obj.economicMechanismDetail ?? ''),
      competitionAngle: String(obj.competitionAngle ?? ''),
      uncertainty: String(obj.uncertainty ?? obj.frictionsAndRisks ?? ''),
      nextSignals,
      oneLineTake: String(obj.oneLineTake ?? ''),
      createdAt: new Date().toISOString(),
      coreThesis: String(obj.coreThesis ?? '') || undefined,
      economicMechanismDetail: String(obj.economicMechanismDetail ?? '') || undefined,
      industryStructureNote: String(obj.industryStructureNote ?? '') || undefined,
      frictionsAndRisks: String(obj.frictionsAndRisks ?? '') || undefined,
      scenarioNote: String(obj.scenarioNote ?? '') || undefined,
    };
  }
}

/* ── Helpers ──────────────────────────────────── */

function parseJson(raw: string): Record<string, unknown> {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  text = text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (match) text = match[0];
  return JSON.parse(text) as Record<string, unknown>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const VALID_SIGNAL_VERDICTS: readonly SignalVerdict[] = ['噪音', '值得跟踪', '结构性信号'];

function normalizeSignalVerdict(v: unknown): SignalVerdict {
  const s = String(v ?? '').trim();
  if (VALID_SIGNAL_VERDICTS.includes(s as SignalVerdict)) return s as SignalVerdict;
  if (/噪音|noise|短期/.test(s)) return '噪音';
  if (/结构|structural|长期|重大/.test(s)) return '结构性信号';
  return '值得跟踪';
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}
