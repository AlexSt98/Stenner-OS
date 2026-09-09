// ─────────────────────────────────────────────────────────────────────────
// AIProvider — the abstraction NEXUS talks to.
//
// The rest of the server (and 100% of the frontend) never imports a
// provider SDK directly. Swapping OpenAI for Anthropic (or anything else)
// later means writing one new class here and flipping AI_PROVIDER in .env —
// nothing else changes, including the /api/nexus route and the entire React
// app. NEXUS ran on Gemini early on; that provider has since been fully
// removed in favor of OpenAI's Responses API (see OpenAIProvider.ts).
// ─────────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'model';

/** An image attached to a message — sent for vision analysis, never persisted server-side. */
export interface ImageAttachment {
  /** data: URL (e.g. "data:image/png;base64,...") as uploaded from the browser. */
  dataUrl: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Images attached to THIS message, analyzed via the model's vision input — user turns only. */
  images?: ImageAttachment[];
  /**
   * Plain text already extracted server-side from a non-image document
   * attachment (PDF/DOCX/PPTX/XLSX/CSV/TXT — see server/nexus/fileExtract.ts).
   * Folded into the model's input as clearly-labeled context, distinct from
   * the user's own words, so the model never confuses "what the user said"
   * with "what a file contains".
   */
  fileContext?: { fileName: string; text: string }[];
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
  /** STENNER OS's own app-action tools (createTask, etc.) — always confirm/cancel, never auto-executed. */
  tools?: ToolDeclaration[];
  /**
   * Let the provider's own hosted web-search tool run when the model decides
   * it needs current information. The model chooses whether to use it per
   * turn — callers don't classify intent themselves. Providers that don't
   * support this (e.g. AnthropicProvider's scaffold) simply ignore it.
   */
  enableWebSearch?: boolean;
  /** Same idea for the provider's hosted image-generation tool. */
  enableImageGeneration?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** A citation the model's web-search tool actually returned — never fabricated. */
export interface WebSource {
  title: string;
  url: string;
}

export interface GenerateResult {
  text: string;
  toolCall?: ToolCall;
  usage?: TokenUsage;
  /** Images the hosted image-generation tool actually produced, as data: URLs — absent unless it ran. */
  images?: string[];
  /** Web citations the hosted web-search tool actually returned — absent unless it ran. Never fabricated. */
  sources?: WebSource[];
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
   * turn is complete, not incrementally). `onPhase`, if given, fires when a
   * hosted tool (web search, image generation) starts running — purely
   * informational, for the UI's connection-status line; never fabricated,
   * only called when the provider's stream actually reports that event.
   */
  abstract streamResponse(
    request: GenerateRequest,
    onDelta: (delta: string) => void,
    onPhase?: (phase: 'searching' | 'generating_image') => void
  ): Promise<GenerateResult>;

  /** Ask for a response shaped to a JSON schema — used for anything NEXUS needs as structured data rather than prose. */
  abstract generateStructuredOutput<T = unknown>(request: StructuredRequest): Promise<T>;
}
