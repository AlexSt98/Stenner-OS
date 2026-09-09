import type { NexusAttachment, NexusPhase, NexusRole, NexusSource, NexusToolCall, NexusTokenUsage } from '../../types/nexus';
import { NEXUS_TOOLS } from './tools';

export interface NexusStatus {
  connected: boolean;
  provider: string;
}

let cachedStatus: NexusStatus | null = null;

/** Cheap, cached — call refreshNexusStatus() to force a re-check (e.g. after editing .env and restarting the server). */
export async function fetchNexusStatus(force = false): Promise<NexusStatus> {
  if (cachedStatus && !force) return cachedStatus;
  try {
    const res = await fetch('/api/nexus/status');
    if (!res.ok) throw new Error('status check failed');
    cachedStatus = await res.json();
    return cachedStatus!;
  } catch {
    cachedStatus = { connected: false, provider: 'openai' };
    return cachedStatus;
  }
}

const META_MARKER = '\n\n[[NEXUS_META]]';
const PHASE_MARKER_PREFIX = '\n\n[[NEXUS_PHASE:';
const PHASE_MARKER_SUFFIX = ']]\n\n';

export interface StreamNexusParams {
  systemPrompt: string;
  history: { role: NexusRole; content: string }[];
  /** Attached to the LAST message only (the one just sent) — see server/nexus/handlers.ts's NexusAttachment. */
  attachments?: NexusAttachment[];
  onDelta: (delta: string) => void;
  /** Fires the moment a hosted tool (web search, image generation) actually starts running — never simulated. */
  onPhase?: (phase: NexusPhase) => void;
}

export interface StreamNexusResult {
  text: string;
  toolCall?: NexusToolCall;
  usage?: NexusTokenUsage;
  /** Present only when the hosted web-search tool actually returned citations this turn. */
  sources?: NexusSource[];
  /** Present only when the hosted image-generation tool actually produced an image this turn. */
  images?: string[];
}

/** Talks only to /api/nexus/chat — never a provider SDK directly. */
export async function streamNexusReply({ systemPrompt, history, attachments, onDelta, onPhase }: StreamNexusParams): Promise<StreamNexusResult> {
  const res = await fetch('/api/nexus/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages: history, tools: NEXUS_TOOLS, attachments }),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: 'NEXUS request failed.' }));
    throw new Error(err.error || 'NEXUS request failed.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let visibleLen = 0;
  let markerIndex = -1;
  let visibleText = ''; // exactly what's been handed to onDelta so far — phase markers never included

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });

    // Strip any complete `[[NEXUS_PHASE:...]]` markers sitting right at the
    // front of the not-yet-emitted text (they're always written before any
    // real output for that phase begins — see streamNexusChat in
    // server/nexus/handlers.ts). A marker still arriving mid-flight (suffix
    // not seen yet) is left for the next chunk rather than guessed at.
    for (;;) {
      if (!full.startsWith(PHASE_MARKER_PREFIX, visibleLen)) break;
      const suffixStart = full.indexOf(PHASE_MARKER_SUFFIX, visibleLen + PHASE_MARKER_PREFIX.length);
      if (suffixStart === -1) break;
      const phase = full.slice(visibleLen + PHASE_MARKER_PREFIX.length, suffixStart);
      onPhase?.(phase as NexusPhase);
      visibleLen = suffixStart + PHASE_MARKER_SUFFIX.length;
    }

    if (markerIndex === -1) markerIndex = full.indexOf(META_MARKER, visibleLen);
    const safeEnd = markerIndex === -1 ? full.length : markerIndex;
    if (safeEnd > visibleLen) {
      const delta = full.slice(visibleLen, safeEnd);
      onDelta(delta);
      visibleText += delta;
      visibleLen = safeEnd;
    }
  }

  if (markerIndex === -1) return { text: visibleText };

  const text = visibleText;
  try {
    const meta = JSON.parse(full.slice(markerIndex + META_MARKER.length)) as {
      toolCall?: NexusToolCall;
      usage?: NexusTokenUsage;
      sources?: NexusSource[];
      images?: string[];
    };
    return { text, toolCall: meta.toolCall, usage: meta.usage, sources: meta.sources, images: meta.images };
  } catch {
    return { text }; // malformed meta JSON — still show the text
  }
}
