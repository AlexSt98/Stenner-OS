// ─────────────────────────────────────────────────────────────────────────
// The question card — where most research actually happens.
//
// Collapsed it is a status line. Expanded it shows why the question is
// worth answering, how to go about it and what would count as evidence,
// then everything attached to it: the answer, its evidence, its hypotheses,
// its notes and any decision recorded on it.
//
// A question is never limited to a single piece of evidence or a single
// hypothesis — they are separate records joined by questionId, so a question
// can accumulate as many as the research produces.
//
// The answer field saves on blur rather than on every keystroke: writes are
// optimistic, and firing one per character would be pointless traffic.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileSearch,
  FlaskConical,
  Gavel,
  Plus,
  StickyNote,
  Target,
  Trash2,
} from 'lucide-react';
import type {
  Confidence,
  MLDecision,
  MLEvidence,
  MLHypothesis,
  MLNote,
  MLQuestion,
  QuestionStatus,
} from '../../types/marketing';
import { Button } from '../common/Button';
import { Select, TextArea } from '../common/Fields';
import {
  ConfidenceMeter,
  HypothesisStatusBadge,
  QUESTION_STATUS_OPTIONS,
  QuestionStatusBadge,
  SourceTypeChip,
} from './primitives';

interface Props {
  question: MLQuestion;
  evidence: MLEvidence[];
  hypotheses: MLHypothesis[];
  notes: MLNote[];
  decisions: MLDecision[];
  expanded: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<MLQuestion>) => void;
  onAddEvidence: () => void;
  onAddHypothesis: () => void;
  onAddDecision: () => void;
  onAddNote: () => void;
  onDeleteEvidence: (id: string) => void;
  onDeleteQuestion: () => void;
}

const CONFIDENCE_OPTIONS: Confidence[] = ['none', 'low', 'medium', 'high'];

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1">{label}</div>
      <p className="text-[12.5px] text-zinc-400 leading-relaxed">{children}</p>
    </div>
  );
}

export function QuestionCard({
  question,
  evidence,
  hypotheses,
  notes,
  decisions,
  expanded,
  onToggle,
  onPatch,
  onAddEvidence,
  onAddHypothesis,
  onAddDecision,
  onAddNote,
  onDeleteEvidence,
  onDeleteQuestion,
}: Props) {
  const [draft, setDraft] = useState(question.response);
  const lastSaved = useRef(question.response);

  // Keep the local draft in step when the record changes underneath (another
  // view edited it), without clobbering what is being typed right now.
  useEffect(() => {
    if (question.response !== lastSaved.current) {
      lastSaved.current = question.response;
      setDraft(question.response);
    }
  }, [question.response]);

  const commitResponse = () => {
    const trimmed = draft.trim();
    if (trimmed === question.response.trim()) return;
    lastSaved.current = trimmed;
    // Writing the first answer moves an untouched question into progress —
    // it never jumps straight to validated, which requires evidence.
    const status: QuestionStatus = question.status === 'not_started' && trimmed ? 'in_progress' : question.status;
    onPatch({ response: trimmed, status });
  };

  return (
    <div className="stenner-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
        <span className="mt-0.5 text-zinc-600 shrink-0">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-medium text-zinc-100 leading-snug">{question.text}</span>
          <span className="flex items-center gap-2 mt-2 flex-wrap">
            <QuestionStatusBadge status={question.status} />
            {evidence.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500">
                <FileSearch size={11} /> {evidence.length}
              </span>
            )}
            {hypotheses.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500">
                <FlaskConical size={11} /> {hypotheses.length}
              </span>
            )}
            {decisions.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-violet-400">
                <Gavel size={11} /> {decisions.length}
              </span>
            )}
            {question.response.trim() && <ConfidenceMeter value={question.confidence} showLabel={false} />}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-[var(--color-border-soft)] pt-4">
          {/* Why this question exists */}
          <div className="grid grid-cols-3 gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-soft)]">
            <Meta label="Purpose">{question.purpose || '—'}</Meta>
            <Meta label="How to approach it">{question.guidance || '—'}</Meta>
            <Meta label="Expected evidence">{question.expectedEvidence || '—'}</Meta>
          </div>

          {/* Answer */}
          <div>
            <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1.5">Answer</div>
            <TextArea
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitResponse}
              placeholder="What has the research established? Write the finding, not the intention."
            />
            <div className="flex items-center gap-3 mt-2.5">
              <Select
                value={question.status}
                onChange={(e) => onPatch({ status: e.target.value as QuestionStatus })}
                className="!w-auto !py-1.5 !text-[12px]"
              >
                {QUESTION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Select
                value={question.confidence}
                onChange={(e) => onPatch({ confidence: e.target.value as Confidence })}
                className="!w-auto !py-1.5 !text-[12px]"
              >
                {CONFIDENCE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    Confidence: {c}
                  </option>
                ))}
              </Select>
              {question.status === 'validated' && evidence.length === 0 && (
                <span className="text-[11px] text-amber-400">
                  Validated with no evidence attached — this stays an assumption.
                </span>
              )}
              <button
                onClick={onDeleteQuestion}
                className="ml-auto text-[11.5px] text-zinc-600 hover:text-red-400 transition-colors"
              >
                Delete question
              </button>
            </div>
          </div>

          {/* Attached records */}
          <div className="grid grid-cols-2 gap-4">
            <AttachedList
              icon={FileSearch}
              title="Evidence"
              count={evidence.length}
              onAdd={onAddEvidence}
              addLabel="Add evidence"
              empty="No evidence collected yet."
            >
              {evidence.map((e) => (
                <div key={e.id} className="group px-3 py-2.5 rounded-lg bg-white/[0.03] border border-[var(--color-border-soft)]">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] text-zinc-200 leading-snug">{e.title}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <SourceTypeChip type={e.sourceType} />
                        {e.sourceName && <span className="text-[10.5px] text-zinc-600">{e.sourceName}</span>}
                        <ConfidenceMeter value={e.confidence} showLabel={false} />
                        {e.url && (
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-zinc-600 hover:text-violet-400 transition-colors"
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteEvidence(e.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </AttachedList>

            <AttachedList
              icon={FlaskConical}
              title="Hypotheses"
              count={hypotheses.length}
              onAdd={onAddHypothesis}
              addLabel="Add hypothesis"
              empty="No hypotheses yet."
            >
              {hypotheses.map((h) => (
                <div key={h.id} className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-[var(--color-border-soft)]">
                  <div className="text-[12.5px] text-zinc-200 leading-snug">{h.statement}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <HypothesisStatusBadge status={h.status} />
                    <ConfidenceMeter value={h.confidence} showLabel={false} />
                  </div>
                </div>
              ))}
            </AttachedList>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AttachedList
              icon={Gavel}
              title="Decisions"
              count={decisions.length}
              onAdd={onAddDecision}
              addLabel="Record decision"
              empty="No decision recorded on this question."
            >
              {decisions.map((d) => (
                <div key={d.id} className="px-3 py-2.5 rounded-lg bg-violet-500/[0.07] border border-violet-500/20">
                  <div className="text-[12.5px] text-zinc-100 leading-snug">{d.title}</div>
                  {d.reason && <div className="text-[11.5px] text-zinc-500 mt-1 leading-relaxed">{d.reason}</div>}
                  <div className="text-[10.5px] text-zinc-600 mt-1.5">
                    {d.decidedAt}
                    {d.decidedBy && ` · ${d.decidedBy}`}
                  </div>
                </div>
              ))}
            </AttachedList>

            <AttachedList
              icon={StickyNote}
              title="Notes"
              count={notes.length}
              onAdd={onAddNote}
              addLabel="Capture note"
              empty="No notes yet."
            >
              {notes.map((n) => (
                <div key={n.id} className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-[var(--color-border-soft)]">
                  <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1">{n.type}</div>
                  <div className="text-[12.5px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{n.body}</div>
                </div>
              ))}
            </AttachedList>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachedList({
  icon: Icon,
  title,
  count,
  onAdd,
  addLabel,
  empty,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-zinc-600 uppercase">
          <Icon size={11} />
          {title}
          {count > 0 && <span className="text-zinc-500">({count})</span>}
        </div>
        <Button size="sm" variant="ghost" onClick={onAdd} className="!px-2 !py-1">
          <Plus size={12} /> {addLabel}
        </Button>
      </div>
      {count === 0 ? (
        <div className="px-3 py-3 rounded-lg border border-dashed border-[var(--color-border)] text-[11.5px] text-zinc-600 text-center">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

/** Small helper reused by the strategy view for section headings. */
export const QuestionIcon = Target;
