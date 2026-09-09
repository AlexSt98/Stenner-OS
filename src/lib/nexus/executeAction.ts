import { format, addDays } from 'date-fns';
import { useStore } from '../../store/useStore';
import { todayISO } from '../date';
import type { NexusToolCall } from '../../types/nexus';

function resolveDate(input?: unknown): string {
  const raw = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (!raw || raw === 'today') return todayISO();
  if (raw === 'tomorrow') return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return todayISO();
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Loose match so the model can say "TEOPM" or "the WMS project" and still resolve. */
function findProjectId(name: unknown): string | null {
  if (typeof name !== 'string' || !name.trim()) return null;
  const lower = name.trim().toLowerCase();
  const { projects } = useStore.getState();
  const exact = projects.find((p) => p.name.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = projects.find((p) => lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower));
  return partial?.id ?? null;
}

function findTask(title: unknown) {
  if (typeof title !== 'string' || !title.trim()) return undefined;
  const lower = title.trim().toLowerCase();
  const { tasks } = useStore.getState();
  return (
    tasks.find((t) => t.title.toLowerCase() === lower) ??
    tasks.find((t) => t.title.toLowerCase().includes(lower) || lower.includes(t.title.toLowerCase()))
  );
}

export interface ActionResult {
  success: boolean;
  message: string;
}

/** The ONLY place a NexusToolCall turns into a real store mutation — always invoked from an explicit user confirm, never automatically. */
export function executeNexusAction(call: NexusToolCall): ActionResult {
  const store = useStore.getState();
  const args = call.args ?? {};

  switch (call.name) {
    case 'createTask': {
      const title = str(args.title);
      if (!title) return { success: false, message: 'Missing a task title.' };
      store.addTask({
        title,
        description: str(args.description),
        projectId: findProjectId(args.projectName),
        category: str(args.category, 'General'),
        priority: (str(args.priority, 'Medium') as 'Low' | 'Medium' | 'High') || 'Medium',
        dueDate: resolveDate(args.dueDate),
        dueTime: str(args.dueTime) || null,
        endTime: str(args.endTime) || null,
        estimatedMinutes: num(args.estimatedMinutes, 30),
        ...(args.tags
          ? { tags: str(args.tags).split(',').map((t) => t.trim()).filter(Boolean) }
          : {}),
      });
      return { success: true, message: `Created task "${title}".` };
    }

    case 'updateTask': {
      const task = findTask(args.taskTitle);
      if (!task) return { success: false, message: `Couldn't find a task matching "${str(args.taskTitle)}".` };
      store.updateTask(task.id, {
        ...(args.priority ? { priority: args.priority as 'Low' | 'Medium' | 'High' } : {}),
        ...(args.status ? { status: args.status as never } : {}),
        ...(args.dueDate ? { dueDate: resolveDate(args.dueDate) } : {}),
        ...(args.dueTime ? { dueTime: str(args.dueTime) } : {}),
        ...(args.endTime ? { endTime: str(args.endTime) } : {}),
        ...(args.estimatedMinutes ? { estimatedMinutes: num(args.estimatedMinutes, task.estimatedMinutes) } : {}),
        ...(args.tags
          ? { tags: str(args.tags).split(',').map((t) => t.trim()).filter(Boolean) }
          : {}),
      });
      return { success: true, message: `Updated "${task.title}".` };
    }

    case 'completeTask': {
      const task = findTask(args.taskTitle);
      if (!task) return { success: false, message: `Couldn't find a task matching "${str(args.taskTitle)}".` };
      if (task.status !== 'Done') store.toggleTaskComplete(task.id);
      return { success: true, message: `Completed "${task.title}".` };
    }

    case 'createProject': {
      const name = str(args.name);
      if (!name) return { success: false, message: 'Missing a project name.' };
      store.addProject({ name, description: str(args.description) });
      return { success: true, message: `Created project "${name}".` };
    }

    case 'createIdea': {
      const title = str(args.title);
      if (!title) return { success: false, message: 'Missing an idea title.' };
      store.addIdea({
        title,
        description: str(args.description),
        tags: str(args.tags)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      return { success: true, message: `Saved idea "${title}".` };
    }

    case 'createCalendarEvent': {
      const title = str(args.title);
      const startTime = str(args.startTime);
      const endTime = str(args.endTime);
      if (!title || !startTime || !endTime) return { success: false, message: 'Missing title, start or end time.' };
      store.addEvent({ title, date: resolveDate(args.date), startTime, endTime });
      return { success: true, message: `Added "${title}" to the calendar.` };
    }

    case 'startTimer': {
      const category = str(args.category, 'General');
      const projectId = findProjectId(args.projectName);
      const projectName = str(args.projectName);
      store.startTimer({ category, projectId, label: projectName ? `${category} · ${projectName}` : category });
      return { success: true, message: 'Timer started.' };
    }

    case 'stopTimer': {
      store.stopTimer();
      return { success: true, message: 'Timer stopped.' };
    }

    default:
      return { success: false, message: `Unknown action "${call.name}".` };
  }
}
