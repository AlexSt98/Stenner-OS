import type { Task, TimeSession, Project } from '../types';
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
