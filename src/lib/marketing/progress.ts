// ─────────────────────────────────────────────────────────────────────────
// Research progress — computed, never stored.
//
// Progress is a function of question status, nothing else. Writing a
// response moves a question to `in_progress` but does not make it progress:
// only `validated` and `decided` count as finished, because only those two
// mean evidence or a decision backs the answer.
//
// A phase with no questions reports 0% and, crucially, reports `total: 0`
// so the UI can say "No research data yet" instead of rendering a
// meaningless 0% bar.
// ─────────────────────────────────────────────────────────────────────────

import type { MarketingWorkspaceData, MLQuestion, PhaseProgress, PhaseKey } from '../../types/marketing';
import { PHASE_TEMPLATES } from './phaseTemplates';

/** Weight per status. Partial credit for work genuinely under way. */
const STATUS_WEIGHT: Record<MLQuestion['status'], number> = {
  not_started: 0,
  in_progress: 0.35,
  needs_evidence: 0.5,
  validated: 1,
  decided: 1,
};

export function phaseProgress(questions: MLQuestion[], phaseKey: PhaseKey): PhaseProgress {
  const total = questions.length;
  const tally = (s: MLQuestion['status']) => questions.filter((q) => q.status === s).length;

  const percent =
    total === 0 ? 0 : Math.round((questions.reduce((sum, q) => sum + STATUS_WEIGHT[q.status], 0) / total) * 100);

  return {
    phaseKey,
    percent,
    total,
    answered: questions.filter((q) => q.response.trim().length > 0).length,
    validated: tally('validated'),
    decided: tally('decided'),
    needsEvidence: tally('needs_evidence'),
    notStarted: tally('not_started'),
  };
}

/** Progress for all 14 phases, in template order. */
export function allPhaseProgress(data: MarketingWorkspaceData): PhaseProgress[] {
  const byPhaseId = new Map<string, MLQuestion[]>();
  for (const q of data.questions) {
    const list = byPhaseId.get(q.phaseId) ?? [];
    list.push(q);
    byPhaseId.set(q.phaseId, list);
  }

  return PHASE_TEMPLATES.map((template) => {
    const phase = data.phases.find((p) => p.key === template.key);
    const questions = phase ? byPhaseId.get(phase.id) ?? [] : [];
    return phaseProgress(questions, template.key);
  });
}

/**
 * Overall progress across the workspace. Averaged over questions rather than
 * over phases, so a phase with 12 questions is not worth the same as one
 * with 2.
 */
export function overallProgress(data: MarketingWorkspaceData) {
  const total = data.questions.length;
  if (total === 0) return { percent: 0, total: 0 };
  const sum = data.questions.reduce((acc, q) => acc + STATUS_WEIGHT[q.status], 0);
  return { percent: Math.round((sum / total) * 100), total };
}

/**
 * The phase the researcher is currently working in: the first one that is
 * started but unfinished. Falls back to the first unfinished phase, and to
 * the last phase when everything is done. Returns null on an untouched
 * workspace, so the UI shows an empty state rather than guessing.
 */
export function currentPhaseKey(data: MarketingWorkspaceData): PhaseKey | null {
  if (data.questions.length === 0) return null;
  const progress = allPhaseProgress(data);
  const inFlight = progress.find((p) => p.total > 0 && p.percent > 0 && p.percent < 100);
  if (inFlight) return inFlight.phaseKey;
  const untouched = progress.find((p) => p.total > 0 && p.percent === 0);
  if (untouched) return untouched.phaseKey;
  return progress.filter((p) => p.total > 0).at(-1)?.phaseKey ?? null;
}
