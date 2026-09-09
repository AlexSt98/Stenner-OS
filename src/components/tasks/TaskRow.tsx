import { useState } from 'react';
import { Check, Clock3, GripVertical } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';
import { PriorityBadge, CategoryChip } from '../common/Badges';
import { fmtHM } from '../../lib/date';

const STATUS_OPTIONS: TaskStatus[] = ['To Do', 'Today', 'In Progress', 'Review', 'Done'];

interface TaskRowProps {
  task: Task;
  onOpen: (task: Task) => void;
  draggable?: boolean;
}

export function TaskRow({ task, onOpen, draggable = true }: TaskRowProps) {
  const toggleTaskComplete = useStore((s) => s.toggleTaskComplete);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const reorderTasks = useStore((s) => s.reorderTasks);
  const projects = useStore((s) => s.projects);
  const pushToast = useToastStore((s) => s.push);
  const [dragOver, setDragOver] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);
  const isDone = task.status === 'Done';

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willComplete = task.status !== 'Done';
    toggleTaskComplete(task.id);
    if (willComplete) pushToast('+100 XP', 'xp');
  };

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const draggedId = e.dataTransfer.getData('text/task-id');
        if (draggedId) reorderTasks(draggedId, task.id);
      }}
      onClick={() => onOpen(task)}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
        dragOver ? 'border-violet-500/50 bg-violet-500/[0.06]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
      }`}
    >
      <GripVertical size={13} className="text-zinc-700 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />

      <button
        onClick={handleComplete}
        className={`w-[18px] h-[18px] rounded-md border shrink-0 flex items-center justify-center transition-all ${
          isDone
            ? 'bg-violet-600 border-violet-600'
            : 'border-zinc-600 hover:border-violet-400'
        }`}
      >
        {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className={`text-[13.5px] font-medium truncate ${isDone ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-100'}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {project && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ color: project.color, background: `${project.color}1a` }}>
              {project.name}
            </span>
          )}
          <CategoryChip label={task.category} />
        </div>
      </div>

      <PriorityBadge priority={task.priority} />

      <div className="hidden sm:flex items-center gap-1 text-[11.5px] text-zinc-500 w-14 shrink-0">
        <Clock3 size={11} />
        {fmtHM(task.estimatedMinutes)}
      </div>

      <select
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setTaskStatus(task.id, e.target.value as TaskStatus)}
        className={`text-[11.5px] font-semibold rounded-lg pl-2.5 pr-1.5 py-1.5 border bg-transparent shrink-0 w-[104px] cursor-pointer appearance-none text-center
          ${task.status === 'Done' ? 'text-zinc-500 border-white/10' : task.status === 'In Progress' ? 'text-blue-400 border-blue-500/25' : task.status === 'Today' ? 'text-green-400 border-green-500/25' : task.status === 'Review' ? 'text-violet-400 border-violet-500/25' : 'text-zinc-300 border-white/10'}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-[#17171b] text-zinc-200">
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
