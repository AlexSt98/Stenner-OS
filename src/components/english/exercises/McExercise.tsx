import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { EnglishExercise } from '../../../types';

export interface AnswerResult {
  correct: boolean;
  userResponse: string;
  score?: number;
}

interface McExerciseProps {
  exercise: EnglishExercise;
  onAnswered: (result: AnswerResult) => void;
}

/** Shared multiple-choice UI for grammar, vocabulary, business and (wrapped) listening exercises. */
export function McExercise({ exercise, onAnswered }: McExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const pick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === exercise.correctIndex;
    onAnswered({ correct, userResponse: exercise.options?.[i] ?? '' });
  };

  return (
    <div>
      <div className="space-y-2">
        {(exercise.options ?? []).map((opt, i) => {
          const isCorrect = i === exercise.correctIndex;
          const isSelected = i === selected;
          const answered = selected !== null;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={answered}
              className={`w-full text-left px-4 py-2.5 rounded-xl border text-[13.5px] transition-colors flex items-center justify-between gap-2 ${
                !answered
                  ? 'border-white/10 hover:border-violet-500/40 hover:bg-white/[0.03]'
                  : isCorrect
                    ? 'border-green-500/40 bg-green-500/10 text-green-300'
                    : isSelected
                      ? 'border-red-500/40 bg-red-500/10 text-red-300'
                      : 'border-white/10 opacity-50'
              }`}
            >
              <span>
                {String.fromCharCode(65 + i)}. {opt}
              </span>
              {answered && isCorrect && <Check size={15} />}
              {answered && isSelected && !isCorrect && <X size={15} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function McFeedback({ exercise, correct }: { exercise: EnglishExercise; correct: boolean }) {
  return (
    <div className={`mt-4 p-3.5 rounded-xl border text-[13px] ${correct ? 'border-green-500/25 bg-green-500/[0.06]' : 'border-red-500/25 bg-red-500/[0.06]'}`}>
      <div className={`font-semibold flex items-center gap-1.5 ${correct ? 'text-green-400' : 'text-red-400'}`}>
        {correct ? <Check size={14} /> : <X size={14} />} {correct ? 'Correct' : 'Incorrect'}
      </div>
      {exercise.definition && <p className="text-zinc-300 mt-1.5">{exercise.definition}</p>}
      <p className="text-zinc-400 mt-1.5 leading-relaxed">{exercise.explanation}</p>
    </div>
  );
}
