import { useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTimerElapsed } from '../hooks/useTimerElapsed';
import { fmtHMS, fmtHM, todayISO } from '../lib/date';
import { ProgressBar } from '../components/common/ProgressBar';
import { Select } from '../components/common/Fields';
import { focusSecondsToday, focusSecondsThisWeek, focusSecondsThisMonth, secondsByCategory } from '../store/selectors';

const CATEGORIES = ['Design', 'TEOPM', 'Marketing', 'Meetings', 'Personal', 'Admin', 'Content'];
const CATEGORY_COLOR: Record<string, string> = {
  Design: 'var(--color-accent-purple)',
  TEOPM: 'var(--color-accent-blue)',
  Marketing: 'var(--color-accent-green)',
  Meetings: 'var(--color-accent-yellow)',
  Personal: 'var(--color-accent-pink)',
  Admin: '#64748b',
  Content: '#f97316',
};

export function TimeTrackerPage() {
  const timer = useStore((s) => s.timer);
  const timeSessions = useStore((s) => s.timeSessions);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const startTimer = useStore((s) => s.startTimer);
  const pauseTimer = useStore((s) => s.pauseTimer);
  const resumeTimer = useStore((s) => s.resumeTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const elapsed = useTimerElapsed();

  const [category, setCategory] = useState('Design');
  const [projectId, setProjectId] = useState('');
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today');

  const isActive = !!timer.startedAt || timer.accumulatedSeconds > 0;
  const project = projects.find((p) => p.id === projectId);

  const totals = {
    today: focusSecondsToday(timeSessions),
    week: focusSecondsThisWeek(timeSessions),
    month: focusSecondsThisMonth(timeSessions),
  };

  const breakdown = secondsByCategory(timeSessions, range);
  const maxSecs = Math.max(1, ...breakdown.map((b) => b.seconds));

  const recentSessions = [...timeSessions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 12);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-[20px] font-bold">Time Tracker</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">Track focus time by category and project. Runs in the background across the app.</p>
      </div>

      <div className="stenner-card p-8 flex flex-col items-center text-center">
        <div className="text-[13px] text-zinc-500 mb-1">{isActive ? timer.label : 'Ready when you are'}</div>
        <div className="text-[56px] font-bold tabular-nums tracking-tight leading-none">{fmtHMS(elapsed)}</div>

        {!isActive && (
          <div className="flex items-center gap-2 mt-5">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-36">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-44">
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          {!isActive && (
            <button
              onClick={() => startTimer({ category, projectId: projectId || null, label: `${category}${project ? ' · ' + project.name : ''}` })}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
            >
              <Play size={16} /> Start
            </button>
          )}
          {isActive && timer.startedAt && (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-zinc-100 font-semibold transition-colors"
            >
              <Pause size={16} /> Pause
            </button>
          )}
          {isActive && !timer.startedAt && (
            <button
              onClick={resumeTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
            >
              <Play size={16} /> Resume
            </button>
          )}
          {isActive && (
            <button
              onClick={stopTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold transition-colors"
            >
              <Square size={15} /> Stop
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <div className="stenner-card p-4">
          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">TODAY</div>
          <div className="text-[20px] font-bold mt-1.5">{fmtHM(Math.round(totals.today / 60))}</div>
        </div>
        <div className="stenner-card p-4">
          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">THIS WEEK</div>
          <div className="text-[20px] font-bold mt-1.5">{fmtHM(Math.round(totals.week / 60))}</div>
        </div>
        <div className="stenner-card p-4">
          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">THIS MONTH</div>
          <div className="text-[20px] font-bold mt-1.5">{fmtHM(Math.round(totals.month / 60))}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="stenner-card p-4">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 w-fit mb-3.5">
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-colors capitalize ${
                  range === r ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {breakdown.length === 0 && <div className="text-[12.5px] text-zinc-500 py-4">No sessions in this range.</div>}
            {breakdown.map((b) => (
              <div key={b.category}>
                <div className="flex items-center justify-between text-[12.5px] mb-1">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLOR[b.category] ?? '#8b5cf6' }} />
                    {b.category}
                  </span>
                  <span className="text-zinc-500">{fmtHM(Math.round(b.seconds / 60))}</span>
                </div>
                <ProgressBar value={(b.seconds / maxSecs) * 100} color={CATEGORY_COLOR[b.category] ?? '#8b5cf6'} />
              </div>
            ))}
          </div>
        </div>

        <div className="stenner-card p-4">
          <div className="text-[12.5px] font-bold tracking-wide text-zinc-300 mb-3.5">SESSION HISTORY</div>
          <div className="space-y-1 max-h-[280px] overflow-y-auto">
            {recentSessions.map((s) => {
              const task = tasks.find((t) => t.id === s.taskId);
              return (
                <div key={s.id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/[0.03]">
                  <div className="min-w-0">
                    <div className="text-[12.5px] text-zinc-200 truncate">{task?.title ?? s.label}</div>
                    <div className="text-[10.5px] text-zinc-500">
                      {s.date === todayISO() ? 'Today' : s.date} · {s.category}
                    </div>
                  </div>
                  <div className="text-[12px] font-semibold text-zinc-400 shrink-0 ml-2">{fmtHM(Math.round(s.durationSeconds / 60))}</div>
                </div>
              );
            })}
            {recentSessions.length === 0 && <div className="text-[12.5px] text-zinc-500 py-4 text-center">No sessions yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
