interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  trackClassName?: string;
  className?: string;
  height?: number;
}

export function ProgressBar({ value, color = 'var(--color-accent-purple)', trackClassName = '', className = '', height = 6 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`w-full rounded-full bg-white/[0.06] overflow-hidden ${trackClassName}`}
      style={{ height }}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${className}`}
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
