// ─────────────────────────────────────────────────────────────────────────
// PHASE WORKBENCH — one of the 14 phases.
//
// Shows the phase objective and progress, then its questions. Every capture
// modal opened from here is anchored to the phase and, where relevant, to
// the question, so evidence recorded while reading a question attaches to
// it without any extra step.
//
// A ?q=<id> query parameter expands and scrolls to one question, which is
// what every [Start Research] button in the app links to.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Plus, StickyNote } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import { PHASE_BY_KEY } from '../../lib/marketing/phaseTemplates';
import { phaseProgress } from '../../lib/marketing/progress';
import type { PhaseKey } from '../../types/marketing';
import { QuestionCard } from '../../components/marketing/QuestionCard';
import {
  DecisionModal,
  EvidenceModal,
  HypothesisModal,
  NoteModal,
} from '../../components/marketing/RecordModals';
import { EmptyState, SectionHeading } from '../../components/marketing/primitives';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Label, TextArea } from '../../components/common/Fields';

type ModalKind = 'evidence' | 'hypothesis' | 'decision' | 'note' | null;

export function PhaseWorkbenchPage() {
  const { phaseKey = 'foundation' } = useParams<{ workspaceId: string; phaseKey: PhaseKey }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, add, patch, drop } = useMarketingStore();

  const template = PHASE_BY_KEY.get(phaseKey as PhaseKey);
  const phase = data.phases.find((p) => p.key === phaseKey);

  const questions = useMemo(
    () => data.questions.filter((q) => q.phaseId === phase?.id).sort((a, b) => a.sortOrder - b.sortOrder),
    [data.questions, phase?.id]
  );
  const progress = useMemo(() => phaseProgress(questions, phaseKey as PhaseKey), [questions, phaseKey]);

  const focusId = searchParams.get('q');
  const [expandedId, setExpandedId] = useState<string | null>(focusId);
  const [modal, setModal] = useState<ModalKind>(null);
  const [anchorQuestionId, setAnchorQuestionId] = useState<string | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Follow a [Start Research] deep link: expand the question and scroll to it.
  useEffect(() => {
    if (!focusId) return;
    setExpandedId(focusId);
    const el = document.getElementById(`question-${focusId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId]);

  // Reset when moving between phases so the previous phase's open card does
  // not appear expanded in the new one.
  useEffect(() => {
    if (!focusId) setExpandedId(null);
  }, [phaseKey, focusId]);

  const phaseNotes = data.notes.filter((n) => n.phaseId === phase?.id && !n.questionId);

  const openModal = (kind: ModalKind, questionId: string | null) => {
    setAnchorQuestionId(questionId);
    setModal(kind);
  };

  const anchor = { phaseId: phase?.id ?? null, questionId: anchorQuestionId };

  if (!template) return <EmptyState title="Unknown phase." />;

  return (
    <div className="space-y-5">
      <div className="stenner-card p-5">
        <div className="flex items-start gap-3">
          <span className="text-[13px] font-mono text-zinc-600 mt-1">{template.code}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-bold">{template.label}</h1>
            <p className="text-[12.5px] text-zinc-500 mt-1 leading-relaxed">{phase?.objective ?? template.objective}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[22px] font-bold tabular-nums">{progress.total > 0 ? `${progress.percent}%` : '—'}</div>
            <div className="text-[10px] text-zinc-600 tracking-wide uppercase">progress</div>
          </div>
        </div>

        {progress.total > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-[var(--color-border-soft)] text-[11.5px] text-zinc-500">
            <span>{progress.total} questions</span>
            <span>{progress.answered} answered</span>
            <span className="text-green-400/80">{progress.validated} validated</span>
            <span className="text-violet-400/80">{progress.decided} decided</span>
            {progress.needsEvidence > 0 && <span className="text-amber-400/80">{progress.needsEvidence} need evidence</span>}
            <Button size="sm" variant="ghost" className="ml-auto !px-2 !py-1" onClick={() => openModal('note', null)}>
              <StickyNote size={12} /> Note
            </Button>
          </div>
        )}
      </div>

      <section>
        <SectionHeading
          title="Questions"
          count={questions.length}
          action={
            <Button size="sm" variant="secondary" onClick={() => setAddingQuestion(true)}>
              <Plus size={13} /> Add question
            </Button>
          }
        />

        {questions.length === 0 ? (
          <EmptyState
            title="No questions in this phase."
            hint="Add the questions this phase needs to answer."
            action={
              <Button size="sm" variant="primary" onClick={() => setAddingQuestion(true)}>
                <Plus size={13} /> Add question
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {questions.map((question) => (
              <div key={question.id} id={`question-${question.id}`}>
                <QuestionCard
                  question={question}
                  evidence={data.evidence.filter((e) => e.questionId === question.id)}
                  hypotheses={data.hypotheses.filter((h) => h.questionId === question.id)}
                  notes={data.notes.filter((n) => n.questionId === question.id)}
                  decisions={data.decisions.filter((d) => d.questionId === question.id)}
                  expanded={expandedId === question.id}
                  onToggle={() => {
                    setExpandedId((id) => (id === question.id ? null : question.id));
                    if (focusId) setSearchParams({}, { replace: true });
                  }}
                  onPatch={(p) => void patch('questions', question.id, p)}
                  onAddEvidence={() => openModal('evidence', question.id)}
                  onAddHypothesis={() => openModal('hypothesis', question.id)}
                  onAddDecision={() => openModal('decision', question.id)}
                  onAddNote={() => openModal('note', question.id)}
                  onDeleteEvidence={(id) => void drop('evidence', id)}
                  onDeleteQuestion={() => void drop('questions', question.id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {phaseNotes.length > 0 && (
        <section>
          <SectionHeading title="Phase notes" count={phaseNotes.length} />
          <div className="space-y-2">
            {phaseNotes.map((n) => (
              <div key={n.id} className="stenner-card px-3.5 py-3">
                <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1">{n.type}</div>
                <div className="text-[12.5px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{n.body}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <EvidenceModal
        open={modal === 'evidence'}
        onClose={() => setModal(null)}
        anchor={anchor}
        onSave={(draft) => void add('evidence', draft)}
      />
      <HypothesisModal
        open={modal === 'hypothesis'}
        onClose={() => setModal(null)}
        anchor={anchor}
        onSave={(draft) => void add('hypotheses', draft)}
      />
      <DecisionModal
        open={modal === 'decision'}
        onClose={() => setModal(null)}
        anchor={anchor}
        onSave={async (draft) => {
          await add('decisions', draft);
          // Recording a decision on a question resolves it — that is what
          // `decided` means, and it is how the question leaves the gap list.
          if (anchorQuestionId) void patch('questions', anchorQuestionId, { status: 'decided' });
        }}
      />
      <NoteModal open={modal === 'note'} onClose={() => setModal(null)} anchor={anchor} onSave={(draft) => void add('notes', draft)} />

      <AddQuestionModal
        open={addingQuestion}
        onClose={() => setAddingQuestion(false)}
        onSave={(fields) =>
          void add('questions', {
            phaseId: phase?.id ?? '',
            sortOrder: questions.length + 1,
            response: '',
            status: 'not_started',
            confidence: 'none',
            isTemplate: false,
            ...fields,
          })
        }
      />
    </div>
  );
}

function AddQuestionModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (fields: { text: string; purpose: string; guidance: string; expectedEvidence: string }) => void;
}) {
  const [text, setText] = useState('');
  const [purpose, setPurpose] = useState('');
  const [guidance, setGuidance] = useState('');
  const [expectedEvidence, setExpectedEvidence] = useState('');

  useEffect(() => {
    if (!open) return;
    setText('');
    setPurpose('');
    setGuidance('');
    setExpectedEvidence('');
  }, [open]);

  const submit = () => {
    if (!text.trim()) return;
    onSave({
      text: text.trim(),
      purpose: purpose.trim(),
      guidance: guidance.trim(),
      expectedEvidence: expectedEvidence.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add research question"
      width={620}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!text.trim()}>
            Add question
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Question</Label>
          <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Make it observable and decidable — something you could go and check." autoFocus />
        </div>
        <div>
          <Label>Purpose — what does answering it unblock?</Label>
          <TextArea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        <div>
          <Label>Guidance — how would you go about it?</Label>
          <TextArea rows={2} value={guidance} onChange={(e) => setGuidance(e.target.value)} />
        </div>
        <div>
          <Label>Expected evidence — what would count as a real answer?</Label>
          <TextArea rows={2} value={expectedEvidence} onChange={(e) => setExpectedEvidence(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
