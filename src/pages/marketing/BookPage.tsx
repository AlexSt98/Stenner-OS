// ─────────────────────────────────────────────────────────────────────────
// MARKETING BOOK
//
// The strategic document, built from consolidated output — not from raw
// research. Two rules are enforced here rather than left to discipline:
//
//   1. Nothing is auto-promoted. "Pull in validated research" inserts only
//      items that reached WHAT WE KNOW, and each arrives tagged.
//   2. Every inserted claim carries its epistemic status — FACT, INFERENCE,
//      HYPOTHESIS or DECISION — so a hypothesis can never read as a fact.
//      Open hypotheses are listed under Research Gaps, never as findings.
//
// The Research Gaps section is part of the document on purpose: a strategy
// document that hides what is still unknown is misleading to whoever reads
// it next.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileJson, FileSpreadsheet, Printer, Sparkles } from 'lucide-react';
import { useActiveWorkspace, useMarketingStore } from '../../store/marketing/useMarketingStore';
import { whatWeKnow } from '../../lib/marketing/knowledge';
import { detectGaps } from '../../lib/marketing/gaps';
import { overallProgress } from '../../lib/marketing/progress';
import { exportJson, exportXlsx, printBook } from '../../lib/marketing/export';
import type { BookSectionKey, MLBookSection } from '../../types/marketing';
import { BOOK_SECTIONS } from '../../store/marketing/seedWorkspace';
import { ClaimKindBadge, EmptyState } from '../../components/marketing/primitives';
import { Button } from '../../components/common/Button';
import { TextArea } from '../../components/common/Fields';

/** Which phase's validated findings feed which section. */
const SECTION_SOURCE: Partial<Record<BookSectionKey, string>> = {
  market_overview: 'us_market',
  industry_trends: 'us_market',
  target_market: 'segmentation',
  segmentation: 'segmentation',
  icp: 'icp',
  buyer_personas: 'buyer_personas',
  buying_committee: 'buying_committee',
  customer_journey: 'customer_journey',
  competitive_landscape: 'competition',
  positioning: 'positioning',
  messaging: 'messaging',
  linkedin_strategy: 'linkedin',
  content_strategy: 'content_visual',
  visual_strategy: 'content_visual',
  measurement: 'measurement',
  roadmap_90_day: 'roadmap',
};

export function BookPage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, patch } = useMarketingStore();
  const workspace = useActiveWorkspace();

  const known = useMemo(() => whatWeKnow(data, workspaceId), [data, workspaceId]);
  const gaps = useMemo(() => detectGaps(data, workspaceId), [data, workspaceId]);
  const progress = overallProgress(data);

  const sectionByKey = useMemo(
    () => new Map(data.bookSections.map((s) => [s.key, s])),
    [data.bookSections]
  );

  const written = data.bookSections.filter((s) => s.body.trim()).length;

  return (
    <div className="space-y-5">
      <div className="stenner-card p-5 no-print">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold">Marketing Book</h1>
            <p className="text-[12.5px] text-zinc-500 mt-1 leading-relaxed max-w-2xl">
              Consolidated strategy. Every claim pulled in from research keeps its status, so a hypothesis is never
              presented as a fact.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={() => workspace && exportJson(workspace, data)} disabled={!workspace}>
              <FileJson size={13} /> JSON
            </Button>
            <Button size="sm" onClick={() => workspace && exportXlsx(workspace, data)} disabled={!workspace}>
              <FileSpreadsheet size={13} /> XLSX
            </Button>
            <Button size="sm" variant="primary" onClick={printBook}>
              <Printer size={13} /> PDF
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-4 pt-3.5 border-t border-[var(--color-border-soft)] text-[11.5px] text-zinc-500">
          <span>
            {written} / {BOOK_SECTIONS.length} sections written
          </span>
          <span>{known.length} established findings available</span>
          <span>{progress.percent}% research complete</span>
          {gaps.length > 0 && <span className="text-amber-400/90">{gaps.length} open gaps</span>}
        </div>

        {progress.percent < 50 && (
          <p className="text-[11.5px] text-amber-300/80 mt-3 flex items-start gap-1.5">
            <Download size={12} className="mt-0.5 shrink-0 rotate-180" />
            Research is {progress.percent}% complete. Exporting now produces a document resting largely on assumptions.
          </p>
        )}
      </div>

      <div className="space-y-4 print-document">
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold">{workspace?.name} — Marketing Book</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Generated {new Date().toISOString().slice(0, 10)} · research {progress.percent}% complete
          </p>
        </div>

        {BOOK_SECTIONS.map((meta, i) => {
          const section = sectionByKey.get(meta.key);
          if (!section) return null;
          return (
            <BookSection
              key={meta.key}
              index={i + 1}
              section={section}
              sourcePhase={SECTION_SOURCE[meta.key]}
              known={known}
              gaps={meta.key === 'research_gaps' ? gaps : []}
              sources={meta.key === 'sources' ? data.evidence : []}
              onChange={(body) => void patch('bookSections', section.id, { body })}
            />
          );
        })}
      </div>
    </div>
  );
}

function BookSection({
  index,
  section,
  sourcePhase,
  known,
  gaps,
  sources,
  onChange,
}: {
  index: number;
  section: MLBookSection;
  sourcePhase?: string;
  known: ReturnType<typeof whatWeKnow>;
  gaps: ReturnType<typeof detectGaps>;
  sources: { id: string; title: string; sourceName: string; url: string; sourceType: string }[];
  onChange: (body: string) => void;
}) {
  const [draft, setDraft] = useState(section.body);

  useEffect(() => {
    setDraft(section.body);
  }, [section.body]);

  const available = sourcePhase ? known.filter((k) => k.phaseKey === sourcePhase) : [];

  /** Insert validated findings, each tagged with what it actually is. */
  const pullIn = () => {
    const lines = available.map((k) => `[${k.kind.toUpperCase()}] ${k.statement}`);
    const next = [draft.trim(), ...lines].filter(Boolean).join('\n\n');
    setDraft(next);
    onChange(next);
  };

  return (
    <section className="stenner-card p-5 break-inside-avoid">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-[15px] font-bold">
          <span className="text-zinc-600 font-mono text-[12px] mr-2">{String(index).padStart(2, '0')}</span>
          {section.title}
        </h2>
        {available.length > 0 && (
          <Button size="sm" variant="ghost" className="no-print !px-2 !py-1" onClick={pullIn}>
            <Sparkles size={12} /> Pull in {available.length} validated
          </Button>
        )}
      </div>

      {/* Research Gaps is generated, not written — it must reflect reality. */}
      {section.key === 'research_gaps' ? (
        gaps.length === 0 ? (
          <p className="text-[12.5px] text-zinc-500">No research gaps identified.</p>
        ) : (
          <ul className="space-y-2">
            {gaps.map((g) => (
              <li key={g.id} className="text-[12.5px] text-zinc-400 leading-relaxed">
                <span className="text-zinc-200 font-medium">[{g.priority.toUpperCase()}]</span> {g.title}
                <span className="block text-[11.5px] text-zinc-600 mt-0.5">
                  {g.reason} → {g.nextAction}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : section.key === 'sources' ? (
        sources.length === 0 ? (
          <p className="text-[12.5px] text-zinc-500">No sources collected yet.</p>
        ) : (
          <ol className="space-y-1.5 list-decimal list-inside">
            {sources.map((s) => (
              <li key={s.id} className="text-[12.5px] text-zinc-400 leading-relaxed">
                {s.title}
                {s.sourceName && <span className="text-zinc-600"> — {s.sourceName}</span>}
                {s.url && <span className="text-zinc-700 block ml-4 text-[11px] break-all">{s.url}</span>}
              </li>
            ))}
          </ol>
        )
      ) : (
        <>
          <TextArea
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== section.body) onChange(draft);
            }}
            placeholder={
              available.length > 0
                ? 'Write the consolidated section, or pull in the validated findings above as a starting point.'
                : 'No validated research backs this section yet. Anything written here is an assumption.'
            }
            className="no-print"
          />
          {/* What actually prints: the prose, not the editor. */}
          <div className="hidden print:block whitespace-pre-wrap text-[12.5px] leading-relaxed">
            {draft || '(Not yet written.)'}
          </div>

          {available.length === 0 && !draft.trim() && (
            <div className="mt-2">
              <EmptyState title="No validated research for this section yet." />
            </div>
          )}

          {available.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border-soft)] no-print">
              <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-2">
                Available from research
              </div>
              <div className="space-y-1.5">
                {available.map((k) => (
                  <div key={k.id} className="flex items-start gap-2">
                    <ClaimKindBadge kind={k.kind} />
                    <span className="text-[12px] text-zinc-400 leading-relaxed flex-1">{k.statement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
