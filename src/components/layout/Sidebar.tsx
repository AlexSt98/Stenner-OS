import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Home,
  Briefcase,
  CheckSquare,
  Calendar,
  Clock,
  LayoutGrid,
  Lightbulb,
  FolderKanban,
  Languages,
  BarChart2,
  BrainCircuit,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { NexusAvatar } from '../nexus/NexusAvatar';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/nexus', label: 'NEXUS', icon: BrainCircuit },
  { to: '/teopm', label: 'TEOPM', icon: Briefcase },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/time-tracker', label: 'Time Tracker', icon: Clock },
  { to: '/boards', label: 'Boards', icon: LayoutGrid },
  { to: '/ideas', label: 'Ideas Vault', icon: Lightbulb },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/english', label: 'English Lab', icon: Languages },
  { to: '/stats', label: 'Stats', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const settings = useStore((s) => s.settings);

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)]">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold tracking-wide">STENNER OS</div>
            <div className="text-[9px] text-zinc-500 tracking-widest">v1.0</div>
          </div>
        </div>
        <div className="text-[9px] text-zinc-600 mt-2 tracking-wide">YOUR CREATIVE COMMAND CENTER</div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`
            }
          >
            {({ isActive }) =>
              item.to === '/nexus' && isActive ? (
                <>
                  <NexusAvatar size={18} />
                  {item.label}
                </>
              ) : (
                <>
                  <item.icon size={16} />
                  {item.label}
                </>
              )
            }
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--color-border-soft)]">
        <NavLink
          to="/settings"
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-[15px] shrink-0">
            {settings.avatarEmoji}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[12.5px] font-semibold truncate">{settings.name}</div>
            <div className="text-[10.5px] text-zinc-500 truncate">{settings.role}</div>
          </div>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
