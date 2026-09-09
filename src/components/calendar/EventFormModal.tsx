import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Label, TextInput, Select, FieldRow } from '../common/Fields';
import { Button } from '../common/Button';
import { useStore } from '../../store/useStore';
import type { CalendarEvent } from '../../types';

const COLORS = [
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
];

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  initialDate?: string;
  initialStart?: string;
}

export function EventFormModal({ open, onClose, event, initialDate, initialStart }: EventFormModalProps) {
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const projects = useStore((s) => s.projects);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState('#8b5cf6');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setDate(event.date);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setColor(event.color);
      setProjectId(event.projectId ?? '');
    } else {
      setTitle('');
      setDate(initialDate ?? '');
      setStartTime(initialStart ?? '09:00');
      const [h, m] = (initialStart ?? '09:00').split(':').map(Number);
      setEndTime(`${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      setColor('#8b5cf6');
      setProjectId('');
    }
  }, [open, event, initialDate, initialStart]);

  const submit = () => {
    if (!title.trim() || !date) return;
    const payload = { title: title.trim(), date, startTime, endTime, color, projectId: projectId || null };
    if (event) {
      updateEvent(event.id, payload);
    } else {
      addEvent(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? 'Edit event' : 'New event'}
      width={460}
      footer={
        <>
          {event && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                deleteEvent(event.id);
                onClose();
              }}
            >
              <Trash2 size={13} /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim() || !date}>
            {event ? 'Save changes' : 'Create event'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Title</Label>
          <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Client call" />
        </div>
        <FieldRow>
          <div>
            <Label>Date</Label>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Project (optional)</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </FieldRow>
        <FieldRow>
          <div>
            <Label>Start time</Label>
            <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label>End time</Label>
            <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </FieldRow>
        <div>
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                style={{ background: c.hex }}
                className={`w-7 h-7 rounded-full transition-transform ${color === c.hex ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-white scale-105' : ''}`}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
