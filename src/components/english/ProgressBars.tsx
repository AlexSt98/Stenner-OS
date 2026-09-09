import type { EnglishProgress } from '../../types';
import { ProgressBar } from '../common/ProgressBar';

const LABELS: { key: keyof EnglishProgress; label: string; color: string }[] = [
  { key: 'grammar', label: 'Grammar', color: '#8b5cf6' },
  { key: 'vocabulary', label: 'Vocabulary', color: '#3b82f6' },
  { key: 'listening', label: 'Listening', color: '#eab308' },
  { key: 'business', label: 'Business English', color: '#22c55e' },
  { key: 'writing', label: 'Writing', color: '#ec4899' },
  { key: 'speaking', label: 'Speaking', color: '#f97316' },
];

export function ProgressBars({ progress }: { progress: EnglishProgress }) {
  return (
    <div className="space-y-3">
      {LABELS.map(({ key, label, color }) => (
        <div key={key}>
          <div className="flex items-center justify-between text-[12.5px] mb-1">
            <span className="text-zinc-300">{label}</span>
            <span className="text-zinc-500">{progress[key]}%</span>
          </div>
          <ProgressBar value={progress[key]} color={color} />
        </div>
      ))}
    </div>
  );
}
