// ─────────────────────────────────────────────────────────────────────────
// MARKETING LAB — research projects.
//
// Each card answers "where is this project" at a glance: current phase,
// research progress, what is blocking it, and the next action. Counts are
// secondary and deliberately rendered small.
//
// Every number here is computed from real records. A workspace with no
// research shows "No research data yet" rather than a row of zeros, because
// a zero reads as a measurement and there has been no measurement.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FlaskConical, Plus } from 'lucide-react';
import { useMarketingStore } from '../../store/marketing/useMarketingStore';
import { forcedLocal, missingCredentials, repository } from '../../store/marketing';
import type { MarketingWorkspaceData, MLWorkspace } from '../../types/marketing';
import { currentPhaseKey, overallProgress } from '../../lib/marketing/progress';
import { detectGaps } from '../../lib/marketing/gaps';
import { nextResearchAction } from '../../lib/marketing/nextAction';
import { phaseLabel } from '../../lib/marketing/phaseTemplates';
import { EmptyState, ErrorState, LoadingState, ProgressRing } from '../../components/marketing/primitives';
import { SessionBadge } from '../../components/marketing/AuthGate';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FieldRow, Label, TextArea, TextInput } from '../../components/common/Fields';

interface Summary {
  progress: number;
  totalQuestions: number;
  evidence: number;
  openHypotheses: number;
  decisions: number;
  gaps: number;
  currentPhase: string | null;
  nextAction: string | null;
}

function summarise(data: MarketingWorkspaceData, workspaceId: string): Summary {
  const gaps = detectGaps(data, workspaceId);
  const phaseKey = currentPhaseKey(data);
  const next = nextResearchAction(data, gaps, workspaceId);
  return {
    progress: overallProgress(data).percent,
    totalQuestions: data.questions.length,
    evidence: data.evidence.length,
    openHypotheses: data.hypotheses.filter((h) => h.status === 'open' || h.status === 'testing').length,
    decisions: data.decisions.length,
    gaps: gaps.length,
    currentPhase: phaseKey ? phaseLabel(phaseKey) : null,
    nextAction: next?.title ?? null,
  };
}

/** True once the researcher has actually recorded something. */
function hasResearch(s: Summary) {
  return s.progress > 0 || s.evidence > 0 || s.openHypotheses > 0 || s.decisions > 0;
}

export function MarketingLabPage() {
  const navigate = useNavigate();
  const { workspaces, workspacesStatus, workspacesError, loadWorkspaces, createWorkspace, backend } = useMarketingStore();
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  // Summaries are derived, so they are fetched rather than stored. With a
  // handful of workspaces this is cheap and always current.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, Summary> = {};
      for (const w of workspaces) {
        const data = await repository.loadWorkspaceData(w.id);
        next[w.id] = summarise(data, w.id);
      }
      if (!cancelled) setSummaries(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaces]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Marketing Lab</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Research → evidence → hypothesis → validation → decision → strategy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SessionBadge />
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> New research project
          </Button>
        </div>
      </div>

      {backend === 'local' && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06]">
          <FlaskConical size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-200/80 leading-relaxed">
            {missingCredentials ? (
              <>
                <span className="font-semibold text-amber-200">No database connected.</span> Set VITE_SUPABASE_URL and
                VITE_SUPABASE_ANON_KEY to persist research; until then it is stored in this browser only.
              </>
            ) : forcedLocal ? (
              <>
                <span className="font-semibold text-amber-200">Local mode (forced).</span> VITE_MARKETING_BACKEND=local
                is set, so research stays in this browser and nothing reaches Supabase.
              </>
            ) : null}
          </p>
        </div>
      )}

      {workspacesStatus === 'loading' && <LoadingState label="Loading research projects…" />}
      {workspacesStatus === 'error' && <ErrorState message={workspacesError ?? ''} onRetry={() => void loadWorkspaces()} />}

      {workspacesStatus === 'ready' && workspaces.length === 0 && (
        <EmptyState
          icon={FlaskConical}
          title="No research projects yet."
          hint="A research project is a company you are investigating — its phases, evidence, hypotheses and decisions stay entirely separate from every other project."
          action={
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
              <Plus size={14} /> New research project
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        {workspaces.map((w) => {
          const s = summaries[w.id];
          return <WorkspaceCard key={w.id} workspace={w} summary={s} onOpen={() => navigate(`/marketing/${w.id}`)} />;
        })}
      </div>

      <NewWorkspaceModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={async (input) => {
          const created = await createWorkspace(input);
          navigate(`/marketing/${created.id}`);
        }}
      />
    </div>
  );
}

function WorkspaceCard({
  workspace,
  summary,
  onOpen,
}: {
  workspace: MLWorkspace;
  summary?: Summary;
  onOpen: () => void;
}) {
  const started = summary ? hasResearch(summary) : false;

  return (
    <button onClick={onOpen} className="stenner-card stenner-card-hover p-5 text-left">
      <div className="flex items-start gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[17px] shrink-0"
          style={{ background: `${workspace.color}22`, color: workspace.color }}
        >
          {workspace.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold">{workspace.name}</div>
          <div className="text-[12.5px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{workspace.description}</div>
        </div>
        {summary && started && <ProgressRing percent={summary.progress} size={58} stroke={5} color={workspace.color} />}
      </div>

      {!summary && <div className="mt-4 h-[72px] rounded-lg bg-white/[0.02] animate-pulse" />}

      {summary && !started && (
        <div className="mt-4 px-3 py-3 rounded-lg border border-dashed border-[var(--color-border)] text-center">
          <div className="text-[12.5px] text-zinc-500">No research data yet</div>
          <div className="text-[11px] text-zinc-600 mt-1">
            {summary.totalQuestions} questions across 14 phases are ready to work through.
          </div>
        </div>
      )}

      {summary && started && (
        <>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-[var(--color-border-soft)]">
            <Field label="Current phase" value={summary.currentPhase ?? '—'} />
            <Field label="Research gaps" value={String(summary.gaps)} tone={summary.gaps > 0 ? 'warn' : 'default'} />
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-600">
            <span>{summary.evidence} evidence</span>
            <span>{summary.openHypotheses} open hypotheses</span>
            <span>{summary.decisions} decisions</span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-[var(--color-border-soft)]">
            <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase mb-1">Next research action</div>
            {summary.nextAction ? (
              <div className="flex items-start gap-1.5 text-[12.5px] text-violet-300 leading-snug">
                <ArrowRight size={13} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2">{summary.nextAction}</span>
              </div>
            ) : (
              <div className="text-[12px] text-zinc-600">No next research action defined.</div>
            )}
          </div>
        </>
      )}
    </button>
  );
}

function Field({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warn' }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase">{label}</div>
      <div className={`text-[13.5px] font-semibold mt-0.5 ${tone === 'warn' ? 'text-amber-300' : 'text-zinc-200'}`}>{value}</div>
    </div>
  );
}

function NewWorkspaceModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; slug: string; description: string; color: string; icon: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate({
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim(),
        color: '#8b5cf6',
        icon: name.trim()[0]?.toUpperCase() ?? '◆',
      });
      setName('');
      setDescription('');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New research project"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim() || busy}>
            {busy ? 'Creating…' : 'Create project'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <FieldRow>
          <div>
            <Label>Name</Label>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TEOPM" autoFocus />
          </div>
          <div />
        </FieldRow>
        <div>
          <Label>What is being researched?</Label>
          <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. U.S. marketing research — operational visibility and project execution." />
        </div>
        <p className="text-[11.5px] text-zinc-600 leading-relaxed">
          The project starts with the 14 research phases and their questions. It starts with no evidence, no hypotheses and
          no decisions — those only come from your research, and its data stays isolated from every other project.
        </p>
      </div>
    </Modal>
  );
}
