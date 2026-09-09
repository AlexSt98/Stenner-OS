import OpenAI from 'openai';
import type { Response, ResponseInputItem, ResponseUsage, Tool as ResponsesTool } from 'openai/resources/responses/responses';
import {
  AIProvider,
  type ChatMessage,
  type GenerateRequest,
  type GenerateResult,
  type StructuredRequest,
  type TokenUsage,
  type WebSource,
} from './AIProvider.js';

// "gpt-4o-mini" supports vision + the Responses API's hosted web_search and
// image_generation tools — override via OPENAI_MODEL in .env for a
// different model (e.g. "gpt-4o" for stronger multimodal quality).
const DEFAULT_MODEL = 'gpt-4o-mini';

// NEXUS's ChatRole is 'user' | 'model' — the Responses API's EasyInputMessage
// expects 'user' | 'assistant'. Plain string content is used unless the
// message carries images or extracted file text, in which case it becomes
// a content-part array (input_text + input_image) so vision actually sees
// the image rather than just a text description of it.
function toResponsesInput(messages: ChatMessage[]): ResponseInputItem[] {
  return messages.map((m): ResponseInputItem => {
    const role = m.role === 'model' ? 'assistant' : 'user';
    const fileBlocks = (m.fileContext ?? [])
      .map((f) => `--- Attached file: "${f.fileName}" (extracted text below — treat as reference material, not the user's own words) ---\n${f.text}`)
      .join('\n\n');
    const text = fileBlocks ? `${m.content}\n\n${fileBlocks}` : m.content;

    if (!m.images || m.images.length === 0) {
      return { role, content: text };
    }
    return {
      role,
      content: [
        { type: 'input_text', text },
        ...m.images.map((img) => ({ type: 'input_image' as const, image_url: img.dataUrl, detail: 'auto' as const })),
      ],
    };
  });
}

function toFunctionTools(tools: GenerateRequest['tools']): ResponsesTool[] {
  if (!tools || tools.length === 0) return [];
  return tools.map((t) => ({
    type: 'function',
    name: t.name,
    description: t.description,
    parameters: t.parameters as Record<string, unknown>,
    // NEXUS's tool schemas (src/lib/nexus/tools.ts) aren't authored for the
    // Responses API's strict mode (which requires e.g. additionalProperties:
    // false on every object), so leave validation non-strict.
    strict: null,
  }));
}

// OpenAI gates some hosted tools (image_generation in particular) behind
// "Verified Organization" account status and 403s with this message when
// it isn't verified — unrelated to API key validity or our request shape.
const ORG_VERIFICATION_ERROR = /organization must be verified/i;

function toUsage(usage: ResponseUsage | undefined): TokenUsage | undefined {
  if (!usage) return undefined;
  return {
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
  };
}

/** Pulls out whatever the hosted tools actually produced — never fabricated, only present if the model's output really contains it. */
function extractToolOutputs(response: Response): { sources?: WebSource[]; images?: string[]; toolCall?: GenerateResult['toolCall'] } {
  const sources: WebSource[] = [];
  const images: string[] = [];
  let toolCall: GenerateResult['toolCall'];

  for (const item of response.output) {
    if (item.type === 'message') {
      for (const part of item.content) {
        if (part.type === 'output_text') {
          for (const ann of part.annotations) {
            if (ann.type === 'url_citation') sources.push({ title: ann.title, url: ann.url });
          }
        }
      }
    } else if (item.type === 'image_generation_call' && item.result) {
      images.push(`data:image/png;base64,${item.result}`);
    } else if (item.type === 'function_call' && !toolCall) {
      // STENNER OS app-action tool (createTask, etc.) — only ever one per turn.
      toolCall = { name: item.name, args: JSON.parse(item.arguments || '{}') as Record<string, unknown> };
    }
  }

  return { sources: sources.length ? sources : undefined, images: images.length ? images : undefined, toolCall };
}

export class OpenAIProvider extends AIProvider {
  readonly name = 'openai';
  private client: OpenAI | null;
  // Once image_generation 403s for lack of org verification, stop requesting
  // it for the rest of this process's lifetime instead of eating the same
  // failure (and its latency) on every subsequent turn. web_search isn't
  // included here — it's gated independently and shouldn't be disabled just
  // because image_generation was.
  private imageGenerationBlocked = false;

  constructor(private apiKey: string | undefined, private model = process.env.OPENAI_MODEL || DEFAULT_MODEL) {
    super();
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.client;
  }

  private requireClient() {
    if (!this.client) throw new Error('OpenAIProvider is not configured — OPENAI_API_KEY is missing.');
    return this.client;
  }

  /**
   * Builds the full tools array: STENNER OS's own app-action functions PLUS
   * OpenAI's hosted web_search / image_generation tools when enabled. The
   * model decides per-turn whether it needs any of these — NEXUS never
   * classifies intent itself (see AIProvider.enableWebSearch/enableImageGeneration).
   */
  private buildTools(request: GenerateRequest): ResponsesTool[] {
    const tools = toFunctionTools(request.tools);
    if (request.enableWebSearch) tools.push({ type: 'web_search' });
    if (request.enableImageGeneration && !this.imageGenerationBlocked) tools.push({ type: 'image_generation' });
    return tools;
  }

  /**
   * Runs `create`, and if it fails specifically because image_generation
   * requires a verified OpenAI organization, retries once without that tool
   * — so a single unverified account setting doesn't take down every NEXUS
   * conversation, only the image-generation capability itself.
   */
  private async withImageGenerationFallback<T>(tools: ResponsesTool[], create: (tools: ResponsesTool[]) => Promise<T>): Promise<T> {
    const hasImageGeneration = tools.some((t) => t.type === 'image_generation');
    try {
      return await create(tools);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!hasImageGeneration || !ORG_VERIFICATION_ERROR.test(message)) throw err;
      this.imageGenerationBlocked = true;
      console.warn(
        '[nexus] OpenAI image_generation is unavailable for this account (organization not verified) — retrying without it. ' +
          'Verify at https://platform.openai.com/settings/organization/general to enable it.'
      );
      return create(tools.filter((t) => t.type !== 'image_generation'));
    }
  }

  async generateResponse(request: GenerateRequest): Promise<GenerateResult> {
    const response = await this.withImageGenerationFallback(this.buildTools(request), (tools) =>
      this.requireClient().responses.create({
        model: this.model,
        instructions: request.systemPrompt,
        input: toResponsesInput(request.messages),
        tools,
      })
    );
    const { sources, images, toolCall } = extractToolOutputs(response);
    return { text: response.output_text, toolCall, usage: toUsage(response.usage), sources, images };
  }

  async streamResponse(
    request: GenerateRequest,
    onDelta: (delta: string) => void,
    onPhase?: (phase: 'searching' | 'generating_image') => void
  ): Promise<GenerateResult> {
    const stream = await this.withImageGenerationFallback(this.buildTools(request), (tools) =>
      this.requireClient().responses.create({
        model: this.model,
        instructions: request.systemPrompt,
        input: toResponsesInput(request.messages),
        tools,
        stream: true,
      })
    );

    let fullText = '';
    let result: GenerateResult = { text: '' };
    // So each hosted tool only announces its phase once per turn, even
    // though its "in progress" event can fire more than once.
    let announcedSearching = false;
    let announcedGeneratingImage = false;

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        fullText += event.delta;
        onDelta(event.delta);
      } else if (event.type === 'response.web_search_call.searching' && !announcedSearching) {
        announcedSearching = true;
        onPhase?.('searching');
      } else if (
        (event.type === 'response.image_generation_call.in_progress' || event.type === 'response.image_generation_call.generating') &&
        !announcedGeneratingImage
      ) {
        announcedGeneratingImage = true;
        onPhase?.('generating_image');
      } else if (event.type === 'response.completed') {
        const { sources, images, toolCall } = extractToolOutputs(event.response);
        result = { text: fullText, toolCall, usage: toUsage(event.response.usage), sources, images };
      }
    }

    return { ...result, text: fullText };
  }

  async generateStructuredOutput<T = unknown>({ systemPrompt, messages, responseSchema }: StructuredRequest): Promise<T> {
    const response = await this.requireClient().responses.create({
      model: this.model,
      instructions: systemPrompt,
      input: toResponsesInput(messages),
      text: {
        format: {
          type: 'json_schema',
          name: 'response',
          schema: responseSchema,
        },
      },
    });
    return JSON.parse(response.output_text) as T;
  }
}
