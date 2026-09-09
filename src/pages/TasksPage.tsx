import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { TaskQueue } from '../components/tasks/TaskQueue';
import { Select } from '../components/common/Fields';

export function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, projectFilter, priorityFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Tasks</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">{tasks.length} total · {tasks.filter((t) => t.status === 'Done').length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-40">
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-36">
            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
        </div>
      </div>

      <TaskQueue tasks={filtered} title="ALL TASKS" />
    </div>
  );
}
