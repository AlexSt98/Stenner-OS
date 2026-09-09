import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { projectProgress } from '../../store/selectors';
import { ProgressBar } from '../common/ProgressBar';

export function ProjectsWidget() {
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);

  return (
    <div className="stenner-card p-4">
      <div className="flex items-center mb-3.5">
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">PROJECTS</h2>
        <button
          onClick={() => navigate('/projects')}
          className="ml-auto flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-white font-medium"
        >
          View all <ArrowRight size={11} />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {projects.slice(0, 4).map((p) => {
          const pct = projectProgress(tasks, p.id);
          return (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="stenner-card stenner-card-hover p-3.5 text-left"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] mb-2.5"
                style={{ background: `${p.color}22`, color: p.color }}
              >
                {p.icon ?? p.name[0]}
              </div>
              <div className="text-[13px] font-semibold truncate">{p.name}</div>
              <div className="text-[11px] text-zinc-500 truncate mt-0.5">{p.description}</div>
              <div className="flex items-center gap-2 mt-2.5">
                <ProgressBar value={pct} color={p.color} />
                <span className="text-[11px] text-zinc-500 shrink-0">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
