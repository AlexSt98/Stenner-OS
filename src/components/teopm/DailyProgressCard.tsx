import { useEffect, useRef } from 'react';
import { PartyPopper, ListChecks, Clock3, Hourglass } from 'lucide-react';
import { fmtHM } from '../../lib/date';
import { toDecimalHours, WORKDAY_TARGET_MINUTES } from '../../store/selectors';
import { useToastStore } from '../../store/useToastStore';

interface DailyProgressCardProps {
  workedMinutes: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export function DailyProgressCard({ workedMinutes, tasksCompleted, tasksTotal }: DailyProgressCardProps) {
  const pushToast = useToastStore((s) => s.push);
  const prevRef = useRef(workedMinutes);
  const complete = workedMinutes >= WORKDAY_TARGET_MINUTES;
  const pct = Math.min(100, (workedMinutes / WORKDAY_TARGET_MINUTES) * 100);
  const remaining = Math.max(0, WORKDAY_TARGET_MINUTES - workedMinutes);

  useEffect(() => {
    const wasComplete = prevRef.current >= WORKDAY_TARGET_MINUTES;
    if (!wasComplete && complete) {
      pushToast('✓ Workday complete — 8h logged!', 'xp');
    }
    prevRef.current = workedMinutes;
  }, [workedMinutes, complete, pushToast]);

  return (
    <div className={`stenner-card p-5 relative overflow-hidden ${complete ? 'ring-1 ring-green-500/30' : ''}`}>
      {complete && <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />}
      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-bold tracking-wide text-zinc-500">DAILY PROGRESS</div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-[32px] font-bold leading-none tabular-nums">{toDecimalHours(workedMinutes)}</span>
            <span className="text-[15px] text-zinc-500">/ {toDecimalHours(WORKDAY_TARGET_MINUTES)} hours</span>
          </div>
        </div>
        {complete && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 text-[12.5px] font-bold animate-stenner-pop">
            <PartyPopper size={14} /> WORKDAY COMPLETE
          </div>
        )}
      </div>

      <div className="relative mt-3.5 flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${complete ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-violet-500 to-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[12.5px] text-zinc-500 shrink-0 tabular-nums">{pct.toFixed(1)}%</span>
      </div>

      <div className="relative grid grid-cols-3 gap-3 mt-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 mb-1">
            <ListChecks size={11} /> TASKS COMPLETED
          </div>
          <div className="text-[15px] font-semibold">
            {tasksCompleted} / {tasksTotal}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 mb-1">
            <Clock3 size={11} /> FOCUS TIME
          </div>
          <div className="text-[15px] font-semibold">{fmtHM(workedMinutes)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 mb-1">
            <Hourglass size={11} /> REMAINING
          </div>
          <div className="text-[15px] font-semibold">{remaining === 0 ? '—' : fmtHM(remaining)}</div>
        </div>
      </div>
    </div>
  );
}
