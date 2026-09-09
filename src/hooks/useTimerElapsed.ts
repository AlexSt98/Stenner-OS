import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

/** Live elapsed seconds for the currently running/paused timer. Ticks every second while running. */
export function useTimerElapsed() {
  const timer = useStore((s) => s.timer);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!timer.startedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer.startedAt]);

  const running = timer.startedAt
    ? timer.accumulatedSeconds + (Date.now() - new Date(timer.startedAt).getTime()) / 1000
    : timer.accumulatedSeconds;

  // reference `tick` so effect re-render happens each second
  void tick;

  return Math.round(running);
}
