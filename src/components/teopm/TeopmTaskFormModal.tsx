import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Label, TextInput, TextArea, Select, FieldRow } from '../common/Fields';
import { DurationInput } from '../common/DurationInput';
import { Button } from '../common/Button';
import { useStore } from '../../store/useStore';
import { TEOPM_PROJECT_ID } from '../../store/selectors';
import type { Task, Priority, TaskStatus } from '../../types';
import { todayISO } from '../../lib/date';

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
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [actualMinutes, setActualMinutes] = useState(0);

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
      setEstimatedMinutes(task.estimatedMinutes);
      setActualMinutes(task.actualMinutes);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Marketing');
      setPriority('Medium');
      setStatus('To Do');
      setDate(initialDate ?? todayISO()); // assigned automatically — changeable below
      setStartTime(initialStartTime ?? '');
      setEstimatedMinutes(30);
      setActualMinutes(0);
    }
  }, [open, task, initialDate, initialStartTime]);

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
      estimatedMinutes: Number(estimatedMinutes) || 0,
      actualMinutes: Number(actualMinutes) || 0,
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
          <Label>Start time (optional)</Label>
          <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-32" />
        </div>

        <FieldRow>
          <div>
            <Label>Estimated duration</Label>
            <DurationInput minutes={estimatedMinutes} onChange={setEstimatedMinutes} />
          </div>
          <div>
            <Label>Duration worked</Label>
            <DurationInput minutes={actualMinutes} onChange={setActualMinutes} />
          </div>
        </FieldRow>
        <p className="text-[11px] text-zinc-600 -mt-2">
          "Duration worked" also grows automatically while its timer runs — set it by hand for time logged elsewhere.
        </p>
      </div>
    </Modal>
  );
}
