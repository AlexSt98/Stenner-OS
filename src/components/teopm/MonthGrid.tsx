import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import { WORKDAY_TARGET_MINUTES, toDecimalHours } from '../../store/selectors';

interface MonthGridProps {
  monthAnchor: Date;
  workedMinutesFor: (dateISO: string) => number;
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
}

export function MonthGrid({ monthAnchor, workedMinutesFor, selectedDate, onSelectDate }: MonthGridProps) {
  const start = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const minutes = workedMinutesFor(iso);
          const inMonth = isSameMonth(day, monthAnchor);
          const complete = minutes >= WORKDAY_TARGET_MINUTES;
          const selected = iso === selectedDate;
          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`aspect-square rounded-lg border p-1.5 flex flex-col items-start justify-between transition-colors ${
                selected
                  ? 'border-violet-500 bg-violet-500/15'
                  : inMonth
                    ? 'border-white/10 hover:bg-white/[0.04]'
                    : 'border-transparent opacity-30'
              }`}
            >
              <span className={`text-[11px] font-semibold ${isToday(day) ? 'text-violet-400' : 'text-zinc-300'}`}>{format(day, 'd')}</span>
              {minutes > 0 && (
                <span className={`text-[9.5px] font-bold rounded px-1 ${complete ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {toDecimalHours(minutes)}h
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
