import type { RawItem } from '../../types/index.js';

export function normalizeRawItems(items: RawItem[]): RawItem[] {
  return items
    .filter((item) => item.title && item.rawText)
    .map((item) => ({
      ...item,
      title: item.title.trim(),
      rawText: item.rawText.trim(),
      url: item.url?.trim() ?? '',
      sourceName: item.sourceName?.trim() ?? 'Unknown',
      sourceUrl: item.sourceUrl?.trim() ?? '',
      fetchedAt: item.fetchedAt || new Date().toISOString(),
    }));
}
