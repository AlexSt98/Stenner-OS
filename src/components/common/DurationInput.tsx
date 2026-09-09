import { TextInput } from './Fields';

interface DurationInputProps {
  minutes: number;
  onChange: (minutes: number) => void;
}

/** Two small H / M fields that combine into a single minutes value — used anywhere "1h 30m" needs editing. */
export function DurationInput({ minutes, onChange }: DurationInputProps) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <TextInput
          type="number"
          min={0}
          value={h}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0) * 60 + m)}
          className="w-16 text-center"
        />
        <span className="text-[12px] text-zinc-500">h</span>
      </div>
      <div className="flex items-center gap-1.5">
        <TextInput
          type="number"
          min={0}
          max={59}
          step={5}
          value={m}
          onChange={(e) => onChange(h * 60 + Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
          className="w-16 text-center"
        />
        <span className="text-[12px] text-zinc-500">m</span>
      </div>
    </div>
  );
}
