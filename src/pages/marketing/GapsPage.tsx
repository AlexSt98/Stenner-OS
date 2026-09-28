// ─────────────────────────────────────────────────────────────────────────
// RESEARCH GAPS + RESEARCH QUEUE
//
// Two lists that answer different questions:
//
//   Gaps   what the records say is missing — derived, never authored, and
//          recomputed on every change so it cannot go stale
//   Queue  what you have decided to research next — authored, and allowed
//          to contain things the data cannot know about
//
// A gap can be promoted into the queue, which is how a detected problem
// becomes a committed piece of work.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ListPlus, Plus, Trash2 } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import { detectGaps, gapsByPriority } from '../../lib/marketing/gaps';
import type { MLQueueItem, Priority, ResearchGap } from '../../types/marketing';
import { EmptyState, PriorityBadge, SectionHeading } from '../../components/marketing/primitives';
import { GapCard } from '../../components/marketing/insights';
import { QueueItemModal } from '../../components/marketing/RecordModals';
import { Button } from '../../components/common/Button';

const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low'];

export function GapsPage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, add, patch, drop } = useMarketingStore();
  const [queueing, setQueueing] = useState(false);

  const gaps = useMemo(() => detectGaps(data, workspaceId), [data, workspaceId]);
  const grouped = useMemo(() => gapsByPriority(gaps), [gaps]);

  const promote = (gap: ResearchGap) =>
    void add('queue', {
      title: gap.nextAction,
      reason: `${gap.reason} (${gap.title})`,
      priority: gap.priority,
      status: 'todo',
      origin: 'derived',
      phaseId: data.phases.find((p) => p.key === gap.phaseKey)?.id ?? null,
    });

  const queueByPriority = (priority: Priority) =>
    data.queue.filter((q) => q.priority === priority && q.status !== 'done');
  const done = data.queue.filter((q) => q.status === 'done');

  return (
    <div className="space-y-7">
      <section>
        <SectionHeading
          title="Research gaps"
          count={gaps.length}
          hint="Detected automatically from questions, evidence, hypotheses and decisions."
        />

        {gaps.length === 0 ? (
          <EmptyState
            title="No research gaps identified."
            hint="Gaps are derived from your records: unanswered questions, answers with nothing backing them, unresolved hypotheses and decisions running ahead of their research."
          />
        ) : (
          <div className="space-y-5">
            {PRIORITY_ORDER.map((priority) => {
              const items = grouped[priority];
              if (items.length === 0) return null;
              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <PriorityBadge priority={priority} />
                    <span className="text-[11px] text-zinc-600">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((gap) => (
                      <div key={gap.id} className="relative">
                        <GapCard gap={gap} />
                        <button
                          onClick={() => promote(gap)}
                          title="Add to research queue"
                          className="absolute top-3.5 right-3.5 text-zinc-700 hover:text-violet-300 transition-colors"
                        >
                          <ListPlus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Research queue"
          count={data.queue.filter((q) => q.status !== 'done').length}
          hint="What you have committed to research next."
          action={
            <Button size="sm" variant="primary" onClick={() => setQueueing(true)}>
              <Plus size={13} /> Queue research
            </Button>
          }
        />

        {data.queue.length === 0 ? (
          <EmptyState
            title="Research queue is empty."
            hint="Queue what you intend to investigate next, or promote a gap above into the queue."
            action={
              <Button size="sm" variant="primary" onClick={() => setQueueing(true)}>
                <Plus size={13} /> Queue research
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {PRIORITY_ORDER.map((priority) => {
              const items = queueByPriority(priority);
              if (items.length === 0) return null;
              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-2">
                    <PriorityBadge priority={priority} />
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <QueueRow key={item.id} item={item} onPatch={(p) => void patch('queue', item.id, p)} onDrop={() => void drop('queue', item.id)} />
                    ))}
                  </div>
                </div>
              );
            })}

            {done.length > 0 && (
              <details className="pt-1">
                <summary className="text-[11.5px] text-zinc-600 cursor-pointer hover:text-zinc-400">
                  {done.length} completed
                </summary>
                <div className="space-y-2 mt-2">
                  {done.map((item) => (
                    <QueueRow key={item.id} item={item} onPatch={(p) => void patch('queue', item.id, p)} onDrop={() => void drop('queue', item.id)} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </section>

      <QueueItemModal open={queueing} onClose={() => setQueueing(false)} onSave={(draft) => void add('queue', draft)} />
    </div>
  );
}

function QueueRow({
  item,
  onPatch,
  onDrop,
}: {
  item: MLQueueItem;
  onPatch: (patch: Partial<MLQueueItem>) => void;
  onDrop: () => void;
}) {
  const complete = item.status === 'done';
  return (
    <div className={`stenner-card px-4 py-3 flex items-start gap-3 group ${complete ? 'opacity-55' : ''}`}>
      <button
        onClick={() => onPatch({ status: complete ? 'todo' : 'done' })}
        className={`mt-0.5 shrink-0 transition-colors ${complete ? 'text-green-400' : 'text-zinc-700 hover:text-zinc-400'}`}
      >
        <CheckCircle2 size={15} />
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-medium leading-snug ${complete ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
          {item.title}
        </div>
        {item.reason && <p className="text-[11.5px] text-zinc-500 mt-1 leading-relaxed">{item.reason}</p>}
        {item.origin === 'derived' && <span className="text-[10px] text-zinc-700 mt-1 inline-block">from a detected gap</span>}
      </div>
      <button onClick={onDrop} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0">
        <Trash2 size={12} />
      </button>
    </div>
  );
}
