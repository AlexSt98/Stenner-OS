// ─────────────────────────────────────────────────────────────────────────
// Workspace shell.
//
// Loads one workspace's data once, then every child route reads it from the
// store. This is where the isolation between TEOPM and GEO-CX is enforced
// in the UI: only the active workspace's records are ever in memory, so no
// view can accidentally read across projects.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useActiveWorkspace, useMarketingStore } from '../../store/marketing/useMarketingStore';
import { allPhaseProgress, overallProgress } from '../../lib/marketing/progress';
import { MarketingSidebar } from '../../components/marketing/MarketingSidebar';
import { ErrorState, LoadingState } from '../../components/marketing/primitives';

export function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data, dataStatus, dataError, mode, setMode, loadWorkspace, loadWorkspaces, workspacesStatus } =
    useMarketingStore();
  const workspace = useActiveWorkspace();

  useEffect(() => {
    if (workspacesStatus === 'idle') void loadWorkspaces();
  }, [workspacesStatus, loadWorkspaces]);

  useEffect(() => {
    if (workspaceId) void loadWorkspace(workspaceId);
  }, [workspaceId, loadWorkspace]);

  const phaseProgress = useMemo(() => allPhaseProgress(data), [data]);
  const overall = useMemo(() => overallProgress(data), [data]);

  if (!workspaceId) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          to="/marketing"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Back to Marketing Lab"
        >
          <ArrowLeft size={16} />
        </Link>
        {workspace && (
          <>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shrink-0"
              style={{ background: `${workspace.color}22`, color: workspace.color }}
            >
              {workspace.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-bold leading-tight">{workspace.name}</div>
              <div className="text-[11.5px] text-zinc-600 truncate">{workspace.description}</div>
            </div>
          </>
        )}
        {overall.total > 0 && (
          <div className="ml-auto flex items-center gap-2.5">
            <span className="text-[11px] text-zinc-600 tracking-wide uppercase">Research progress</span>
            <span className="w-28 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <span
                className="block h-full rounded-full bg-violet-500 transition-all duration-700"
                style={{ width: `${overall.percent}%` }}
              />
            </span>
            <span className="text-[13px] font-bold tabular-nums">{overall.percent}%</span>
          </div>
        )}
      </div>

      <div className="flex gap-6 items-start">
        <MarketingSidebar workspaceId={workspaceId} mode={mode} onModeChange={setMode} phaseProgress={phaseProgress} />

        <div className="flex-1 min-w-0">
          {dataStatus === 'loading' && <LoadingState />}
          {dataStatus === 'error' && (
            <ErrorState message={dataError ?? ''} onRetry={() => void loadWorkspace(workspaceId)} />
          )}
          {dataStatus === 'ready' && <Outlet />}
        </div>
      </div>
    </div>
  );
}
