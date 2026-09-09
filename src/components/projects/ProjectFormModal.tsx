import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Label, TextInput, TextArea, Select, FieldRow } from '../common/Fields';
import { Button } from '../common/Button';
import { useStore } from '../../store/useStore';
import type { Project, ProjectStatus } from '../../types';

const COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#f97316'];
const ICONS = ['●', '◭', '▤', '✚', '◆', '★'];

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectFormModal({ open, onClose, project }: ProjectFormModalProps) {
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  useEffect(() => {
    if (!open) return;
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setStatus(project.status);
      setColor(project.color);
      setIcon(project.icon ?? ICONS[0]);
    } else {
      setName('');
      setDescription('');
      setStatus('Active');
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setIcon(ICONS[0]);
    }
  }, [open, project]);

  const submit = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), description, status, color, icon };
    if (project) {
      updateProject(project.id, payload);
    } else {
      addProject(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'New project'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim()}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Name</Label>
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. WMS" />
        </div>
        <div>
          <Label>Description</Label>
          <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <FieldRow>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              <option value="Active">Active</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </Select>
          </div>
          <div>
            <Label>Icon</Label>
            <div className="flex items-center gap-1.5">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-8 h-8 rounded-lg border text-[14px] transition-colors ${
                    icon === i ? 'border-violet-500 bg-violet-500/15 text-white' : 'border-white/10 text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </FieldRow>
        <div>
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-white scale-105' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
