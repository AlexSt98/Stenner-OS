// ─────────────────────────────────────────────────────────────────────────
// EVIDENCE LIBRARY — everything collected for this workspace.
//
// Search and filters exist because evidence is only useful if it can be
// found again months later, when writing the Marketing Book and needing the
// source behind a claim.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, FileSearch, Plus, Search, Trash2 } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import type { Confidence, MLEvidence, SourceType } from '../../types/marketing';
import { phaseLabel } from '../../lib/marketing/phaseTemplates';
import {
  ConfidenceMeter,
  EmptyState,
  SectionHeading,
  SOURCE_TYPE_LABELS,
  SourceTypeChip,
} from '../../components/marketing/primitives';
import { EvidenceModal } from '../../components/marketing/RecordModals';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Fields';

export function EvidencePage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, add, patch, drop } = useMarketingStore();

  const [query, setQuery] = useState('');
  const [sourceType, setSourceType] = useState<SourceType | 'all'>('all');
  const [confidence, setConfidence] = useState<Confidence | 'all'>('all');
  const [editing, setEditing] = useState<MLEvidence | null>(null);
  const [creating, setCreating] = useState(false);

  const phaseKeyById = useMemo(() => new Map(data.phases.map((p) => [p.id, p.key])), [data.phases]);
  const questionById = useMemo(() => new Map(data.questions.map((q) => [q.id, q])), [data.questions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.evidence
      .filter((e) => (sourceType === 'all' ? true : e.sourceType === sourceType))
      .filter((e) => (confidence === 'all' ? true : e.confidence === confidence))
      .filter((e) =>
        !q ? true : [e.title, e.description, e.sourceName, e.url].some((field) => field.toLowerCase().includes(q))
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.evidence, query, sourceType, confidence]);

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Evidence"
        count={data.evidence.length}
        hint="Every source collected for this project."
        action={
          <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
            <Plus size={13} /> Add Evidence
          </Button>
        }
      />

      {data.evidence.length > 0 && (
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search evidence, sources, URLs…"
              className="stenner-input w-full pl-8 pr-3 py-2 text-[12.5px] placeholder:text-zinc-600"
            />
          </div>
          <Select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType | 'all')} className="!w-auto !py-2 !text-[12px]">
            <option value="all">All source types</option>
            {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((t) => (
              <option key={t} value={t}>
                {SOURCE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence | 'all')} className="!w-auto !py-2 !text-[12px]">
            <option value="all">Any confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </Select>
        </div>
      )}

      {data.evidence.length === 0 && (
        <EmptyState
          icon={FileSearch}
          title="No evidence collected yet."
          hint="Evidence is what turns an answer into something known. Attach sources as you research, and they will appear here and on the question they back."
          action={
            <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
              <Plus size={13} /> Add Evidence
            </Button>
          }
        />
      )}

      {data.evidence.length > 0 && filtered.length === 0 && (
        <EmptyState title="No evidence matches these filters." hint="Try clearing the search or widening the source type." />
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((e) => {
          const question = e.questionId ? questionById.get(e.questionId) : null;
          const key = e.phaseId ? phaseKeyById.get(e.phaseId) : null;
          return (
            <div key={e.id} className="stenner-card p-4 group">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-zinc-100 leading-snug">{e.title}</div>
                  {e.description && (
                    <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-3">{e.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setEditing(e)} className="text-[11px] text-zinc-600 hover:text-violet-300">
                    Edit
                  </button>
                  <button onClick={() => void drop('evidence', e.id)} className="text-zinc-600 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <SourceTypeChip type={e.sourceType} />
                {e.sourceName && <span className="text-[10.5px] text-zinc-600">{e.sourceName}</span>}
                {e.sourceDate && <span className="text-[10.5px] text-zinc-700">{e.sourceDate}</span>}
                <ConfidenceMeter value={e.confidence} showLabel={false} />
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-zinc-600 hover:text-violet-400 transition-colors"
                    title={e.url}
                  >
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {(question || key) && (
                <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border-soft)]">
                  {question && key ? (
                    <Link
                      to={`/marketing/${workspaceId}/phase/${key}?q=${question.id}`}
                      className="text-[11.5px] text-zinc-500 hover:text-violet-300 transition-colors line-clamp-1"
                    >
                      {phaseLabel(key)} · {question.text}
                    </Link>
                  ) : (
                    key && <span className="text-[11.5px] text-zinc-600">{phaseLabel(key)}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EvidenceModal open={creating} onClose={() => setCreating(false)} onSave={(draft) => void add('evidence', draft)} />
      <EvidenceModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        initial={editing ?? undefined}
        onSave={(draft) => {
          if (editing) void patch('evidence', editing.id, draft);
        }}
      />
    </div>
  );
}
