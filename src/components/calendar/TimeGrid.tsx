import { format, isToday } from 'date-fns';
import type { CalendarEvent } from '../../types';

const HOUR_HEIGHT = 52;

interface TimeGridProps {
  days: Date[];
  startHour: number;
  endHour: number;
  eventsByDay: (day: Date) => CalendarEvent[];
  onSlotClick: (day: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  showDayHeaders?: boolean;
}

function minutesFromMidnight(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function TimeGrid({ days, startHour, endHour, eventsByDay, onSlotClick, onEventClick, showDayHeaders = true }: TimeGridProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const gridStartMinutes = startHour * 60;

  return (
    <div className="stenner-scroll-x">
      <div className="flex min-w-[560px]">
        {/* Hour labels */}
        <div className="w-14 shrink-0 pt-8">
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[11px] text-zinc-600 -translate-y-2 pr-2 text-right">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day) => {
            const events = eventsByDay(day);
            const today = isToday(day);
            return (
              <div key={day.toISOString()} className="border-l border-[var(--color-border-soft)] first:border-l-0">
                {showDayHeaders && (
                  <div className="h-8 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-zinc-500 uppercase">{format(day, 'EEE')}</div>
                    <div className={`text-[12px] font-semibold ${today ? 'text-violet-400' : 'text-zinc-300'}`}>{format(day, 'd')}</div>
                  </div>
                )}
                <div
                  className="relative"
                  style={{ height: hours.length * HOUR_HEIGHT }}
                >
                  {hours.map((h) => (
                    <button
                      key={h}
                      onClick={() => onSlotClick(day, h)}
                      style={{ top: (h - startHour) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                      className="absolute left-0 right-0 border-b border-[var(--color-border-soft)] hover:bg-white/[0.03] transition-colors"
                    />
                  ))}
                  {events.map((ev) => {
                    const top = ((minutesFromMidnight(ev.startTime) - gridStartMinutes) / 60) * HOUR_HEIGHT;
                    const height = Math.max(20, ((minutesFromMidnight(ev.endTime) - minutesFromMidnight(ev.startTime)) / 60) * HOUR_HEIGHT - 2);
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(ev);
                        }}
                        style={{ top, height, background: `${ev.color}22`, borderColor: `${ev.color}55` }}
                        className="absolute left-1 right-1 rounded-lg border px-2 py-1 text-left overflow-hidden hover:brightness-125 transition-all z-10"
                      >
                        <div className="text-[11.5px] font-semibold truncate" style={{ color: ev.color }}>
                          {ev.title}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {ev.startTime} – {ev.endTime}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { HOUR_HEIGHT };
