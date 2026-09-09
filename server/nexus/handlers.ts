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
import { extractDocumentText } from './fileExtract.js';

export interface NexusStatusResponse {
  connected: boolean;
  provider: string;
}

/** A file the frontend attached to the LAST message in the request — see src/lib/nexus/client.ts. */
export interface NexusAttachment {
  name: string;
  mimeType: string;
  /** data: URL as read client-side via FileReader — decoded to a Buffer here for document extraction. */
  dataUrl: string;
}

/** Body shape POSTed by src/lib/nexus/client.ts's streamNexusReply(). */
export interface NexusChatBody {
  systemPrompt?: string;
  messages?: ChatMessage[];
  tools?: ToolDeclaration[];
  /** Attachments on the newest (last) message only — images go to vision, documents get text-extracted below. */
  attachments?: NexusAttachment[];
}

export const NEXUS_META_MARKER = '\n\n[[NEXUS_META]]';
export const NEXUS_PHASE_MARKER_PREFIX = '\n\n[[NEXUS_PHASE:';
export const NEXUS_PHASE_MARKER_SUFFIX = ']]\n\n';

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

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Buffer.from(base64, 'base64');
}

/**
 * Splits this turn's attachments into images (attached directly to the last
 * message for vision) and documents (text-extracted locally — see
 * fileExtract.ts — and folded in as labeled context). Extraction errors
 * become a visible, honest note rather than a silent failure or a pretended
 * success (see fileExtract.ts's ExtractedFile.error).
 */
async function prepareAttachments(attachments: NexusAttachment[] | undefined) {
  const images: { dataUrl: string }[] = [];
  const fileContext: { fileName: string; text: string }[] = [];
  const extractionErrors: string[] = [];

  for (const att of attachments ?? []) {
    if (att.mimeType.startsWith('image/')) {
      images.push({ dataUrl: att.dataUrl });
      continue;
    }
    const buffer = dataUrlToBuffer(att.dataUrl);
    const extracted = await extractDocumentText(att.name, att.mimeType, buffer);
    if (!extracted) continue; // image type routed above, shouldn't normally happen here
    if (extracted.error) {
      extractionErrors.push(extracted.error);
    } else {
      fileContext.push({ fileName: extracted.name, text: extracted.text });
    }
  }

  return { images, fileContext, extractionErrors };
}

/**
 * Streams a chat turn through `provider`, writing text deltas via `write`
 * and — once the turn completes — the same `[[NEXUS_META]]`-prefixed JSON
 * blob (tool call + usage, now also sources/images when the hosted web
 * search / image generation tools actually ran) the Express route always
 * appended. Also writes a `[[NEXUS_PHASE:...]]` marker the moment a hosted
 * tool starts running, so the UI can show "Searching the web…" etc. instead
 * of a generic "thinking" state — see src/lib/nexus/client.ts for parsing.
 * Mirrors the try/catch behavior of the original route: a mid-stream
 * provider error is written into the stream as visible text rather than
 * surfaced as a status code, since headers are already flushed by the time
 * streaming starts.
 */
export async function streamNexusChat(
  provider: AIProvider,
  body: NexusChatBody & { messages: ChatMessage[] },
  write: (chunk: string) => void
): Promise<void> {
  try {
    const { images, fileContext, extractionErrors } = await prepareAttachments(body.attachments);

    if (extractionErrors.length > 0) {
      write(`${extractionErrors.map((e) => `⚠️ ${e}`).join('\n')}\n\n`);
    }

    const messages = [...body.messages];
    if (images.length > 0 || fileContext.length > 0) {
      const last = messages[messages.length - 1];
      messages[messages.length - 1] = { ...last, images: images.length ? images : undefined, fileContext: fileContext.length ? fileContext : undefined };
    }

    // Nothing left to send to the model — every attachment failed extraction.
    if (messages[messages.length - 1]?.content.trim() === '' && images.length === 0 && fileContext.length === 0 && extractionErrors.length > 0) {
      return;
    }

    const result = await provider.streamResponse(
      { systemPrompt: body.systemPrompt ?? '', messages, tools: body.tools, enableWebSearch: true, enableImageGeneration: true },
      write,
      (phase) => write(`${NEXUS_PHASE_MARKER_PREFIX}${phase}${NEXUS_PHASE_MARKER_SUFFIX}`)
    );
    if (result.toolCall || result.usage || result.sources || result.images) {
      write(NEXUS_META_MARKER + JSON.stringify({ toolCall: result.toolCall, usage: result.usage, sources: result.sources, images: result.images }));
    }
  } catch (err) {
    // The stream may already have started — write a visible error instead of
    // changing the status code (headers are already sent by this point).
    // Full details go to server logs; the user only sees a plain, honest note.
    console.error('[nexus] streamNexusChat failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error talking to the AI provider.';
    write(`\n\n[NEXUS encountered an error: ${message}]`);
  }
}
