// ─────────────────────────────────────────────────────────────────────────
// HYPOTHESES — grouped by status, each showing its evidence balance.
//
// The supporting/contradicting split is the point of the page: a hypothesis
// with evidence on both sides is not "in progress", it is a contradiction
// that needs resolving, and it should be visible as such.
//
// Evidence is attached to a hypothesis through ml_evidence_links with a
// stance, which is why the same source can support one hypothesis and
// contradict another.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FlaskConical, Link2, Plus, Trash2 } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import type { EvidenceStance, HypothesisStatus, MLHypothesis } from '../../types/marketing';
import { phaseLabel } from '../../lib/marketing/phaseTemplates';
import {
  ConfidenceMeter,
  EmptyState,
  HypothesisStatusBadge,
  SectionHeading,
} from '../../components/marketing/primitives';
import { HypothesisModal } from '../../components/marketing/RecordModals';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Label, Select } from '../../components/common/Fields';

const GROUPS: { status: HypothesisStatus; label: string }[] = [
  { status: 'testing', label: 'Testing' },
  { status: 'open', label: 'Open' },
  { status: 'supported', label: 'Supported' },
  { status: 'validated', label: 'Validated' },
  { status: 'rejected', label: 'Rejected' },
];

export function HypothesesPage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, add, patch, drop } = useMarketingStore();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MLHypothesis | null>(null);
  const [linking, setLinking] = useState<MLHypothesis | null>(null);

  const phaseKeyById = useMemo(() => new Map(data.phases.map((p) => [p.id, p.key])), [data.phases]);

  const linksFor = (hypothesisId: string) =>
    data.evidenceLinks.filter((l) => l.targetType === 'hypothesis' && l.targetId === hypothesisId);

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Hypotheses"
        count={data.hypotheses.length}
        hint="A hypothesis resolves through evidence, never through opinion."
        action={
          <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
            <Plus size={13} /> New hypothesis
          </Button>
        }
      />

      {data.hypotheses.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No hypotheses yet."
          hint="Write down what you believe but have not proved. A hypothesis is only useful if evidence could refute it."
          action={
            <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
              <Plus size={13} /> New hypothesis
            </Button>
          }
        />
      ) : (
        GROUPS.map((group) => {
          const items = data.hypotheses.filter((h) => h.status === group.status);
          if (items.length === 0) return null;
          return (
            <section key={group.status}>
              <div className="flex items-center gap-2 mb-2.5">
                <HypothesisStatusBadge status={group.status} />
                <span className="text-[11px] text-zinc-600">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((h) => {
                  const links = linksFor(h.id);
                  const supporting = links.filter((l) => l.stance === 'supports').length;
                  const contradicting = links.filter((l) => l.stance === 'contradicts').length;
                  const key = h.phaseId ? phaseKeyById.get(h.phaseId) : null;
                  const conflicted = supporting > 0 && contradicting > 0;

                  return (
                    <div key={h.id} className={`stenner-card p-4 group ${conflicted ? 'border-amber-500/25' : ''}`}>
                      <div className="flex items-start gap-3">
                        <p className="flex-1 text-[13.5px] text-zinc-100 leading-snug">{h.statement}</p>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => setEditing(h)} className="text-[11px] text-zinc-600 hover:text-violet-300">
                            Edit
                          </button>
                          <button onClick={() => void drop('hypotheses', h.id)} className="text-zinc-600 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 flex-wrap text-[11.5px]">
                        <span className="text-green-400/90">{supporting} supporting</span>
                        <span className="text-red-400/90">{contradicting} contradicting</span>
                        <ConfidenceMeter value={h.confidence} />
                        {key && <span className="text-zinc-600">{phaseLabel(key)}</span>}
                        <Button size="sm" variant="ghost" className="!px-2 !py-1 ml-auto" onClick={() => setLinking(h)}>
                          <Link2 size={12} /> Link evidence
                        </Button>
                      </div>

                      {conflicted && (
                        <p className="text-[11.5px] text-amber-300/90 mt-2.5">
                          Evidence points both ways — resolve which sources are more reliable before relying on this.
                        </p>
                      )}

                      {h.conclusion && (
                        <p className="text-[12px] text-zinc-400 mt-2.5 pt-2.5 border-t border-[var(--color-border-soft)] leading-relaxed">
                          {h.conclusion}
                        </p>
                      )}

                      {links.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border-soft)] space-y-1.5">
                          {links.map((l) => {
                            const e = data.evidence.find((x) => x.id === l.evidenceId);
                            if (!e) return null;
                            return (
                              <div key={l.id} className="flex items-start gap-2 text-[11.5px]">
                                <span
                                  className={
                                    l.stance === 'supports'
                                      ? 'text-green-400'
                                      : l.stance === 'contradicts'
                                        ? 'text-red-400'
                                        : 'text-zinc-500'
                                  }
                                >
                                  {l.stance === 'supports' ? '+' : l.stance === 'contradicts' ? '−' : '·'}
                                </span>
                                <span className="text-zinc-400 flex-1 line-clamp-1">{e.title}</span>
                                <button
                                  onClick={() => void drop('evidenceLinks', l.id)}
                                  className="text-zinc-700 hover:text-red-400 shrink-0"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {data.hypotheses.length > 0 && (
        <Link to={`/marketing/${workspaceId}/evidence`} className="inline-block text-[12px] text-violet-300 hover:text-violet-200">
          Go to evidence library →
        </Link>
      )}

      <HypothesisModal open={creating} onClose={() => setCreating(false)} onSave={(draft) => void add('hypotheses', draft)} />
      <HypothesisModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        initial={editing ?? undefined}
        onSave={(draft) => {
          if (editing) void patch('hypotheses', editing.id, draft);
        }}
      />
      <LinkEvidenceModal
        hypothesis={linking}
        onClose={() => setLinking(null)}
        onLink={(evidenceId, stance) => {
          if (!linking) return;
          void add('evidenceLinks', { evidenceId, targetType: 'hypothesis', targetId: linking.id, stance });
        }}
      />
    </div>
  );
}

function LinkEvidenceModal({
  hypothesis,
  onClose,
  onLink,
}: {
  hypothesis: MLHypothesis | null;
  onClose: () => void;
  onLink: (evidenceId: string, stance: EvidenceStance) => void;
}) {
  const evidence = useMarketingStore((s) => s.data.evidence);
  const [evidenceId, setEvidenceId] = useState('');
  const [stance, setStance] = useState<EvidenceStance>('supports');

  return (
    <Modal
      open={hypothesis !== null}
      onClose={onClose}
      title="Link evidence to hypothesis"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!evidenceId}
            onClick={() => {
              onLink(evidenceId, stance);
              setEvidenceId('');
              onClose();
            }}
          >
            Link
          </Button>
        </>
      }
    >
      {evidence.length === 0 ? (
        <EmptyState title="No evidence collected yet." hint="Add evidence first, then link it here for or against this hypothesis." />
      ) : (
        <div className="space-y-3.5">
          {hypothesis && <p className="text-[12.5px] text-zinc-400 leading-relaxed">{hypothesis.statement}</p>}
          <div>
            <Label>Evidence</Label>
            <Select value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)}>
              <option value="">Select evidence…</option>
              {evidence.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Stance</Label>
            <Select value={stance} onChange={(e) => setStance(e.target.value as EvidenceStance)}>
              <option value="supports">Supports this hypothesis</option>
              <option value="contradicts">Contradicts this hypothesis</option>
              <option value="context">Context only</option>
            </Select>
          </div>
        </div>
      )}
    </Modal>
  );
}
