import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize2, CalendarDays } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks } from 'date-fns';
import { useStore } from '../../store/useStore';
import { TimeGrid } from '../calendar/TimeGrid';
import { EventFormModal } from '../calendar/EventFormModal';
import type { CalendarEvent } from '../../types';

export function CalendarWidget() {
  const events = useStore((s) => s.events);
  const navigate = useNavigate();
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [modalState, setModalState] = useState<{ open: boolean; event?: CalendarEvent | null; date?: string; start?: string }>({
    open: false,
  });

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const eventsByDay = (day: Date) => events.filter((e) => e.date === format(day, 'yyyy-MM-dd'));

  return (
    <div className="stenner-card p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">CALENDAR</h2>
        <button
          className="ml-1 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06]"
          title="Google Calendar — coming soon"
        >
          <CalendarDays size={13} />
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className="ml-auto p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06]"
          title="Open full calendar"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={() => setWeekAnchor((a) => addWeeks(a, -1))}
          className="p-1 rounded-md hover:bg-white/[0.06] text-zinc-500 hover:text-white"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="text-[12px] font-semibold text-zinc-300 flex-1 text-center">{format(weekStart, 'MMMM yyyy')}</div>
        <button
          onClick={() => setWeekAnchor((a) => addWeeks(a, 1))}
          className="p-1 rounded-md hover:bg-white/[0.06] text-zinc-500 hover:text-white"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1 mb-3">
        {days.map((d) => {
          const isSelected = format(d, 'yyyy-MM-dd') === format(selected, 'yyyy-MM-dd');
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                isSelected ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:bg-white/[0.06]'
              }`}
            >
              <span className="text-[9.5px] uppercase">{format(d, 'EEE')}</span>
              <span className="text-[13px] font-semibold">{format(d, 'd')}</span>
            </button>
          );
        })}
      </div>

      <TimeGrid
        days={[selected]}
        startHour={9}
        endHour={18}
        eventsByDay={eventsByDay}
        showDayHeaders={false}
        onSlotClick={(day, hour) =>
          setModalState({ open: true, date: format(day, 'yyyy-MM-dd'), start: `${String(hour).padStart(2, '0')}:00` })
        }
        onEventClick={(event) => setModalState({ open: true, event })}
      />

      <EventFormModal
        open={modalState.open}
        onClose={() => setModalState({ open: false })}
        event={modalState.event}
        initialDate={modalState.date}
        initialStart={modalState.start}
      />
    </div>
  );
}
