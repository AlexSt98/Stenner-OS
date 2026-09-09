import { useState } from 'react';
import { Check, X, PenLine } from 'lucide-react';
import type { EnglishExercise } from '../../../types';
import { evaluateWriting } from '../../../lib/english/evaluate';
import { TextArea } from '../../common/Fields';
import { Button } from '../../common/Button';
import type { AnswerResult } from './McExercise';

interface WritingExerciseProps {
  exercise: EnglishExercise;
  onAnswered: (result: AnswerResult) => void;
}

export function WritingExercise({ exercise, onAnswered }: WritingExerciseProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof evaluateWriting> | null>(null);

  const check = () => {
    if (result) return;
    const evaluated = evaluateWriting(text, exercise);
    setResult(evaluated);
    onAnswered({ correct: evaluated.passed, userResponse: text, score: evaluated.score });
  };

  return (
    <div>
      <TextArea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!result}
        placeholder="Write your response..."
      />
      {!result && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={check} disabled={!text.trim()}>
          <PenLine size={13} /> Check
        </Button>
      )}

      {result && (
        <div className={`mt-4 p-3.5 rounded-xl border text-[13px] ${result.passed ? 'border-green-500/25 bg-green-500/[0.06]' : 'border-yellow-500/25 bg-yellow-500/[0.06]'}`}>
          <div className={`font-semibold flex items-center gap-1.5 ${result.passed ? 'text-green-400' : 'text-yellow-400'}`}>
            {result.passed ? <Check size={14} /> : <X size={14} />} Score: {result.score}/100
          </div>
          <ul className="mt-2 space-y-1 text-zinc-400 list-disc list-inside">
            {result.feedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {exercise.modelAnswer && (
            <p className="text-zinc-500 mt-2 pt-2 border-t border-white/10">
              Model answer: <span className="text-zinc-300 italic">"{exercise.modelAnswer}"</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
