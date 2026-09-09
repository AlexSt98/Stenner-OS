import { useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import type { Task } from '../../types';
import { TaskRow } from '../tasks/TaskRow';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { TeopmTaskFormModal } from './TeopmTaskFormModal';

interface TeopmTaskListProps {
  tasks: Task[]; // already scoped to the selected date, NOT done
  dateLabel: string;
}

export function TeopmTaskList({ tasks, dateLabel }: TeopmTaskListProps) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="stenner-card p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <ListChecks size={15} className="text-zinc-500" />
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">TODAY'S TASKS</h2>
        <span className="text-[11px] text-zinc-600">{dateLabel}</span>
        <button
          onClick={() => setCreating(true)}
          className="ml-auto p-1.5 rounded-lg bg-white/[0.05] hover:bg-violet-600 text-zinc-300 hover:text-white transition-colors"
          title="Add workday task"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onOpen={setSelected} />
        ))}
        {tasks.length === 0 && (
          <div className="py-10 text-center text-[13px] text-zinc-500">
            Nothing logged yet.{' '}
            <button onClick={() => setCreating(true)} className="text-violet-400 hover:underline">
              Add your first task
            </button>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selected}
        onClose={() => setSelected(null)}
        renderEditModal={({ task, open, onClose }) => <TeopmTaskFormModal open={open} onClose={onClose} task={task} />}
      />
      <TeopmTaskFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
