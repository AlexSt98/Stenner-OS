import { CalendarClock, ListChecks, BarChart3, Users, Languages, Lightbulb, ArrowUpDown, CalendarDays } from 'lucide-react';

const QUICK_PROMPTS = [
  { icon: CalendarClock, text: 'Plan my day' },
  { icon: ListChecks, text: 'Review my tasks' },
  { icon: BarChart3, text: 'Analyze my productivity' },
  { icon: Users, text: 'Prepare me for a meeting' },
  { icon: Languages, text: 'Practice my English' },
  { icon: Lightbulb, text: 'Turn this idea into a task' },
  { icon: ArrowUpDown, text: 'Help me prioritize' },
  { icon: CalendarDays, text: 'Review my week' },
];

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_PROMPTS.map((p) => (
        <button
          key={p.text}
          onClick={() => onSelect(p.text)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-violet-500/30 text-[12px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <p.icon size={12} />
          {p.text}
        </button>
      ))}
    </div>
  );
}
