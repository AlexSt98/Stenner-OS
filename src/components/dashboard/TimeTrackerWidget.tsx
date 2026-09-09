import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Square, Maximize2, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useTimerElapsed } from '../../hooks/useTimerElapsed';
import { fmtHMS, fmtHM } from '../../lib/date';
import { ProgressBar } from '../common/ProgressBar';
import { secondsByCategory } from '../../store/selectors';

const CATEGORIES = ['Design', 'TEOPM', 'Marketing', 'Meetings', 'Personal'];
const CATEGORY_COLOR: Record<string, string> = {
  Design: 'var(--color-accent-purple)',
  TEOPM: 'var(--color-accent-blue)',
  Marketing: 'var(--color-accent-green)',
  Meetings: 'var(--color-accent-yellow)',
  Personal: 'var(--color-accent-pink)',
};

export function TimeTrackerWidget() {
  const navigate = useNavigate();
  const timer = useStore((s) => s.timer);
  const timeSessions = useStore((s) => s.timeSessions);
  const startTimer = useStore((s) => s.startTimer);
  const pauseTimer = useStore((s) => s.pauseTimer);
  const resumeTimer = useStore((s) => s.resumeTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const elapsed = useTimerElapsed();
  const [range, setRange] = useState<'today' | 'week'>('today');
  const [quickCategory, setQuickCategory] = useState('Design');

  const isActive = !!timer.startedAt || timer.accumulatedSeconds > 0;
  const breakdown = secondsByCategory(timeSessions, range === 'today' ? 'today' : 'week');
  const maxSecs = Math.max(1, ...breakdown.map((b) => b.seconds));

  return (
    <div className="stenner-card p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">TIME TRACKER</h2>
        <button
          onClick={() => navigate('/time-tracker')}
          className="ml-auto p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06]"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {isActive ? (
        <div className="mb-1">
          <div className="text-[12.5px] text-zinc-400 truncate">{timer.label}</div>
          <div className="text-[26px] font-bold tabular-nums tracking-tight mt-0.5">{fmtHMS(elapsed)}</div>
        </div>
      ) : (
        <div className="mb-1">
          <div className="text-[12.5px] text-zinc-500">No session running</div>
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value)}
            className="stenner-input mt-1.5 px-2.5 py-1.5 text-[12.5px] w-full"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        {!isActive && (
          <button
            onClick={() => startTimer({ category: quickCategory, label: quickCategory })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12.5px] font-semibold transition-colors"
          >
            <Play size={13} /> Start
          </button>
        )}
        {isActive && timer.startedAt && (
          <button
            onClick={pauseTimer}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-zinc-200 text-[12.5px] font-semibold transition-colors"
          >
            <Pause size={13} /> Pause
          </button>
        )}
        {isActive && !timer.startedAt && (
          <button
            onClick={resumeTimer}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12.5px] font-semibold transition-colors"
          >
            <Play size={13} /> Resume
          </button>
        )}
        {isActive && (
          <button
            onClick={stopTimer}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[12.5px] font-semibold transition-colors"
          >
            <Square size={12} /> Stop
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 mt-4 w-fit">
        {(['today', 'week'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              range === r ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {r === 'today' ? 'Today' : 'This Week'}
          </button>
        ))}
      </div>

      <div className="space-y-2.5 mt-3">
        {breakdown.length === 0 && <div className="text-[12px] text-zinc-500 py-2">No sessions logged yet.</div>}
        {breakdown.map((b) => (
          <div key={b.category}>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLOR[b.category] ?? '#8b5cf6' }} />
                {b.category}
              </span>
              <span className="text-zinc-500">{fmtHM(Math.round(b.seconds / 60))}</span>
            </div>
            <ProgressBar value={(b.seconds / maxSecs) * 100} color={CATEGORY_COLOR[b.category] ?? '#8b5cf6'} />
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/time-tracker')}
        className="flex items-center gap-1 text-[11.5px] text-violet-400 hover:text-violet-300 mt-3.5 font-medium"
      >
        View full report <ArrowRight size={11} />
      </button>
    </div>
  );
}
