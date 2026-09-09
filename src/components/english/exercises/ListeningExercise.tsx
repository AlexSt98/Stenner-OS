import { useState } from 'react';
import { Volume2, Headphones } from 'lucide-react';
import type { EnglishExercise } from '../../../types';
import { McExercise, type AnswerResult } from './McExercise';
import { speakText, speechSynthesisSupported } from '../../../lib/english/speech';

interface ListeningExerciseProps {
  exercise: EnglishExercise;
  onAnswered: (result: AnswerResult) => void;
}

export function ListeningExercise({ exercise, onAnswered }: ListeningExerciseProps) {
  const [played, setPlayed] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Headphones size={14} className="text-yellow-400" />
        <button
          onClick={() => {
            const ok = speakText(exercise.audioText ?? '');
            if (ok) setPlayed(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-[13px] font-semibold transition-colors"
        >
          <Volume2 size={14} /> Play audio
        </button>
        {!speechSynthesisSupported && (
          <span className="text-[11.5px] text-zinc-500">Your browser doesn't support audio playback — read the transcript below instead.</span>
        )}
        {!speechSynthesisSupported && <span className="text-[13px] text-zinc-300 italic">"{exercise.audioText}"</span>}
      </div>
      {played && speechSynthesisSupported && (
        <button onClick={() => speakText(exercise.audioText ?? '')} className="text-[11.5px] text-zinc-500 hover:text-zinc-300 mb-3 -mt-2 block">
          Play again
        </button>
      )}
      <McExercise exercise={exercise} onAnswered={onAnswered} />
    </div>
  );
}
