import Parser from 'rss-parser';
import type { RawItem, SourceConfig } from '../../types/index.js';

const parser = new Parser({
  timeout: 15_000,
  headers: { 'User-Agent': 'AgentScanner/0.1 (RSS reader)' },
});

const MAX_AGE_DAYS = 14;
const DEFAULT_MAX_ITEMS = 5;

export async function fetchRssFeeds(sources: SourceConfig[]): Promise<RawItem[]> {
  const items: RawItem[] = [];
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;

  for (const source of sources) {
    try {
      console.log(`  ↳ fetching ${source.name} …`);
      const feed = await parser.parseURL(source.url);
      const max = source.maxItems ?? DEFAULT_MAX_ITEMS;

      let count = 0;
      for (const entry of feed.items ?? []) {
        if (count >= max) break;
        if (!entry.title || !entry.link) continue;

        if (entry.pubDate) {
          const ts = new Date(entry.pubDate).getTime();
          if (!isNaN(ts) && ts < cutoff) continue;
        }

        const rawText = stripHtml(
          entry.contentSnippet || entry.content || entry['summary'] || '',
        );
        if (rawText.length < 20) continue;

        items.push({
          sourceName: source.name,
          sourceUrl: source.url,
          title: entry.title.trim(),
          url: entry.link.trim(),
          publishedAt: entry.pubDate
            ? new Date(entry.pubDate).toISOString().slice(0, 10)
            : undefined,
          rawText: rawText.slice(0, 1500),
          fetchedAt: new Date().toISOString(),
        });
        count++;
      }

      console.log(`    ✓ ${count} items from ${source.name}`);
    } catch (err) {
      console.warn(
        `    ⚠ failed to fetch ${source.name}: ${(err as Error).message}`,
      );
    }
  }

  return items;
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
