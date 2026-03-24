import 'dotenv/config';

export interface EnvConfig {
  llmMode: 'mock' | 'real';
  llmProvider: string;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
  debugLlm: boolean;
}

export function loadEnv(llmOverride?: string): EnvConfig {
  const raw = llmOverride ?? process.env.LLM_MODE ?? 'mock';
  const llmMode = raw === 'real' ? 'real' : 'mock';

  const llmProvider = process.env.LLM_PROVIDER ?? 'openai-compatible';
  const llmApiKey = process.env.LLM_API_KEY ?? '';
  const llmBaseUrl = process.env.LLM_BASE_URL ?? '';
  const llmModel = process.env.LLM_MODEL ?? '';
  const debugLlm = process.env.DEBUG_LLM === '1' || process.env.DEBUG_LLM === 'true';

  if (llmMode === 'real') {
    const missing: string[] = [];
    if (!llmApiKey) missing.push('LLM_API_KEY');
    if (!llmBaseUrl) missing.push('LLM_BASE_URL');
    if (!llmModel) missing.push('LLM_MODEL');
    if (missing.length > 0) {
      throw new Error(
        `LLM_MODE=real but missing: ${missing.join(', ')}.\n` +
        `Set them in .env or as environment variables. See .env.example.`,
      );
    }
  }

  return { llmMode, llmProvider, llmApiKey, llmBaseUrl, llmModel, debugLlm };
}
