import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock3, ListChecks } from 'lucide-react';
import { useStore } from '../store/useStore';
import { projectProgress, projectTaskCounts, projectTrackedMinutes } from '../store/selectors';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { fmtHM } from '../lib/date';

export function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const timeSessions = useStore((s) => s.timeSessions);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Projects</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">{projects.length} projects · progress is computed from linked tasks automatically.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          <Plus size={14} /> New project
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {projects.map((p) => {
          const pct = projectProgress(tasks, p.id);
          const counts = projectTaskCounts(tasks, p.id);
          const minutes = projectTrackedMinutes(timeSessions, p.id);
          return (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="stenner-card stenner-card-hover p-5 text-left"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[17px]"
                  style={{ background: `${p.color}22`, color: p.color }}
                >
                  {p.icon ?? p.name[0]}
                </div>
                <span
                  className="text-[10.5px] font-semibold px-2 py-1 rounded-md border"
                  style={{ color: p.color, borderColor: `${p.color}40`, background: `${p.color}12` }}
                >
                  {p.status}
                </span>
              </div>
              <div className="text-[16px] font-bold mt-3">{p.name}</div>
              <div className="text-[12.5px] text-zinc-500 mt-0.5 line-clamp-2">{p.description}</div>

              <div className="flex items-center gap-4 mt-3.5 text-[11.5px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <ListChecks size={12} /> {counts.done}/{counts.total} tasks
                </span>
                <span className="flex items-center gap-1">
                  <Clock3 size={12} /> {fmtHM(minutes)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <ProgressBar value={pct} color={p.color} />
                <span className="text-[11.5px] text-zinc-500 shrink-0">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
