import crypto from 'node:crypto';
import type { EventRecord, ExpandedAnalysis, LLMProvider, RunContext } from '../types/index.js';
import { DEFAULT_SOURCES } from '../config/sources.js';
import { fetchSources } from './ingest/fetchSources.js';
import { normalizeRawItems } from './ingest/normalizeRawItems.js';
import { dedupeRawItems } from './analysis/dedupe.js';
import { classifyAndScore } from './analysis/classifyAndScore.js';
import { selectTopEvents } from './analysis/selectTopEvents.js';
import { expandAnalysis } from './analysis/expandAnalysis.js';
import { appendEvents, findEventByIndexOrId } from './storage/eventStore.js';
import { saveRunMarkdown, saveExpandedMarkdown, saveRawSnapshot } from './storage/runStore.js';
import { renderDailyRadar } from './render/renderDailyRadar.js';
import { renderExpandedAnalysis } from './render/renderExpandedAnalysis.js';

export interface RadarRunResult {
  events: EventRecord[];
  markdown: string;
  runFilePath: string;
  runId: string;
}

export async function runDailyRadar(
  provider: LLMProvider,
  mock: boolean,
): Promise<RadarRunResult> {
  const ctx: RunContext = {
    runId: crypto.randomUUID().slice(0, 8),
    mock,
    timestamp: new Date().toISOString(),
  };

  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n🦞 Agent Scanner — Daily Radar`);
  console.log(`   Run ID: ${ctx.runId} | Mode: ${mock ? 'MOCK' : 'LIVE'} | Date: ${today}\n`);

  // 1. Fetch
  console.log('① Fetching sources...');
  const raw = await fetchSources(DEFAULT_SOURCES, mock);
  console.log(`   → ${raw.length} raw items fetched`);

  if (!mock && raw.length > 0) {
    const snapPath = await saveRawSnapshot(ctx.runId, raw);
    console.log(`   → raw snapshot saved to ${snapPath}`);
  }

  // 2. Normalize
  const normalized = normalizeRawItems(raw);
  console.log(`② Normalized: ${normalized.length} items`);

  // 3. Dedupe
  const deduped = dedupeRawItems(normalized);
  console.log(`③ After dedupe: ${deduped.length} items`);

  // 4. Classify & Score
  console.log('④ Analyzing candidates...');
  const candidates = await classifyAndScore(deduped, provider, ctx);
  console.log(`   → ${candidates.length} candidates scored`);

  // 5. Select top events
  const topEvents = selectTopEvents(candidates);
  console.log(`⑤ Selected top ${topEvents.length} events (score ≥ 12)\n`);

  // 6. Persist
  await appendEvents(topEvents);

  // 7. Render
  const markdown = renderDailyRadar(topEvents, today);
  const runFilePath = await saveRunMarkdown(ctx.runId, markdown);

  return { events: topEvents, markdown, runFilePath, runId: ctx.runId };
}

export interface ExpandResult {
  analysis: ExpandedAnalysis;
  markdown: string;
  filePath: string;
}

export async function runExpandEvent(
  query: string,
  provider: LLMProvider,
): Promise<ExpandResult> {
  const event = await findEventByIndexOrId(query);
  if (!event) {
    throw new Error(
      `Event not found: "${query}". Run "pnpm radar:run --mock" first, then use an index (1-5) or event ID.`,
    );
  }

  console.log(`\n🔍 Expanding: ${event.title} (${event.id})\n`);

  const analysis = await expandAnalysis(event, provider);
  const markdown = renderExpandedAnalysis(event, analysis);
  const filePath = await saveExpandedMarkdown(event.id, markdown);

  return { analysis, markdown, filePath };
}
