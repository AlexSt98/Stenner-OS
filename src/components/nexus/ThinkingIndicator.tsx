import type { NexusPhase } from '../../types/nexus';
import { NexusAvatar } from './NexusAvatar';

// Only reflects phases the backend actually reported (see onPhase in
// lib/nexus/client.ts) — never a guessed or fabricated state.
const PHASE_LABELS: Record<NexusPhase, string> = {
  thinking: 'NEXUS is thinking',
  searching: 'Searching the web...',
  generating_image: 'Generating image...',
};

export function ThinkingIndicator({ phase = 'thinking' }: { phase?: NexusPhase }) {
  return (
    <div className="flex gap-2.5">
      <NexusAvatar size={40} />
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm stenner-card flex items-center gap-2">
        <span className="text-[12.5px] text-zinc-500">{PHASE_LABELS[phase]}</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
        </span>
      </div>
    </div>
  );
}
