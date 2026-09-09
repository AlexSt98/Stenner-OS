import OpenAI from 'openai';
import type { Response, ResponseFunctionToolCall, ResponseInputItem, ResponseUsage, Tool as ResponsesTool } from 'openai/resources/responses/responses';
import {
  AIProvider,
  type ChatMessage,
  type GenerateRequest,
  type GenerateResult,
  type StructuredRequest,
  type TokenUsage,
  type WebSource,
} from './AIProvider.js';

// "gpt-4o-mini" supports vision + the Responses API's hosted web_search tool
// — override via OPENAI_MODEL in .env for a different model (e.g. "gpt-4o").
const DEFAULT_MODEL = 'gpt-4o-mini';
// "gpt-image-1" is OpenAI's current image-generation model, called directly
// via the classic Images API (client.images.generate) — NOT the Responses
// API's hosted `image_generation` tool, which requires "Verified
// Organization" account status and 403s otherwise (confirmed against the
// live API). The classic Images API works on a standard, unverified
// account, so real image generation is implemented as a NEXUS function
// tool that the server executes itself when the model calls it — see
// generateImage() and the tool-execution loop in streamResponse() below.
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

const IMAGE_GENERATION_TOOL: ResponsesTool = {
  type: 'function',
  name: 'image_generation',
  description:
    'Generate a real image from a text prompt. Call this DIRECTLY and IMMEDIATELY whenever the user asks to create, generate, design, draw, illustrate, sketch, mock up, or visualize an image, logo, banner, dashboard concept, moodboard, or any other visual — do not call web_search first or instead, an image request never needs research. NEXUS actually produces the image; never respond with only text claiming an image was made without calling this tool.',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description:
          'A detailed, self-contained description of the image to generate. Fold in any style/mood direction the user gave (e.g. "more corporate", "less futuristic") rather than relying on prior turns.',
      },
    },
    required: ['prompt'],
  },
  strict: null,
};

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

function toUsage(usage: ResponseUsage | undefined): TokenUsage | undefined {
  if (!usage) return undefined;
  return {
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
  };
}

function addUsage(a: TokenUsage | undefined, b: TokenUsage | undefined): TokenUsage | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}

/** Pulls out whatever the response actually contains — never fabricated, only present if the model's output really contains it. */
function extractToolOutputs(response: Response): { sources?: WebSource[]; toolCall?: GenerateResult['toolCall'] } {
  const sources: WebSource[] = [];
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
    } else if (item.type === 'function_call' && item.name !== 'image_generation' && !toolCall) {
      // A STENNER OS app-action tool (createTask, etc.) — only ever one per turn.
      // image_generation is handled separately (see streamResponse) — it's
      // executed for real here in the provider, never surfaced as a
      // confirm/cancel toolCall the way app actions are.
      toolCall = { name: item.name, args: JSON.parse(item.arguments || '{}') as Record<string, unknown> };
    }
  }

  return { sources: sources.length ? sources : undefined, toolCall };
}

function findImageGenerationCall(response: Response): ResponseFunctionToolCall | undefined {
  return response.output.find((o): o is ResponseFunctionToolCall => o.type === 'function_call' && o.name === 'image_generation');
}

export class OpenAIProvider extends AIProvider {
  readonly name = 'openai';
  private client: OpenAI | null;

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
   * NEXUS's real image_generation function tool and OpenAI's hosted
   * web_search tool, when enabled. The model decides per-turn whether it
   * needs any of these — NEXUS never classifies intent itself (see
   * AIProvider.enableWebSearch/enableImageGeneration).
   */
  private buildTools(request: GenerateRequest, { includeImageGeneration = true } = {}): ResponsesTool[] {
    const tools = toFunctionTools(request.tools);
    if (request.enableWebSearch) tools.push({ type: 'web_search' });
    if (request.enableImageGeneration && includeImageGeneration) tools.push(IMAGE_GENERATION_TOOL);
    return tools;
  }

  /** Real call to OpenAI's Images API (client.images.generate) — not the gated Responses hosted tool. Throws with a clean, honest message on any failure. */
  private async generateImage(prompt: string): Promise<{ dataUrl: string; usage?: TokenUsage }> {
    try {
      const result = await this.requireClient().images.generate({ model: IMAGE_MODEL, prompt, size: '1024x1024' });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error('Image API returned no image data.');
      const usage = result.usage
        ? { promptTokens: result.usage.input_tokens, completionTokens: result.usage.output_tokens, totalTokens: result.usage.total_tokens }
        : undefined;
      return { dataUrl: `data:image/png;base64,${b64}`, usage };
    } catch (err) {
      // Full detail server-side only — the user gets one honest, plain sentence, never a stack trace or raw API error.
      console.error('[nexus] image_generation (Images API) failed:', err);
      throw new Error('Unable to generate image. Please try again.');
    }
  }

  async generateResponse(request: GenerateRequest): Promise<GenerateResult> {
    const input = toResponsesInput(request.messages);
    const response = await this.requireClient().responses.create({
      model: this.model,
      instructions: request.systemPrompt,
      input,
      tools: this.buildTools(request),
    });

    const imageCall = findImageGenerationCall(response);
    if (!imageCall) {
      const { sources, toolCall } = extractToolOutputs(response);
      return { text: response.output_text, toolCall, usage: toUsage(response.usage), sources };
    }

    const { prompt } = JSON.parse(imageCall.arguments || '{}') as { prompt?: string };
    try {
      const image = await this.generateImage(prompt ?? '');
      const followUp = await this.requireClient().responses.create({
        model: this.model,
        instructions: request.systemPrompt,
        input: [...input, imageCall, { type: 'function_call_output', call_id: imageCall.call_id, output: 'Image generated successfully.' }],
        tools: this.buildTools(request, { includeImageGeneration: false }),
      });
      const { sources, toolCall } = extractToolOutputs(followUp);
      return {
        text: followUp.output_text,
        toolCall,
        usage: addUsage(addUsage(toUsage(response.usage), image.usage), toUsage(followUp.usage)),
        sources,
        images: [image.dataUrl],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate image. Please try again.';
      return { text: message, usage: toUsage(response.usage) };
    }
  }

  async streamResponse(
    request: GenerateRequest,
    onDelta: (delta: string) => void,
    onPhase?: (phase: 'searching' | 'generating_image') => void
  ): Promise<GenerateResult> {
    const input = toResponsesInput(request.messages);
    const first = await this.streamOnce(request.systemPrompt, input, this.buildTools(request), onDelta, onPhase);

    const imageCall = findImageGenerationCall(first.response);
    if (!imageCall) {
      const { sources, toolCall } = extractToolOutputs(first.response);
      return { text: first.fullText, toolCall, usage: toUsage(first.response.usage), sources };
    }

    onPhase?.('generating_image');
    const { prompt } = JSON.parse(imageCall.arguments || '{}') as { prompt?: string };
    let image: { dataUrl: string; usage?: TokenUsage };
    try {
      image = await this.generateImage(prompt ?? '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate image. Please try again.';
      onDelta(`\n\n${message}`);
      const { sources, toolCall } = extractToolOutputs(first.response);
      return { text: `${first.fullText}\n\n${message}`, toolCall, usage: toUsage(first.response.usage), sources };
    }

    // Feed the tool's real output back to the model so it can write a
    // natural closing message alongside the image (e.g. "Here's your
    // dashboard concept — let me know if you'd like it more corporate.").
    const followUpInput: ResponseInputItem[] = [
      ...input,
      imageCall,
      { type: 'function_call_output', call_id: imageCall.call_id, output: 'Image generated successfully.' },
    ];
    const second = await this.streamOnce(
      request.systemPrompt,
      followUpInput,
      this.buildTools(request, { includeImageGeneration: false }),
      onDelta,
      onPhase
    );

    const { sources, toolCall } = extractToolOutputs(second.response);
    return {
      text: first.fullText + second.fullText,
      toolCall,
      usage: addUsage(addUsage(toUsage(first.response.usage), image.usage), toUsage(second.response.usage)),
      sources,
      images: [image.dataUrl],
    };
  }

  /** One streamed responses.create() call — text deltas go to onDelta, hosted-tool phases to onPhase, and the final Response (for tool-call/usage/citation extraction) is returned once the stream completes. */
  private async streamOnce(
    instructions: string,
    input: ResponseInputItem[],
    tools: ResponsesTool[],
    onDelta: (delta: string) => void,
    onPhase?: (phase: 'searching' | 'generating_image') => void
  ): Promise<{ fullText: string; response: Response }> {
    const stream = await this.requireClient().responses.create({ model: this.model, instructions, input, tools, stream: true });

    let fullText = '';
    let response: Response | undefined;
    let announcedSearching = false;

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        fullText += event.delta;
        onDelta(event.delta);
      } else if (event.type === 'response.web_search_call.searching' && !announcedSearching) {
        announcedSearching = true;
        onPhase?.('searching');
      } else if (event.type === 'response.completed') {
        response = event.response;
      }
    }

    if (!response) throw new Error('OpenAI stream ended without a completed response.');
    return { fullText, response };
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
