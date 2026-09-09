import { Pause, Play, Square } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useTimerElapsed } from '../../hooks/useTimerElapsed';
import { fmtHMS } from '../../lib/date';

export function RunningTimerPill() {
  const timer = useStore((s) => s.timer);
  const pauseTimer = useStore((s) => s.pauseTimer);
  const resumeTimer = useStore((s) => s.resumeTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const elapsed = useTimerElapsed();

  const isActive = !!timer.startedAt || timer.accumulatedSeconds > 0;
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2.5 pl-3 pr-1.5 py-1 rounded-full border border-violet-500/25 bg-violet-500/10">
      <span className={`w-1.5 h-1.5 rounded-full ${timer.startedAt ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
      <span className="text-[12px] font-medium text-zinc-300 max-w-[140px] truncate">{timer.label}</span>
      <span className="text-[13px] font-bold tabular-nums text-white">{fmtHMS(elapsed)}</span>
      <div className="flex items-center gap-0.5 ml-1">
        {timer.startedAt ? (
          <button onClick={pauseTimer} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300">
            <Pause size={12} />
          </button>
        ) : (
          <button onClick={resumeTimer} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300">
            <Play size={12} />
          </button>
        )}
        <button onClick={stopTimer} className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400">
          <Square size={11} />
        </button>
      </div>
    </div>
  );
}
