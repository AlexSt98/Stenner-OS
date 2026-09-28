// ─────────────────────────────────────────────────────────────────────────
// EXPORT — JSON, XLSX and print-to-PDF.
//
// XLSX reuses the `xlsx` package already in the project (it was only used
// server-side, in NEXUS's file extraction). No new dependency was added.
//
// PDF goes through the browser's own print pipeline against a dedicated
// stylesheet, which keeps typography and page breaks under our control
// without pulling in a PDF renderer. DOCX is deliberately not implemented
// yet — it needs a new dependency and was deferred.
//
// The JSON export is the complete, round-trippable record: every collection,
// with ids intact, so the research can be re-imported or diffed.
// ─────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { MarketingWorkspaceData, MLWorkspace } from '../../types/marketing';
import { PHASE_TEMPLATES, phaseLabel } from './phaseTemplates';
import { detectGaps } from './gaps';
import { whatWeDontKnow, whatWeKnow } from './knowledge';
import { allPhaseProgress, overallProgress } from './progress';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);
const safe = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Full research record, structure preserved. */
export function exportJson(workspace: MLWorkspace, data: MarketingWorkspaceData) {
  const payload = {
    exportedAt: new Date().toISOString(),
    workspace,
    // Derived views are included for convenience but clearly marked, so a
    // re-import knows not to treat them as source records.
    derived: {
      progress: overallProgress(data),
      phaseProgress: allPhaseProgress(data),
      gaps: detectGaps(data, workspace.id),
      whatWeKnow: whatWeKnow(data, workspace.id),
      whatWeDontKnow: whatWeDontKnow(data, workspace.id),
    },
    records: data,
  };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${safe(workspace.name)}-research-${stamp()}.json`);
}

/** One sheet per entity, plus a summary sheet. */
export function exportXlsx(workspace: MLWorkspace, data: MarketingWorkspaceData) {
  const book = XLSX.utils.book_new();
  const phaseName = (phaseId: string | null) => {
    const phase = data.phases.find((p) => p.id === phaseId);
    return phase ? phaseLabel(phase.key) : '';
  };
  const questionText = (id: string | null) => data.questions.find((q) => q.id === id)?.text ?? '';

  const progress = allPhaseProgress(data);
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      PHASE_TEMPLATES.map((t) => {
        const p = progress.find((x) => x.phaseKey === t.key);
        return {
          Phase: `${t.code} ${t.label}`,
          Objective: t.objective,
          Progress: p && p.total > 0 ? `${p.percent}%` : 'No data',
          Questions: p?.total ?? 0,
          Answered: p?.answered ?? 0,
          Validated: p?.validated ?? 0,
          Decided: p?.decided ?? 0,
        };
      })
    ),
    'Phases'
  );

  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      data.questions.map((q) => ({
        Phase: phaseName(q.phaseId),
        Question: q.text,
        Purpose: q.purpose,
        'Expected evidence': q.expectedEvidence,
        Answer: q.response,
        Status: q.status,
        Confidence: q.confidence,
        Evidence: data.evidence.filter((e) => e.questionId === q.id).length,
      }))
    ),
    'Questions'
  );

  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      data.evidence.map((e) => ({
        Title: e.title,
        Description: e.description,
        Source: e.sourceName,
        'Source type': e.sourceType,
        URL: e.url,
        Date: e.sourceDate ?? '',
        Confidence: e.confidence,
        Question: questionText(e.questionId),
      }))
    ),
    'Evidence'
  );

  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      data.hypotheses.map((h) => ({
        Statement: h.statement,
        Status: h.status,
        Confidence: h.confidence,
        Supporting: data.evidenceLinks.filter((l) => l.targetId === h.id && l.stance === 'supports').length,
        Contradicting: data.evidenceLinks.filter((l) => l.targetId === h.id && l.stance === 'contradicts').length,
        Conclusion: h.conclusion,
        Phase: phaseName(h.phaseId),
      }))
    ),
    'Hypotheses'
  );

  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      data.decisions.map((d) => ({
        Decision: d.title,
        Date: d.decidedAt,
        'Decided by': d.decidedBy,
        Reason: d.reason,
        Impact: d.impact,
        Phase: phaseName(d.phaseId),
        'Based on': questionText(d.questionId),
      }))
    ),
    'Decisions'
  );

  const gaps = detectGaps(data, workspace.id);
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      gaps.map((g) => ({
        Priority: g.priority,
        Kind: g.kind,
        Title: g.title,
        Reason: g.reason,
        'Next action': g.nextAction,
        Phase: g.phaseLabel,
      }))
    ),
    'Research Gaps'
  );

  XLSX.writeFile(book, `${safe(workspace.name)}-research-${stamp()}.xlsx`);
}

/**
 * Hand the Marketing Book to the browser's print dialog. The print
 * stylesheet in index.css hides the app chrome, so what prints is the
 * document alone.
 */
export function printBook() {
  window.print();
}
