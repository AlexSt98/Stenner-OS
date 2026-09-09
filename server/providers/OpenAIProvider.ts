import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { AIProvider, type ChatMessage, type GenerateRequest, type GenerateResult, type StructuredRequest, type TokenUsage } from './AIProvider.js';

// "gpt-4o-mini" is OpenAI's current low-cost, tool-calling-capable default —
// override via OPENAI_MODEL in .env for a different model.
const DEFAULT_MODEL = 'gpt-4o-mini';

function toOpenAiMessages(systemPrompt: string, messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: systemPrompt },
    // NEXUS's ChatRole is 'user' | 'model' — OpenAI expects 'assistant' for the model's turn.
    ...messages.map((m): ChatCompletionMessageParam => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];
}

function toOpenAiTools(tools: GenerateRequest['tools']): ChatCompletionTool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>,
    },
  }));
}

function toUsage(usage: OpenAI.CompletionUsage | undefined): TokenUsage | undefined {
  if (!usage) return undefined;
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
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
    const completion = await this.requireClient().chat.completions.create({
      model: this.model,
      messages: toOpenAiMessages(systemPrompt, messages),
      tools: toOpenAiTools(tools),
    });
    const choice = completion.choices[0];
    const call = choice.message.tool_calls?.[0];
    return {
      text: choice.message.content ?? '',
      toolCall:
        call && call.type === 'function'
          ? { name: call.function.name, args: JSON.parse(call.function.arguments || '{}') as Record<string, unknown> }
          : undefined,
      usage: toUsage(completion.usage),
    };
  }

  async streamResponse({ systemPrompt, messages, tools }: GenerateRequest, onDelta: (delta: string) => void): Promise<GenerateResult> {
    const stream = await this.requireClient().chat.completions.create({
      model: this.model,
      messages: toOpenAiMessages(systemPrompt, messages),
      tools: toOpenAiTools(tools),
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullText = '';
    let usage: TokenUsage | undefined;
    // Tool call arguments arrive as incremental string fragments, keyed by index — accumulate until the stream ends.
    const toolCallFragments = new Map<number, { name: string; args: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullText += delta.content;
        onDelta(delta.content);
      }
      for (const tc of delta?.tool_calls ?? []) {
        const existing = toolCallFragments.get(tc.index) ?? { name: '', args: '' };
        if (tc.function?.name) existing.name = tc.function.name;
        if (tc.function?.arguments) existing.args += tc.function.arguments;
        toolCallFragments.set(tc.index, existing);
      }
      if (chunk.usage) usage = toUsage(chunk.usage);
    }

    const firstToolCall = toolCallFragments.get(0);
    return {
      text: fullText,
      toolCall: firstToolCall ? { name: firstToolCall.name, args: JSON.parse(firstToolCall.args || '{}') as Record<string, unknown> } : undefined,
      usage,
    };
  }

  async generateStructuredOutput<T = unknown>({ systemPrompt, messages, responseSchema }: StructuredRequest): Promise<T> {
    // Plain JSON-object mode (widely supported) rather than strict json_schema
    // mode — the schema is folded into the system prompt as an instruction,
    // matching what most call sites of this method already expect.
    const schemaInstruction = `${systemPrompt}\n\nRespond ONLY with a JSON object matching this schema:\n${JSON.stringify(responseSchema)}`;
    const completion = await this.requireClient().chat.completions.create({
      model: this.model,
      messages: toOpenAiMessages(schemaInstruction, messages),
      response_format: { type: 'json_object' },
    });
    return JSON.parse(completion.choices[0].message.content ?? '{}') as T;
  }
}
