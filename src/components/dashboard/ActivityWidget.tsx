import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Plus, Pencil, Trash2, Lightbulb, FolderKanban, CalendarPlus, Play, Square, LayoutGrid, Star, SlidersHorizontal, GraduationCap, PartyPopper } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { timeAgo } from '../../lib/date';
import type { ActivityType } from '../../types';

const ICONS: Record<ActivityType, { icon: typeof Check; color: string }> = {
  task_completed: { icon: Check, color: 'text-green-400' },
  task_created: { icon: Plus, color: 'text-blue-400' },
  task_updated: { icon: Pencil, color: 'text-zinc-400' },
  task_deleted: { icon: Trash2, color: 'text-red-400' },
  idea_added: { icon: Lightbulb, color: 'text-yellow-400' },
  idea_converted: { icon: Lightbulb, color: 'text-yellow-400' },
  project_created: { icon: FolderKanban, color: 'text-violet-400' },
  project_updated: { icon: FolderKanban, color: 'text-violet-400' },
  event_created: { icon: CalendarPlus, color: 'text-blue-400' },
  timer_started: { icon: Play, color: 'text-green-400' },
  timer_stopped: { icon: Square, color: 'text-red-400' },
  board_created: { icon: LayoutGrid, color: 'text-pink-400' },
  level_up: { icon: Star, color: 'text-yellow-400' },
  settings_updated: { icon: SlidersHorizontal, color: 'text-zinc-400' },
  english_session_completed: { icon: GraduationCap, color: 'text-blue-400' },
  workday_complete: { icon: PartyPopper, color: 'text-green-400' },
};

export function ActivityWidget() {
  const navigate = useNavigate();
  const activities = useStore((s) => s.activities);

  return (
    <div className="stenner-card p-4">
      <div className="flex items-center mb-3.5">
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">RECENT ACTIVITY</h2>
        <button
          onClick={() => navigate('/stats')}
          className="ml-auto flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-white font-medium"
        >
          View all <ArrowRight size={11} />
        </button>
      </div>
      <div className="space-y-3">
        {activities.slice(0, 6).map((a) => {
          const meta = ICONS[a.type] ?? ICONS.settings_updated;
          const Icon = meta.icon;
          return (
            <div key={a.id} className="flex items-start gap-2.5">
              <div className={`w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 ${meta.color}`}>
                <Icon size={12} />
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] text-zinc-300 leading-snug">{a.message}</div>
                <div className="text-[10.5px] text-zinc-600 mt-0.5">{timeAgo(a.timestamp)}</div>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && <div className="text-[12.5px] text-zinc-500 py-4 text-center">Nothing yet — go make something.</div>}
      </div>
    </div>
  );
}
