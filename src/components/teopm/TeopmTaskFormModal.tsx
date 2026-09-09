import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Label, TextInput, TextArea, Select, FieldRow } from '../common/Fields';
import { Button } from '../common/Button';
import { useStore } from '../../store/useStore';
import { TEOPM_PROJECT_ID } from '../../store/selectors';
import { toDecimalHours } from '../../store/selectors';
import { calculateDuration, fmtTime12h, todayISO } from '../../lib/date';
import type { Task, Priority, TaskStatus } from '../../types';

const CATEGORIES = ['Marketing', 'Design', 'Meetings', 'Admin', 'Content', 'General'];

interface TeopmTaskFormModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  initialDate?: string;
  initialStartTime?: string;
}

export function TeopmTaskFormModal({ open, onClose, task, initialDate, initialStartTime }: TeopmTaskFormModalProps) {
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Marketing');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category);
      setPriority(task.priority);
      setStatus(task.status);
      setDate(task.dueDate ?? todayISO());
      setStartTime(task.dueTime ?? '');
      setEndTime(task.endTime ?? '');
      setTags(task.tags.join(', '));
    } else {
      setTitle('');
      setDescription('');
      setCategory('Marketing');
      setPriority('Medium');
      setStatus('To Do');
      setDate(initialDate ?? todayISO()); // assigned automatically — changeable below
      setStartTime(initialStartTime ?? '');
      setEndTime('');
      setTags('TEOPM'); // auto-tagged so this task is recognized as TEOPM even if reassigned off the project later
    }
  }, [open, task, initialDate, initialStartTime]);

  // Live preview — recalculates on every keystroke, same calculateDuration() the store uses on save.
  const durationMinutes = useMemo(() => calculateDuration(startTime || null, endTime || null), [startTime, endTime]);

  const submit = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description,
      projectId: TEOPM_PROJECT_ID,
      category,
      priority,
      status,
      dueDate: date || todayISO(),
      dueTime: startTime || null,
      endTime: endTime || null,
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
      title={task ? 'Edit workday task' : 'New workday task'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            {task ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Task name</Label>
          <TextInput
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Update TEOPM landing page"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
          />
        </div>
        <div>
          <Label>Description (optional)</Label>
          <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <FieldRow>
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
          <div>
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
          </div>
        </FieldRow>

        <FieldRow>
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
          <div>
            <Label>Date</Label>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </FieldRow>

        <div>
          <Label>Tags</Label>
          <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="TEOPM, Marketing" />
          <p className="text-[11px] text-zinc-600 mt-1">A "TEOPM" or "WORK" tag is what makes a task count toward the workday total.</p>
        </div>

        <div>
          <Label>Start time / End time</Label>
          <div className="flex items-center gap-2.5">
            <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-36" />
            <ArrowRight size={14} className="text-zinc-600 shrink-0" />
            <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-36" />
          </div>
          <p className="text-[11px] text-zinc-600 mt-1">Leave both blank to log the task without hours yet — add them later once you know when it happened.</p>
        </div>

        {/* Live "10:30 AM → 11:00 AM · 0.5 HRS" preview — updates as soon as both times are set, no save required. */}
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[13px] font-medium ${
          durationMinutes !== null ? 'border-violet-500/25 bg-violet-500/[0.06] text-violet-300' : 'border-white/10 bg-white/[0.02] text-zinc-500'
        }`}>
          {startTime && endTime ? (
            <>
              <span>{fmtTime12h(startTime)}</span>
              <ArrowRight size={13} />
              <span>{fmtTime12h(endTime)}</span>
              <span className="ml-auto tabular-nums">{toDecimalHours(durationMinutes ?? 0)} HRS</span>
            </>
          ) : (
            <span>Set both times to see the duration — shows as “--” until then.</span>
          )}
        </div>
      </div>
    </Modal>
  );
}
