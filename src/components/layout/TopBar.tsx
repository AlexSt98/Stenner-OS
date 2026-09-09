import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, CheckSquare, FolderKanban, Lightbulb } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { timeAgo } from '../../lib/date';
import { RunningTimerPill } from './RunningTimerPill';

export function TopBar() {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const ideas = useStore((s) => s.ideas);
  const activities = useStore((s) => s.activities);
  const isDark = settings.theme !== 'light';

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(searchRef, () => setSearchOpen(false));
  useOnClickOutside(notifRef, () => setNotifOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { tasks: [], projects: [], ideas: [] };
    return {
      tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 4),
      projects: projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 3),
      ideas: ideas.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [query, tasks, projects, ideas]);

  const hasResults = results.tasks.length + results.projects.length + results.ideas.length > 0;

  return (
    <div className="flex items-center gap-3 px-6 py-3.5 border-b border-[var(--color-border-soft)] sticky top-0 z-30 bg-[var(--color-bg)]/85 backdrop-blur">
      <div className="relative w-full max-w-xs" ref={searchRef}>
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search anything..."
          className="stenner-input w-full pl-8 pr-12 py-1.5 text-[12.5px] placeholder:text-zinc-600"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 border border-white/10 rounded px-1 py-0.5">
          ⌘K
        </span>

        {searchOpen && query.trim() && (
          <div className="absolute top-full mt-2 left-0 w-[340px] stenner-card shadow-2xl z-40 p-1.5 animate-stenner-fade-in">
            {!hasResults && (
              <div className="px-3 py-4 text-[12.5px] text-zinc-500 text-center">No results for "{query}"</div>
            )}
            {results.tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  navigate('/tasks');
                  setSearchOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left"
              >
                <CheckSquare size={13} className="text-blue-400 shrink-0" />
                <span className="text-[12.5px] truncate">{t.title}</span>
                <span className="ml-auto text-[10px] text-zinc-500 shrink-0">Task</span>
              </button>
            ))}
            {results.projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  navigate('/projects');
                  setSearchOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left"
              >
                <FolderKanban size={13} className="text-violet-400 shrink-0" />
                <span className="text-[12.5px] truncate">{p.name}</span>
                <span className="ml-auto text-[10px] text-zinc-500 shrink-0">Project</span>
              </button>
            ))}
            {results.ideas.map((i) => (
              <button
                key={i.id}
                onClick={() => {
                  navigate('/ideas');
                  setSearchOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left"
              >
                <Lightbulb size={13} className="text-yellow-400 shrink-0" />
                <span className="text-[12.5px] truncate">{i.title}</span>
                <span className="ml-auto text-[10px] text-zinc-500 shrink-0">Idea</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <RunningTimerPill />

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Bell size={16} />
            {activities.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pink-500" />}
          </button>
          {notifOpen && (
            <div className="absolute top-full mt-2 right-0 w-[300px] stenner-card shadow-2xl z-40 p-1.5 animate-stenner-fade-in">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 tracking-wide">RECENT ACTIVITY</div>
              {activities.slice(0, 6).map((a) => (
                <div key={a.id} className="px-2.5 py-2 rounded-lg hover:bg-white/[0.05]">
                  <div className="text-[12px] text-zinc-200 leading-snug">{a.message}</div>
                  <div className="text-[10.5px] text-zinc-500 mt-0.5">{timeAgo(a.timestamp)}</div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="px-3 py-4 text-[12.5px] text-zinc-500 text-center">Nothing yet</div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
          title="Theme toggle — V1 ships dark-only, preference is saved for later"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {isDark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </div>
  );
}
