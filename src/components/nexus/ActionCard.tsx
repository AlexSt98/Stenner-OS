import { useState } from 'react';
import { CheckSquare, FolderKanban, Lightbulb, CalendarPlus, Play, Square, Check, X } from 'lucide-react';
import type { NexusToolCall } from '../../types/nexus';
import { executeNexusAction } from '../../lib/nexus/executeAction';
import { useToastStore } from '../../store/useToastStore';

const TOOL_META: Record<string, { label: string; icon: typeof CheckSquare; color: string }> = {
  createTask: { label: 'CREATE TASK', icon: CheckSquare, color: '#3b82f6' },
  updateTask: { label: 'UPDATE TASK', icon: CheckSquare, color: '#3b82f6' },
  completeTask: { label: 'COMPLETE TASK', icon: Check, color: '#22c55e' },
  createProject: { label: 'CREATE PROJECT', icon: FolderKanban, color: '#8b5cf6' },
  createIdea: { label: 'SAVE IDEA', icon: Lightbulb, color: '#eab308' },
  createCalendarEvent: { label: 'CREATE EVENT', icon: CalendarPlus, color: '#8b5cf6' },
  startTimer: { label: 'START TIMER', icon: Play, color: '#22c55e' },
  stopTimer: { label: 'STOP TIMER', icon: Square, color: '#ef4444' },
};

function fieldsFor(call: NexusToolCall): { label: string; value: string }[] {
  const a = call.args as Record<string, unknown>;
  const s = (v: unknown) => (v == null || v === '' ? null : String(v));
  switch (call.name) {
    case 'createTask':
      return [
        { label: 'Title', value: s(a.title) ?? '—' },
        { label: 'Project', value: s(a.projectName) ?? 'None' },
        { label: 'Priority', value: s(a.priority) ?? 'Medium' },
        { label: 'Due', value: s(a.dueDate) ?? 'Today' },
      ].filter((f) => f.value);
    case 'updateTask':
      return [
        { label: 'Task', value: s(a.taskTitle) ?? '—' },
        { label: 'Priority', value: s(a.priority) },
        { label: 'Status', value: s(a.status) },
        { label: 'Due', value: s(a.dueDate) },
      ].filter((f): f is { label: string; value: string } => !!f.value);
    case 'completeTask':
      return [{ label: 'Task', value: s(a.taskTitle) ?? '—' }];
    case 'createProject':
      return [
        { label: 'Name', value: s(a.name) ?? '—' },
        { label: 'Description', value: s(a.description) ?? '' },
      ].filter((f) => f.value);
    case 'createIdea':
      return [
        { label: 'Title', value: s(a.title) ?? '—' },
        { label: 'Tags', value: s(a.tags) ?? '' },
      ].filter((f) => f.value);
    case 'createCalendarEvent':
      return [
        { label: 'Title', value: s(a.title) ?? '—' },
        { label: 'Date', value: s(a.date) ?? 'Today' },
        { label: 'Time', value: `${s(a.startTime) ?? '?'} – ${s(a.endTime) ?? '?'}` },
      ];
    case 'startTimer':
      return [
        { label: 'Category', value: s(a.category) ?? '—' },
        { label: 'Project', value: s(a.projectName) ?? 'None' },
      ].filter((f) => f.value);
    case 'stopTimer':
      return [];
    default:
      return Object.entries(a).map(([k, v]) => ({ label: k, value: String(v) }));
  }
}

interface ActionCardProps {
  call: NexusToolCall;
  resolution?: 'confirmed' | 'cancelled' | null;
  onResolve: (resolution: 'confirmed' | 'cancelled') => void;
}

export function ActionCard({ call, resolution, onResolve }: ActionCardProps) {
  const [busy, setBusy] = useState(false);
  const pushToast = useToastStore((s) => s.push);
  const meta = TOOL_META[call.name] ?? { label: call.name, icon: CheckSquare, color: '#8b5cf6' };
  const fields = fieldsFor(call);

  if (resolution === 'confirmed') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-green-500/25 bg-green-500/[0.06] text-[12.5px] text-green-400">
        <Check size={14} /> Done.
      </div>
    );
  }
  if (resolution === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-[12.5px] text-zinc-500">
        <X size={14} /> Cancelled.
      </div>
    );
  }

  const confirm = () => {
    setBusy(true);
    const result = executeNexusAction(call);
    pushToast(result.message, result.success ? 'xp' : 'info');
    onResolve('confirmed');
    setBusy(false);
  };

  return (
    <div className="stenner-card p-3.5 max-w-sm border-white/10">
      <div className="flex items-center gap-1.5 mb-2.5">
        <meta.icon size={13} style={{ color: meta.color }} />
        <span className="text-[10.5px] font-bold tracking-wide" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      {fields.length > 0 && (
        <div className="space-y-1 mb-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-baseline gap-2 text-[12.5px]">
              <span className="text-zinc-500 w-16 shrink-0">{f.label}</span>
              <span className="text-zinc-200 truncate">{f.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onResolve('cancelled')}
          disabled={busy}
          className="flex-1 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06] text-[12.5px] font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={confirm}
          disabled={busy}
          className="flex-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12.5px] font-semibold transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
