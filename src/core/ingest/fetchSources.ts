import fs from 'node:fs/promises';
import path from 'node:path';
import type { RawItem, SourceConfig } from '../../types/index.js';
import { fetchRssFeeds } from './fetchRssFeeds.js';

const MOCK_PATH = path.resolve('data', 'mock', 'raw_items.json');

export async function fetchSources(
  sources: SourceConfig[],
  mock: boolean,
): Promise<RawItem[]> {
  if (mock) {
    return loadMockItems();
  }

  const rssSources = sources.filter((s) => s.enabled && s.type === 'rss');
  if (rssSources.length === 0) {
    console.warn('  ⚠ No enabled RSS sources configured');
    return [];
  }

  const items = await fetchRssFeeds(rssSources);

  if (items.length === 0) {
    console.warn('  ⚠ All live sources returned 0 items — check network or feed URLs');
  }

  return items;
}

async function loadMockItems(): Promise<RawItem[]> {
  const raw = await fs.readFile(MOCK_PATH, 'utf-8');
  return JSON.parse(raw) as RawItem[];
}
