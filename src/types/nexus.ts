// ─────────────────────────────────────────────────────────────────────────
// NEXUS — types shared across the frontend only. The backend (server/) is
// deliberately decoupled: it knows nothing about Tasks or Projects, just
// { systemPrompt, messages, tools } in, streamed text (+ maybe a tool call)
// out. STENNER OS's own meaning lives entirely in src/lib/nexus/*.
// ─────────────────────────────────────────────────────────────────────────

export type NexusRole = 'user' | 'model';

export type NexusToolName =
  | 'createTask'
  | 'updateTask'
  | 'completeTask'
  | 'createProject'
  | 'createIdea'
  | 'createCalendarEvent'
  | 'startTimer'
  | 'stopTimer';

export interface NexusToolCall {
  name: NexusToolName;
  args: Record<string, unknown>;
}

/** A citation the model's hosted web-search tool actually returned — never fabricated by the frontend. */
export interface NexusSource {
  title: string;
  url: string;
}

/** A file the user attached to a message — images go to vision, documents get server-side text extraction. */
export interface NexusAttachment {
  name: string;
  mimeType: string;
  /** data: URL as read via FileReader — only images additionally get a thumbnail preview. */
  dataUrl: string;
}

/** Real-time phase of the current turn, reported by the backend as it actually happens — see lib/nexus/client.ts. */
export type NexusPhase = 'thinking' | 'searching' | 'generating_image';

export interface NexusMessage {
  id: string;
  role: NexusRole;
  content: string;
  toolCall?: NexusToolCall | null;
  /** Set once the user has confirmed or cancelled a proposed action card. */
  toolCallResolution?: 'confirmed' | 'cancelled' | null;
  contextLabels?: string[]; // which context blocks were sent alongside this turn, for transparency
  /** Files the USER attached to this message (user turns only). */
  attachments?: NexusAttachment[];
  /** Images the hosted image-generation tool actually produced this turn, as data: URLs. */
  images?: string[];
  /** Web citations the hosted web-search tool actually returned this turn. Absent unless it really ran. */
  sources?: NexusSource[];
  timestamp: string;
}

export interface NexusTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface NexusConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: NexusMessage[];
  contextUsed: string[]; // union of context labels used across the conversation
}
