// ─────────────────────────────────────────────────────────────────────────
// WHAT WE KNOW / WHAT WE DON'T KNOW
//
// Side by side, deliberately. Seeing them together is the point: a long
// left column with an empty right column means the research is thin rather
// than finished, and the reverse means there is a lot still to do.
//
// The bar for the left column is enforced in lib/marketing/knowledge.ts —
// validated with evidence, or decided. Writing an answer is not enough.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import { whatWeDontKnow, whatWeKnow } from '../../lib/marketing/knowledge';
import type { ClaimKind, UnknownItem } from '../../types/marketing';
import { KnownList, UnknownList } from '../../components/marketing/insights';
import { SectionHeading } from '../../components/marketing/primitives';
import { Select } from '../../components/common/Fields';

export function KnowledgePage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const data = useMarketingStore((s) => s.data);

  const [knownFilter, setKnownFilter] = useState<ClaimKind | 'all'>('all');
  const [unknownFilter, setUnknownFilter] = useState<UnknownItem['kind'] | 'all'>('all');

  const known = useMemo(() => whatWeKnow(data, workspaceId), [data, workspaceId]);
  const unknown = useMemo(() => whatWeDontKnow(data, workspaceId), [data, workspaceId]);

  const knownShown = knownFilter === 'all' ? known : known.filter((k) => k.kind === knownFilter);
  const unknownShown = unknownFilter === 'all' ? unknown : unknown.filter((u) => u.kind === unknownFilter);

  return (
    <div className="grid grid-cols-2 gap-6 items-start">
      <section>
        <SectionHeading
          title="What we know"
          count={known.length}
          hint="Validated with evidence attached, or settled by a decision."
          action={
            known.length > 0 ? (
              <Select
                value={knownFilter}
                onChange={(e) => setKnownFilter(e.target.value as ClaimKind | 'all')}
                className="!w-auto !py-1 !text-[11.5px]"
              >
                <option value="all">All</option>
                <option value="fact">Facts</option>
                <option value="inference">Inferences</option>
                <option value="decision">Decisions</option>
              </Select>
            ) : undefined
          }
        />
        <KnownList items={knownShown} />
      </section>

      <section>
        <SectionHeading
          title="What we don't know"
          count={unknown.length}
          hint="Unanswered, unbacked, unresolved, uncertain or blocked."
          action={
            unknown.length > 0 ? (
              <Select
                value={unknownFilter}
                onChange={(e) => setUnknownFilter(e.target.value as UnknownItem['kind'] | 'all')}
                className="!w-auto !py-1 !text-[11.5px]"
              >
                <option value="all">All</option>
                <option value="unanswered_question">Unanswered questions</option>
                <option value="missing_evidence">Missing evidence</option>
                <option value="unresolved_hypothesis">Unresolved hypotheses</option>
                <option value="uncertain_assumption">Uncertain assumptions</option>
                <option value="blocked_decision">Blocked decisions</option>
              </Select>
            ) : undefined
          }
        />
        <UnknownList items={unknownShown} />
      </section>
    </div>
  );
}
