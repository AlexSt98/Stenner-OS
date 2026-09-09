import { Target } from 'lucide-react';
import type { EnglishMistake } from '../../types';
import { Button } from '../common/Button';

interface NeedsPracticeProps {
  mistakes: EnglishMistake[];
  onPractice: () => void;
}

export function NeedsPractice({ mistakes, onPractice }: NeedsPracticeProps) {
  return (
    <div className="stenner-card p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <Target size={15} className="text-red-400" />
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">NEEDS PRACTICE</h2>
      </div>

      {mistakes.length === 0 ? (
        <p className="text-[12.5px] text-zinc-500 py-2">No weak spots yet — keep practicing to build your profile.</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {mistakes.slice(0, 5).map((m) => (
              <div key={m.topicTag} className="flex items-center justify-between text-[12.5px]">
                <span className="text-zinc-300">{m.topicTag}</span>
                <span className="text-red-400/80 font-medium">
                  {m.count} mistake{m.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={onPractice} className="w-full justify-center">
            Practice my weak areas
          </Button>
        </>
      )}
    </div>
  );
}
