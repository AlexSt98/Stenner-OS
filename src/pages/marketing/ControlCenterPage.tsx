// ─────────────────────────────────────────────────────────────────────────
// RESEARCH CONTROL CENTER
//
// Ordered to answer five questions in sequence, top to bottom:
//
//   1. Where are we?              current phase + progress
//   2. What should I do next?     next research action
//   3. What is blocking us?       research gaps, high priority first
//   4. What do we know?           established findings
//   5. What don't we know?        outstanding questions and assumptions
//
// Counts sit in a single small row because they are the least useful thing
// on the page: knowing there are 38 pieces of evidence tells you nothing
// about whether the research is progressing.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import { allPhaseProgress, currentPhaseKey, overallProgress } from '../../lib/marketing/progress';
import { detectGaps } from '../../lib/marketing/gaps';
import { nextResearchAction } from '../../lib/marketing/nextAction';
import { whatWeDontKnow, whatWeKnow } from '../../lib/marketing/knowledge';
import { PHASE_TEMPLATES, phaseLabel } from '../../lib/marketing/phaseTemplates';
import { EmptyState, ProgressRing, SectionHeading, StatTile } from '../../components/marketing/primitives';
import { GapCard, KnownList, NextActionCard, UnknownList } from '../../components/marketing/insights';

export function ControlCenterPage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const data = useMarketingStore((s) => s.data);

  const view = useMemo(() => {
    const gaps = detectGaps(data, workspaceId);
    return {
      gaps,
      overall: overallProgress(data),
      phases: allPhaseProgress(data),
      phaseKey: currentPhaseKey(data),
      next: nextResearchAction(data, gaps, workspaceId),
      known: whatWeKnow(data, workspaceId),
      unknown: whatWeDontKnow(data, workspaceId),
      openHypotheses: data.hypotheses.filter((h) => h.status === 'open' || h.status === 'testing').length,
      blockedDecisions: gaps.filter((g) => g.kind === 'blocked_decision').length,
    };
  }, [data, workspaceId]);

  const started = view.overall.percent > 0 || data.evidence.length > 0 || data.decisions.length > 0;
  const currentPhase = view.phaseKey ? PHASE_TEMPLATES.find((p) => p.key === view.phaseKey) : null;

  return (
    <div className="space-y-6">
      {/* 1 — Where are we? */}
      <div className="stenner-card p-5 flex items-center gap-6">
        <ProgressRing percent={view.overall.percent} label="researched" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase">Current phase</div>
          {currentPhase ? (
            <>
              <Link
                to={`/marketing/${workspaceId}/phase/${currentPhase.key}`}
                className="inline-flex items-center gap-2 text-[18px] font-bold hover:text-violet-300 transition-colors"
              >
                <span className="text-[12px] font-mono text-zinc-600">{currentPhase.code}</span>
                {currentPhase.label}
                <ArrowRight size={15} className="text-zinc-600" />
              </Link>
              <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed max-w-2xl">{currentPhase.objective}</p>
            </>
          ) : (
            <>
              <div className="text-[16px] font-bold text-zinc-400 mt-0.5">No research data yet</div>
              <p className="text-[12px] text-zinc-600 mt-1 leading-relaxed max-w-2xl">
                {data.questions.length} questions across 14 phases are ready. Open a phase and answer one to begin.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 2 — What should I do next? */}
      <NextActionCard action={view.next} />

      {/* Counts, deliberately secondary */}
      <div className="grid grid-cols-5 gap-3">
        <StatTile label="Evidence" value={data.evidence.length} />
        <StatTile label="Open hypotheses" value={view.openHypotheses} tone={view.openHypotheses > 0 ? 'warn' : 'default'} />
        <StatTile label="Decisions" value={data.decisions.length} />
        <StatTile label="Research gaps" value={view.gaps.length} tone={view.gaps.length > 0 ? 'warn' : 'default'} />
        <StatTile label="Blocked decisions" value={view.blockedDecisions} tone={view.blockedDecisions > 0 ? 'warn' : 'default'} />
      </div>

      {/* 3 — What is blocking us? */}
      <section>
        <SectionHeading
          title="Research gaps"
          count={view.gaps.length}
          hint="Detected from your records — never generic advice."
          action={
            view.gaps.length > 3 ? (
              <Link to={`/marketing/${workspaceId}/gaps`} className="text-[12px] text-violet-300 hover:text-violet-200">
                View all {view.gaps.length} →
              </Link>
            ) : undefined
          }
        />
        {view.gaps.length === 0 ? (
          <EmptyState
            title="No research gaps identified."
            hint={
              started
                ? 'Nothing is currently unanswered, unbacked or blocked.'
                : 'Gaps appear as soon as you start answering questions — they are derived from real records, so an untouched project has none.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {view.gaps.slice(0, 4).map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        )}
      </section>

      {/* 4 & 5 — What do we know / not know? */}
      <div className="grid grid-cols-2 gap-5">
        <section>
          <SectionHeading
            title="What we know"
            count={view.known.length}
            hint="Validated with evidence, or decided."
            action={
              <Link to={`/marketing/${workspaceId}/knowledge`} className="text-[12px] text-violet-300 hover:text-violet-200">
                Open →
              </Link>
            }
          />
          <KnownList items={view.known} limit={4} />
        </section>

        <section>
          <SectionHeading
            title="What we don't know"
            count={view.unknown.length}
            hint="Unanswered, unbacked, unresolved or blocked."
            action={
              <Link to={`/marketing/${workspaceId}/knowledge`} className="text-[12px] text-violet-300 hover:text-violet-200">
                Open →
              </Link>
            }
          />
          <UnknownList items={view.unknown} limit={4} />
        </section>
      </div>

      {/* Phase overview */}
      <section>
        <SectionHeading title="Phases" hint="Progress counts validated and decided questions only." />
        <div className="grid grid-cols-2 gap-2.5">
          {PHASE_TEMPLATES.map((template) => {
            const progress = view.phases.find((p) => p.phaseKey === template.key);
            const percent = progress?.percent ?? 0;
            return (
              <Link
                key={template.key}
                to={`/marketing/${workspaceId}/phase/${template.key}`}
                className="stenner-card stenner-card-hover px-3.5 py-3 flex items-center gap-3"
              >
                <span className="text-[10.5px] font-mono text-zinc-600 w-5 shrink-0">{template.code}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium truncate">{template.label}</span>
                  <span className="flex items-center gap-2 mt-1.5">
                    <span className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-violet-500 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="text-[10.5px] text-zinc-600 tabular-nums w-8 text-right">
                      {progress && progress.total > 0 ? `${percent}%` : '—'}
                    </span>
                  </span>
                </span>
                <Layers size={13} className="text-zinc-700 shrink-0" />
              </Link>
            );
          })}
        </div>
        {view.phaseKey === null && (
          <p className="text-[11.5px] text-zinc-600 mt-3">
            Showing the framework for {phaseLabel('foundation')} through {phaseLabel('roadmap')}. No findings recorded yet.
          </p>
        )}
      </section>
    </div>
  );
}
