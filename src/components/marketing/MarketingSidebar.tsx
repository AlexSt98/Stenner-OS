// ─────────────────────────────────────────────────────────────────────────
// Workspace navigation.
//
// Research Mode and Strategy Mode are not a filter on one screen — they
// swap the entire navigation. That is what keeps RAW RESEARCH and STRATEGIC
// OUTPUT genuinely separate: in Strategy Mode the raw material is not one
// click away, so consolidated conclusions cannot be quietly mixed with
// unvalidated notes.
//
// The 14 phases live in an expandable section with their live progress, so
// the researcher always sees where the work stands without leaving the page.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  FileSearch,
  FlaskConical,
  Gavel,
  Layers,
  Lightbulb,
  ScrollText,
  Target,
} from 'lucide-react';
import type { PhaseProgress, WorkspaceMode } from '../../types/marketing';
import { PHASE_TEMPLATES } from '../../lib/marketing/phaseTemplates';

interface Props {
  workspaceId: string;
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  phaseProgress: PhaseProgress[];
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  /** Only the index link needs exact matching; the rest match by prefix. */
  end?: boolean;
}

const RESEARCH_LINKS: NavItem[] = [
  { to: '', label: 'Control Center', icon: Compass, end: true },
  { to: '/evidence', label: 'Evidence', icon: FileSearch },
  { to: '/hypotheses', label: 'Hypotheses', icon: FlaskConical },
  { to: '/decisions', label: 'Decision Log', icon: Gavel },
  { to: '/gaps', label: 'Research Gaps', icon: Lightbulb },
  { to: '/knowledge', label: 'Know / Don’t Know', icon: ScrollText },
];

const STRATEGY_LINKS: NavItem[] = [
  { to: '/strategy', label: 'Strategy Output', icon: Target },
  { to: '/book', label: 'Marketing Book', icon: BookOpen },
];

export function MarketingSidebar({ workspaceId, mode, onModeChange, phaseProgress }: Props) {
  const base = `/marketing/${workspaceId}`;
  const location = useLocation();
  const [phasesOpen, setPhasesOpen] = useState(location.pathname.includes('/phase/'));

  const links = mode === 'research' ? RESEARCH_LINKS : STRATEGY_LINKS;
  const progressByKey = new Map(phaseProgress.map((p) => [p.phaseKey, p]));

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
      isActive
        ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
    }`;

  return (
    <aside className="w-[212px] shrink-0 space-y-4">
      {/* Mode switch */}
      <div className="stenner-card p-1 flex">
        {(['research', 'strategy'] as WorkspaceMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-colors ${
              mode === m ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <nav className="space-y-0.5">
        {links.map((l) => (
          <NavLink key={l.to} to={`${base}${l.to}`} end={l.end} className={linkClass}>
            <l.icon size={15} />
            {l.label}
          </NavLink>
        ))}

        {mode === 'research' && (
          <div className="pt-1">
            <button
              onClick={() => setPhasesOpen((v) => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Layers size={15} />
              Phases
              {phasesOpen ? <ChevronDown size={13} className="ml-auto" /> : <ChevronRight size={13} className="ml-auto" />}
            </button>

            {phasesOpen && (
              <div className="mt-0.5 space-y-px">
                {PHASE_TEMPLATES.map((phase) => {
                  const progress = progressByKey.get(phase.key);
                  const percent = progress?.percent ?? 0;
                  return (
                    <NavLink
                      key={phase.key}
                      to={`${base}/phase/${phase.key}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 pl-4 pr-2.5 py-1.5 rounded-lg text-[11.5px] transition-colors ${
                          isActive ? 'bg-violet-600/15 text-violet-300' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                        }`
                      }
                    >
                      <span className="text-[9.5px] font-mono text-zinc-600 w-4 shrink-0">{phase.code}</span>
                      <span className="truncate flex-1">{phase.label}</span>
                      <span className="w-8 h-1 rounded-full bg-white/[0.07] overflow-hidden shrink-0">
                        <span
                          className="block h-full rounded-full bg-violet-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
