// ─────────────────────────────────────────────────────────────────────────
// Demo/local mode — used automatically whenever /api/nexus reports it isn't
// connected (no provider key configured). This is NOT a fake placeholder:
// it reads the same real store data as the live context layer and produces
// genuinely useful, computed answers for the common questions (the same
// ones the quick prompts send) — so the whole NEXUS UI/UX can be tried with
// zero setup. Anything outside its pattern set gets an honest "connect a
// provider for open-ended questions" nudge instead of a hallucinated guess.
// ─────────────────────────────────────────────────────────────────────────

import { useStore } from '../../store/useStore';
import { fmtHM, todayISO } from '../date';
import {
  teopmDayStats,
  toDecimalHours,
  WORKDAY_TARGET_MINUTES,
  todaysTasks,
  projectProgress,
  projectTaskCounts,
  focusSecondsThisWeek,
  secondsByCategory,
  englishProgressByType,
  englishMistakesByTopic,
} from '../../store/selectors';
import type { NexusToolCall } from '../../types/nexus';

export interface DemoResult {
  text: string;
  toolCall?: NexusToolCall;
}

function pendingTasksToday() {
  const { tasks } = useStore.getState();
  return todaysTasks(tasks).filter((t) => t.status !== 'Done');
}

function reviewTasks(): DemoResult {
  const { tasks } = useStore.getState();
  const today = todaysTasks(tasks);
  const done = today.filter((t) => t.status === 'Done');
  const pending = today.filter((t) => t.status !== 'Done');
  const nextEvent = useStore.getState().events.filter((e) => e.date === todayISO()).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  const lines = [
    `You have ${pending.length} task${pending.length === 1 ? '' : 's'} remaining today.`,
    `You've completed ${done.length} of ${today.length} tasks.`,
    nextEvent ? `Your next calendar event is at ${nextEvent.startTime} — "${nextEvent.title}".` : '',
    pending.length > 0
      ? `I'd prioritize:\n\n${pending
          .slice(0, 5)
          .map((t, i) => `${i + 1}. ${t.title} (${t.priority})`)
          .join('\n')}`
      : "Nothing left — that's a clean board.",
  ].filter(Boolean);
  return { text: lines.join('\n') };
}

function planMyDay(): DemoResult {
  const pending = pendingTasksToday();
  const { events } = useStore.getState();
  const today = todayISO();
  const stats = teopmDayStats(useStore.getState().tasks, today);
  const remainingMinutes = Math.max(0, WORKDAY_TARGET_MINUTES - stats.workedMinutes);

  if (pending.length === 0) {
    return { text: `You've got no pending tasks today, and ${toDecimalHours(stats.workedMinutes)}h logged on TEOPM. A good day to get ahead on something, or rest.` };
  }

  const sorted = [...pending].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 } as const;
    return order[a.priority] - order[b.priority];
  });

  const todayEvents = events.filter((e) => e.date === today);
  const lines = [
    `You have ${fmtHM(remainingMinutes)} left toward today's 8h TEOPM goal, and ${pending.length} pending task${pending.length === 1 ? '' : 's'}.`,
    todayEvents.length > 0 ? `Calendar today: ${todayEvents.map((e) => `${e.startTime} "${e.title}"`).join(', ')}.` : '',
    `Suggested order:\n\n${sorted.map((t, i) => `${i + 1}. ${t.title} — ${t.priority} priority, est. ${fmtHM(t.estimatedMinutes)}`).join('\n')}`,
  ].filter(Boolean);
  return { text: lines.join('\n') };
}

function analyzeProductivity(): DemoResult {
  const { tasks, timeSessions, settings } = useStore.getState();
  const today = todaysTasks(tasks);
  const done = today.filter((t) => t.status === 'Done').length;
  const weekMin = Math.round(focusSecondsThisWeek(timeSessions) / 60);
  return {
    text: [
      `Today: ${done}/${today.length} tasks completed.`,
      `This week: ${fmtHM(weekMin)} tracked across all categories.`,
      `Streak: ${settings.streak} day${settings.streak === 1 ? '' : 's'}. XP: ${settings.xp.toLocaleString()} (Level ${Math.max(1, Math.floor(settings.xp / 100))}).`,
    ].join('\n'),
  };
}

function prepareForMeeting(): DemoResult {
  const { events } = useStore.getState();
  const today = todayISO();
  const now = new Date();
  const upcoming = events
    .filter((e) => e.date >= today)
    .filter((e) => e.date > today || e.startTime >= `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  if (!upcoming) return { text: "You don't have any upcoming calendar events — nothing to prep for right now." };
  return {
    text: `Your next event is "${upcoming.title}" on ${upcoming.date} at ${upcoming.startTime}–${upcoming.endTime}. Connect Google Calendar (Settings → NEXUS) once available for full agenda + attendee context — for now this is drawn from STENNER OS's own calendar.`,
  };
}

function reviewWeek(): DemoResult {
  const { timeSessions } = useStore.getState();
  const weekMin = Math.round(focusSecondsThisWeek(timeSessions) / 60);
  const byCategory = secondsByCategory(timeSessions, 'week');
  return {
    text: [
      `This week you've logged ${fmtHM(weekMin)}.`,
      ...byCategory.map((c) => `${c.category}: ${fmtHM(Math.round(c.seconds / 60))}`),
    ].join('\n'),
  };
}

function helpPrioritize(): DemoResult {
  const pending = pendingTasksToday();
  if (pending.length === 0) return { text: 'No pending tasks today — nothing to prioritize.' };
  const order = { High: 0, Medium: 1, Low: 2 } as const;
  const sorted = [...pending].sort((a, b) => order[a.priority] - order[b.priority]);
  return { text: `By priority:\n\n${sorted.map((t, i) => `${i + 1}. ${t.title} (${t.priority})`).join('\n')}` };
}

function practiceEnglish(): DemoResult {
  const { englishSessions } = useStore.getState();
  const mistakes = englishMistakesByTopic(englishSessions);
  const progress = englishProgressByType(englishSessions);
  const weakest = mistakes[0];
  return {
    text: [
      `Grammar ${progress.grammar}% · Vocabulary ${progress.vocabulary}% · Listening ${progress.listening}% · Business ${progress.business}% · Writing ${progress.writing}% · Speaking ${progress.speaking}%.`,
      weakest ? `Your weakest area is "${weakest.topicTag}" (${weakest.count} mistakes) — head to English Lab and try "Practice my weak areas."` : 'Head to English Lab to start today\'s 10-exercise challenge.',
    ].join('\n'),
  };
}

function whichProject(): DemoResult {
  const { tasks, projects } = useStore.getState();
  const scored = projects.map((p) => {
    const pct = projectProgress(tasks, p.id);
    const counts = projectTaskCounts(tasks, p.id);
    const pendingHighPriority = tasks.filter((t) => t.projectId === p.id && t.status !== 'Done' && t.priority === 'High').length;
    return { p, pct, counts, pendingHighPriority };
  });
  const behind = scored.filter((s) => s.counts.total > 0).sort((a, b) => a.pct - b.pct || b.pendingHighPriority - a.pendingHighPriority)[0];
  if (!behind) return { text: "You don't have any projects with tasks yet." };
  return {
    text: `I'd focus on "${behind.p.name}" — it's at ${behind.pct}% (${behind.counts.done}/${behind.counts.total} tasks)${behind.pendingHighPriority > 0 ? ` with ${behind.pendingHighPriority} high-priority task(s) still open` : ''}.`,
  };
}

const PATTERNS: { test: (m: string) => boolean; run: () => DemoResult }[] = [
  { test: (m) => /plan.*day|organi[sz].*(day|hour)|agéndame|organízame/.test(m), run: planMyDay },
  { test: (m) => /review.*task|falta.*hoy|qué me falta/.test(m), run: reviewTasks },
  { test: (m) => /productiv/.test(m), run: analyzeProductivity },
  { test: (m) => /meeting|reuni[oó]n|prepare/.test(m), run: prepareForMeeting },
  { test: (m) => /review.*week|trabajado esta semana|this week/.test(m), run: reviewWeek },
  { test: (m) => /priorit/.test(m), run: helpPrioritize },
  { test: (m) => /english|inglés|ingles/.test(m), run: practiceEnglish },
  { test: (m) => /which project|qué proyecto|en qué proyecto/.test(m), run: whichProject },
];

export function generateDemoResponse(userMessage: string): DemoResult {
  const lower = userMessage.toLowerCase();

  if (/turn.*idea.*task|idea en (una )?tarea|convierte.*idea/.test(lower)) {
    const { ideas } = useStore.getState();
    const latest = ideas[0];
    const title = latest?.title ?? (userMessage.replace(/turn this idea into a task/i, '').trim() || 'New task from idea');
    return {
      text: `Sure. I'll create:\n\n**Task:** ${title}\n**Priority:** Medium\n**Due:** Today`,
      toolCall: { name: 'createTask', args: { title, priority: 'Medium', dueDate: 'today' } },
    };
  }

  for (const pattern of PATTERNS) {
    if (pattern.test(lower)) return pattern.run();
  }

  const pending = pendingTasksToday();
  return {
    text: [
      "NEXUS is running in **demo mode** (no AI provider connected yet — see Settings → NEXUS).",
      `Here's what I can tell you locally right now: you have ${pending.length} pending task${pending.length === 1 ? '' : 's'} today.`,
      'Try one of the quick prompts below, or connect a real provider for open-ended questions.',
    ].join('\n\n'),
  };
}
