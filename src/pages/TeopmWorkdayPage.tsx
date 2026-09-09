import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, parseISO, isSameMonth } from 'date-fns';
import { useStore } from '../store/useStore';
import { todayISO, fmtDateLong } from '../lib/date';
import { teopmTasksForDate, teopmDayStats } from '../store/selectors';
import { DailyProgressCard } from '../components/teopm/DailyProgressCard';
import { TeopmTaskList } from '../components/teopm/TeopmTaskList';
import { CompletedTaskList } from '../components/teopm/CompletedTaskList';
import { MonthGrid } from '../components/teopm/MonthGrid';
import { isTeopmWorkTask } from '../store/selectors';

// ─────────────────────────────────────────────────────────────────────────
// Deliberately no calendar/time-grid view here. TEOPM is a work-hours log,
// not a schedule: it reads a task's date/start/end purely to total worked
// minutes for the day. It never renders those tasks as calendar blocks and
// never touches the `events` (CalendarEvent) store — Calendar stays a
// separate, manually-curated module (see pages/CalendarPage.tsx). The
// day/month navigation below only changes which date's TEOPM log is shown.
// ─────────────────────────────────────────────────────────────────────────

export function TeopmWorkdayPage() {
  const tasks = useStore((s) => s.tasks);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [monthAnchor, setMonthAnchor] = useState(new Date());

  const dayStats = teopmDayStats(tasks, selectedDate);
  const dayTasks = teopmTasksForDate(tasks, selectedDate);
  const activeDayTasks = dayTasks.filter((t) => t.status !== 'Done');

  const workedMinutesFor = (dateISO: string) => teopmDayStats(tasks, dateISO).workedMinutes;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-[20px] font-bold">TEOPM Workday</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          {selectedDate === todayISO() ? fmtDateLong() : fmtDateLong(parseISO(selectedDate))}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedDate(format(new Date(parseISO(selectedDate).getTime() - 86400000), 'yyyy-MM-dd'))}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/10"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-[13px] font-medium text-zinc-300 w-36 text-center">
          {selectedDate === todayISO() ? 'Today' : format(parseISO(selectedDate), 'EEEE, MMM d')}
        </span>
        <button
          onClick={() => setSelectedDate(format(new Date(parseISO(selectedDate).getTime() + 86400000), 'yyyy-MM-dd'))}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/10"
        >
          <ChevronRight size={15} />
        </button>
        {selectedDate !== todayISO() && (
          <button
            onClick={() => setSelectedDate(todayISO())}
            className="text-[11px] px-2 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            Today
          </button>
        )}
      </div>

      <DailyProgressCard
        workedMinutes={dayStats.workedMinutes}
        tasksCompleted={dayStats.tasksCompleted}
        tasksTotal={dayStats.tasksTotal}
      />

      <TeopmTaskList
        tasks={activeDayTasks}
        dateLabel={selectedDate === todayISO() ? 'Today' : format(parseISO(selectedDate), 'MMM d')}
      />

      <div className="stenner-card p-4">
        <div className="flex items-center gap-3 mb-3.5 flex-wrap">
          <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">WORKDAY HISTORY</h2>
          <span className="text-[11px] text-zinc-600">Hours logged per day — tap a day to view it above.</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setMonthAnchor((a) => addMonths(a, -1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-[13px] font-medium text-zinc-300 w-32 text-center">{format(monthAnchor, 'MMMM yyyy')}</span>
          <button
            onClick={() => setMonthAnchor((a) => addMonths(a, 1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
          >
            <ChevronRight size={15} />
          </button>
          {!isSameMonth(monthAnchor, new Date()) && (
            <button
              onClick={() => setMonthAnchor(new Date())}
              className="text-[11px] px-2 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              This month
            </button>
          )}
        </div>
        <MonthGrid
          monthAnchor={monthAnchor}
          workedMinutesFor={workedMinutesFor}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <CompletedTaskList tasks={tasks.filter(isTeopmWorkTask)} />
    </div>
  );
}
