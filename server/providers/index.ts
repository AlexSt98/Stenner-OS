import { AIProvider } from './AIProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';

// Gemini has been fully retired from NEXUS — GeminiProvider.ts is gone and
// GEMINI_API_KEY/GEMINI_MODEL have no effect anywhere. "openai" is now the
// only implemented, wired-up provider; "anthropic" remains a scaffold.
export type ProviderName = 'openai' | 'anthropic';

const PROVIDER_NAMES: ProviderName[] = ['openai', 'anthropic'];

export function isProviderName(v: string): v is ProviderName {
  return (PROVIDER_NAMES as string[]).includes(v);
}

/** Reads AI_PROVIDER (defaulting to openai) and builds the matching provider from env credentials. */
export function getProvider(): AIProvider {
  const requested = process.env.AI_PROVIDER?.toLowerCase() ?? 'openai';
  const name: ProviderName = isProviderName(requested) ? requested : 'openai';

  switch (name) {
    case 'anthropic':
      return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
    case 'openai':
    default:
      return new OpenAIProvider(process.env.OPENAI_API_KEY);
  }
}

export { AIProvider };
export * from './AIProvider.js';
