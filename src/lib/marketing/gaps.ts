// ─────────────────────────────────────────────────────────────────────────
// RESEARCH GAPS — detected, not authored.
//
// A gap is always a statement about a record that exists. There is no
// generic advice in this file and no heuristic that fires on an empty
// workspace: if nothing has been researched, there are no gaps, and the UI
// says "No research gaps identified."
//
// Five kinds, each with a concrete reason and a next action that names what
// to actually do:
//
//   blocked_decision       a decision cannot be made because its question
//                          is not validated yet
//   missing_evidence       a question is explicitly marked needs_evidence,
//                          or answered with nothing backing it
//   unresolved_hypothesis  a hypothesis is open or testing without enough
//                          evidence either way
//   unanswered_question    a question in a started phase has no response
//   uncertain_assumption   an answer exists but confidence is none/low
//
// Priority is structural, not arbitrary: something that blocks a decision
// outranks something that merely lacks backing.
// ─────────────────────────────────────────────────────────────────────────

import type { MarketingWorkspaceData, Priority, ResearchGap } from '../../types/marketing';
import { buildIndex, evidenceCountFor, hasResponse, labelFor, phaseKeyOf, questionPath } from './derive';
import { phaseLabel } from './phaseTemplates';

/** Evidence below this count is treated as unbacked for a validated claim. */
const MIN_EVIDENCE_FOR_CONFIDENCE = 1;

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function detectGaps(data: MarketingWorkspaceData, workspaceId: string): ResearchGap[] {
  const index = buildIndex(data);
  const gaps: ResearchGap[] = [];

  // ── Blocked decisions ────────────────────────────────────────────────
  // A decision attached to a question that is not yet validated or decided
  // is resting on unfinished research.
  for (const decision of data.decisions) {
    if (!decision.questionId) continue;
    const question = index.questionById.get(decision.questionId);
    if (!question) continue;
    if (question.status === 'validated' || question.status === 'decided') continue;

    const phaseKey = phaseKeyOf(index, question.phaseId);
    gaps.push({
      id: `gap-decision-${decision.id}`,
      kind: 'blocked_decision',
      priority: 'high',
      title: decision.title,
      reason: `This decision rests on "${question.text}", which is still ${question.status.replace(/_/g, ' ')}.`,
      nextAction: `Validate the underlying question before relying on this decision.`,
      phaseKey,
      phaseLabel: phaseLabel(phaseKey),
      targetPath: questionPath(workspaceId, phaseKey, question.id),
    });
  }

  // ── Questions that need evidence ─────────────────────────────────────
  for (const question of data.questions) {
    const evidenceCount = evidenceCountFor(index, question.id);
    const phaseKey = phaseKeyOf(index, question.phaseId);

    const explicitlyNeedsEvidence = question.status === 'needs_evidence';
    const answeredButUnbacked = hasResponse(question) && evidenceCount < MIN_EVIDENCE_FOR_CONFIDENCE && question.status !== 'decided';

    if (explicitlyNeedsEvidence || answeredButUnbacked) {
      gaps.push({
        id: `gap-evidence-${question.id}`,
        kind: 'missing_evidence',
        priority: explicitlyNeedsEvidence ? 'high' : 'medium',
        title: question.text,
        reason: explicitlyNeedsEvidence
          ? 'Marked as needing evidence, and none has been attached yet.'
          : 'An answer has been written but nothing backs it, so it cannot be treated as known.',
        nextAction: question.expectedEvidence
          ? `Collect: ${question.expectedEvidence}`
          : 'Attach at least one source that supports this answer.',
        phaseKey,
        phaseLabel: phaseLabel(phaseKey),
        targetPath: questionPath(workspaceId, phaseKey, question.id),
      });
      continue;
    }

    // ── Unanswered questions ───────────────────────────────────────────
    // Only counted inside a phase that has actually been started; an
    // untouched phase is not a gap, it is simply not begun.
    if (!hasResponse(question) && question.status !== 'not_started') {
      gaps.push({
        id: `gap-unanswered-${question.id}`,
        kind: 'unanswered_question',
        priority: 'medium',
        title: question.text,
        reason: 'Work has started on this question but no answer has been recorded.',
        nextAction: question.guidance || 'Record what has been found so far, even if partial.',
        phaseKey,
        phaseLabel: phaseLabel(phaseKey),
        targetPath: questionPath(workspaceId, phaseKey, question.id),
      });
      continue;
    }

    // ── Uncertain assumptions ──────────────────────────────────────────
    if (hasResponse(question) && (question.confidence === 'none' || question.confidence === 'low')) {
      gaps.push({
        id: `gap-uncertain-${question.id}`,
        kind: 'uncertain_assumption',
        priority: 'low',
        title: question.text,
        reason: `Answered, but confidence is ${question.confidence}. It is currently an assumption.`,
        nextAction: 'Either strengthen the evidence or mark it explicitly as a hypothesis.',
        phaseKey,
        phaseLabel: phaseLabel(phaseKey),
        targetPath: questionPath(workspaceId, phaseKey, question.id),
      });
    }
  }

  // ── Unresolved hypotheses ────────────────────────────────────────────
  for (const hypothesis of data.hypotheses) {
    if (hypothesis.status !== 'open' && hypothesis.status !== 'testing') continue;

    const supporting = index.supportingByHypothesis.get(hypothesis.id)?.length ?? 0;
    const contradicting = index.contradictingByHypothesis.get(hypothesis.id)?.length ?? 0;
    const phaseKey = phaseKeyOf(index, hypothesis.phaseId);

    gaps.push({
      id: `gap-hypothesis-${hypothesis.id}`,
      kind: 'unresolved_hypothesis',
      priority: hypothesis.status === 'testing' ? 'high' : 'medium',
      title: hypothesis.statement,
      reason:
        supporting + contradicting === 0
          ? 'No evidence has been attached for or against this hypothesis.'
          : `${supporting} supporting and ${contradicting} contradicting — not yet resolved.`,
      nextAction:
        contradicting > 0 && supporting > 0
          ? 'Resolve the contradiction: determine which sources are more reliable.'
          : 'Attach evidence that would confirm or refute this.',
      phaseKey,
      phaseLabel: labelFor(index, hypothesis.phaseId),
      targetPath: `/marketing/${workspaceId}/hypotheses`,
    });
  }

  return gaps.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export function gapsByPriority(gaps: ResearchGap[]) {
  return {
    high: gaps.filter((g) => g.priority === 'high'),
    medium: gaps.filter((g) => g.priority === 'medium'),
    low: gaps.filter((g) => g.priority === 'low'),
  };
}
