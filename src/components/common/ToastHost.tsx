import { Sparkles } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-stenner-xp-float flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-semibold shadow-lg ${
            t.kind === 'xp'
              ? 'bg-violet-600/90 border-violet-400/40 text-white'
              : 'bg-zinc-900/95 border-white/10 text-zinc-200'
          }`}
        >
          {t.kind === 'xp' && <Sparkles size={14} />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
