import { Sparkles } from 'lucide-react';

export function ThinkingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm stenner-card flex items-center gap-2">
        <span className="text-[12.5px] text-zinc-500">NEXUS is thinking</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
        </span>
      </div>
    </div>
  );
}
