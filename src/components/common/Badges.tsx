import type { Priority, TaskStatus } from '../../types';

const PRIORITY_STYLES: Record<Priority, string> = {
  High: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  Low: 'bg-green-500/15 text-green-400 border-green-500/20',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${PRIORITY_STYLES[priority]}`}>
      {priority}
    </span>
  );
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  'To Do': 'bg-white/[0.06] text-zinc-300 border-white/10',
  Today: 'bg-green-500/15 text-green-400 border-green-500/20',
  'In Progress': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Review: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Done: 'bg-white/[0.06] text-zinc-500 border-white/10 line-through decoration-zinc-600',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function CategoryChip({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.05] text-zinc-400 border border-white/10 whitespace-nowrap">
      {label}
    </span>
  );
}
