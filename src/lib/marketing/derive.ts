// ─────────────────────────────────────────────────────────────────────────
// Shared indexing for the derived views.
//
// Research gaps, progress, what-we-know / what-we-don't-know and the next
// research action are all computed from the same scan of a workspace's
// records. This module builds the lookups they share once, so the four
// derivations stay consistent with each other by construction — they cannot
// disagree about how many pieces of evidence a question has.
//
// Nothing here is persisted. Nothing here invents a value: every number
// comes from a record the researcher created.
// ─────────────────────────────────────────────────────────────────────────

import type {
  MarketingWorkspaceData,
  MLEvidence,
  MLPhase,
  MLQuestion,
  PhaseKey,
} from '../../types/marketing';
import { phaseLabel } from './phaseTemplates';

export interface WorkspaceIndex {
  /** phaseId → phase */
  phaseById: Map<string, MLPhase>;
  /** questionId → its evidence */
  evidenceByQuestion: Map<string, MLEvidence[]>;
  /** hypothesisId → evidence linked with stance 'supports' */
  supportingByHypothesis: Map<string, string[]>;
  /** hypothesisId → evidence linked with stance 'contradicts' */
  contradictingByHypothesis: Map<string, string[]>;
  /** questionId → true when a decision references it */
  decidedQuestionIds: Set<string>;
  questionById: Map<string, MLQuestion>;
}

export function buildIndex(data: MarketingWorkspaceData): WorkspaceIndex {
  const phaseById = new Map(data.phases.map((p) => [p.id, p]));
  const questionById = new Map(data.questions.map((q) => [q.id, q]));

  const evidenceByQuestion = new Map<string, MLEvidence[]>();
  for (const e of data.evidence) {
    if (!e.questionId) continue;
    const list = evidenceByQuestion.get(e.questionId) ?? [];
    list.push(e);
    evidenceByQuestion.set(e.questionId, list);
  }

  const supportingByHypothesis = new Map<string, string[]>();
  const contradictingByHypothesis = new Map<string, string[]>();
  for (const link of data.evidenceLinks) {
    if (link.targetType !== 'hypothesis') continue;
    const bucket = link.stance === 'supports' ? supportingByHypothesis : link.stance === 'contradicts' ? contradictingByHypothesis : null;
    if (!bucket) continue;
    const list = bucket.get(link.targetId) ?? [];
    list.push(link.evidenceId);
    bucket.set(link.targetId, list);
  }

  const decidedQuestionIds = new Set<string>();
  for (const d of data.decisions) {
    if (d.questionId) decidedQuestionIds.add(d.questionId);
  }

  return { phaseById, questionById, evidenceByQuestion, supportingByHypothesis, contradictingByHypothesis, decidedQuestionIds };
}

/** Resolve a record's phase key, falling back to foundation when unattached. */
export function phaseKeyOf(index: WorkspaceIndex, phaseId: string | null): PhaseKey {
  return (phaseId && index.phaseById.get(phaseId)?.key) || 'foundation';
}

export function labelFor(index: WorkspaceIndex, phaseId: string | null) {
  return phaseLabel(phaseKeyOf(index, phaseId));
}

export function evidenceCountFor(index: WorkspaceIndex, questionId: string) {
  return index.evidenceByQuestion.get(questionId)?.length ?? 0;
}

/** A question counts as answered once a response has actually been written. */
export function hasResponse(q: MLQuestion) {
  return q.response.trim().length > 0;
}

/** Deep link into the phase workbench, focused on one question. */
export function questionPath(workspaceId: string, phaseKey: PhaseKey, questionId?: string) {
  const base = `/marketing/${workspaceId}/phase/${phaseKey}`;
  return questionId ? `${base}?q=${questionId}` : base;
}
