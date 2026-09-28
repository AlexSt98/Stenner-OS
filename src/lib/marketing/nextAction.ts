// ─────────────────────────────────────────────────────────────────────────
// NEXT RESEARCH ACTION
//
// Picks the single most consequential thing to do next, strictly from real
// records, in the priority order:
//
//   1. questions that block decisions
//   2. hypotheses that need validation
//   3. questions that need evidence
//   4. high-priority gaps
//
// A manually queued HIGH item outranks all of it — an explicit instruction
// from the researcher beats a derived one.
//
// If nothing qualifies, this returns null and the UI prints
// "No next research action defined." It never manufactures a recommendation
// to fill the space.
// ─────────────────────────────────────────────────────────────────────────

import type { MarketingWorkspaceData, NextResearchAction, ResearchGap } from '../../types/marketing';
import { phaseLabel } from './phaseTemplates';
import { PHASE_BY_KEY } from './phaseTemplates';

/** Order in which gap kinds are considered. Mirrors the rule above. */
const KIND_RANK: Record<ResearchGap['kind'], number> = {
  blocked_decision: 0,
  unresolved_hypothesis: 1,
  missing_evidence: 2,
  unanswered_question: 3,
  uncertain_assumption: 4,
};

export function nextResearchAction(
  data: MarketingWorkspaceData,
  gaps: ResearchGap[],
  workspaceId: string
): NextResearchAction | null {
  // An explicit HIGH item in the research queue wins outright.
  const queued = data.queue
    .filter((item) => item.status !== 'done' && item.priority === 'high')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

  if (queued) {
    const key = (queued.phaseId && data.phases.find((p) => p.id === queued.phaseId)?.key) || 'foundation';
    return {
      title: queued.title,
      reason: queued.reason || 'Queued as high priority.',
      phaseKey: key,
      phaseLabel: phaseLabel(key),
      priority: 'high',
      targetPath: `/marketing/${workspaceId}/gaps`,
    };
  }

  if (gaps.length === 0) return null;

  // Rank by kind first, then by the gap's own priority, then by phase order
  // so earlier phases get unblocked before later ones.
  const ranked = [...gaps].sort((a, b) => {
    const byKind = KIND_RANK[a.kind] - KIND_RANK[b.kind];
    if (byKind !== 0) return byKind;
    const byPriority = (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) - (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2);
    if (byPriority !== 0) return byPriority;
    return (PHASE_BY_KEY.get(a.phaseKey)?.order ?? 99) - (PHASE_BY_KEY.get(b.phaseKey)?.order ?? 99);
  });

  const top = ranked[0];
  return {
    title: top.nextAction,
    reason: `${top.reason} — ${top.title}`,
    phaseKey: top.phaseKey,
    phaseLabel: top.phaseLabel,
    priority: top.priority,
    targetPath: top.targetPath,
  };
}
