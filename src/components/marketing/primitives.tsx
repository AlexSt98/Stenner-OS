// ─────────────────────────────────────────────────────────────────────────
// Shared Marketing Lab primitives.
//
// Built on the existing STENNER OS design language — .stenner-card,
// .stenner-input, the violet accent, the px type scale — with slightly
// lighter surfaces and more air, which is what a long research session
// needs. No new branding, no second design system.
//
// EmptyState is load-bearing, not decoration: every list in Marketing Lab
// renders one instead of a zero, so the dashboard never shows an invented
// number and never implies research that has not happened.
// ─────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type {
  ClaimKind,
  Confidence,
  HypothesisStatus,
  Priority,
  QuestionStatus,
  SourceType,
} from '../../types/marketing';

// ── States ───────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  hint,
  action,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-xl border border-dashed border-[var(--color-border)] bg-white/[0.015]">
      {Icon && <Icon size={22} className="text-zinc-600 mb-2.5" />}
      <div className="text-[13.5px] font-medium text-zinc-400">{title}</div>
      {hint && <div className="text-[12px] text-zinc-600 mt-1 max-w-sm leading-relaxed">{hint}</div>}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading research…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-[12.5px] text-zinc-500">
      <Loader2 size={15} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-xl border border-red-500/20 bg-red-500/[0.05]">
      <AlertCircle size={20} className="text-red-400 mb-2" />
      <div className="text-[13px] font-medium text-red-300">Could not load</div>
      <div className="text-[12px] text-zinc-500 mt-1 max-w-md">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-[12px] font-medium text-violet-300 hover:text-violet-200">
          Try again
        </button>
      )}
    </div>
  );
}

// ── Progress ─────────────────────────────────────────────────────────────

export function ProgressRing({
  percent,
  size = 84,
  stroke = 7,
  color = 'var(--color-accent-purple)',
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[17px] font-bold">{clamped}%</span>
        {label && <span className="text-[9px] text-zinc-600 mt-1 tracking-wide uppercase">{label}</span>}
      </div>
    </div>
  );
}

const CONFIDENCE_META: Record<Confidence, { label: string; filled: number; color: string }> = {
  none: { label: 'No confidence', filled: 0, color: 'bg-zinc-600' },
  low: { label: 'Low', filled: 1, color: 'bg-red-400' },
  medium: { label: 'Medium', filled: 2, color: 'bg-yellow-400' },
  high: { label: 'High', filled: 3, color: 'bg-green-400' },
};

export function ConfidenceMeter({ value, showLabel = true }: { value: Confidence; showLabel?: boolean }) {
  const meta = CONFIDENCE_META[value];
  return (
    <span className="inline-flex items-center gap-1.5" title={`Confidence: ${meta.label}`}>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`w-3 h-1 rounded-full ${i < meta.filled ? meta.color : 'bg-white/10'}`} />
        ))}
      </span>
      {showLabel && <span className="text-[10.5px] text-zinc-500">{meta.label}</span>}
    </span>
  );
}

// ── Badges ───────────────────────────────────────────────────────────────

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold border whitespace-nowrap ${className}`}>{children}</span>
  );
}

const QUESTION_STATUS_META: Record<QuestionStatus, { label: string; cls: string }> = {
  not_started: { label: 'Not Started', cls: 'bg-white/[0.05] text-zinc-500 border-white/10' },
  in_progress: { label: 'In Progress', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  needs_evidence: { label: 'Needs Evidence', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  validated: { label: 'Validated', cls: 'bg-green-500/15 text-green-300 border-green-500/25' },
  decided: { label: 'Decided', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
};

export function QuestionStatusBadge({ status }: { status: QuestionStatus }) {
  const meta = QUESTION_STATUS_META[status];
  return <Pill className={meta.cls}>{meta.label}</Pill>;
}

export const QUESTION_STATUS_OPTIONS = Object.entries(QUESTION_STATUS_META).map(([value, m]) => ({
  value: value as QuestionStatus,
  label: m.label,
}));

const HYPOTHESIS_STATUS_META: Record<HypothesisStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-white/[0.05] text-zinc-400 border-white/10' },
  testing: { label: 'Testing', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  supported: { label: 'Supported', cls: 'bg-green-500/15 text-green-300 border-green-500/25' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/15 text-red-300 border-red-500/25' },
  validated: { label: 'Validated', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
};

export function HypothesisStatusBadge({ status }: { status: HypothesisStatus }) {
  const meta = HYPOTHESIS_STATUS_META[status];
  return <Pill className={meta.cls}>{meta.label}</Pill>;
}

export const HYPOTHESIS_STATUS_OPTIONS = Object.entries(HYPOTHESIS_STATUS_META).map(([value, m]) => ({
  value: value as HypothesisStatus,
  label: m.label,
}));

const PRIORITY_META: Record<Priority, string> = {
  high: 'bg-red-500/15 text-red-300 border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  low: 'bg-white/[0.05] text-zinc-400 border-white/10',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Pill className={PRIORITY_META[priority]}>{priority.toUpperCase()}</Pill>;
}

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official: 'Official',
  government: 'Government',
  industry_report: 'Industry Report',
  competitor: 'Competitor',
  customer: 'Customer',
  linkedin: 'LinkedIn',
  interview: 'Interview',
  internal: 'Internal',
  other: 'Other',
};

export function SourceTypeChip({ type }: { type: SourceType }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-white/[0.05] text-zinc-400 border border-white/10 whitespace-nowrap">
      {SOURCE_TYPE_LABELS[type]}
    </span>
  );
}

/**
 * Epistemic tag. Used wherever a statement is shown outside its original
 * context — above all in the Marketing Book, which must never let a
 * hypothesis read as a fact.
 */
const CLAIM_META: Record<ClaimKind, { label: string; cls: string }> = {
  fact: { label: 'FACT', cls: 'bg-green-500/15 text-green-300 border-green-500/25' },
  inference: { label: 'INFERENCE', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  hypothesis: { label: 'HYPOTHESIS', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  decision: { label: 'DECISION', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
};

export function ClaimKindBadge({ kind }: { kind: ClaimKind }) {
  const meta = CLAIM_META[kind];
  return <Pill className={meta.cls}>{meta.label}</Pill>;
}

// ── Layout helpers ───────────────────────────────────────────────────────

export function SectionHeading({
  title,
  count,
  hint,
  action,
}: {
  title: string;
  count?: number;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold tracking-wide text-zinc-300 uppercase">{title}</h2>
          {typeof count === 'number' && count > 0 && (
            <span className="text-[10.5px] font-semibold text-zinc-500 bg-white/[0.06] px-1.5 py-0.5 rounded">{count}</span>
          )}
        </div>
        {hint && <p className="text-[11.5px] text-zinc-600 mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'warn' | 'good' }) {
  const toneCls = tone === 'warn' ? 'text-amber-300' : tone === 'good' ? 'text-green-300' : 'text-zinc-100';
  return (
    <div className="stenner-card px-3.5 py-3">
      <div className={`text-[19px] font-bold leading-none ${toneCls}`}>{value}</div>
      <div className="text-[10.5px] text-zinc-500 mt-1.5 tracking-wide uppercase">{label}</div>
    </div>
  );
}
