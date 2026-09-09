import { GoogleGenerativeAI, type Content, type Tool, type UsageMetadata } from '@google/generative-ai';
import { AIProvider, type ChatMessage, type GenerateRequest, type GenerateResult, type StructuredRequest, type TokenUsage } from './AIProvider.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] }));
}

function toUsage(meta: UsageMetadata | undefined): TokenUsage | undefined {
  if (!meta) return undefined;
  return {
    promptTokens: meta.promptTokenCount ?? 0,
    completionTokens: meta.candidatesTokenCount ?? 0,
    totalTokens: meta.totalTokenCount ?? 0,
  };
}

function toGeminiTools(tools: GenerateRequest['tools']): Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        // The SDK's own types are stricter than plain JSON-schema; this shape matches what the API actually accepts.
        parameters: t.parameters as never,
      })),
    },
  ];
}

export class GeminiProvider extends AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI | null;

  constructor(private apiKey: string | undefined, private model = process.env.GEMINI_MODEL || DEFAULT_MODEL) {
    super();
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.client;
  }

  private requireClient() {
    if (!this.client) throw new Error('GeminiProvider is not configured — GEMINI_API_KEY is missing.');
    return this.client;
  }

  async generateResponse({ systemPrompt, messages, tools }: GenerateRequest): Promise<GenerateResult> {
    const model = this.requireClient().getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      tools: toGeminiTools(tools),
    });
    const history = toGeminiHistory(messages.slice(0, -1));
    const last = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last?.content ?? '');
    const response = result.response;
    const calls = response.functionCalls();
    return {
      text: response.text(),
      toolCall: calls && calls.length > 0 ? { name: calls[0].name, args: calls[0].args as Record<string, unknown> } : undefined,
      usage: toUsage(response.usageMetadata),
    };
  }

  async streamResponse({ systemPrompt, messages, tools }: GenerateRequest, onDelta: (delta: string) => void): Promise<GenerateResult> {
    const model = this.requireClient().getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      tools: toGeminiTools(tools),
    });
    const history = toGeminiHistory(messages.slice(0, -1));
    const last = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(last?.content ?? '');

    let fullText = '';
    for await (const chunk of result.stream) {
      const delta = chunk.text();
      if (delta) {
        fullText += delta;
        onDelta(delta);
      }
    }
    const response = await result.response;
    const calls = response.functionCalls();
    return {
      text: fullText,
      toolCall: calls && calls.length > 0 ? { name: calls[0].name, args: calls[0].args as Record<string, unknown> } : undefined,
      usage: toUsage(response.usageMetadata),
    };
  }

  async generateStructuredOutput<T = unknown>({ systemPrompt, messages, responseSchema }: StructuredRequest): Promise<T> {
    const model = this.requireClient().getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as never,
      },
    });
    const history = toGeminiHistory(messages.slice(0, -1));
    const last = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last?.content ?? '');
    return JSON.parse(result.response.text()) as T;
  }
}
