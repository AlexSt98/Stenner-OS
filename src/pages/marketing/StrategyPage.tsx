// ─────────────────────────────────────────────────────────────────────────
// STRATEGY MODE — consolidated output only.
//
// Nothing arrives here automatically. A hypothesis never becomes strategy on
// its own: somebody has to read the research and write the conclusion. That
// is the whole separation between RAW RESEARCH and STRATEGIC OUTPUT, and it
// is enforced by there being no code path from a hypothesis to this page.
//
// Each tab shows how much validated research currently backs it, so it is
// obvious when strategy is being written ahead of the evidence.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import { whatWeKnow } from '../../lib/marketing/knowledge';
import type { PhaseKey, StrategyKey } from '../../types/marketing';
import { STRATEGY_BLOCKS } from '../../store/marketing/seedWorkspace';
import { EmptyState, SectionHeading } from '../../components/marketing/primitives';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Label, TextArea, TextInput } from '../../components/common/Fields';
import type { CollectionKey } from '../../store/marketing/repository';

type TabKey = 'icp' | 'personas' | 'competition' | 'positioning' | 'messaging' | 'linkedin' | 'content' | 'measurement' | 'roadmap';

const TABS: { key: TabKey; label: string; backedBy: PhaseKey }[] = [
  { key: 'icp', label: 'ICP & Segments', backedBy: 'icp' },
  { key: 'personas', label: 'Personas', backedBy: 'buyer_personas' },
  { key: 'competition', label: 'Competition', backedBy: 'competition' },
  { key: 'positioning', label: 'Positioning', backedBy: 'positioning' },
  { key: 'messaging', label: 'Messaging', backedBy: 'messaging' },
  { key: 'linkedin', label: 'LinkedIn', backedBy: 'linkedin' },
  { key: 'content', label: 'Content & Visual', backedBy: 'content_visual' },
  { key: 'measurement', label: 'Measurement', backedBy: 'measurement' },
  { key: 'roadmap', label: 'Roadmap', backedBy: 'roadmap' },
];

/** Field definitions drive a single generic editor rather than five modals. */
interface FieldDef {
  name: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
}

const ENTITY_FORMS: Record<string, { collection: CollectionKey; title: string; fields: FieldDef[] }> = {
  segment: {
    collection: 'segments',
    title: 'Segment',
    fields: [
      { name: 'name', label: 'Segment name', placeholder: 'e.g. Specialty contractors, 100–500 employees' },
      { name: 'criteria', label: 'Observable criteria', multiline: true, placeholder: 'How would you identify a member from the outside?' },
      { name: 'sizeEstimate', label: 'Size estimate', placeholder: 'e.g. ~4,200 U.S. establishments' },
    ],
  },
  persona: {
    collection: 'personas',
    title: 'Persona',
    fields: [
      { name: 'name', label: 'Persona name', placeholder: 'e.g. Operations Director' },
      { name: 'role', label: 'Role and accountability', placeholder: 'What are they measured on?' },
      { name: 'goals', label: 'Goals', multiline: true },
      { name: 'pains', label: 'Pains', multiline: true },
      { name: 'triggers', label: 'Triggers', multiline: true },
      { name: 'objections', label: 'Objections', multiline: true },
      { name: 'channels', label: 'Where they get information', multiline: true },
    ],
  },
  competitor: {
    collection: 'competitors',
    title: 'Competitor',
    fields: [
      { name: 'name', label: 'Name', placeholder: 'Include “spreadsheets” and “do nothing” if buyers compare against them' },
      { name: 'url', label: 'URL', placeholder: 'https://' },
      { name: 'positioning', label: 'How they position themselves', multiline: true },
      { name: 'strengths', label: 'Strengths', multiline: true },
      { name: 'weaknesses', label: 'Weaknesses', multiline: true },
      { name: 'pricingNotes', label: 'Pricing notes', multiline: true },
    ],
  },
  pillar: {
    collection: 'contentPillars',
    title: 'Content pillar',
    fields: [
      { name: 'name', label: 'Pillar', placeholder: 'e.g. Operational visibility in multi-site projects' },
      { name: 'rationale', label: 'Why can we speak on this with authority?', multiline: true },
      { name: 'formats', label: 'Formats', placeholder: 'e.g. Teardowns, field interviews, benchmark posts' },
    ],
  },
  roadmap: {
    collection: 'roadmapItems',
    title: 'Roadmap item',
    fields: [
      { name: 'title', label: 'Action', placeholder: 'What will be done?' },
      { name: 'owner', label: 'Owner', placeholder: 'A single named person' },
      { name: 'outcome', label: 'What does done look like?', multiline: true },
    ],
  },
};

export function StrategyPage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data, add, patch, drop } = useMarketingStore();
  const [tab, setTab] = useState<TabKey>('icp');
  const [adding, setAdding] = useState<keyof typeof ENTITY_FORMS | null>(null);

  const known = useMemo(() => whatWeKnow(data, workspaceId), [data, workspaceId]);
  const active = TABS.find((t) => t.key === tab)!;
  const backing = known.filter((k) => k.phaseKey === active.backedBy).length;

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Strategy output"
        hint="Consolidated conclusions only. Raw research lives in Research Mode."
      />

      <div className="flex gap-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              tab === t.key ? 'bg-violet-600/15 text-violet-300 border border-violet-500/25' : 'text-zinc-500 hover:text-zinc-200 border border-transparent hover:bg-white/[0.04]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {backing === 0 && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
          <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-200/80 leading-relaxed">
            No validated research backs this section yet. Anything written here is a working assumption —{' '}
            <Link to={`/marketing/${workspaceId}/phase/${active.backedBy}`} className="underline hover:text-amber-100">
              open the {active.label.replace(' & Segments', '')} phase
            </Link>
            .
          </p>
        </div>
      )}

      {tab === 'icp' && (
        <EntityList
          title="Segments"
          empty="No segments defined yet."
          onAdd={() => setAdding('segment')}
          items={data.segments.map((s) => ({
            id: s.id,
            heading: s.name,
            lines: [
              ['Criteria', s.criteria],
              ['Size estimate', s.sizeEstimate],
            ],
          }))}
          onDelete={(id) => void drop('segments', id)}
        />
      )}

      {tab === 'personas' && (
        <EntityList
          title="Buyer personas"
          empty="No personas defined yet."
          onAdd={() => setAdding('persona')}
          items={data.personas.map((p) => ({
            id: p.id,
            heading: `${p.name}${p.role ? ` — ${p.role}` : ''}`,
            lines: [
              ['Goals', p.goals],
              ['Pains', p.pains],
              ['Triggers', p.triggers],
              ['Objections', p.objections],
              ['Channels', p.channels],
            ],
          }))}
          onDelete={(id) => void drop('personas', id)}
        />
      )}

      {tab === 'competition' && (
        <EntityList
          title="Competitive landscape"
          empty="No competitors recorded yet."
          onAdd={() => setAdding('competitor')}
          items={data.competitors.map((c) => ({
            id: c.id,
            heading: c.name,
            lines: [
              ['Positioning', c.positioning],
              ['Strengths', c.strengths],
              ['Weaknesses', c.weaknesses],
              ['Pricing', c.pricingNotes],
            ],
          }))}
          onDelete={(id) => void drop('competitors', id)}
        />
      )}

      {tab === 'content' && (
        <>
          <EntityList
            title="Content pillars"
            empty="No content pillars defined yet."
            onAdd={() => setAdding('pillar')}
            items={data.contentPillars.map((p) => ({
              id: p.id,
              heading: p.name,
              lines: [
                ['Authority basis', p.rationale],
                ['Formats', p.formats],
              ],
            }))}
            onDelete={(id) => void drop('contentPillars', id)}
          />
          <NarrativeBlock workspaceKey="visual" />
        </>
      )}

      {tab === 'roadmap' && (
        <EntityList
          title="90-day roadmap"
          empty="No roadmap items yet."
          onAdd={() => setAdding('roadmap')}
          items={data.roadmapItems.map((r) => ({
            id: r.id,
            heading: r.title,
            lines: [
              ['Owner', r.owner],
              ['Done looks like', r.outcome],
            ],
          }))}
          onDelete={(id) => void drop('roadmapItems', id)}
        />
      )}

      {(['positioning', 'messaging', 'linkedin', 'measurement'] as const).includes(tab as never) && (
        <NarrativeBlock workspaceKey={tab as StrategyKey} />
      )}

      {adding && (
        <EntityModal
          form={ENTITY_FORMS[adding]}
          onClose={() => setAdding(null)}
          onSave={(values) => {
            const form = ENTITY_FORMS[adding];
            const sortOrder =
              (data[form.collection] as { sortOrder?: number }[]).reduce((max, r) => Math.max(max, r.sortOrder ?? 0), 0) + 1;
            const extras = form.collection === 'segments' ? { fitScore: 0 } : form.collection === 'roadmapItems' ? { horizon: 'days_0_30' as const } : {};
            void add(form.collection, { ...blankFields(form.fields), ...values, ...extras, sortOrder } as never);
          }}
        />
      )}
    </div>
  );

  function NarrativeBlock({ workspaceKey }: { workspaceKey: StrategyKey }) {
    const block = data.strategyOutputs.find((s) => s.key === workspaceKey);
    const meta = STRATEGY_BLOCKS.find((b) => b.key === workspaceKey);
    const [draft, setDraft] = useState(block?.body ?? '');

    useEffect(() => {
      setDraft(block?.body ?? '');
    }, [block?.body]);

    if (!block) return null;

    return (
      <div className="stenner-card p-4">
        <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1">{meta?.title}</div>
        <p className="text-[11.5px] text-zinc-600 mb-2.5">{meta?.hint}</p>
        <TextArea
          rows={10}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== block.body) void patch('strategyOutputs', block.id, { body: draft });
          }}
          placeholder="Write the consolidated conclusion. Cite the questions and decisions it rests on."
        />
      </div>
    );
  }
}

function blankFields(fields: FieldDef[]) {
  return Object.fromEntries(fields.map((f) => [f.name, '']));
}

function EntityList({
  title,
  empty,
  items,
  onAdd,
  onDelete,
}: {
  title: string;
  empty: string;
  items: { id: string; heading: string; lines: [string, string][] }[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section>
      <SectionHeading
        title={title}
        count={items.length}
        action={
          <Button size="sm" variant="secondary" onClick={onAdd}>
            <Plus size={13} /> Add
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title={empty}
          hint="This is consolidated output — add it once the underlying research supports it."
          action={
            <Button size="sm" variant="primary" onClick={onAdd}>
              <Plus size={13} /> Add
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.id} className="stenner-card p-4 group">
              <div className="flex items-start gap-3">
                <div className="text-[14px] font-semibold text-zinc-100 flex-1">{item.heading}</div>
                <button
                  onClick={() => onDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2 mt-3">
                {item.lines
                  .filter(([, value]) => value?.trim())
                  .map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-0.5">{label}</div>
                      <p className="text-[12.5px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{value}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EntityModal({
  form,
  onClose,
  onSave,
}: {
  form: { title: string; fields: FieldDef[] };
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => blankFields(form.fields));
  const first = form.fields[0];
  const valid = Boolean(values[first.name]?.trim());

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${form.title.toLowerCase()}`}
      width={620}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              onSave(values);
              onClose();
            }}
          >
            Add {form.title.toLowerCase()}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        {form.fields.map((field) => (
          <div key={field.name}>
            <Label>{field.label}</Label>
            {field.multiline ? (
              <TextArea
                rows={2}
                value={values[field.name]}
                placeholder={field.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
              />
            ) : (
              <TextInput
                value={values[field.name]}
                placeholder={field.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
