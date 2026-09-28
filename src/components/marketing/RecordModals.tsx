// ─────────────────────────────────────────────────────────────────────────
// Capture modals.
//
// All five reuse the existing STENNER OS Modal, Fields and Button — no new
// form primitives were introduced for Marketing Lab.
//
// They can be opened from anywhere and optionally carry a phaseId and
// questionId, so evidence captured while reading a question attaches to it
// automatically. That is what makes research capture fast enough to do
// while actually researching, rather than as a separate filing exercise.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FieldRow, Label, Select, TextArea, TextInput } from '../common/Fields';
import { SOURCE_TYPE_LABELS, HYPOTHESIS_STATUS_OPTIONS } from './primitives';
import type {
  Confidence,
  HypothesisStatus,
  MLDecision,
  MLEvidence,
  MLHypothesis,
  MLNote,
  MLQueueItem,
  NoteType,
  Priority,
  SourceType,
} from '../../types/marketing';

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: 'none', label: 'No confidence' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const NOTE_TYPES: NoteType[] = ['note', 'idea', 'question', 'concern', 'opportunity', 'observation'];

const todayISO = () => new Date().toISOString().slice(0, 10);

interface Anchor {
  phaseId?: string | null;
  questionId?: string | null;
}

// ── Evidence ─────────────────────────────────────────────────────────────

export type EvidenceDraft = Omit<MLEvidence, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>;

export function EvidenceModal({
  open,
  onClose,
  onSave,
  anchor,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: EvidenceDraft) => void;
  anchor?: Anchor;
  initial?: MLEvidence;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('official');
  const [sourceDate, setSourceDate] = useState('');
  const [confidence, setConfidence] = useState<Confidence>('medium');

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setUrl(initial?.url ?? '');
    setSourceName(initial?.sourceName ?? '');
    setSourceType(initial?.sourceType ?? 'official');
    setSourceDate(initial?.sourceDate ?? '');
    setConfidence(initial?.confidence ?? 'medium');
  }, [open, initial]);

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      sourceName: sourceName.trim(),
      sourceType,
      sourceDate: sourceDate || null,
      confidence,
      phaseId: anchor?.phaseId ?? initial?.phaseId ?? null,
      questionId: anchor?.questionId ?? initial?.questionId ?? null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit evidence' : 'Add evidence'}
      width={620}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            {initial ? 'Save' : 'Add evidence'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>What does this evidence show?</Label>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BLS reports 14% construction labour shortfall in 2025" autoFocus />
        </div>
        <div>
          <Label>Detail</Label>
          <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="The specific finding, figure or quote — not a summary of the whole source." />
        </div>
        <FieldRow>
          <div>
            <Label>Source</Label>
            <TextInput value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. Bureau of Labor Statistics" />
          </div>
          <div>
            <Label>Source type</Label>
            <Select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}>
              {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((t) => (
                <option key={t} value={t}>
                  {SOURCE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
        </FieldRow>
        <div>
          <Label>URL</Label>
          <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </div>
        <FieldRow>
          <div>
            <Label>Source date</Label>
            <TextInput type="date" value={sourceDate} onChange={(e) => setSourceDate(e.target.value)} />
          </div>
          <div>
            <Label>Confidence in this source</Label>
            <Select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)}>
              {CONFIDENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </FieldRow>
      </div>
    </Modal>
  );
}

// ── Hypothesis ───────────────────────────────────────────────────────────

export type HypothesisDraft = Omit<MLHypothesis, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>;

export function HypothesisModal({
  open,
  onClose,
  onSave,
  anchor,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: HypothesisDraft) => void;
  anchor?: Anchor;
  initial?: MLHypothesis;
}) {
  const [statement, setStatement] = useState('');
  const [status, setStatus] = useState<HypothesisStatus>('open');
  const [confidence, setConfidence] = useState<Confidence>('none');
  const [conclusion, setConclusion] = useState('');

  useEffect(() => {
    if (!open) return;
    setStatement(initial?.statement ?? '');
    setStatus(initial?.status ?? 'open');
    setConfidence(initial?.confidence ?? 'none');
    setConclusion(initial?.conclusion ?? '');
  }, [open, initial]);

  const submit = () => {
    if (!statement.trim()) return;
    onSave({
      statement: statement.trim(),
      status,
      confidence,
      conclusion: conclusion.trim(),
      phaseId: anchor?.phaseId ?? initial?.phaseId ?? null,
      questionId: anchor?.questionId ?? initial?.questionId ?? null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit hypothesis' : 'New hypothesis'}
      width={620}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!statement.trim()}>
            {initial ? 'Save' : 'Add hypothesis'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Statement</Label>
          <TextArea
            rows={3}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="A falsifiable claim, e.g. “Specialty contractors with 100–500 employees feel the operational visibility problem more acutely than smaller firms.”"
            autoFocus
          />
          <p className="text-[11px] text-zinc-600 mt-1.5">
            Write it so evidence could prove it wrong. A statement nothing could refute is not a hypothesis.
          </p>
        </div>
        <FieldRow>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as HypothesisStatus)}>
              {HYPOTHESIS_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Confidence</Label>
            <Select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)}>
              {CONFIDENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </FieldRow>
        <div>
          <Label>Conclusion (once resolved)</Label>
          <TextArea rows={2} value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Leave empty while still open or testing." />
        </div>
      </div>
    </Modal>
  );
}

// ── Decision ─────────────────────────────────────────────────────────────

export type DecisionDraft = Omit<MLDecision, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>;

export function DecisionModal({
  open,
  onClose,
  onSave,
  anchor,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: DecisionDraft) => void;
  anchor?: Anchor;
  initial?: MLDecision;
}) {
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [impact, setImpact] = useState('');
  const [decidedAt, setDecidedAt] = useState(todayISO());
  const [decidedBy, setDecidedBy] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setReason(initial?.reason ?? '');
    setImpact(initial?.impact ?? '');
    setDecidedAt(initial?.decidedAt ?? todayISO());
    setDecidedBy(initial?.decidedBy ?? '');
  }, [open, initial]);

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      reason: reason.trim(),
      impact: impact.trim(),
      decidedAt,
      decidedBy: decidedBy.trim(),
      supersedesId: initial?.supersedesId ?? null,
      phaseId: anchor?.phaseId ?? initial?.phaseId ?? null,
      questionId: anchor?.questionId ?? initial?.questionId ?? null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit decision' : 'Record decision'}
      width={620}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            {initial ? 'Save' : 'Record decision'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Decision</Label>
          <TextArea
            rows={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. “Position TEOPM around operational visibility and project execution, not project management software.”"
            autoFocus
          />
        </div>
        <div>
          <Label>Why — what evidence led here?</Label>
          <TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="The reasoning, so this is still understandable in six months." />
        </div>
        <div>
          <Label>Impact — what changes as a result?</Label>
          <TextArea rows={2} value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="What this rules in, and what it rules out." />
        </div>
        <FieldRow>
          <div>
            <Label>Date</Label>
            <TextInput type="date" value={decidedAt} onChange={(e) => setDecidedAt(e.target.value)} />
          </div>
          <div>
            <Label>Decided by</Label>
            <TextInput value={decidedBy} onChange={(e) => setDecidedBy(e.target.value)} placeholder="Name" />
          </div>
        </FieldRow>
      </div>
    </Modal>
  );
}

// ── Note ─────────────────────────────────────────────────────────────────

export type NoteDraft = Omit<MLNote, 'id' | 'workspaceId' | 'createdAt'>;

export function NoteModal({
  open,
  onClose,
  onSave,
  anchor,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: NoteDraft) => void;
  anchor?: Anchor;
}) {
  const [type, setType] = useState<NoteType>('note');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!open) return;
    setType('note');
    setBody('');
  }, [open]);

  const submit = () => {
    if (!body.trim()) return;
    onSave({ type, body: body.trim(), pinned: false, phaseId: anchor?.phaseId ?? null, questionId: anchor?.questionId ?? null });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Capture note"
      width={520}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!body.trim()}>
            Save note
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Type</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as NoteType)}>
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Note</Label>
          <TextArea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Capture it now, structure it later." autoFocus />
        </div>
      </div>
    </Modal>
  );
}

// ── Research queue item ──────────────────────────────────────────────────

export type QueueDraft = Omit<MLQueueItem, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>;

export function QueueItemModal({
  open,
  onClose,
  onSave,
  anchor,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: QueueDraft) => void;
  anchor?: Anchor;
}) {
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setReason('');
    setPriority('medium');
  }, [open]);

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      reason: reason.trim(),
      priority,
      status: 'todo',
      origin: 'manual',
      phaseId: anchor?.phaseId ?? null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Queue research"
      width={520}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            Add to queue
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>What needs researching?</Label>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Validate primary economic buyer" autoFocus />
        </div>
        <div>
          <Label>Why does it matter?</Label>
          <TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. ICP cannot be finalized without it." />
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}
