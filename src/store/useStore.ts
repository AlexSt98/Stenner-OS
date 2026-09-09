import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type {
  Task,
  Project,
  CalendarEvent,
  TimeSession,
  Idea,
  Board,
  BoardItem,
  Activity,
  ActivityType,
  UserSettings,
  RunningTimer,
  TaskStatus,
  Priority,
  EnglishSession,
  EnglishAnswer,
} from '../types';
import type { NexusConversation, NexusMessage, NexusTokenUsage } from '../types/nexus';
import {
  SEED_PROJECTS,
  SEED_TASKS,
  SEED_EVENTS,
  SEED_TIME_SESSIONS,
  SEED_IDEAS,
  SEED_BOARDS,
  SEED_ACTIVITIES,
  SEED_SETTINGS,
} from './seed';
import { nowISO, todayISO, yesterdayISO } from '../lib/date';
import { XP_PER_TASK } from '../lib/gamification';

const EMPTY_TIMER: RunningTimer = {
  taskId: null,
  projectId: null,
  category: 'General',
  label: '',
  startedAt: null,
  isPaused: false,
  accumulatedSeconds: 0,
};

export interface EnglishStats {
  streak: number;
  lastPracticeDate: string | null;
}

const EMPTY_ENGLISH_STATS: EnglishStats = { streak: 0, lastPracticeDate: null };

export interface NexusUsage {
  date: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

const EMPTY_NEXUS_USAGE: NexusUsage = { date: todayISO(), requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };

interface StennerState {
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  timeSessions: TimeSession[];
  ideas: Idea[];
  boards: Board[];
  activities: Activity[];
  settings: UserSettings;
  timer: RunningTimer;
  englishSessions: EnglishSession[];
  englishStats: EnglishStats;
  nexusConversations: NexusConversation[];
  nexusUsage: NexusUsage;

  // ── Tasks ────────────────────────────────────────────────
  addTask: (input: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  setTaskPriority: (id: string, priority: Priority) => void;
  reorderTasks: (draggedId: string, targetId: string) => void;

  // ── Projects ─────────────────────────────────────────────
  addProject: (input: Partial<Project> & { name: string }) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // ── Calendar ─────────────────────────────────────────────
  addEvent: (input: Partial<CalendarEvent> & { title: string; date: string; startTime: string; endTime: string }) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  scheduleTaskOnCalendar: (taskId: string, date: string, startTime: string, endTime: string) => void;

  // ── Time tracker ─────────────────────────────────────────
  startTimer: (input: { taskId?: string | null; projectId?: string | null; category: string; label: string }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;

  // ── Ideas ────────────────────────────────────────────────
  addIdea: (input: Partial<Idea> & { title: string }) => Idea;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  convertIdeaToTask: (id: string, overrides?: Partial<Task>) => Task;
  convertIdeaToProject: (id: string, overrides?: Partial<Project>) => Project;
  convertIdeaToBoardItem: (id: string, boardId: string) => void;

  // ── Boards ───────────────────────────────────────────────
  addBoard: (name: string) => Board;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;
  addBoardItem: (boardId: string, item: Partial<BoardItem>) => void;
  updateBoardItem: (boardId: string, itemId: string, patch: Partial<BoardItem>) => void;
  deleteBoardItem: (boardId: string, itemId: string) => void;

  // ── Settings / misc ──────────────────────────────────────
  updateSettings: (patch: Partial<UserSettings>) => void;
  resetDemoData: () => void;

  // ── English Lab ──────────────────────────────────────────
  addEnglishXp: (amount: number) => void;
  recordEnglishSession: (input: {
    mode: 'daily' | 'weak-areas';
    exerciseIds: string[];
    answers: EnglishAnswer[];
  }) => EnglishSession;

  // ── NEXUS ────────────────────────────────────────────────
  createNexusConversation: (title: string) => NexusConversation;
  appendNexusMessage: (conversationId: string, message: NexusMessage) => void;
  updateNexusMessage: (conversationId: string, messageId: string, patch: Partial<NexusMessage>) => void;
  renameNexusConversation: (conversationId: string, title: string) => void;
  deleteNexusConversation: (conversationId: string) => void;
  recordNexusUsage: (usage: NexusTokenUsage) => void;
}

function logActivityInto(activities: Activity[], type: ActivityType, message: string, meta?: Record<string, string>) {
  const entry: Activity = { id: uuid(), type, message, meta, timestamp: nowISO() };
  return [entry, ...activities].slice(0, 100);
}

function bumpStreakAndXp(settings: UserSettings, xpDelta: number): UserSettings {
  const today = todayISO();
  let { streak, lastActiveDate } = settings;
  if (xpDelta > 0) {
    if (lastActiveDate !== today) {
      // Compare plain "yyyy-MM-dd" strings, not Date objects — parsing a
      // date-only string builds it at UTC midnight, so comparing it against
      // a locally-computed "yesterday" can be off by a day in timezones
      // behind UTC. String equality sidesteps that entirely.
      const wasYesterday = lastActiveDate === yesterdayISO();
      streak = wasYesterday ? streak + 1 : 1;
      lastActiveDate = today;
    }
  }
  return { ...settings, xp: Math.max(0, settings.xp + xpDelta), streak, lastActiveDate };
}

/** English XP feeds the same global XP/level shown on Home, but never touches the main productivity streak. */
function addXpOnly(settings: UserSettings, amount: number): UserSettings {
  return { ...settings, xp: Math.max(0, settings.xp + amount) };
}

/** English Lab keeps its own day-consecutive streak, independent of task-completion streak. */
function bumpEnglishStreak(stats: EnglishStats): EnglishStats {
  const today = todayISO();
  if (stats.lastPracticeDate === today) return stats; // already practiced today, no double-count
  const wasYesterday = stats.lastPracticeDate === yesterdayISO();
  return { streak: wasYesterday ? stats.streak + 1 : 1, lastPracticeDate: today };
}

export const useStore = create<StennerState>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,
      projects: SEED_PROJECTS,
      events: SEED_EVENTS,
      timeSessions: SEED_TIME_SESSIONS,
      ideas: SEED_IDEAS,
      boards: SEED_BOARDS,
      activities: SEED_ACTIVITIES,
      settings: SEED_SETTINGS,
      timer: EMPTY_TIMER,
      englishSessions: [],
      englishStats: EMPTY_ENGLISH_STATS,
      nexusConversations: [],
      nexusUsage: EMPTY_NEXUS_USAGE,

      // ── Tasks ────────────────────────────────────────────
      addTask: (input) => {
        const task: Task = {
          id: uuid(),
          title: input.title,
          description: input.description ?? '',
          projectId: input.projectId ?? null,
          category: input.category ?? 'General',
          priority: input.priority ?? 'Medium',
          status: input.status ?? 'To Do',
          dueDate: input.dueDate ?? null,
          dueTime: input.dueTime ?? null,
          estimatedMinutes: input.estimatedMinutes ?? 30,
          actualMinutes: 0,
          tags: input.tags ?? [],
          createdAt: nowISO(),
          completedAt: null,
          updatedAt: nowISO(),
        };
        set((s) => ({
          tasks: [task, ...s.tasks],
          activities: logActivityInto(s.activities, 'task_created', `Created task "${task.title}"`),
        }));
        return task;
      },

      updateTask: (id, patch) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t)),
          activities: logActivityInto(s.activities, 'task_updated', `Updated task "${s.tasks.find((t) => t.id === id)?.title ?? ''}"`),
        }));
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          activities: task ? logActivityInto(s.activities, 'task_deleted', `Deleted task "${task.title}"`) : s.activities,
        }));
      },

      toggleTaskComplete: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const willComplete = task.status !== 'Done';
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: willComplete ? 'Done' : 'To Do',
                  completedAt: willComplete ? nowISO() : null,
                  updatedAt: nowISO(),
                }
              : t
          ),
          settings: bumpStreakAndXp(s.settings, willComplete ? XP_PER_TASK : -XP_PER_TASK),
          activities: logActivityInto(
            s.activities,
            willComplete ? 'task_completed' : 'task_updated',
            willComplete ? `${task.title} marked as completed` : `${task.title} marked as incomplete`
          ),
        }));
      },

      setTaskStatus: (id, status) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        if (status === 'Done' && task.status !== 'Done') {
          get().toggleTaskComplete(id);
          return;
        }
        if (status !== 'Done' && task.status === 'Done') {
          get().toggleTaskComplete(id);
          set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));
          return;
        }
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: nowISO() } : t)),
        }));
      },

      setTaskPriority: (id, priority) => {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority, updatedAt: nowISO() } : t)) }));
      },

      reorderTasks: (draggedId, targetId) => {
        if (draggedId === targetId) return;
        set((s) => {
          const list = [...s.tasks];
          const from = list.findIndex((t) => t.id === draggedId);
          const to = list.findIndex((t) => t.id === targetId);
          if (from === -1 || to === -1) return {};
          const [moved] = list.splice(from, 1);
          list.splice(to, 0, moved);
          return { tasks: list };
        });
      },

      // ── Projects ─────────────────────────────────────────
      addProject: (input) => {
        const project: Project = {
          id: uuid(),
          name: input.name,
          description: input.description ?? '',
          status: input.status ?? 'Active',
          color: input.color ?? '#8b5cf6',
          icon: input.icon ?? '●',
          createdAt: nowISO(),
        };
        set((s) => ({
          projects: [project, ...s.projects],
          activities: logActivityInto(s.activities, 'project_created', `Created project "${project.name}"`),
        }));
        return project;
      },

      updateProject: (id, patch) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          activities: logActivityInto(s.activities, 'project_updated', `Updated project "${s.projects.find((p) => p.id === id)?.name ?? ''}"`),
        }));
      },

      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
        }));
      },

      // ── Calendar ─────────────────────────────────────────
      addEvent: (input) => {
        const event: CalendarEvent = {
          id: uuid(),
          title: input.title,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          color: input.color ?? '#8b5cf6',
          taskId: input.taskId ?? null,
          projectId: input.projectId ?? null,
          location: input.location,
          source: 'local',
        };
        set((s) => ({
          events: [...s.events, event],
          activities: logActivityInto(s.activities, 'event_created', `Created event "${event.title}"`),
        }));
        return event;
      },

      updateEvent: (id, patch) => {
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
      },

      deleteEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      },

      scheduleTaskOnCalendar: (taskId, date, startTime, endTime) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const project = get().projects.find((p) => p.id === task.projectId);
        get().addEvent({
          title: task.title,
          date,
          startTime,
          endTime,
          color: project?.color ?? '#8b5cf6',
          taskId,
          projectId: task.projectId,
        });
        get().updateTask(taskId, { dueDate: date, dueTime: startTime });
      },

      // ── Time tracker ───────────────────────────────────────
      startTimer: ({ taskId = null, projectId = null, category, label }) => {
        const current = get().timer;
        if (current.startedAt || current.accumulatedSeconds > 0) {
          get().stopTimer();
        }
        set(() => ({
          timer: {
            taskId,
            projectId,
            category,
            label,
            startedAt: nowISO(),
            isPaused: false,
            accumulatedSeconds: 0,
          },
        }));
        set((s) => ({ activities: logActivityInto(s.activities, 'timer_started', `Started focus session — ${label}`) }));
      },

      pauseTimer: () => {
        const t = get().timer;
        if (!t.startedAt) return;
        const elapsed = (Date.now() - new Date(t.startedAt).getTime()) / 1000;
        set(() => ({
          timer: { ...t, startedAt: null, isPaused: true, accumulatedSeconds: t.accumulatedSeconds + elapsed },
        }));
      },

      resumeTimer: () => {
        const t = get().timer;
        if (t.startedAt) return;
        set(() => ({ timer: { ...t, startedAt: nowISO(), isPaused: false } }));
      },

      stopTimer: () => {
        const t = get().timer;
        if (!t.startedAt && t.accumulatedSeconds === 0) return;
        const runningSeconds = t.startedAt ? (Date.now() - new Date(t.startedAt).getTime()) / 1000 : 0;
        const totalSeconds = Math.round(t.accumulatedSeconds + runningSeconds);
        if (totalSeconds >= 5) {
          const session: TimeSession = {
            id: uuid(),
            taskId: t.taskId,
            projectId: t.projectId,
            category: t.category,
            label: t.label,
            startedAt: t.startedAt ?? nowISO(),
            endedAt: nowISO(),
            durationSeconds: totalSeconds,
            date: todayISO(),
          };
          set((s) => ({
            timeSessions: [session, ...s.timeSessions],
            tasks: t.taskId
              ? s.tasks.map((task) =>
                  task.id === t.taskId
                    ? { ...task, actualMinutes: task.actualMinutes + Math.round(totalSeconds / 60) }
                    : task
                )
              : s.tasks,
            activities: logActivityInto(s.activities, 'timer_stopped', `Stopped focus session — ${t.label} (${Math.round(totalSeconds / 60)}m)`),
          }));
        }
        set(() => ({ timer: EMPTY_TIMER }));
      },

      // ── Ideas ──────────────────────────────────────────────
      addIdea: (input) => {
        const idea: Idea = {
          id: uuid(),
          title: input.title,
          description: input.description ?? '',
          tags: input.tags ?? [],
          imageUrl: input.imageUrl ?? null,
          url: input.url ?? null,
          date: todayISO(),
          convertedTo: null,
        };
        set((s) => ({
          ideas: [idea, ...s.ideas],
          activities: logActivityInto(s.activities, 'idea_added', `Added new idea to Ideas Vault — "${idea.title}"`),
        }));
        return idea;
      },

      updateIdea: (id, patch) => {
        set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
      },

      deleteIdea: (id) => {
        set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) }));
      },

      convertIdeaToTask: (id, overrides) => {
        const idea = get().ideas.find((i) => i.id === id);
        if (!idea) throw new Error('Idea not found');
        const task = get().addTask({
          title: idea.title,
          description: idea.description,
          tags: idea.tags,
          ...overrides,
        });
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, convertedTo: { type: 'task', id: task.id } } : i)),
          activities: logActivityInto(s.activities, 'idea_converted', `Converted idea "${idea.title}" into a task`),
        }));
        return task;
      },

      convertIdeaToProject: (id, overrides) => {
        const idea = get().ideas.find((i) => i.id === id);
        if (!idea) throw new Error('Idea not found');
        const project = get().addProject({
          name: idea.title,
          description: idea.description,
          ...overrides,
        });
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, convertedTo: { type: 'project', id: project.id } } : i)),
          activities: logActivityInto(s.activities, 'idea_converted', `Converted idea "${idea.title}" into a project`),
        }));
        return project;
      },

      convertIdeaToBoardItem: (id, boardId) => {
        const idea = get().ideas.find((i) => i.id === id);
        if (!idea) return;
        get().addBoardItem(boardId, {
          type: 'sticky',
          content: idea.title,
          color: '#f59e0b',
        });
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, convertedTo: { type: 'board', id: boardId } } : i)),
          activities: logActivityInto(s.activities, 'idea_converted', `Converted idea "${idea.title}" into a board item`),
        }));
      },

      // ── Boards ─────────────────────────────────────────────
      addBoard: (name) => {
        const board: Board = { id: uuid(), name, items: [], createdAt: nowISO() };
        set((s) => ({
          boards: [...s.boards, board],
          activities: logActivityInto(s.activities, 'board_created', `Created board "${name}"`),
        }));
        return board;
      },

      deleteBoard: (id) => set((s) => ({ boards: s.boards.filter((b) => b.id !== id) })),

      renameBoard: (id, name) =>
        set((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, name } : b)) })),

      addBoardItem: (boardId, item) => {
        const newItem: BoardItem = {
          id: uuid(),
          type: item.type ?? 'sticky',
          content: item.content ?? '',
          x: item.x ?? 80,
          y: item.y ?? 80,
          w: item.w ?? 180,
          h: item.h ?? 100,
          color: item.color ?? '#8b5cf6',
          rotation: item.rotation ?? 0,
        };
        set((s) => ({
          boards: s.boards.map((b) => (b.id === boardId ? { ...b, items: [...b.items, newItem] } : b)),
        }));
      },

      updateBoardItem: (boardId, itemId, patch) => {
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId ? { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) } : b
          ),
        }));
      },

      deleteBoardItem: (boardId, itemId) => {
        set((s) => ({
          boards: s.boards.map((b) => (b.id === boardId ? { ...b, items: b.items.filter((it) => it.id !== itemId) } : b)),
        }));
      },

      // ── Settings ─────────────────────────────────────────
      updateSettings: (patch) => {
        set((s) => ({
          settings: { ...s.settings, ...patch },
          activities: logActivityInto(s.activities, 'settings_updated', 'Updated settings'),
        }));
      },

      resetDemoData: () => {
        set(() => ({
          tasks: SEED_TASKS,
          projects: SEED_PROJECTS,
          events: SEED_EVENTS,
          timeSessions: SEED_TIME_SESSIONS,
          ideas: SEED_IDEAS,
          boards: SEED_BOARDS,
          activities: SEED_ACTIVITIES,
          settings: SEED_SETTINGS,
          timer: EMPTY_TIMER,
          englishSessions: [],
          englishStats: EMPTY_ENGLISH_STATS,
          nexusConversations: [],
          nexusUsage: EMPTY_NEXUS_USAGE,
        }));
      },

      // ── English Lab ──────────────────────────────────────
      addEnglishXp: (amount) => {
        set((s) => ({ settings: addXpOnly(s.settings, amount) }));
      },

      recordEnglishSession: (input) => {
        const correct = input.answers.filter((a) => a.correct).length;
        const xpEarned = input.answers.reduce((sum, a) => sum + a.xpEarned, 0);
        const session: EnglishSession = {
          id: uuid(),
          date: todayISO(),
          mode: input.mode,
          exerciseIds: input.exerciseIds,
          answers: input.answers,
          score: correct,
          xpEarned,
          completedAt: nowISO(),
        };
        set((s) => ({
          englishSessions: [session, ...s.englishSessions],
          englishStats: input.mode === 'daily' ? bumpEnglishStreak(s.englishStats) : s.englishStats,
          activities: logActivityInto(
            s.activities,
            'english_session_completed',
            input.mode === 'daily'
              ? `Completed Daily English Challenge — ${correct}/${input.exerciseIds.length}`
              : `Practiced weak areas in English Lab — ${correct}/${input.exerciseIds.length}`
          ),
        }));
        return session;
      },

      // ── NEXUS ──────────────────────────────────────────────
      createNexusConversation: (title) => {
        const conversation: NexusConversation = {
          id: uuid(),
          title,
          createdAt: nowISO(),
          updatedAt: nowISO(),
          messages: [],
          contextUsed: [],
        };
        set((s) => ({ nexusConversations: [conversation, ...s.nexusConversations] }));
        return conversation;
      },

      appendNexusMessage: (conversationId, message) => {
        set((s) => ({
          nexusConversations: s.nexusConversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  contextUsed: Array.from(new Set([...c.contextUsed, ...(message.contextLabels ?? [])])),
                  updatedAt: nowISO(),
                }
              : c
          ),
        }));
      },

      updateNexusMessage: (conversationId, messageId, patch) => {
        set((s) => ({
          nexusConversations: s.nexusConversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)), updatedAt: nowISO() }
              : c
          ),
        }));
      },

      renameNexusConversation: (conversationId, title) => {
        set((s) => ({ nexusConversations: s.nexusConversations.map((c) => (c.id === conversationId ? { ...c, title } : c)) }));
      },

      deleteNexusConversation: (conversationId) => {
        set((s) => ({ nexusConversations: s.nexusConversations.filter((c) => c.id !== conversationId) }));
      },

      recordNexusUsage: (usage) => {
        set((s) => {
          const today = todayISO();
          const base = s.nexusUsage.date === today ? s.nexusUsage : { ...EMPTY_NEXUS_USAGE, date: today };
          return {
            nexusUsage: {
              date: today,
              requests: base.requests + 1,
              promptTokens: base.promptTokens + usage.promptTokens,
              completionTokens: base.completionTokens + usage.completionTokens,
              totalTokens: base.totalTokens + usage.totalTokens,
            },
          };
        });
      },
    }),
    {
      name: 'stenner-os-storage-v1',
    }
  )
);
