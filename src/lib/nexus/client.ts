import type { NexusRole, NexusToolCall, NexusTokenUsage } from '../../types/nexus';
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
    cachedStatus = { connected: false, provider: 'gemini' };
    return cachedStatus;
  }
}

const META_MARKER = '\n\n[[NEXUS_META]]';

export interface StreamNexusParams {
  systemPrompt: string;
  history: { role: NexusRole; content: string }[];
  onDelta: (delta: string) => void;
}

export interface StreamNexusResult {
  text: string;
  toolCall?: NexusToolCall;
  usage?: NexusTokenUsage;
}

/** Talks only to /api/nexus/chat — never a provider SDK directly. */
export async function streamNexusReply({ systemPrompt, history, onDelta }: StreamNexusParams): Promise<StreamNexusResult> {
  const res = await fetch('/api/nexus/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages: history, tools: NEXUS_TOOLS }),
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

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    if (markerIndex === -1) markerIndex = full.indexOf(META_MARKER);
    const safeEnd = markerIndex === -1 ? full.length : markerIndex;
    if (safeEnd > visibleLen) {
      onDelta(full.slice(visibleLen, safeEnd));
      visibleLen = safeEnd;
    }
  }

  if (markerIndex === -1) return { text: full };

  const text = full.slice(0, markerIndex);
  try {
    const meta = JSON.parse(full.slice(markerIndex + META_MARKER.length)) as { toolCall?: NexusToolCall; usage?: NexusTokenUsage };
    return { text, toolCall: meta.toolCall, usage: meta.usage };
  } catch {
    return { text }; // malformed meta JSON — still show the text
  }
}
