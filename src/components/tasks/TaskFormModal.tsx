import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Label, TextInput, TextArea, Select, FieldRow } from '../common/Fields';
import { Button } from '../common/Button';
import { useStore } from '../../store/useStore';
import type { Task, Priority, TaskStatus } from '../../types';
import { todayISO, calculateDuration, fmtTime12h } from '../../lib/date';
import { toDecimalHours } from '../../store/selectors';

const CATEGORIES = ['Design', 'Marketing', 'Meetings', 'Admin', 'Content', 'Personal', 'General'];

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null; // editing when present
  defaultStatus?: TaskStatus;
}

export function TaskFormModal({ open, onClose, task, defaultStatus }: TaskFormModalProps) {
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const projects = useStore((s) => s.projects);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [tags, setTags] = useState('');

  const isWorkTagged = useMemo(
    () => tags.split(',').some((t) => ['TEOPM', 'WORK'].includes(t.trim().toUpperCase())),
    [tags]
  );
  // Live preview — same calculateDuration() the store recomputes on save, so this never drifts from the saved value.
  const durationMinutes = useMemo(() => calculateDuration(dueTime || null, endTime || null), [dueTime, endTime]);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setProjectId(task.projectId ?? '');
      setCategory(task.category);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ?? '');
      setDueTime(task.dueTime ?? '');
      setEndTime(task.endTime ?? '');
      setEstimatedMinutes(task.estimatedMinutes);
      setTags(task.tags.join(', '));
    } else {
      setTitle('');
      setDescription('');
      setProjectId('');
      setCategory('General');
      setPriority('Medium');
      setStatus(defaultStatus ?? 'To Do');
      setDueDate(todayISO());
      setDueTime('');
      setEndTime('');
      setEstimatedMinutes(30);
      setTags('');
    }
  }, [open, task, defaultStatus]);

  const submit = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description,
      projectId: projectId || null,
      category,
      priority,
      status,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      endTime: endTime || null,
      estimatedMinutes: Number(estimatedMinutes) || 0,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (task) {
      updateTask(task.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Title</Label>
          <TextInput
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Diseñar logo WMS"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
          />
        </div>

        <div>
          <Label>Description</Label>
          <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." />
        </div>

        <FieldRow>
          <div>
            <Label>Project</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="To Do">To Do</option>
              <option value="Today">Today</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </Select>
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label>Due date</Label>
            <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="logo, branding" />
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label>Start time (optional)</Label>
            <TextInput type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </div>
          <div>
            <Label>End time (optional)</Label>
            <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </FieldRow>

        {/* Only relevant once the task is tagged TEOPM/WORK — that's what actually feeds the workday total. */}
        {isWorkTagged && (
          <div
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[13px] font-medium ${
              durationMinutes !== null ? 'border-violet-500/25 bg-violet-500/[0.06] text-violet-300' : 'border-white/10 bg-white/[0.02] text-zinc-500'
            }`}
          >
            {dueTime && endTime ? (
              <>
                <span>{fmtTime12h(dueTime)}</span>
                <ArrowRight size={13} />
                <span>{fmtTime12h(endTime)}</span>
                <span className="ml-auto tabular-nums">{toDecimalHours(durationMinutes ?? 0)} HRS · counts toward TEOPM</span>
              </>
            ) : (
              <span>Tagged TEOPM/WORK — set both times to log hours toward the TEOPM workday total.</span>
            )}
          </div>
        )}

        <div>
          <Label>Estimated time (minutes)</Label>
          <TextInput
            type="number"
            min={0}
            step={5}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-32"
          />
        </div>
      </div>
    </Modal>
  );
}
