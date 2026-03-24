import fs from 'node:fs/promises';
import path from 'node:path';
import type { RawItem } from '../../types/index.js';

const RUNS_DIR = path.resolve('data', 'runs');

export async function saveRunMarkdown(
  runId: string,
  content: string,
): Promise<string> {
  await fs.mkdir(RUNS_DIR, { recursive: true });
  const filePath = path.join(RUNS_DIR, `${runId}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

export async function saveRawSnapshot(
  runId: string,
  items: RawItem[],
): Promise<string> {
  await fs.mkdir(RUNS_DIR, { recursive: true });
  const filePath = path.join(RUNS_DIR, `${runId}.raw.json`);
  await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
  return filePath;
}

export async function saveExpandedMarkdown(
  eventId: string,
  content: string,
): Promise<string> {
  await fs.mkdir(RUNS_DIR, { recursive: true });
  const filePath = path.join(RUNS_DIR, `expanded_${eventId}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}
