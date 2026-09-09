import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, addMonths, parseISO, isSameMonth } from 'date-fns';
import { useStore } from '../store/useStore';
import { todayISO, fmtDateLong } from '../lib/date';
import { teopmTasksForDate, teopmDayStats, TEOPM_PROJECT_ID } from '../store/selectors';
import { DailyProgressCard } from '../components/teopm/DailyProgressCard';
import { TeopmTaskList } from '../components/teopm/TeopmTaskList';
import { CompletedTaskList } from '../components/teopm/CompletedTaskList';
import { MonthGrid } from '../components/teopm/MonthGrid';
import { GoogleCalendarConnect } from '../components/teopm/GoogleCalendarConnect';
import { TimeGrid } from '../components/calendar/TimeGrid';
import { TeopmTaskFormModal } from '../components/teopm/TeopmTaskFormModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import type { CalendarEvent, Task } from '../types';

type CalTab = 'Today' | 'Week' | 'Month';

const CATEGORY_COLOR: Record<string, string> = {
  Marketing: '#22c55e',
  Design: '#8b5cf6',
  Meetings: '#eab308',
  Admin: '#64748b',
  Content: '#ec4899',
  General: '#3b82f6',
};

function taskToPseudoEvent(task: Task): CalendarEvent | null {
  if (!task.dueTime || !task.dueDate) return null;
  const durationMinutes = task.actualMinutes > 0 ? task.actualMinutes : task.estimatedMinutes || 30;
  const [h, m] = task.dueTime.split(':').map(Number);
  const endTotal = h * 60 + m + durationMinutes;
  const endTime = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
  return {
    id: `pseudo-${task.id}`,
    title: task.title,
    date: task.dueDate,
    startTime: task.dueTime,
    endTime,
    color: CATEGORY_COLOR[task.category] ?? '#8b5cf6',
    taskId: task.id,
    projectId: task.projectId,
    source: 'local',
  };
}

export function TeopmWorkdayPage() {
  const tasks = useStore((s) => s.tasks);
  const [calTab, setCalTab] = useState<CalTab>('Today');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [monthAnchor, setMonthAnchor] = useState(new Date());
  const [slotPrefill, setSlotPrefill] = useState<{ date: string; time: string } | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  const dayStats = teopmDayStats(tasks, selectedDate);
  const dayTasks = teopmTasksForDate(tasks, selectedDate);
  const activeDayTasks = dayTasks.filter((t) => t.status !== 'Done');

  const teopmTasksWithTime = useMemo(() => tasks.filter((t) => t.projectId === TEOPM_PROJECT_ID && t.dueTime), [tasks]);

  const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = (day: Date) => {
    const iso = format(day, 'yyyy-MM-dd');
    return teopmTasksWithTime
      .filter((t) => t.dueDate === iso)
      .map(taskToPseudoEvent)
      .filter((e): e is CalendarEvent => e !== null);
  };

  const workedMinutesFor = (dateISO: string) => teopmDayStats(tasks, dateISO).workedMinutes;

  const handleEventClick = (event: CalendarEvent) => {
    const task = tasks.find((t) => t.id === event.taskId);
    if (task) setOpenTask(task);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-[20px] font-bold">TEOPM Workday</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          {selectedDate === todayISO() ? fmtDateLong() : fmtDateLong(parseISO(selectedDate))}
        </p>
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
          <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">CALENDAR</h2>
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
            {(['Today', 'Week', 'Month'] as CalTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setCalTab(t)}
                className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-colors ${
                  calTab === t ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <GoogleCalendarConnect />
          </div>
        </div>

        {calTab === 'Today' && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), -1), 'yyyy-MM-dd'))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[13px] font-medium text-zinc-300 w-32 text-center">
                {selectedDate === todayISO() ? 'Today' : format(parseISO(selectedDate), 'EEEE, MMM d')}
              </span>
              <button
                onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
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
            <TimeGrid
              days={[parseISO(selectedDate)]}
              startHour={7}
              endHour={20}
              eventsByDay={eventsByDay}
              showDayHeaders={false}
              onSlotClick={(day, hour) => setSlotPrefill({ date: format(day, 'yyyy-MM-dd'), time: `${String(hour).padStart(2, '0')}:00` })}
              onEventClick={handleEventClick}
            />
          </>
        )}

        {calTab === 'Week' && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setSelectedDate(format(addWeeks(weekStart, -1), 'yyyy-MM-dd'))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[13px] font-medium text-zinc-300 w-40 text-center">{format(weekStart, 'MMMM yyyy')}</span>
              <button
                onClick={() => setSelectedDate(format(addWeeks(weekStart, 1), 'yyyy-MM-dd'))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <TimeGrid
              days={weekDays}
              startHour={7}
              endHour={20}
              eventsByDay={eventsByDay}
              onSlotClick={(day, hour) => setSlotPrefill({ date: format(day, 'yyyy-MM-dd'), time: `${String(hour).padStart(2, '0')}:00` })}
              onEventClick={handleEventClick}
            />
          </>
        )}

        {calTab === 'Month' && (
          <>
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
              onSelectDate={(iso) => {
                setSelectedDate(iso);
                setCalTab('Today');
              }}
            />
          </>
        )}
      </div>

      <CompletedTaskList tasks={tasks.filter((t) => t.projectId === TEOPM_PROJECT_ID)} />

      <TeopmTaskFormModal
        open={!!slotPrefill}
        onClose={() => setSlotPrefill(null)}
        initialDate={slotPrefill?.date}
        initialStartTime={slotPrefill?.time}
      />
      <TaskDetailModal
        task={openTask}
        onClose={() => setOpenTask(null)}
        renderEditModal={({ task, open, onClose }) => <TeopmTaskFormModal open={open} onClose={onClose} task={task} />}
      />
    </div>
  );
}
