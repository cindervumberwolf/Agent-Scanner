import type { RawItem } from '../../types/index.js';

export function dedupeRawItems(items: RawItem[]): RawItem[] {
  const seen = new Map<string, RawItem>();

  for (const item of items) {
    const key = normalizeKey(item.title);
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, '')
    .slice(0, 80);
}
