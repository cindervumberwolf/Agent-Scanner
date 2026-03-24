import type { SourceConfig } from '../types/index.js';

export const DEFAULT_SOURCES: SourceConfig[] = [
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    type: 'rss',
    category: 'open_source_ecosystem',
    enabled: true,
    maxItems: 5,
  },
  {
    name: 'LangChain Blog',
    url: 'https://blog.langchain.dev/rss/',
    type: 'rss',
    category: 'agent_tooling',
    enabled: true,
    maxItems: 5,
  },
  // ── Below sources reserved for Phase 3+ ──
  {
    name: 'Anthropic Blog',
    url: 'https://www.anthropic.com/blog/rss',
    type: 'rss',
    category: 'model_vendor',
    enabled: false,
  },
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    type: 'rss',
    category: 'model_vendor',
    enabled: false,
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    type: 'rss',
    category: 'big_tech_ai',
    enabled: false,
  },
  {
    name: 'The Information AI',
    url: 'https://www.theinformation.com/feed',
    type: 'rss',
    category: 'ai_business_news',
    enabled: false,
  },
];
