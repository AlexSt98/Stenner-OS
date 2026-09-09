import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { projectProgress } from '../store/selectors';
import { secondsByCategory } from '../store/selectors';
import { ProgressBar } from '../components/common/ProgressBar';
import { levelFromXp, xpProgressPct, XP_PER_LEVEL } from '../lib/gamification';
import { fmtHM } from '../lib/date';

const CATEGORY_COLOR: Record<string, string> = {
  Design: '#8b5cf6',
  TEOPM: '#3b82f6',
  Marketing: '#22c55e',
  Meetings: '#eab308',
  Personal: '#ec4899',
  Admin: '#64748b',
  Content: '#f97316',
};

export function StatsPage() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const timeSessions = useStore((s) => s.timeSessions);
  const settings = useStore((s) => s.settings);
  const activities = useStore((s) => s.activities);

  const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const completedByDay = last7.map((day) => ({
    day,
    count: tasks.filter((t) => t.completedAt && isSameDay(parseISO(t.completedAt), day)).length,
  }));
  const maxCompleted = Math.max(1, ...completedByDay.map((d) => d.count));

  const monthBreakdown = secondsByCategory(timeSessions, 'month');
  const maxSecs = Math.max(1, ...monthBreakdown.map((b) => b.seconds));

  const level = levelFromXp(settings.xp);
  const levelPct = xpProgressPct(settings.xp);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-[20px] font-bold">Stats</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">Your creative output, visualized.</p>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <div className="stenner-card p-4">
          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">TOTAL XP</div>
          <div className="text-[24px] font-bold mt-1.5">{settings.xp.toLocaleString()}</div>
          <div className="mt-2.5 flex items-center gap-2">
            <ProgressBar value={levelPct} color="var(--color-accent-yellow)" />
            <span className="text-[11px] text-zinc-500 shrink-0">LVL {level}</span>
          </div>
          <div className="text-[10.5px] text-zinc-600 mt-1.5">{XP_PER_LEVEL - (settings.xp % XP_PER_LEVEL)} XP to next level</div>
        </div>
        <div className="stenner-card p-4">
          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">CURRENT STREAK</div>
          <div className="text-[24px] font-bold mt-1.5">{settings.streak} days</div>
          <div className="text-[11.5px] text-zinc-500 mt-1.5">Complete a task daily to keep it alive.</div>
        </div>
        <div className="stenner-card p-4">
          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">TASKS COMPLETED</div>
          <div className="text-[24px] font-bold mt-1.5">{tasks.filter((t) => t.status === 'Done').length}</div>
          <div className="text-[11.5px] text-zinc-500 mt-1.5">out of {tasks.length} total</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="stenner-card p-4">
          <div className="text-[12.5px] font-bold tracking-wide text-zinc-300 mb-4">TASKS COMPLETED — LAST 7 DAYS</div>
          <div className="flex items-end justify-between gap-2 h-32">
            {completedByDay.map(({ day, count }) => (
              <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-blue-500 transition-all duration-500"
                    style={{ height: `${(count / maxCompleted) * 100}%`, minHeight: count > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500">{format(day, 'EEE')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stenner-card p-4">
          <div className="text-[12.5px] font-bold tracking-wide text-zinc-300 mb-4">TIME BY CATEGORY — THIS MONTH</div>
          <div className="space-y-3">
            {monthBreakdown.length === 0 && <div className="text-[12.5px] text-zinc-500">No sessions logged this month.</div>}
            {monthBreakdown.map((b) => (
              <div key={b.category}>
                <div className="flex items-center justify-between text-[12.5px] mb-1">
                  <span className="text-zinc-300">{b.category}</span>
                  <span className="text-zinc-500">{fmtHM(Math.round(b.seconds / 60))}</span>
                </div>
                <ProgressBar value={(b.seconds / maxSecs) * 100} color={CATEGORY_COLOR[b.category] ?? '#8b5cf6'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stenner-card p-4">
        <div className="text-[12.5px] font-bold tracking-wide text-zinc-300 mb-4">PROJECT PROGRESS OVERVIEW</div>
        <div className="space-y-3.5">
          {projects.map((p) => {
            const pct = projectProgress(tasks, p.id);
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-28 text-[12.5px] font-medium text-zinc-300 shrink-0 truncate">{p.name}</div>
                <ProgressBar value={pct} color={p.color} />
                <span className="text-[11.5px] text-zinc-500 w-9 text-right shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stenner-card p-4">
        <div className="text-[12.5px] font-bold tracking-wide text-zinc-300 mb-3">ALL ACTIVITY</div>
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-[12.5px]">
              <span className="text-zinc-300">{a.message}</span>
              <span className="text-zinc-600 shrink-0 ml-3">{format(parseISO(a.timestamp), 'MMM d, HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
