import { useState } from 'react';
import { Play, Pencil, Check, Trash2, Calendar, Clock3, Tag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PriorityBadge, StatusBadge, CategoryChip } from '../common/Badges';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';
import type { Task } from '../../types';
import { fmtHM, fmtDateShort } from '../../lib/date';
import { TaskFormModal } from './TaskFormModal';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const projects = useStore((s) => s.projects);
  const startTimer = useStore((s) => s.startTimer);
  const toggleTaskComplete = useStore((s) => s.toggleTaskComplete);
  const deleteTask = useStore((s) => s.deleteTask);
  const pushToast = useToastStore((s) => s.push);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!task) return null;
  const project = projects.find((p) => p.id === task.projectId);

  const handleStartTimer = () => {
    startTimer({
      taskId: task.id,
      projectId: task.projectId,
      category: task.category,
      label: `${task.category} · ${project?.name ?? task.title}`,
    });
    pushToast('Timer started');
    onClose();
  };

  const handleComplete = () => {
    const willComplete = task.status !== 'Done';
    toggleTaskComplete(task.id);
    if (willComplete) pushToast('+100 XP', 'xp');
    onClose();
  };

  return (
    <>
      <Modal
        open={!!task && !editing}
        onClose={onClose}
        title="Task detail"
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={13} /> Delete
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" onClick={handleStartTimer}>
              <Play size={13} /> Start timer
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={13} /> Edit
            </Button>
            <Button variant="primary" size="sm" onClick={handleComplete}>
              <Check size={13} /> {task.status === 'Done' ? 'Mark incomplete' : 'Complete'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <h2 className={`text-[17px] font-semibold ${task.status === 'Done' ? 'line-through text-zinc-500' : ''}`}>{task.title}</h2>
            {task.description && <p className="text-[13px] text-zinc-400 mt-1.5 leading-relaxed">{task.description}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <CategoryChip label={task.category} />
            {project && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ color: project.color, background: `${project.color}1a` }}>
                {project.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="stenner-card px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
                <Calendar size={12} /> Due date
              </div>
              <div className="text-[13px] font-medium">
                {task.dueDate ? fmtDateShort(task.dueDate) : '—'} {task.dueTime ? `· ${task.dueTime}` : ''}
              </div>
            </div>
            <div className="stenner-card px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
                <Clock3 size={12} /> Time
              </div>
              <div className="text-[13px] font-medium">
                {fmtHM(task.actualMinutes)} <span className="text-zinc-500">/ {fmtHM(task.estimatedMinutes)} est.</span>
              </div>
            </div>
          </div>

          {task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Tag size={12} className="text-zinc-500" />
              {task.tags.map((tag) => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/10">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <TaskFormModal open={editing} onClose={() => setEditing(false)} task={task} />

      <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)} title="Delete task?" width={380}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteTask(task.id);
                setConfirmingDelete(false);
                onClose();
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-zinc-400">
          This permanently removes "<span className="text-zinc-200">{task.title}</span>" and its recorded time entries stay in history. This can't be undone.
        </p>
      </Modal>
    </>
  );
}
