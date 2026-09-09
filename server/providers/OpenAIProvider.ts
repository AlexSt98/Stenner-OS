import { AIProvider, type GenerateRequest, type GenerateResult, type StructuredRequest } from './AIProvider.js';

/**
 * Scaffolded, not wired — flip AI_PROVIDER=openai in .env once this is
 * implemented with the `openai` package and OPENAI_API_KEY. Until then it
 * reports itself as unconfigured so /api/nexus falls back cleanly instead
 * of crashing.
 */
export class OpenAIProvider extends AIProvider {
  readonly name = 'openai';

  constructor(_apiKey: string | undefined) {
    super();
  }

  isConfigured(): boolean {
    return false;
  }

  async generateResponse(_request: GenerateRequest): Promise<GenerateResult> {
    throw new Error('OpenAIProvider is not implemented yet — this is a scaffold for a future integration.');
  }

  async streamResponse(_request: GenerateRequest, _onDelta: (delta: string) => void): Promise<GenerateResult> {
    throw new Error('OpenAIProvider is not implemented yet — this is a scaffold for a future integration.');
  }

  async generateStructuredOutput<T = unknown>(_request: StructuredRequest): Promise<T> {
    throw new Error('OpenAIProvider is not implemented yet — this is a scaffold for a future integration.');
  }
}
