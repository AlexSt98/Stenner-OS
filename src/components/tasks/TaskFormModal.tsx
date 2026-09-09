import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Label, TextInput, TextArea, Select, FieldRow } from '../common/Fields';
import { Button } from '../common/Button';
import { useStore } from '../../store/useStore';
import type { Task, Priority, TaskStatus } from '../../types';
import { todayISO } from '../../lib/date';

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
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [tags, setTags] = useState('');

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
            <Label>Due time (optional)</Label>
            <TextInput type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label>Estimated time (minutes)</Label>
            <TextInput
              type="number"
              min={0}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="logo, branding" />
          </div>
        </FieldRow>
      </div>
    </Modal>
  );
}
