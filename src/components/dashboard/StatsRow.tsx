import { RefreshCw, Clock, Flame, FolderKanban, Star } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ProgressBar } from '../common/ProgressBar';
import { fmtHM } from '../../lib/date';
import { isTodayISO } from '../../lib/date';
import { todaysTasks, activeProjectsCount, focusSecondsToday } from '../../store/selectors';
import { levelFromXp, xpProgressPct } from '../../lib/gamification';

export function StatsRow() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const timeSessions = useStore((s) => s.timeSessions);
  const settings = useStore((s) => s.settings);

  const todayTaskList = todaysTasks(tasks);
  const doneToday = todayTaskList.filter((t) => t.status === 'Done').length;
  const pct = todayTaskList.length ? Math.round((doneToday / todayTaskList.length) * 100) : 0;

  const focusSecs = focusSecondsToday(timeSessions);
  const focusMinutes = Math.round(focusSecs / 60);
  const goalMinutes = settings.dailyFocusGoalMinutes;
  const focusPct = Math.min(100, Math.round((focusMinutes / goalMinutes) * 100));

  const activeProjects = activeProjectsCount(projects);
  const onTrackCount = projects.filter((p) => p.status === 'On Track').length;

  const xpToday = tasks.filter((t) => t.completedAt && isTodayISO(t.completedAt)).length * 100;
  const level = levelFromXp(settings.xp);
  const levelPct = xpProgressPct(settings.xp);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      <div className="stenner-card stenner-card-hover p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 mb-2.5">
          <RefreshCw size={12} className="text-green-400" /> TODAY'S TASKS
        </div>
        <div className="text-[22px] font-bold leading-none">{todayTaskList.length}</div>
        <div className="text-[11.5px] text-zinc-500 mt-1.5">{doneToday} completed</div>
        <div className="mt-2.5 flex items-center gap-2">
          <ProgressBar value={pct} color="var(--color-accent-green)" />
          <span className="text-[11px] text-zinc-500 shrink-0">{pct}%</span>
        </div>
      </div>

      <div className="stenner-card stenner-card-hover p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 mb-2.5">
          <Clock size={12} className="text-blue-400" /> FOCUS TIME
        </div>
        <div className="text-[22px] font-bold leading-none">{fmtHM(focusMinutes)}</div>
        <div className="text-[11.5px] text-zinc-500 mt-1.5">of {fmtHM(goalMinutes)}</div>
        <div className="mt-2.5 flex items-center gap-2">
          <ProgressBar value={focusPct} color="var(--color-accent-blue)" />
          <span className="text-[11px] text-zinc-500 shrink-0">{focusPct}%</span>
        </div>
      </div>

      <div className="stenner-card stenner-card-hover p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 mb-2.5">
          <Flame size={12} className="text-orange-400" /> STREAK
        </div>
        <div className="text-[22px] font-bold leading-none">{settings.streak} days</div>
        <div className="text-[11.5px] text-orange-400/80 mt-1.5 font-medium">Keep it going!</div>
      </div>

      <div className="stenner-card stenner-card-hover p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 mb-2.5">
          <FolderKanban size={12} className="text-violet-400" /> ACTIVE PROJECTS
        </div>
        <div className="text-[22px] font-bold leading-none">{activeProjects}</div>
        <div className="text-[11.5px] text-zinc-500 mt-1.5">{onTrackCount} on track</div>
      </div>

      <div className="stenner-card stenner-card-hover p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 mb-2.5">
          <Star size={12} className="text-yellow-400" /> XP / LEVEL
        </div>
        <div className="text-[22px] font-bold leading-none">{settings.xp.toLocaleString()} XP</div>
        <div className="text-[11.5px] text-green-400 mt-1.5 font-medium">{xpToday > 0 ? `+${xpToday} today` : 'No XP yet today'}</div>
        <div className="mt-2.5 flex items-center gap-2">
          <ProgressBar value={levelPct} color="var(--color-accent-yellow)" />
          <span className="text-[11px] text-zinc-500 shrink-0">LVL {level}</span>
        </div>
      </div>

      <div className="stenner-card p-4 flex flex-col justify-center bg-gradient-to-br from-violet-600/10 to-transparent">
        <div className="text-[13px] italic text-zinc-300 leading-snug">"Discipline builds the freedom you want."</div>
        <div className="text-[11px] text-zinc-600 mt-2">— STENNER OS</div>
      </div>
    </div>
  );
}
