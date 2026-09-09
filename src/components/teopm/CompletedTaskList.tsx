import { useMemo, useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import type { Task } from '../../types';
import { useStore } from '../../store/useStore';
import { fmtHM, fmtDateTime, isTodayISO, isYesterdayISO, isThisWeekISO, isThisMonthISO } from '../../lib/date';

type Filter = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'All';
const FILTERS: Filter[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'All'];

interface CompletedTaskListProps {
  tasks: Task[]; // TEOPM tasks, any status — this component filters to Done itself
}

export function CompletedTaskList({ tasks }: CompletedTaskListProps) {
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const projects = useStore((s) => s.projects);
  const teopm = projects.find((p) => p.id === 'proj-teopm');

  const completed = useMemo(() => {
    let list = tasks.filter((t) => t.status === 'Done' && t.completedAt);
    if (filter === 'Today') list = list.filter((t) => isTodayISO(t.completedAt));
    if (filter === 'Yesterday') list = list.filter((t) => isYesterdayISO(t.completedAt));
    if (filter === 'This Week') list = list.filter((t) => isThisWeekISO(t.completedAt));
    if (filter === 'This Month') list = list.filter((t) => isThisMonthISO(t.completedAt));
    if (query.trim()) list = list.filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()));
    return [...list].sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [tasks, filter, query]);

  return (
    <div className="stenner-card p-4">
      <div className="flex items-center gap-2 mb-3.5 flex-wrap">
        <CheckCircle2 size={15} className="text-green-400" />
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">COMPLETED TASKS</h2>
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 ml-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                filter === f ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="stenner-input pl-7 pr-2.5 py-1.5 text-[12px] w-40 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
        {completed.map((task) => (
          <div key={task.id} className="flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-white/[0.03]">
            <span className="text-green-400 mt-0.5 shrink-0">✓</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-zinc-200 truncate">{task.title}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                {teopm?.name ?? 'TEOPM'} · {task.category}
              </div>
              <div className="text-[10.5px] text-zinc-600 mt-1">Completed: {fmtDateTime(task.completedAt!)}</div>
            </div>
            <div className="text-[12.5px] font-semibold text-zinc-400 shrink-0">{fmtHM(task.actualMinutes)}</div>
          </div>
        ))}
        {completed.length === 0 && <div className="py-10 text-center text-[13px] text-zinc-500">Nothing here yet.</div>}
      </div>
    </div>
  );
}
