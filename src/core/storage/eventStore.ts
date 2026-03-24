import fs from 'node:fs/promises';
import path from 'node:path';
import type { EventRecord } from '../../types/index.js';

const DATA_DIR = path.resolve('data');
const EVENTS_PATH = path.join(DATA_DIR, 'events.json');

export async function loadEvents(): Promise<EventRecord[]> {
  try {
    const raw = await fs.readFile(EVENTS_PATH, 'utf-8');
    return JSON.parse(raw) as EventRecord[];
  } catch {
    return [];
  }
}

export async function saveEvents(events: EventRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(EVENTS_PATH, JSON.stringify(events, null, 2), 'utf-8');
}

export async function appendEvents(newEvents: EventRecord[]): Promise<EventRecord[]> {
  const existing = await loadEvents();
  const merged = [...existing, ...newEvents];
  await saveEvents(merged);
  return merged;
}

export async function getLatestRunEvents(runId?: string): Promise<EventRecord[]> {
  const all = await loadEvents();
  if (all.length === 0) return [];

  if (runId) {
    return all.filter((e) => e.runId === runId);
  }
  const latestRunId = all[all.length - 1].runId;
  return all.filter((e) => e.runId === latestRunId);
}

export async function findEventByIndexOrId(
  query: string,
): Promise<EventRecord | undefined> {
  const latest = await getLatestRunEvents();
  const idx = parseInt(query, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= latest.length) {
    return latest[idx - 1];
  }
  return latest.find((e) => e.id === query);
}
