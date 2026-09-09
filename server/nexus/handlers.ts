// ─────────────────────────────────────────────────────────────────────────
// Shared NEXUS route logic — reused by BOTH runtimes that can front it:
//   - server/index.ts        (Express, used for local dev via Vite's proxy)
//   - api/nexus/*.ts          (Vercel Serverless Functions, used in production)
//
// Keeping the actual behavior here means the two entry points are thin
// adapters only: they translate their runtime's request/response shape into
// calls against this module, so the request/response formats stay identical
// no matter which one is serving the request.
// ─────────────────────────────────────────────────────────────────────────
import type { AIProvider, ChatMessage, ToolDeclaration } from '../providers/AIProvider.js';

export interface NexusStatusResponse {
  connected: boolean;
  provider: string;
}

/** Body shape POSTed by src/lib/nexus/client.ts's streamNexusReply(). */
export interface NexusChatBody {
  systemPrompt?: string;
  messages?: ChatMessage[];
  tools?: ToolDeclaration[];
}

export const NEXUS_META_MARKER = '\n\n[[NEXUS_META]]';

export function getNexusStatus(provider: AIProvider): NexusStatusResponse {
  return {
    connected: provider.isConfigured(),
    provider: provider.name,
  };
}

/** True when `body` has the minimum shape needed to call the provider. */
export function isValidChatBody(body: unknown): body is NexusChatBody & { messages: ChatMessage[] } {
  const b = body as Partial<NexusChatBody> | null | undefined;
  return !!b && Array.isArray(b.messages) && b.messages.length > 0;
}

/**
 * Streams a chat turn through `provider`, writing text deltas via `write`
 * and — once the turn completes — the same `[[NEXUS_META]]`-prefixed JSON
 * blob (tool call + usage) the Express route always appended. Mirrors the
 * try/catch behavior of the original route: a mid-stream provider error is
 * written into the stream as visible text rather than surfaced as a status
 * code, since headers are already flushed by the time streaming starts.
 */
export async function streamNexusChat(
  provider: AIProvider,
  body: NexusChatBody & { messages: ChatMessage[] },
  write: (chunk: string) => void
): Promise<void> {
  try {
    const result = await provider.streamResponse(
      { systemPrompt: body.systemPrompt ?? '', messages: body.messages, tools: body.tools },
      write
    );
    if (result.toolCall || result.usage) {
      write(NEXUS_META_MARKER + JSON.stringify({ toolCall: result.toolCall, usage: result.usage }));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error talking to the AI provider.';
    write(`\n\n[NEXUS encountered an error: ${message}]`);
  }
}
