// ─────────────────────────────────────────────────────────────────────────
// AIProvider — the abstraction NEXUS talks to.
//
// The rest of the server (and 100% of the frontend) never imports a
// provider SDK directly. Swapping Gemini for OpenAI or Anthropic later means
// writing one new class here and flipping AI_PROVIDER in .env — nothing
// else changes, including the /api/nexus route and the entire React app.
// ─────────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'model';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** A function/tool NEXUS may propose calling — mirrors the JSON-schema shape most providers expect. */
export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface GenerateRequest {
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDeclaration[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateResult {
  text: string;
  toolCall?: ToolCall;
  usage?: TokenUsage;
}

export interface StructuredRequest extends GenerateRequest {
  /** A JSON-schema-shaped description of the object we want back. */
  responseSchema: Record<string, unknown>;
}

export abstract class AIProvider {
  abstract readonly name: string;

  /** True once this provider has whatever credentials it needs (checked without making a network call). */
  abstract isConfigured(): boolean;

  /** One-shot, non-streaming generation. */
  abstract generateResponse(request: GenerateRequest): Promise<GenerateResult>;

  /**
   * Streamed generation — invokes `onDelta` with each text chunk as it
   * arrives, and resolves with the full text plus a tool call if the model
   * proposed one (providers generally only surface function calls once the
   * turn is complete, not incrementally).
   */
  abstract streamResponse(request: GenerateRequest, onDelta: (delta: string) => void): Promise<GenerateResult>;

  /** Ask for a response shaped to a JSON schema — used for anything NEXUS needs as structured data rather than prose. */
  abstract generateStructuredOutput<T = unknown>(request: StructuredRequest): Promise<T>;
}
