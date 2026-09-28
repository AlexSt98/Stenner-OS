// ─────────────────────────────────────────────────────────────────────────
// WHAT WE KNOW / WHAT WE DON'T KNOW
//
// The bar for "known" is deliberately high. Writing a response NEVER makes
// something known — that is the single rule that keeps this tool honest and
// separates it from a notes app. A statement reaches WHAT WE KNOW only if:
//
//   · a decision was recorded on it (status `decided`), or
//   · it is marked `validated` AND at least one piece of evidence backs it,
//     or
//   · it is a hypothesis that reached `validated` / `supported` with
//     supporting evidence and nothing contradicting it.
//
// A question marked validated with no evidence attached does NOT qualify.
// It lands in WHAT WE DON'T KNOW as an uncertain assumption, because the
// claim outruns its backing.
//
// Everything else the researcher has touched is an unknown, classified so
// the next move is obvious.
// ─────────────────────────────────────────────────────────────────────────

import type { KnownItem, MarketingWorkspaceData, UnknownItem } from '../../types/marketing';
import { buildIndex, evidenceCountFor, hasResponse, phaseKeyOf, questionPath } from './derive';
import { phaseLabel } from './phaseTemplates';

export function whatWeKnow(data: MarketingWorkspaceData, workspaceId: string): KnownItem[] {
  const index = buildIndex(data);
  const known: KnownItem[] = [];

  for (const question of data.questions) {
    if (!hasResponse(question)) continue;

    const evidenceCount = evidenceCountFor(index, question.id);
    const phaseKey = phaseKeyOf(index, question.phaseId);
    const isDecided = question.status === 'decided';
    const isValidatedAndBacked = question.status === 'validated' && evidenceCount > 0;

    if (!isDecided && !isValidatedAndBacked) continue;

    known.push({
      id: `known-q-${question.id}`,
      // A decided question is a decision; a validated one is an established fact.
      kind: isDecided ? 'decision' : 'fact',
      statement: question.response.trim(),
      phaseKey,
      phaseLabel: phaseLabel(phaseKey),
      evidenceCount,
      confidence: question.confidence,
      targetPath: questionPath(workspaceId, phaseKey, question.id),
    });
  }

  // Hypotheses that survived testing become inferences, never bare facts —
  // the distinction is carried through into the Marketing Book.
  for (const hypothesis of data.hypotheses) {
    if (hypothesis.status !== 'validated' && hypothesis.status !== 'supported') continue;

    const supporting = index.supportingByHypothesis.get(hypothesis.id)?.length ?? 0;
    const contradicting = index.contradictingByHypothesis.get(hypothesis.id)?.length ?? 0;
    if (supporting === 0 || contradicting > 0) continue;

    const phaseKey = phaseKeyOf(index, hypothesis.phaseId);
    known.push({
      id: `known-h-${hypothesis.id}`,
      kind: 'inference',
      statement: hypothesis.conclusion.trim() || hypothesis.statement,
      phaseKey,
      phaseLabel: phaseLabel(phaseKey),
      evidenceCount: supporting,
      confidence: hypothesis.confidence,
      targetPath: `/marketing/${workspaceId}/hypotheses`,
    });
  }

  for (const decision of data.decisions) {
    const phaseKey = phaseKeyOf(index, decision.phaseId);
    known.push({
      id: `known-d-${decision.id}`,
      kind: 'decision',
      statement: decision.title,
      phaseKey,
      phaseLabel: phaseLabel(phaseKey),
      evidenceCount: data.evidenceLinks.filter((l) => l.targetType === 'decision' && l.targetId === decision.id).length,
      confidence: 'high',
      targetPath: `/marketing/${workspaceId}/decisions`,
    });
  }

  return known;
}

export function whatWeDontKnow(data: MarketingWorkspaceData, workspaceId: string): UnknownItem[] {
  const index = buildIndex(data);
  const unknown: UnknownItem[] = [];

  for (const question of data.questions) {
    const phaseKey = phaseKeyOf(index, question.phaseId);
    const evidenceCount = evidenceCountFor(index, question.id);
    const base = { phaseKey, phaseLabel: phaseLabel(phaseKey), targetPath: questionPath(workspaceId, phaseKey, question.id) };

    if (!hasResponse(question)) {
      // An untouched question is not yet an unknown — it is simply not begun.
      if (question.status === 'not_started') continue;
      unknown.push({ id: `unk-q-${question.id}`, kind: 'unanswered_question', statement: question.text, ...base });
      continue;
    }

    if (question.status === 'needs_evidence' || (evidenceCount === 0 && question.status !== 'decided')) {
      unknown.push({ id: `unk-e-${question.id}`, kind: 'missing_evidence', statement: question.text, ...base });
      continue;
    }

    if (question.confidence === 'none' || question.confidence === 'low') {
      unknown.push({ id: `unk-a-${question.id}`, kind: 'uncertain_assumption', statement: question.response.trim(), ...base });
    }
  }

  for (const hypothesis of data.hypotheses) {
    if (hypothesis.status !== 'open' && hypothesis.status !== 'testing') continue;
    const phaseKey = phaseKeyOf(index, hypothesis.phaseId);
    unknown.push({
      id: `unk-h-${hypothesis.id}`,
      kind: 'unresolved_hypothesis',
      statement: hypothesis.statement,
      phaseKey,
      phaseLabel: phaseLabel(phaseKey),
      targetPath: `/marketing/${workspaceId}/hypotheses`,
    });
  }

  for (const decision of data.decisions) {
    if (!decision.questionId) continue;
    const question = index.questionById.get(decision.questionId);
    if (!question || question.status === 'validated' || question.status === 'decided') continue;
    const phaseKey = phaseKeyOf(index, decision.phaseId);
    unknown.push({
      id: `unk-d-${decision.id}`,
      kind: 'blocked_decision',
      statement: decision.title,
      phaseKey,
      phaseLabel: phaseLabel(phaseKey),
      targetPath: `/marketing/${workspaceId}/decisions`,
    });
  }

  return unknown;
}

export const UNKNOWN_KIND_LABEL: Record<UnknownItem['kind'], string> = {
  unanswered_question: 'Unanswered question',
  missing_evidence: 'Missing evidence',
  unresolved_hypothesis: 'Unresolved hypothesis',
  uncertain_assumption: 'Uncertain assumption',
  blocked_decision: 'Blocked decision',
};
