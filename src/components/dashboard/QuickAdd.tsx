import { useState } from 'react';
import { ArrowRight, CheckSquare, CalendarPlus, Lightbulb } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';
import { todayISO } from '../../lib/date';

type Kind = 'Task' | 'Event' | 'Idea';

export function QuickAdd() {
  const [kind, setKind] = useState<Kind>('Task');
  const [value, setValue] = useState('');
  const addTask = useStore((s) => s.addTask);
  const addEvent = useStore((s) => s.addEvent);
  const addIdea = useStore((s) => s.addIdea);
  const pushToast = useToastStore((s) => s.push);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    if (kind === 'Task') {
      addTask({ title: text, status: 'To Do', dueDate: todayISO() });
      pushToast('Task added');
    } else if (kind === 'Event') {
      addEvent({ title: text, date: todayISO(), startTime: '18:00', endTime: '19:00' });
      pushToast('Event added');
    } else {
      addIdea({ title: text });
      pushToast('Idea added');
    }
    setValue('');
  };

  const KIND_META: Record<Kind, { icon: typeof CheckSquare; color: string }> = {
    Task: { icon: CheckSquare, color: 'text-blue-400' },
    Event: { icon: CalendarPlus, color: 'text-violet-400' },
    Idea: { icon: Lightbulb, color: 'text-yellow-400' },
  };

  return (
    <div className="stenner-card p-4">
      <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300 mb-3">QUICK ADD</h2>
      <div className="flex items-center gap-1.5 mb-3">
        {(['Task', 'Event', 'Idea'] as Kind[]).map((k) => {
          const Meta = KIND_META[k];
          const active = kind === k;
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                active ? 'bg-white/[0.08] border-white/15 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Meta.icon size={13} className={active ? Meta.color : ''} />
              {k}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="What do you need to do?"
          className="stenner-input flex-1 px-3 py-2 text-[13px] placeholder:text-zinc-600"
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors"
        >
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
