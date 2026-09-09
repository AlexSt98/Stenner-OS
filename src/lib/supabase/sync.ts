// ─────────────────────────────────────────────────────────────────────────
// Supabase sync layer — the only place that translates between STENNER OS's
// camelCase app types (src/types/*) and the snake_case Postgres rows
// (schema.sql). The Zustand store (src/store/useStore.ts) calls into this;
// nothing else in the app talks to Supabase directly.
//
// Design:
//   - Every app entity already carries its own `id` (uuid v4, generated
//     client-side by the store). We reuse that same id as the Postgres PK,
//     so pushRow() is always an upsert-by-id — safe to call twice with the
//     same data (idempotent), which is what makes migration retries and
//     realtime echo-back both safe (see dedupe notes below).
//   - Realtime: each table subscription ignores changes whose row id was
//     just written by this same tab (see `recentlyWritten`), so a change
//     you make locally doesn't "bounce back" as a duplicate remote update.
// ─────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from './client';
import type {
  Task,
  Project,
  CalendarEvent,
  TimeSession,
  Idea,
  Board,
  BoardItem,
  Activity,
  UserSettings,
  EnglishSession,
} from '../../types';
import type { NexusConversation, NexusMessage } from '../../types/nexus';
import type { EnglishStats } from '../../store/useStore';

export const LOCAL_STORAGE_KEY = 'stenner-os-storage-v1';
export const MIGRATION_FLAG_KEY = 'stenner-os-storage-v1:migrated';

// ── Self-write suppression for Realtime echo ───────────────────────────
// Short-lived memory of ids this tab just pushed, so the Realtime
// subscription callback can skip re-applying our own write when Supabase
// echoes it back — avoids a redundant (harmless, but wasteful) re-render
// and any risk of clobbering a slightly newer local edit with the echo.
const recentlyWritten = new Map<string, number>();
const ECHO_SUPPRESS_MS = 4000;

function markWritten(id: string) {
  recentlyWritten.set(id, Date.now());
}

function wasRecentlyWritten(id: string) {
  const at = recentlyWritten.get(id);
  if (at === undefined) return false;
  if (Date.now() - at > ECHO_SUPPRESS_MS) {
    recentlyWritten.delete(id);
    return false;
  }
  return true;
}

// ── Row <-> app-type mappers ────────────────────────────────────────────
// Only the fields that exist in schema.sql; keeps this in one obvious place
// per entity instead of scattering snake_case knowledge across the store.

const taskToRow = (t: Task, userId: string) => ({
  id: t.id,
  user_id: userId,
  project_id: t.projectId,
  title: t.title,
  description: t.description,
  category: t.category,
  priority: t.priority,
  status: t.status,
  due_date: t.dueDate,
  due_time: t.dueTime,
  end_time: t.endTime,
  estimated_minutes: t.estimatedMinutes,
  actual_minutes: t.actualMinutes,
  duration_minutes: t.durationMinutes,
  tags: t.tags,
  created_at: t.createdAt,
  completed_at: t.completedAt,
  updated_at: t.updatedAt,
});
const rowToTask = (r: Record<string, unknown>): Task => ({
  id: r.id as string,
  title: r.title as string,
  description: (r.description as string) ?? '',
  projectId: (r.project_id as string) ?? null,
  category: r.category as string,
  priority: r.priority as Task['priority'],
  status: r.status as Task['status'],
  dueDate: (r.due_date as string) ?? null,
  dueTime: (r.due_time as string) ?? null,
  endTime: (r.end_time as string) ?? null,
  estimatedMinutes: (r.estimated_minutes as number) ?? 30,
  actualMinutes: (r.actual_minutes as number) ?? 0,
  durationMinutes: (r.duration_minutes as number) ?? null,
  tags: (r.tags as string[]) ?? [],
  createdAt: r.created_at as string,
  completedAt: (r.completed_at as string) ?? null,
  updatedAt: r.updated_at as string,
});

const projectToRow = (p: Project, userId: string) => ({
  id: p.id,
  user_id: userId,
  name: p.name,
  description: p.description,
  status: p.status,
  color: p.color,
  icon: p.icon ?? null,
  created_at: p.createdAt,
});
const rowToProject = (r: Record<string, unknown>): Project => ({
  id: r.id as string,
  name: r.name as string,
  description: (r.description as string) ?? '',
  status: r.status as Project['status'],
  color: r.color as string,
  icon: (r.icon as string) ?? undefined,
  createdAt: r.created_at as string,
});

// calendar_events — deliberately never linked automatically from tasks;
// task_id only ever comes from the app's explicit "Add to Calendar" flow
// (see scheduleTaskOnCalendar in useStore.ts), same as it does today.
const eventToRow = (e: CalendarEvent, userId: string) => ({
  id: e.id,
  user_id: userId,
  title: e.title,
  date: e.date,
  start_time: e.startTime,
  end_time: e.endTime,
  color: e.color,
  task_id: e.taskId ?? null,
  project_id: e.projectId ?? null,
  location: e.location ?? null,
  source: e.source,
});
const rowToEvent = (r: Record<string, unknown>): CalendarEvent => ({
  id: r.id as string,
  title: r.title as string,
  date: r.date as string,
  startTime: r.start_time as string,
  endTime: r.end_time as string,
  color: r.color as string,
  taskId: (r.task_id as string) ?? null,
  projectId: (r.project_id as string) ?? null,
  location: (r.location as string) ?? undefined,
  source: r.source as CalendarEvent['source'],
});

const sessionToRow = (s: TimeSession, userId: string) => ({
  id: s.id,
  user_id: userId,
  task_id: s.taskId,
  project_id: s.projectId,
  category: s.category,
  label: s.label,
  started_at: s.startedAt,
  ended_at: s.endedAt,
  duration_seconds: s.durationSeconds,
  date: s.date,
});
const rowToSession = (r: Record<string, unknown>): TimeSession => ({
  id: r.id as string,
  taskId: (r.task_id as string) ?? null,
  projectId: (r.project_id as string) ?? null,
  category: r.category as string,
  label: (r.label as string) ?? '',
  startedAt: r.started_at as string,
  endedAt: (r.ended_at as string) ?? null,
  durationSeconds: (r.duration_seconds as number) ?? 0,
  date: r.date as string,
});

const ideaToRow = (i: Idea, userId: string) => ({
  id: i.id,
  user_id: userId,
  title: i.title,
  description: i.description,
  tags: i.tags,
  image_url: i.imageUrl ?? null,
  url: i.url ?? null,
  date: i.date,
  converted_to_type: i.convertedTo?.type ?? null,
  converted_to_id: i.convertedTo?.id ?? null,
});
const rowToIdea = (r: Record<string, unknown>): Idea => ({
  id: r.id as string,
  title: r.title as string,
  description: (r.description as string) ?? '',
  tags: (r.tags as string[]) ?? [],
  imageUrl: (r.image_url as string) ?? null,
  url: (r.url as string) ?? null,
  date: r.date as string,
  convertedTo:
    r.converted_to_type && r.converted_to_id
      ? { type: r.converted_to_type as 'task' | 'project' | 'board', id: r.converted_to_id as string }
      : null,
});

const boardToRow = (b: Board, userId: string) => ({
  id: b.id,
  user_id: userId,
  name: b.name,
  description: b.description ?? null,
  created_at: b.createdAt,
});
const boardItemToRow = (boardId: string, item: BoardItem, userId: string) => ({
  id: item.id,
  user_id: userId,
  board_id: boardId,
  type: item.type,
  content: item.content,
  x: item.x,
  y: item.y,
  w: item.w,
  h: item.h,
  color: item.color,
  rotation: item.rotation ?? 0,
});
const rowToBoardItem = (r: Record<string, unknown>): BoardItem => ({
  id: r.id as string,
  type: r.type as BoardItem['type'],
  content: (r.content as string) ?? '',
  x: r.x as number,
  y: r.y as number,
  w: r.w as number,
  h: r.h as number,
  color: r.color as string,
  rotation: (r.rotation as number) ?? 0,
});

const activityToRow = (a: Activity, userId: string) => ({
  id: a.id,
  user_id: userId,
  type: a.type,
  message: a.message,
  meta: a.meta ?? null,
  timestamp: a.timestamp,
});
const rowToActivity = (r: Record<string, unknown>): Activity => ({
  id: r.id as string,
  type: r.type as Activity['type'],
  message: r.message as string,
  meta: (r.meta as Record<string, string>) ?? undefined,
  timestamp: r.timestamp as string,
});

const settingsToRow = (s: UserSettings, userId: string) => ({
  user_id: userId,
  name: s.name,
  role: s.role,
  avatar_emoji: s.avatarEmoji,
  xp: s.xp,
  streak: s.streak,
  last_active_date: s.lastActiveDate,
  daily_focus_goal_minutes: s.dailyFocusGoalMinutes,
  theme: s.theme,
  integrations: s.integrations,
});
const rowToSettings = (r: Record<string, unknown>): UserSettings => ({
  name: (r.name as string) ?? '',
  role: (r.role as string) ?? '',
  avatarEmoji: (r.avatar_emoji as string) ?? '🧑‍💻',
  xp: (r.xp as number) ?? 0,
  streak: (r.streak as number) ?? 0,
  lastActiveDate: (r.last_active_date as string) ?? null,
  dailyFocusGoalMinutes: (r.daily_focus_goal_minutes as number) ?? 480,
  theme: (r.theme as UserSettings['theme']) ?? 'dark',
  integrations: (r.integrations as UserSettings['integrations']) ?? {
    googleCalendar: { connected: false },
    googleDrive: { connected: false },
    gmail: { connected: false },
  },
});

const englishSessionToRow = (s: EnglishSession, userId: string) => ({
  id: s.id,
  user_id: userId,
  date: s.date,
  mode: s.mode,
  exercise_ids: s.exerciseIds,
  answers: s.answers,
  score: s.score,
  xp_earned: s.xpEarned,
  completed_at: s.completedAt,
});
const rowToEnglishSession = (r: Record<string, unknown>): EnglishSession => ({
  id: r.id as string,
  date: r.date as string,
  mode: r.mode as EnglishSession['mode'],
  exerciseIds: (r.exercise_ids as string[]) ?? [],
  answers: (r.answers as EnglishSession['answers']) ?? [],
  score: (r.score as number) ?? 0,
  xpEarned: (r.xp_earned as number) ?? 0,
  completedAt: r.completed_at as string,
});

const englishStatsToRow = (s: EnglishStats, userId: string) => ({
  user_id: userId,
  streak: s.streak,
  last_practice_date: s.lastPracticeDate,
});
const rowToEnglishStats = (r: Record<string, unknown>): EnglishStats => ({
  streak: (r.streak as number) ?? 0,
  lastPracticeDate: (r.last_practice_date as string) ?? null,
});

const conversationToRow = (c: NexusConversation, userId: string) => ({
  id: c.id,
  user_id: userId,
  title: c.title,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
  context_used: c.contextUsed,
});
const rowToConversation = (r: Record<string, unknown>): Omit<NexusConversation, 'messages'> => ({
  id: r.id as string,
  title: r.title as string,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
  contextUsed: (r.context_used as string[]) ?? [],
});

const messageToRow = (conversationId: string, m: NexusMessage, userId: string) => ({
  id: m.id,
  user_id: userId,
  conversation_id: conversationId,
  role: m.role,
  content: m.content,
  tool_call: m.toolCall ?? null,
  tool_call_resolution: m.toolCallResolution ?? null,
  context_labels: m.contextLabels ?? [],
  timestamp: m.timestamp,
});
const rowToMessage = (r: Record<string, unknown>): NexusMessage => ({
  id: r.id as string,
  role: r.role as NexusMessage['role'],
  content: (r.content as string) ?? '',
  toolCall: (r.tool_call as NexusMessage['toolCall']) ?? null,
  toolCallResolution: (r.tool_call_resolution as NexusMessage['toolCallResolution']) ?? null,
  contextLabels: (r.context_labels as string[]) ?? [],
  timestamp: r.timestamp as string,
});

// ── Generic push/delete helpers ─────────────────────────────────────────
// Fire-and-forget by design: the local store already applied the change
// (Zustand + localStorage is the offline cache), so a failed push logs a
// warning instead of rolling back the UI. The realtime subscription (or the
// next successful push) reconciles it later.

async function upsert(table: string, row: Record<string, unknown>) {
  if (!isSupabaseConfigured) return;
  markWritten(row.id as string);
  const { error } = await supabase.from(table).upsert(row);
  if (error) console.warn(`[supabase] upsert into ${table} failed:`, error.message);
}

async function remove(table: string, id: string) {
  if (!isSupabaseConfigured) return;
  markWritten(id);
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) console.warn(`[supabase] delete from ${table} failed:`, error.message);
}

export const push = {
  task: (t: Task, userId: string) => upsert('tasks', taskToRow(t, userId)),
  deleteTask: (id: string) => remove('tasks', id),
  project: (p: Project, userId: string) => upsert('projects', projectToRow(p, userId)),
  deleteProject: (id: string) => remove('projects', id),
  event: (e: CalendarEvent, userId: string) => upsert('calendar_events', eventToRow(e, userId)),
  deleteEvent: (id: string) => remove('calendar_events', id),
  session: (s: TimeSession, userId: string) => upsert('time_sessions', sessionToRow(s, userId)),
  idea: (i: Idea, userId: string) => upsert('ideas', ideaToRow(i, userId)),
  deleteIdea: (id: string) => remove('ideas', id),
  board: (b: Board, userId: string) => upsert('boards', boardToRow(b, userId)),
  deleteBoard: (id: string) => remove('boards', id),
  boardItem: (boardId: string, item: BoardItem, userId: string) => upsert('board_items', boardItemToRow(boardId, item, userId)),
  deleteBoardItem: (id: string) => remove('board_items', id),
  activity: (a: Activity, userId: string) => upsert('activities', activityToRow(a, userId)),
  settings: (s: UserSettings, userId: string) => upsert('user_settings', settingsToRow(s, userId)),
  englishSession: (s: EnglishSession, userId: string) => upsert('english_sessions', englishSessionToRow(s, userId)),
  englishStats: (s: EnglishStats, userId: string) => upsert('english_stats', englishStatsToRow(s, userId)),
  nexusConversation: (c: NexusConversation, userId: string) => upsert('nexus_conversations', conversationToRow(c, userId)),
  deleteNexusConversation: (id: string) => remove('nexus_conversations', id),
  nexusMessage: (conversationId: string, m: NexusMessage, userId: string) =>
    upsert('nexus_messages', messageToRow(conversationId, m, userId)),
};

// ── Full pull — used both for initial hydrate and for the migration's
// "does this user already have data?" check ─────────────────────────────
export interface SupabaseSnapshot {
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  timeSessions: TimeSession[];
  ideas: Idea[];
  boards: Board[];
  activities: Activity[];
  settings: UserSettings | null;
  englishSessions: EnglishSession[];
  englishStats: EnglishStats | null;
  nexusConversations: NexusConversation[];
}

export async function pullAll(): Promise<SupabaseSnapshot> {
  const empty: SupabaseSnapshot = {
    tasks: [],
    projects: [],
    events: [],
    timeSessions: [],
    ideas: [],
    boards: [],
    activities: [],
    settings: null,
    englishSessions: [],
    englishStats: null,
    nexusConversations: [],
  };
  if (!isSupabaseConfigured) return empty;

  const [tasks, projects, events, sessions, ideas, boards, boardItems, activities, settings, englishSessions, englishStats, conversations, messages] =
    await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('calendar_events').select('*'),
      supabase.from('time_sessions').select('*'),
      supabase.from('ideas').select('*'),
      supabase.from('boards').select('*'),
      supabase.from('board_items').select('*'),
      supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(100),
      supabase.from('user_settings').select('*').maybeSingle(),
      supabase.from('english_sessions').select('*'),
      supabase.from('english_stats').select('*').maybeSingle(),
      supabase.from('nexus_conversations').select('*'),
      supabase.from('nexus_messages').select('*').order('timestamp', { ascending: true }),
    ]);

  const boardItemsByBoard = new Map<string, BoardItem[]>();
  for (const r of boardItems.data ?? []) {
    const boardId = (r as Record<string, unknown>).board_id as string;
    const list = boardItemsByBoard.get(boardId) ?? [];
    list.push(rowToBoardItem(r as Record<string, unknown>));
    boardItemsByBoard.set(boardId, list);
  }

  const messagesByConversation = new Map<string, NexusMessage[]>();
  for (const r of messages.data ?? []) {
    const convId = (r as Record<string, unknown>).conversation_id as string;
    const list = messagesByConversation.get(convId) ?? [];
    list.push(rowToMessage(r as Record<string, unknown>));
    messagesByConversation.set(convId, list);
  }

  return {
    tasks: (tasks.data ?? []).map((r) => rowToTask(r as Record<string, unknown>)),
    projects: (projects.data ?? []).map((r) => rowToProject(r as Record<string, unknown>)),
    events: (events.data ?? []).map((r) => rowToEvent(r as Record<string, unknown>)),
    timeSessions: (sessions.data ?? []).map((r) => rowToSession(r as Record<string, unknown>)),
    ideas: (ideas.data ?? []).map((r) => rowToIdea(r as Record<string, unknown>)),
    boards: (boards.data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      const b: Board = {
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string) ?? undefined,
        createdAt: row.created_at as string,
        items: boardItemsByBoard.get(row.id as string) ?? [],
      };
      return b;
    }),
    activities: (activities.data ?? []).map((r) => rowToActivity(r as Record<string, unknown>)),
    settings: settings.data ? rowToSettings(settings.data as Record<string, unknown>) : null,
    englishSessions: (englishSessions.data ?? []).map((r) => rowToEnglishSession(r as Record<string, unknown>)),
    englishStats: englishStats.data ? rowToEnglishStats(englishStats.data as Record<string, unknown>) : null,
    nexusConversations: (conversations.data ?? []).map((r) => {
      const base = rowToConversation(r as Record<string, unknown>);
      return { ...base, messages: messagesByConversation.get(base.id) ?? [] };
    }),
  };
}

/** True if this user has ANY row in Supabase yet — used to decide whether to offer the migration prompt. */
export async function userHasRemoteData(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { count } = await supabase.from('tasks').select('id', { count: 'exact', head: true });
  if (count && count > 0) return true;
  const { count: projectCount } = await supabase.from('projects').select('id', { count: 'exact', head: true });
  return Boolean(projectCount && projectCount > 0);
}

// ── One-time local -> Supabase migration ────────────────────────────────
// Reuses every entity's existing client-generated id as the upsert key, so
// running this twice (e.g. a retry after a network error) never creates
// duplicate rows — it just re-writes the same rows with the same content.
export async function migrateLocalDataToSupabase(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured.' };

  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return { ok: false, error: 'No local data found to migrate.' };

  let parsed: { state?: Record<string, unknown> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Local data is corrupted — could not parse.' };
  }
  const state = parsed.state;
  if (!state) return { ok: false, error: 'Local data has no state to migrate.' };

  try {
    const tasks = (state.tasks as Task[]) ?? [];
    const projects = (state.projects as Project[]) ?? [];
    const events = (state.events as CalendarEvent[]) ?? [];
    const timeSessions = (state.timeSessions as TimeSession[]) ?? [];
    const ideas = (state.ideas as Idea[]) ?? [];
    const boards = (state.boards as Board[]) ?? [];
    const activities = (state.activities as Activity[]) ?? [];
    const settings = state.settings as UserSettings | undefined;
    const englishSessions = (state.englishSessions as EnglishSession[]) ?? [];
    const englishStats = state.englishStats as EnglishStats | undefined;
    const nexusConversations = (state.nexusConversations as NexusConversation[]) ?? [];

    // Projects before tasks/events (FK dependency), boards before board_items.
    if (projects.length) {
      const { error } = await supabase.from('projects').upsert(projects.map((p) => projectToRow(p, userId)));
      if (error) throw error;
    }
    if (tasks.length) {
      const { error } = await supabase.from('tasks').upsert(tasks.map((t) => taskToRow(t, userId)));
      if (error) throw error;
    }
    if (events.length) {
      const { error } = await supabase.from('calendar_events').upsert(events.map((e) => eventToRow(e, userId)));
      if (error) throw error;
    }
    if (timeSessions.length) {
      const { error } = await supabase.from('time_sessions').upsert(timeSessions.map((s) => sessionToRow(s, userId)));
      if (error) throw error;
    }
    if (ideas.length) {
      const { error } = await supabase.from('ideas').upsert(ideas.map((i) => ideaToRow(i, userId)));
      if (error) throw error;
    }
    if (boards.length) {
      const { error } = await supabase.from('boards').upsert(boards.map((b) => boardToRow(b, userId)));
      if (error) throw error;
      const allItems = boards.flatMap((b) => b.items.map((it) => boardItemToRow(b.id, it, userId)));
      if (allItems.length) {
        const { error: itemsError } = await supabase.from('board_items').upsert(allItems);
        if (itemsError) throw itemsError;
      }
    }
    if (activities.length) {
      const { error } = await supabase.from('activities').upsert(activities.map((a) => activityToRow(a, userId)));
      if (error) throw error;
    }
    if (settings) {
      const { error } = await supabase.from('user_settings').upsert(settingsToRow(settings, userId));
      if (error) throw error;
    }
    if (englishSessions.length) {
      const { error } = await supabase.from('english_sessions').upsert(englishSessions.map((s) => englishSessionToRow(s, userId)));
      if (error) throw error;
    }
    if (englishStats) {
      const { error } = await supabase.from('english_stats').upsert(englishStatsToRow(englishStats, userId));
      if (error) throw error;
    }
    if (nexusConversations.length) {
      const { error } = await supabase.from('nexus_conversations').upsert(nexusConversations.map((c) => conversationToRow(c, userId)));
      if (error) throw error;
      const allMessages = nexusConversations.flatMap((c) => c.messages.map((m) => messageToRow(c.id, m, userId)));
      if (allMessages.length) {
        const { error: msgError } = await supabase.from('nexus_messages').upsert(allMessages);
        if (msgError) throw msgError;
      }
    }

    // Only after every table above succeeded do we mark migration done.
    // The original localStorage key is NEVER touched/removed — it keeps
    // serving as the offline cache going forward.
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error migrating local data to Supabase.';
    return { ok: false, error: message };
  }
}

export function hasPendingLocalData(): boolean {
  return Boolean(localStorage.getItem(LOCAL_STORAGE_KEY)) && localStorage.getItem(MIGRATION_FLAG_KEY) !== 'true';
}

// ── Realtime subscriptions ───────────────────────────────────────────────
// One channel per user, one postgres_changes listener per table, filtered
// server-side to that user's rows. Each callback skips changes this same
// tab just wrote (see wasRecentlyWritten) to avoid a redundant self-echo.
export interface RealtimeHandlers {
  onTask?: (row: Task, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onProject?: (row: Project, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onEvent?: (row: CalendarEvent, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onSession?: (row: TimeSession, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onIdea?: (row: Idea, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onSettings?: (row: UserSettings) => void;
}

export function subscribeRealtime(userId: string, handlers: RealtimeHandlers) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`stenner-os:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, (payload) => {
      const row = (payload.new ?? payload.old) as Record<string, unknown>;
      if (wasRecentlyWritten(row.id as string)) return;
      handlers.onTask?.(rowToTask(row), payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` }, (payload) => {
      const row = (payload.new ?? payload.old) as Record<string, unknown>;
      if (wasRecentlyWritten(row.id as string)) return;
      handlers.onProject?.(rowToProject(row), payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${userId}` }, (payload) => {
      const row = (payload.new ?? payload.old) as Record<string, unknown>;
      if (wasRecentlyWritten(row.id as string)) return;
      handlers.onEvent?.(rowToEvent(row), payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'time_sessions', filter: `user_id=eq.${userId}` }, (payload) => {
      const row = (payload.new ?? payload.old) as Record<string, unknown>;
      if (wasRecentlyWritten(row.id as string)) return;
      handlers.onSession?.(rowToSession(row), payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `user_id=eq.${userId}` }, (payload) => {
      const row = (payload.new ?? payload.old) as Record<string, unknown>;
      if (wasRecentlyWritten(row.id as string)) return;
      handlers.onIdea?.(rowToIdea(row), payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${userId}` }, (payload) => {
      const row = payload.new as Record<string, unknown>;
      if (!row) return;
      handlers.onSettings?.(rowToSettings(row));
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
