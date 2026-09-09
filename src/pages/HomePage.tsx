import { useStore } from '../store/useStore';
import { fmtDateLong } from '../lib/date';
import { StatsRow } from '../components/dashboard/StatsRow';
import { QuickAdd } from '../components/dashboard/QuickAdd';
import { CalendarWidget } from '../components/dashboard/CalendarWidget';
import { TimeTrackerWidget } from '../components/dashboard/TimeTrackerWidget';
import { ProjectsWidget } from '../components/dashboard/ProjectsWidget';
import { IdeasWidget } from '../components/dashboard/IdeasWidget';
import { ActivityWidget } from '../components/dashboard/ActivityWidget';
import { TaskQueue } from '../components/tasks/TaskQueue';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 19) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage() {
  const settings = useStore((s) => s.settings);
  const tasks = useStore((s) => s.tasks);
  const firstName = settings.name.split(' ')[0];

  return (
    <div className="max-w-[1500px] mx-auto space-y-4">
      <div className="stenner-card relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-blue-600/10" />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold tracking-widest text-zinc-500">{fmtDateLong()}</div>
            <h1 className="text-[32px] font-bold mt-1.5 leading-tight">
              {greeting()}, <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{firstName}.</span>
            </h1>
            <p className="text-[13.5px] text-zinc-500 mt-1">Ideas, plans, and a little bit of chaos. Perfect.</p>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center px-4 min-w-0">
            <img src="/nayncat.gif" alt="" className="h-16 w-auto object-contain opacity-90" />
          </div>
          <div className="hidden lg:flex flex-col items-end shrink-0 text-right">
            <div className="text-[11px] tracking-[0.2em] text-zinc-600 font-medium leading-loose">
              CREATE
              <br />
              PLAN
              <br />
              DO
              <br />
              REPEAT
            </div>
            <div className="text-[10px] text-zinc-700 mt-2">— {new Date().getFullYear()}</div>
          </div>
        </div>
      </div>

      <StatsRow />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-5">
          <TaskQueue tasks={tasks} compact />
        </div>
        <div className="xl:col-span-4">
          <CalendarWidget />
        </div>
        <div className="xl:col-span-3 space-y-4">
          <TimeTrackerWidget />
          <QuickAdd />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-6">
          <ProjectsWidget />
        </div>
        <div className="xl:col-span-3">
          <IdeasWidget />
        </div>
        <div className="xl:col-span-3">
          <ActivityWidget />
        </div>
      </div>
    </div>
  );
}
