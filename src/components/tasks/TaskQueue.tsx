import { useMemo, useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import type { Task } from '../../types';
import { TaskRow } from './TaskRow';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFormModal } from './TaskFormModal';
import { isTodayISO } from '../../lib/date';
import { parseISO, isFuture } from 'date-fns';

type Tab = 'Today' | 'Upcoming' | 'All';

interface TaskQueueProps {
  tasks: Task[];
  compact?: boolean;
  limit?: number;
  title?: string;
  showHeader?: boolean;
}

export function TaskQueue({ tasks, compact = false, limit, title = 'TASK QUEUE', showHeader = true }: TaskQueueProps) {
  const [tab, setTab] = useState<Tab>('Today');
  const [selected, setSelected] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (tab === 'All') return tasks;
    if (tab === 'Today') return tasks.filter((t) => isTodayISO(t.dueDate) || t.status === 'Today');
    return tasks.filter((t) => {
      if (!t.dueDate || t.status === 'Done') return false;
      if (isTodayISO(t.dueDate)) return false;
      return isFuture(parseISO(t.dueDate));
    });
  }, [tasks, tab]);

  const visible = limit ? filtered.slice(0, limit) : filtered;
  const completedCount = filtered.filter((t) => t.status === 'Done').length;

  return (
    <div className="stenner-card p-4">
      {showHeader && (
        <div className="flex items-center gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <ListChecks size={15} className="text-zinc-500" />
            <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">{title}</h2>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 ml-2">
            {(['Today', 'Upcoming', 'All'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-colors ${
                  tab === t ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreating(true)}
            className="ml-auto p-1.5 rounded-lg bg-white/[0.05] hover:bg-violet-600 text-zinc-300 hover:text-white transition-colors"
            title="Add task"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      <div className={`space-y-0.5 ${compact ? 'max-h-[360px] overflow-y-auto' : ''}`}>
        {visible.map((task) => (
          <TaskRow key={task.id} task={task} onOpen={setSelected} />
        ))}
        {visible.length === 0 && (
          <div className="py-10 text-center text-[13px] text-zinc-500">
            No tasks here. <button onClick={() => setCreating(true)} className="text-violet-400 hover:underline">Add one</button>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center gap-2 mt-3.5">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
              style={{ width: `${(completedCount / filtered.length) * 100}%` }}
            />
          </div>
          <span className="text-[11.5px] text-zinc-500 shrink-0">
            {completedCount} / {filtered.length} completed
          </span>
        </div>
      )}

      <TaskDetailModal task={selected} onClose={() => setSelected(null)} />
      <TaskFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
