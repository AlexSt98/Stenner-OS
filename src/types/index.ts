// ─────────────────────────────────────────────────────────────────────────
// STENNER OS — core data models
// These types are the contract for local persistence (LocalStorage) today
// and are shaped so a future backend (PostgreSQL) can mirror them 1:1.
// ─────────────────────────────────────────────────────────────────────────

export type Priority = 'Low' | 'Medium' | 'High';

export type TaskStatus = 'To Do' | 'Today' | 'In Progress' | 'Review' | 'Done';

export type ProjectStatus = 'Active' | 'On Track' | 'At Risk' | 'Completed' | 'Archived';

/** Categories are free-form but these are the seeded/common ones. */
export type Category =
  | 'Design'
  | 'Marketing'
  | 'Meetings'
  | 'Admin'
  | 'Content'
  | 'Personal'
  | 'General';

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  category: Category | string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null; // ISO date, e.g. 2026-09-08
  dueTime: string | null; // HH:mm, optional — lets a task become a calendar block
  estimatedMinutes: number;
  actualMinutes: number; // accumulated from linked TimeSessions
  tags: string[];
  createdAt: string; // ISO datetime
  completedAt: string | null;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string; // hex accent
  icon?: string; // optional emoji / lucide icon name
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string;
  taskId?: string | null; // links back to a Task if this block represents one
  projectId?: string | null;
  location?: string;
  source: 'local' | 'google'; // architecture hook for Google Calendar sync
}

export interface TimeSession {
  id: string;
  taskId: string | null;
  projectId: string | null;
  category: Category | string;
  label: string; // what shows in the tracker, e.g. "Design · WMS"
  startedAt: string; // ISO datetime
  endedAt: string | null; // null while running
  durationSeconds: number; // finalized on stop; live elapsed computed from startedAt while running
  date: string; // ISO date the session belongs to (for daily rollups)
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string | null; // data URL / object URL reference for V1
  url?: string | null;
  date: string;
  convertedTo?: { type: 'task' | 'project' | 'board'; id: string } | null;
}

export interface BoardItem {
  id: string;
  type: 'text' | 'sticky' | 'image' | 'section';
  content: string; // text content or image src
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rotation?: number;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  items: BoardItem[];
  createdAt: string;
}

export type ActivityType =
  | 'task_completed'
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'idea_added'
  | 'idea_converted'
  | 'project_created'
  | 'project_updated'
  | 'event_created'
  | 'timer_started'
  | 'timer_stopped'
  | 'board_created'
  | 'level_up'
  | 'settings_updated';

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  meta?: Record<string, string>;
  timestamp: string; // ISO datetime
}

export interface UserSettings {
  name: string;
  role: string;
  avatarEmoji: string;
  xp: number;
  streak: number;
  lastActiveDate: string | null; // ISO date of last "productive" action
  dailyFocusGoalMinutes: number;
  theme: 'dark' | 'light';
  // Integration placeholders — wired up but inert until credentials exist.
  integrations: {
    googleCalendar: { connected: boolean };
    googleDrive: { connected: boolean };
    gmail: { connected: boolean };
  };
}

export interface RunningTimer {
  taskId: string | null;
  projectId: string | null;
  category: Category | string;
  label: string;
  startedAt: string | null; // ISO datetime; null = not running
  isPaused: boolean;
  accumulatedSeconds: number; // seconds banked before the current run (from pauses)
}
