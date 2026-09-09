import { AIProvider } from './AIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';

export type ProviderName = 'gemini' | 'openai' | 'anthropic';

const PROVIDER_NAMES: ProviderName[] = ['gemini', 'openai', 'anthropic'];

export function isProviderName(v: string): v is ProviderName {
  return (PROVIDER_NAMES as string[]).includes(v);
}

/** Reads AI_PROVIDER (defaulting to gemini) and builds the matching provider from env credentials. */
export function getProvider(): AIProvider {
  const requested = process.env.AI_PROVIDER?.toLowerCase() ?? 'gemini';
  const name: ProviderName = isProviderName(requested) ? requested : 'gemini';

  switch (name) {
    case 'openai':
      return new OpenAIProvider(process.env.OPENAI_API_KEY);
    case 'anthropic':
      return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
    case 'gemini':
    default:
      return new GeminiProvider(process.env.GEMINI_API_KEY);
  }
}

export { AIProvider };
export * from './AIProvider.js';
