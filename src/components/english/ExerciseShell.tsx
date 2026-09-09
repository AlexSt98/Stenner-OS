import { ArrowRight } from 'lucide-react';
import type { EnglishExercise } from '../../types';
import { Button } from '../common/Button';

const TYPE_LABEL: Record<string, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  listening: 'Listening',
  dictation: 'Listening · Dictation',
  business: 'Business English',
  writing: 'Writing',
  speaking: 'Speaking',
};

const TYPE_COLOR: Record<string, string> = {
  grammar: '#8b5cf6',
  vocabulary: '#3b82f6',
  listening: '#eab308',
  dictation: '#eab308',
  business: '#22c55e',
  writing: '#ec4899',
  speaking: '#f97316',
};

interface ExerciseShellProps {
  exercise: EnglishExercise;
  index: number;
  total: number;
  answered: boolean;
  isLast: boolean;
  onNext: () => void;
  children: React.ReactNode;
  feedback?: React.ReactNode;
}

export function ExerciseShell({ exercise, index, total, answered, isLast, onNext, children, feedback }: ExerciseShellProps) {
  const color = TYPE_COLOR[exercise.type] ?? '#8b5cf6';
  return (
    <div className="stenner-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ color, background: `${color}1a` }}>
          {TYPE_LABEL[exercise.type] ?? exercise.type}
        </span>
        <span className="text-[11px] text-zinc-600">{exercise.topicTag}</span>
        <span className="ml-auto text-[11.5px] font-semibold text-zinc-500">
          {index + 1} / {total}
        </span>
      </div>

      <div className="flex items-center gap-1 mt-3 mb-4">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < index ? 'bg-violet-500' : i === index ? 'bg-violet-500/60' : 'bg-white/[0.06]'}`} />
        ))}
      </div>

      {exercise.scenario && <p className="text-[12.5px] text-zinc-500 italic mb-1.5">{exercise.scenario}</p>}
      <p className="text-[16px] font-semibold leading-snug mb-4">{exercise.prompt}</p>

      {children}

      {answered && feedback}

      {answered && (
        <div className="flex justify-end mt-5">
          <Button variant="primary" onClick={onNext}>
            {isLast ? 'Finish' : 'Next'} <ArrowRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
