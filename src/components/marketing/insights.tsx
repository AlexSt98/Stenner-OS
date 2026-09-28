// ─────────────────────────────────────────────────────────────────────────
// Derived-insight components: gaps, next action, know / don't know.
//
// Every one of these renders a computed value. None of them accept a
// hand-written recommendation, and none render a placeholder when there is
// nothing to show — they render the honest empty state instead.
//
// [Start Research] is the point of the gap card: a gap that cannot be acted
// on is just a complaint, so each one carries a targetPath straight to the
// question, hypothesis or decision that would close it.
// ─────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { ArrowRight, CircleHelp, Compass } from 'lucide-react';
import type { KnownItem, NextResearchAction, ResearchGap, UnknownItem } from '../../types/marketing';
import { ClaimKindBadge, EmptyState, PriorityBadge } from './primitives';
import { UNKNOWN_KIND_LABEL } from '../../lib/marketing/knowledge';

const GAP_KIND_LABEL: Record<ResearchGap['kind'], string> = {
  unanswered_question: 'Unanswered question',
  missing_evidence: 'Missing evidence',
  unresolved_hypothesis: 'Unresolved hypothesis',
  blocked_decision: 'Blocked decision',
  uncertain_assumption: 'Uncertain assumption',
};

export function GapCard({ gap }: { gap: ResearchGap }) {
  return (
    <div className="stenner-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge priority={gap.priority} />
        <span className="text-[10.5px] text-zinc-600">{GAP_KIND_LABEL[gap.kind]}</span>
        <span className="text-[10.5px] text-zinc-700">·</span>
        <span className="text-[10.5px] text-zinc-600">{gap.phaseLabel}</span>
      </div>

      <div className="text-[13.5px] font-medium text-zinc-100 leading-snug">{gap.title}</div>

      <div className="mt-2.5 space-y-1.5">
        <div>
          <span className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase">Reason </span>
          <span className="text-[12px] text-zinc-400 leading-relaxed">{gap.reason}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase">Next action </span>
          <span className="text-[12px] text-zinc-400 leading-relaxed">{gap.nextAction}</span>
        </div>
      </div>

      <Link
        to={gap.targetPath}
        className="inline-flex items-center gap-1.5 mt-3.5 px-2.5 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/25 text-violet-300 text-[12px] font-semibold hover:bg-violet-600/25 transition-colors"
      >
        Start Research <ArrowRight size={12} />
      </Link>
    </div>
  );
}

export function NextActionCard({ action }: { action: NextResearchAction | null }) {
  if (!action) {
    return (
      <div className="stenner-card p-4">
        <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-2">Next research action</div>
        <div className="text-[13px] text-zinc-500">No next research action defined.</div>
        <p className="text-[11.5px] text-zinc-600 mt-1.5 leading-relaxed">
          Nothing in this project is currently blocked or missing evidence. Start answering questions in a phase and this
          will populate from real records.
        </p>
      </div>
    );
  }

  return (
    <div className="stenner-card p-4 border-violet-500/25 bg-violet-500/[0.04]">
      <div className="flex items-center gap-2 mb-2">
        <Compass size={13} className="text-violet-400" />
        <span className="text-[10px] font-bold tracking-wide text-violet-300 uppercase">Next research action</span>
        <PriorityBadge priority={action.priority} />
      </div>
      <div className="text-[14px] font-semibold text-zinc-100 leading-snug">{action.title}</div>
      <p className="text-[12px] text-zinc-400 mt-1.5 leading-relaxed">{action.reason}</p>
      <div className="flex items-center gap-2 mt-3">
        <Link
          to={action.targetPath}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-semibold transition-colors"
        >
          Start Research <ArrowRight size={12} />
        </Link>
        <span className="text-[11px] text-zinc-600">{action.phaseLabel}</span>
      </div>
    </div>
  );
}

export function KnownList({ items, limit }: { items: KnownItem[]; limit?: number }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing established yet."
        hint="A finding appears here once it is validated with evidence attached, or once a decision is recorded on it. Writing an answer alone is not enough."
      />
    );
  }

  const shown = limit ? items.slice(0, limit) : items;
  return (
    <div className="space-y-2">
      {shown.map((item) => (
        <Link
          key={item.id}
          to={item.targetPath}
          className="block px-3.5 py-3 rounded-xl bg-white/[0.025] border border-[var(--color-border-soft)] hover:border-[var(--color-border)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <ClaimKindBadge kind={item.kind} />
            <span className="text-[10.5px] text-zinc-600">{item.phaseLabel}</span>
            {item.evidenceCount > 0 && (
              <span className="text-[10.5px] text-zinc-600">
                · {item.evidenceCount} {item.evidenceCount === 1 ? 'source' : 'sources'}
              </span>
            )}
          </div>
          <div className="text-[12.5px] text-zinc-200 leading-relaxed line-clamp-3">{item.statement}</div>
        </Link>
      ))}
      {limit && items.length > limit && (
        <div className="text-[11.5px] text-zinc-600 pt-1">+{items.length - limit} more</div>
      )}
    </div>
  );
}

export function UnknownList({ items, limit }: { items: UnknownItem[]; limit?: number }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={CircleHelp}
        title="Nothing outstanding."
        hint="Unanswered questions, missing evidence and unresolved hypotheses appear here as soon as research begins."
      />
    );
  }

  const shown = limit ? items.slice(0, limit) : items;
  return (
    <div className="space-y-2">
      {shown.map((item) => (
        <Link
          key={item.id}
          to={item.targetPath}
          className="block px-3.5 py-3 rounded-xl bg-white/[0.025] border border-[var(--color-border-soft)] hover:border-[var(--color-border)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold border bg-amber-500/10 text-amber-300/90 border-amber-500/20 whitespace-nowrap">
              {UNKNOWN_KIND_LABEL[item.kind]}
            </span>
            <span className="text-[10.5px] text-zinc-600">{item.phaseLabel}</span>
          </div>
          <div className="text-[12.5px] text-zinc-300 leading-relaxed line-clamp-3">{item.statement}</div>
        </Link>
      ))}
      {limit && items.length > limit && (
        <div className="text-[11.5px] text-zinc-600 pt-1">+{items.length - limit} more</div>
      )}
    </div>
  );
}
