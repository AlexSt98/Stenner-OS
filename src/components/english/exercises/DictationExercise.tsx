import { useState } from 'react';
import { Volume2, Check, X } from 'lucide-react';
import type { EnglishExercise } from '../../../types';
import { checkDictation } from '../../../lib/english/dictation';
import { speakText, speechSynthesisSupported } from '../../../lib/english/speech';
import { TextInput } from '../../common/Fields';
import { Button } from '../../common/Button';
import type { AnswerResult } from './McExercise';

interface DictationExerciseProps {
  exercise: EnglishExercise;
  onAnswered: (result: AnswerResult) => void;
}

export function DictationExercise({ exercise, onAnswered }: DictationExerciseProps) {
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);

  const check = () => {
    if (checked) return;
    const result = checkDictation(value, exercise.audioText ?? '');
    setCorrect(result.correct);
    setChecked(true);
    onAnswered({ correct: result.correct, userResponse: value });
  };

  return (
    <div>
      <button
        onClick={() => speakText(exercise.audioText ?? '')}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-[13px] font-semibold transition-colors mb-4"
      >
        <Volume2 size={14} /> Play
      </button>
      {!speechSynthesisSupported && <p className="text-[13px] text-zinc-300 italic mb-3">"{exercise.audioText}"</p>}

      <TextInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={checked}
        placeholder="Type exactly what you hear..."
        onKeyDown={(e) => e.key === 'Enter' && check()}
      />
      {!checked && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={check} disabled={!value.trim()}>
          Check answer
        </Button>
      )}

      {checked && (
        <div className={`mt-4 p-3.5 rounded-xl border text-[13px] ${correct ? 'border-green-500/25 bg-green-500/[0.06]' : 'border-red-500/25 bg-red-500/[0.06]'}`}>
          <div className={`font-semibold flex items-center gap-1.5 ${correct ? 'text-green-400' : 'text-red-400'}`}>
            {correct ? <Check size={14} /> : <X size={14} />} {correct ? 'Correct' : 'Not quite'}
          </div>
          <p className="text-zinc-400 mt-1.5">
            Expected: <span className="text-zinc-200">"{exercise.audioText}"</span>
          </p>
        </div>
      )}
    </div>
  );
}
