// ─────────────────────────────────────────────────────────────────────────
// NEXUS CONTEXT — the "only fetch what's relevant" layer.
//
// Every function here returns a small, self-contained block of plain text
// built from data that's already in the Zustand store (getState(), not a
// hook — this runs from an event handler, not a component). selectContext()
// scans the user's message for intent keywords and assembles only the
// blocks that matter, plus a cheap always-on baseline (date + today's
// tasks). Nothing here calls the network — this is pure, free, local work
// that happens BEFORE we ever spend a token on the AI provider.
// ─────────────────────────────────────────────────────────────────────────

import { useStore } from '../../store/useStore';
import { fmtDateLong, fmtHM, todayISO } from '../date';
import {
  teopmDayStats,
  teopmTasksForDate,
  toDecimalHours,
  projectProgress,
  projectTaskCounts,
  projectTrackedMinutes,
  focusSecondsToday,
  focusSecondsThisWeek,
  secondsByCategory,
  englishProgressByType,
  englishMistakesByTopic,
  englishSessionForDate,
  todaysTasks,
  activeProjectsCount,
} from '../../store/selectors';

export interface ContextBlock {
  label: string;
  text: string;
}

function dateTimeBlock(): ContextBlock {
  const now = new Date();
  return {
    label: 'datetime',
    text: `Current date: ${fmtDateLong(now)}. Current time: ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`,
  };
}

function tasksBlock(): ContextBlock {
  const { tasks } = useStore.getState();
  const today = todaysTasks(tasks);
  const pending = today.filter((t) => t.status !== 'Done');
  const done = today.filter((t) => t.status === 'Done');
  const lines = [
    `Today's tasks: ${today.length} total, ${done.length} completed, ${pending.length} pending.`,
    pending.length > 0
      ? `Pending: ${pending.map((t) => `"${t.title}" (${t.priority} priority, ${t.status}${t.dueTime ? `, ${t.dueTime}` : ''})`).join('; ')}.`
      : 'Nothing pending today.',
    done.length > 0 ? `Completed today: ${done.map((t) => `"${t.title}"`).join(', ')}.` : '',
  ].filter(Boolean);
  return { label: 'tasks', text: lines.join(' ') };
}

function teopmBlock(): ContextBlock {
  const { tasks } = useStore.getState();
  const today = todayISO();
  const stats = teopmDayStats(tasks, today);
  const dayTasks = teopmTasksForDate(tasks, today);
  const pending = dayTasks.filter((t) => t.status !== 'Done');
  const lines = [
    `TEOPM workday: ${toDecimalHours(stats.workedMinutes)} of 8.0 hours logged today, ${stats.tasksCompleted}/${stats.tasksTotal} tasks completed.`,
    pending.length > 0
      ? `Remaining TEOPM tasks: ${pending.map((t) => `"${t.title}" (${t.priority}, est. ${fmtHM(t.estimatedMinutes)})`).join('; ')}.`
      : 'No remaining TEOPM tasks today.',
  ];
  return { label: 'teopm', text: lines.join(' ') };
}

function calendarBlock(): ContextBlock {
  const { events } = useStore.getState();
  const today = todayISO();
  const todayEvents = events.filter((e) => e.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcoming = events
    .filter((e) => e.date > today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 3);
  const lines = [
    todayEvents.length > 0
      ? `Today's calendar: ${todayEvents.map((e) => `${e.startTime}-${e.endTime} "${e.title}"`).join('; ')}.`
      : 'No calendar events today.',
    upcoming.length > 0 ? `Upcoming: ${upcoming.map((e) => `${e.date} ${e.startTime} "${e.title}"`).join('; ')}.` : '',
  ].filter(Boolean);
  return { label: 'calendar', text: lines.join(' ') };
}

function projectsBlock(): ContextBlock {
  const { tasks, projects, timeSessions } = useStore.getState();
  const lines = projects.map((p) => {
    const pct = projectProgress(tasks, p.id);
    const counts = projectTaskCounts(tasks, p.id);
    const minutes = projectTrackedMinutes(timeSessions, p.id);
    return `"${p.name}" (${p.status}): ${pct}% complete, ${counts.done}/${counts.total} tasks, ${fmtHM(minutes)} tracked.`;
  });
  return {
    label: 'projects',
    text: `Active projects: ${activeProjectsCount(projects)}. ${lines.join(' ')}`,
  };
}

function timeTrackingBlock(): ContextBlock {
  const { timeSessions } = useStore.getState();
  const todayMin = Math.round(focusSecondsToday(timeSessions) / 60);
  const weekMin = Math.round(focusSecondsThisWeek(timeSessions) / 60);
  const byCategory = secondsByCategory(timeSessions, 'week').map((c) => `${c.category} ${fmtHM(Math.round(c.seconds / 60))}`);
  return {
    label: 'time_tracking',
    text: `Time tracked today: ${fmtHM(todayMin)}. This week: ${fmtHM(weekMin)} total${byCategory.length ? ` (${byCategory.join(', ')})` : ''}.`,
  };
}

function englishBlock(): ContextBlock {
  const { englishSessions, englishStats } = useStore.getState();
  const progress = englishProgressByType(englishSessions);
  const mistakes = englishMistakesByTopic(englishSessions);
  const today = englishSessionForDate(englishSessions, todayISO());
  const lines = [
    `English Lab streak: ${englishStats.streak} days.`,
    today ? `Today's practice: ${today.score}/${today.exerciseIds.length}.` : 'No practice session today yet.',
    `Progress — Grammar ${progress.grammar}%, Vocabulary ${progress.vocabulary}%, Listening ${progress.listening}%, Business English ${progress.business}%, Writing ${progress.writing}%, Speaking ${progress.speaking}%.`,
    mistakes.length > 0 ? `Top weak areas: ${mistakes.slice(0, 3).map((m) => `${m.topicTag} (${m.count} mistakes)`).join(', ')}.` : 'No recorded mistakes yet.',
  ];
  return { label: 'english', text: lines.join(' ') };
}

function ideasBlock(): ContextBlock {
  const { ideas } = useStore.getState();
  const recent = ideas.slice(0, 5);
  return {
    label: 'ideas',
    text: recent.length > 0 ? `Recent ideas: ${recent.map((i) => `"${i.title}"`).join(', ')}.` : 'No ideas saved yet.',
  };
}

function activityBlock(): ContextBlock {
  const { activities } = useStore.getState();
  const recent = activities.slice(0, 6);
  return {
    label: 'activity',
    text: recent.length > 0 ? `Recent activity: ${recent.map((a) => a.message).join('; ')}.` : 'No recent activity.',
  };
}

const INTENT_RULES: { keywords: string[]; block: () => ContextBlock }[] = [
  { keywords: ['teopm', 'workday', 'work hour', 'worked today', 'hora trabaj', 'jornada'], block: teopmBlock },
  {
    keywords: ['english', 'inglés', 'ingles', 'grammar', 'vocabulary', 'listening', 'speaking', 'writing', 'mistake', 'streak'],
    block: englishBlock,
  },
  { keywords: ['project', 'proyecto', 'progress', 'deadline', 'behind'], block: projectsBlock },
  { keywords: ['calendar', 'meeting', 'event', 'agenda', 'reunión', 'reunion', 'free time', 'schedule'], block: calendarBlock },
  { keywords: ['time', 'tracked', 'hours', 'week', 'tiempo', 'horas'], block: timeTrackingBlock },
  { keywords: ['idea'], block: ideasBlock },
  { keywords: ['activity', 'recent', 'actividad'], block: activityBlock },
];

/**
 * Picks only the context blocks relevant to what the user asked. Always
 * includes date/time + today's tasks (cheap, almost universally useful);
 * everything else is opt-in based on keyword intent.
 */
export function selectContext(userMessage: string): ContextBlock[] {
  const lower = userMessage.toLowerCase();
  const blocks = new Map<string, ContextBlock>();

  for (const b of [dateTimeBlock(), tasksBlock()]) blocks.set(b.label, b);

  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      const block = rule.block();
      blocks.set(block.label, block);
    }
  }

  return Array.from(blocks.values());
}

export function contextToSystemPromptBlock(blocks: ContextBlock[]): string {
  if (blocks.length === 0) return '';
  return `\n\nCurrent STENNER OS context:\n${blocks.map((b) => `- ${b.text}`).join('\n')}`;
}
