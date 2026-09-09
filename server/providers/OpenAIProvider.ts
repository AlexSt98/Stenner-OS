import OpenAI from 'openai';
import type { Response, ResponseFunctionToolCall, ResponseInputItem, ResponseUsage, Tool as ResponsesTool } from 'openai/resources/responses/responses';
import { AIProvider, type ChatMessage, type GenerateRequest, type GenerateResult, type StructuredRequest, type TokenUsage } from './AIProvider.js';

// "gpt-4o-mini" is OpenAI's current low-cost, tool-calling-capable default —
// override via OPENAI_MODEL in .env for a different model.
const DEFAULT_MODEL = 'gpt-4o-mini';

// NEXUS's ChatRole is 'user' | 'model' — the Responses API's EasyInputMessage
// expects 'user' | 'assistant' (plain string content is accepted directly,
// no need for the { type: 'input_text', text } content-part wrapper).
function toResponsesInput(messages: ChatMessage[]): ResponseInputItem[] {
  return messages.map((m) => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.content,
  }));
}

function toResponsesTools(tools: GenerateRequest['tools']): ResponsesTool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: 'function',
    name: t.name,
    description: t.description,
    parameters: t.parameters as Record<string, unknown>,
    // NEXUS's tool schemas (src/lib/nexus/tools.ts) aren't authored for the
    // Responses API's strict mode (which requires e.g. additionalProperties:
    // false on every object), so leave validation non-strict — same
    // trust level Chat Completions tool-calling gave us before.
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

/** The Responses API returns tool calls as items in response.output — NEXUS only ever proposes one at a time. */
function firstFunctionCall(response: Response): GenerateResult['toolCall'] {
  const item = response.output.find((o): o is ResponseFunctionToolCall => o.type === 'function_call');
  if (!item) return undefined;
  return { name: item.name, args: JSON.parse(item.arguments || '{}') as Record<string, unknown> };
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

  async generateResponse({ systemPrompt, messages, tools }: GenerateRequest): Promise<GenerateResult> {
    const response = await this.requireClient().responses.create({
      model: this.model,
      instructions: systemPrompt,
      input: toResponsesInput(messages),
      tools: toResponsesTools(tools),
    });
    return {
      text: response.output_text,
      toolCall: firstFunctionCall(response),
      usage: toUsage(response.usage),
    };
  }

  async streamResponse({ systemPrompt, messages, tools }: GenerateRequest, onDelta: (delta: string) => void): Promise<GenerateResult> {
    const stream = await this.requireClient().responses.create({
      model: this.model,
      instructions: systemPrompt,
      input: toResponsesInput(messages),
      tools: toResponsesTools(tools),
      stream: true,
    });

    let fullText = '';
    let toolCall: GenerateResult['toolCall'];
    let usage: TokenUsage | undefined;

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        fullText += event.delta;
        onDelta(event.delta);
      } else if (event.type === 'response.completed') {
        usage = toUsage(event.response.usage);
        toolCall = firstFunctionCall(event.response);
      }
    }

    return { text: fullText, toolCall, usage };
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
