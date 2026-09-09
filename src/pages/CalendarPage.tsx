import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { addWeeks, format, startOfWeek, addDays, isSameMonth } from 'date-fns';
import { useStore } from '../store/useStore';
import { TimeGrid } from '../components/calendar/TimeGrid';
import { EventFormModal } from '../components/calendar/EventFormModal';
import { Button } from '../components/common/Button';
import type { CalendarEvent } from '../types';

export function CalendarPage() {
  const events = useStore((s) => s.events);
  const [anchor, setAnchor] = useState(new Date());
  const [modalState, setModalState] = useState<{ open: boolean; event?: CalendarEvent | null; date?: string; start?: string }>({
    open: false,
  });

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = (day: Date) => events.filter((e) => e.date === format(day, 'yyyy-MM-dd'));

  const rangeLabel = isSameMonth(days[0], days[4])
    ? `${format(days[0], 'MMMM yyyy')}`
    : `${format(days[0], 'MMM')} – ${format(days[4], 'MMM yyyy')}`;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Calendar</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Plan your week, block focus time, drop tasks into slots.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            title="Google Calendar integration — coming soon. OAuth wiring is scaffolded in src/lib/integrations."
          >
            <CalendarDays size={14} /> Google Calendar
          </Button>
          <Button variant="primary" size="sm" onClick={() => setModalState({ open: true })}>
            <Plus size={14} /> New event
          </Button>
        </div>
      </div>

      <div className="stenner-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setAnchor((a) => addWeeks(a, -1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-[14px] font-semibold w-40 text-center">{rangeLabel}</div>
          <button
            onClick={() => setAnchor((a) => addWeeks(a, 1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="ml-2 text-[11.5px] px-2.5 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            Today
          </button>
        </div>

        <TimeGrid
          days={days}
          startHour={7}
          endHour={20}
          eventsByDay={eventsByDay}
          onSlotClick={(day, hour) =>
            setModalState({ open: true, date: format(day, 'yyyy-MM-dd'), start: `${String(hour).padStart(2, '0')}:00` })
          }
          onEventClick={(event) => setModalState({ open: true, event })}
        />
      </div>

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
