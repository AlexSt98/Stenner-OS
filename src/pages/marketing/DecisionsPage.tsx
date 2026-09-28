// ─────────────────────────────────────────────────────────────────────────
// DECISION LOG — why the strategy is what it is.
//
// A chronological record, newest first, each entry carrying its reasoning
// and its impact. The point is retrospective: in six months it should be
// possible to reconstruct why a conclusion was reached, and to notice when
// the evidence behind it has since changed.
//
// A decision whose underlying question is not yet validated is flagged
// here rather than hidden — it is also picked up as a blocked_decision gap.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Gavel, Plus, Trash2 } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import type { MLDecision } from '../../types/marketing';
import { phaseLabel } from '../../lib/marketing/phaseTemplates';
import { EmptyState, SectionHeading } from '../../components/marketing/primitives';
import { DecisionModal } from '../../components/marketing/RecordModals';
import { Button } from '../../components/common/Button';

export function DecisionsPage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, add, patch, drop } = useMarketingStore();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MLDecision | null>(null);

  const phaseKeyById = useMemo(() => new Map(data.phases.map((p) => [p.id, p.key])), [data.phases]);
  const questionById = useMemo(() => new Map(data.questions.map((q) => [q.id, q])), [data.questions]);

  const ordered = useMemo(
    () => [...data.decisions].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)),
    [data.decisions]
  );

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Decision log"
        count={data.decisions.length}
        hint="Each decision keeps its reasoning, so it stays auditable later."
        action={
          <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
            <Plus size={13} /> Record decision
          </Button>
        }
      />

      {ordered.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No decisions recorded yet."
          hint="Record a decision when research has settled a question. Capturing the reasoning is what lets you revisit it when the evidence changes."
          action={
            <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
              <Plus size={13} /> Record decision
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {ordered.map((d) => {
            const question = d.questionId ? questionById.get(d.questionId) : null;
            const key = d.phaseId ? phaseKeyById.get(d.phaseId) : null;
            const unsupported = question && question.status !== 'validated' && question.status !== 'decided';

            return (
              <div key={d.id} className="stenner-card p-4 group">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Gavel size={13} className="text-violet-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-zinc-100 leading-snug">{d.title}</div>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">
                      <span>{d.decidedAt}</span>
                      {d.decidedBy && <span>· {d.decidedBy}</span>}
                      {key && <span>· {phaseLabel(key)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setEditing(d)} className="text-[11px] text-zinc-600 hover:text-violet-300">
                      Edit
                    </button>
                    <button onClick={() => void drop('decisions', d.id)} className="text-zinc-600 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {d.reason && (
                  <div className="mt-3 pl-10">
                    <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1">Reason</div>
                    <p className="text-[12.5px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{d.reason}</p>
                  </div>
                )}

                {d.impact && (
                  <div className="mt-2.5 pl-10">
                    <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1">Impact</div>
                    <p className="text-[12.5px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{d.impact}</p>
                  </div>
                )}

                {question && key && (
                  <div className="mt-3 pl-10">
                    <Link
                      to={`/marketing/${workspaceId}/phase/${key}?q=${question.id}`}
                      className="text-[11.5px] text-zinc-500 hover:text-violet-300 transition-colors line-clamp-1"
                    >
                      Based on: {question.text}
                    </Link>
                  </div>
                )}

                {unsupported && (
                  <div className="mt-3 ml-10 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.07] border border-amber-500/20">
                    <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11.5px] text-amber-200/80 leading-relaxed">
                      The question behind this decision is still {question.status.replace(/_/g, ' ')}. This decision is
                      running ahead of its research.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DecisionModal open={creating} onClose={() => setCreating(false)} onSave={(draft) => void add('decisions', draft)} />
      <DecisionModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        initial={editing ?? undefined}
        onSave={(draft) => {
          if (editing) void patch('decisions', editing.id, draft);
        }}
      />
    </div>
  );
}
