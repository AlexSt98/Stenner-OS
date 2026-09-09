import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Clock3, ListChecks } from 'lucide-react';
import { useStore } from '../store/useStore';
import { projectProgress, projectTaskCounts, projectTrackedMinutes } from '../store/selectors';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { TaskQueue } from '../components/tasks/TaskQueue';
import { fmtHM } from '../lib/date';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const timeSessions = useStore((s) => s.timeSessions);
  const deleteProject = useStore((s) => s.deleteProject);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-zinc-500">Project not found.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/projects')}>
          Back to projects
        </Button>
      </div>
    );
  }

  const pct = projectProgress(tasks, project.id);
  const counts = projectTaskCounts(tasks, project.id);
  const minutes = projectTrackedMinutes(timeSessions, project.id);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-white"
      >
        <ArrowLeft size={13} /> Back to projects
      </button>

      <div className="stenner-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-[20px]"
              style={{ background: `${project.color}22`, color: project.color }}
            >
              {project.icon ?? project.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold">{project.name}</h1>
                <span
                  className="text-[10.5px] font-semibold px-2 py-1 rounded-md border"
                  style={{ color: project.color, borderColor: `${project.color}40`, background: `${project.color}12` }}
                >
                  {project.status}
                </span>
              </div>
              <p className="text-[13px] text-zinc-500 mt-0.5">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={13} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3.5 mt-5">
          <div className="stenner-card px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
              <ListChecks size={12} /> Tasks
            </div>
            <div className="text-[16px] font-bold">
              {counts.done} / {counts.total}
            </div>
          </div>
          <div className="stenner-card px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
              <Clock3 size={12} /> Time tracked
            </div>
            <div className="text-[16px] font-bold">{fmtHM(minutes)}</div>
          </div>
          <div className="stenner-card px-4 py-3">
            <div className="text-[11px] text-zinc-500 mb-1.5">Progress</div>
            <div className="flex items-center gap-2">
              <ProgressBar value={pct} color={project.color} />
              <span className="text-[12px] text-zinc-400 shrink-0">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      <TaskQueue tasks={projectTasks} title={`${project.name.toUpperCase()} TASKS`} />

      <ProjectFormModal open={editing} onClose={() => setEditing(false)} project={project} />

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete project?"
        width={380}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteProject(project.id);
                navigate('/projects');
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-zinc-400">
          This removes "<span className="text-zinc-200">{project.name}</span>". Its tasks stay, unassigned from any project.
        </p>
      </Modal>
    </div>
  );
}
