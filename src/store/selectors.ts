import type { Task, TimeSession, Project, EnglishSession, EnglishProgress, EnglishMistake } from '../types';
import { isTodayISO, isThisWeekISO, isThisMonthISO } from '../lib/date';

export function projectProgress(tasks: Task[], projectId: string) {
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  const done = projectTasks.filter((t) => t.status === 'Done').length;
  return Math.round((done / projectTasks.length) * 100);
}

export function projectTaskCounts(tasks: Task[], projectId: string) {
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  return {
    total: projectTasks.length,
    done: projectTasks.filter((t) => t.status === 'Done').length,
  };
}

export function projectTrackedMinutes(sessions: TimeSession[], projectId: string) {
  const secs = sessions
    .filter((s) => s.projectId === projectId)
    .reduce((sum, s) => sum + s.durationSeconds, 0);
  return Math.round(secs / 60);
}

export function todaysTasks(tasks: Task[]) {
  return tasks.filter((t) => isTodayISO(t.dueDate) || t.status === 'Today');
}

export function activeProjectsCount(projects: Project[]) {
  return projects.filter((p) => p.status === 'Active' || p.status === 'On Track' || p.status === 'At Risk').length;
}

export function focusSecondsToday(sessions: TimeSession[]) {
  return sessions.filter((s) => s.date && isTodayISO(s.date)).reduce((sum, s) => sum + s.durationSeconds, 0);
}

export function focusSecondsThisWeek(sessions: TimeSession[]) {
  return sessions.filter((s) => isThisWeekISO(s.date)).reduce((sum, s) => sum + s.durationSeconds, 0);
}

export function focusSecondsThisMonth(sessions: TimeSession[]) {
  return sessions.filter((s) => isThisMonthISO(s.date)).reduce((sum, s) => sum + s.durationSeconds, 0);
}

export function secondsByCategory(sessions: TimeSession[], range: 'today' | 'week' | 'month' = 'today') {
  const filterFn = range === 'today' ? isTodayISO : range === 'week' ? isThisWeekISO : isThisMonthISO;
  const filtered = sessions.filter((s) => filterFn(s.date));
  const map = new Map<string, number>();
  for (const s of filtered) {
    map.set(s.category, (map.get(s.category) ?? 0) + s.durationSeconds);
  }
  return Array.from(map.entries())
    .map(([category, seconds]) => ({ category, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}

// ─────────────────────────────────────────────────────────────────────────
// TEOPM Workday — a "workday task" is any Task tagged TEOPM/WORK (or, for
// backward compatibility with tasks created before tag-based detection
// existed, one filed on the TEOPM project). No timer involved: the worked
// total for a day sums each task's durationMinutes — derived from its
// dueTime (start) and endTime (end) via calculateDuration(), never from a
// running/stopped timer — so nothing here double-counts Time Tracker
// sessions. Nothing new is persisted beyond the Task fields themselves; the
// 8h rollup for any date (past or present) falls out of the existing Task
// records.
// ─────────────────────────────────────────────────────────────────────────

export const TEOPM_PROJECT_ID = 'proj-teopm';
export const WORKDAY_TARGET_MINUTES = 480; // 8h — a goal, not a cap: logged time is never clamped to it.
const TEOPM_WORK_TAGS = new Set(['TEOPM', 'WORK']);

/** A task counts toward TEOPM the moment it carries a TEOPM/WORK tag (case-insensitive) — no project assignment required. */
export function isTeopmWorkTask(task: Task) {
  return task.projectId === TEOPM_PROJECT_ID || task.tags.some((tag) => TEOPM_WORK_TAGS.has(tag.trim().toUpperCase()));
}

export function teopmTasksForDate(tasks: Task[], date: string) {
  return tasks.filter((t) => isTeopmWorkTask(t) && t.dueDate === date);
}

export function teopmWorkedMinutes(tasks: Task[], date: string) {
  return teopmTasksForDate(tasks, date).reduce((sum, t) => sum + (t.durationMinutes ?? 0), 0);
}

export function teopmDayStats(tasks: Task[], date: string) {
  const dayTasks = teopmTasksForDate(tasks, date);
  const workedMinutes = dayTasks.reduce((sum, t) => sum + (t.durationMinutes ?? 0), 0);
  const tasksCompleted = dayTasks.filter((t) => t.status === 'Done').length;
  return {
    date,
    workedMinutes, // can exceed targetMinutes — 8h is a goal, not a limit
    targetMinutes: WORKDAY_TARGET_MINUTES,
    tasksCompleted,
    tasksTotal: dayTasks.length,
  };
}

/** Decimal-hours string like "1.5", "0.25", "8.0" — distinct from the "1h 30m" style used elsewhere. */
export function toDecimalHours(minutes: number) {
  return (minutes / 60).toFixed(2).replace(/0$/, '').replace(/\.$/, '.0');
}

// ─────────────────────────────────────────────────────────────────────────
// English Lab
// ─────────────────────────────────────────────────────────────────────────

export function englishSessionForDate(sessions: EnglishSession[], date: string) {
  return sessions.find((s) => s.date === date) ?? null;
}

const CORE_PROGRESS_TYPES = ['grammar', 'vocabulary', 'listening', 'business', 'writing', 'speaking'] as const;

export function englishProgressByType(sessions: EnglishSession[]): EnglishProgress {
  const totals: Record<string, { correct: number; total: number }> = {};
  for (const s of sessions) {
    for (const a of s.answers) {
      const key = a.type === 'dictation' ? 'listening' : a.type; // dictation folds into the listening bucket
      totals[key] ??= { correct: 0, total: 0 };
      totals[key].total += 1;
      if (a.correct) totals[key].correct += 1;
    }
  }
  const pct = (k: string) => (totals[k] && totals[k].total > 0 ? Math.round((totals[k].correct / totals[k].total) * 100) : 0);
  return Object.fromEntries(CORE_PROGRESS_TYPES.map((t) => [t, pct(t)])) as unknown as EnglishProgress;
}

export function englishMistakesByTopic(sessions: EnglishSession[]): EnglishMistake[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const a of s.answers) {
      if (!a.correct) counts.set(a.topicTag, (counts.get(a.topicTag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([topicTag, count]) => ({ topicTag, count }))
    .sort((a, b) => b.count - a.count);
}

export function englishTotalXp(sessions: EnglishSession[]) {
  return sessions.reduce((sum, s) => sum + s.xpEarned, 0);
}
