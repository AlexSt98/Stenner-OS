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

export interface NexusMessage {
  id: string;
  role: NexusRole;
  content: string;
  toolCall?: NexusToolCall | null;
  /** Set once the user has confirmed or cancelled a proposed action card. */
  toolCallResolution?: 'confirmed' | 'cancelled' | null;
  contextLabels?: string[]; // which context blocks were sent alongside this turn, for transparency
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
