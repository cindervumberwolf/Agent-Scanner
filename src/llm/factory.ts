import type { LLMProvider } from '../types/index.js';
import type { EnvConfig } from '../config/env.js';
import { MockLLMProvider } from './provider.js';
import { OpenAICompatibleProvider } from './providers/openaiCompatible.js';

export function createProvider(env: EnvConfig): LLMProvider {
  if (env.llmMode === 'mock') {
    if (env.debugLlm) console.log('[LLM] provider = MockLLMProvider');
    return new MockLLMProvider();
  }

  if (env.llmProvider === 'openai-compatible') {
    if (env.debugLlm) {
      console.log('[LLM] provider = OpenAI-compatible');
      console.log(`[LLM] base_url = ${env.llmBaseUrl}`);
      console.log(`[LLM] model    = ${env.llmModel}`);
    }
    return new OpenAICompatibleProvider({
      apiKey: env.llmApiKey,
      baseUrl: env.llmBaseUrl,
      model: env.llmModel,
      debug: env.debugLlm,
    });
  }

  throw new Error(`Unknown LLM_PROVIDER: "${env.llmProvider}". Supported: openai-compatible`);
}
