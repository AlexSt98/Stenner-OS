import { useState } from 'react';
import type { EnglishExercise, EnglishAnswer, EnglishSession } from '../../types';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';
import { todayISO } from '../../lib/date';
import { XP_BY_TYPE, pickChallengeExercise } from '../../lib/english/exercises';
import { ExerciseShell } from './ExerciseShell';
import { McExercise, McFeedback, type AnswerResult } from './exercises/McExercise';
import { ListeningExercise } from './exercises/ListeningExercise';
import { DictationExercise } from './exercises/DictationExercise';
import { WritingExercise } from './exercises/WritingExercise';
import { SpeakingExercise } from './exercises/SpeakingExercise';

interface SessionRunnerProps {
  initialExercises: EnglishExercise[];
  mode: 'daily' | 'weak-areas';
  appendChallenge?: boolean;
  onFinish: (session: EnglishSession) => void;
}

export function SessionRunner({ initialExercises, mode, appendChallenge = false, onFinish }: SessionRunnerProps) {
  const recordEnglishSession = useStore((s) => s.recordEnglishSession);
  const addEnglishXp = useStore((s) => s.addEnglishXp);
  const pushToast = useToastStore((s) => s.push);

  const [exercises, setExercises] = useState(initialExercises);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<EnglishAnswer[]>([]);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);

  const total = appendChallenge ? 10 : initialExercises.length;
  const current = exercises[currentIndex];
  if (!current) return null;

  const answered = answers.length > currentIndex;

  const handleAnswered = (result: AnswerResult) => {
    setLastResult(result);
    const xpEarned = result.correct ? XP_BY_TYPE[current.type] : 0;
    if (xpEarned > 0) {
      addEnglishXp(xpEarned);
      pushToast(`+${xpEarned} XP`, 'xp');
    }
    const answer: EnglishAnswer = {
      exerciseId: current.id,
      type: current.type,
      topicTag: current.topicTag,
      correct: result.correct,
      score: result.score,
      userResponse: result.userResponse,
      xpEarned,
      timestamp: new Date().toISOString(),
    };
    setAnswers((prev) => [...prev, answer]);
  };

  const handleNext = () => {
    const isFinal = currentIndex === total - 1;
    if (!isFinal) {
      if (appendChallenge && currentIndex === initialExercises.length - 1 && exercises.length === initialExercises.length) {
        const missed = answers
          .filter((a) => !a.correct)
          .map((a) => exercises.find((e) => e.id === a.exerciseId))
          .filter((e): e is EnglishExercise => !!e);
        const challenge = pickChallengeExercise(
          todayISO(),
          missed,
          exercises.map((e) => e.id)
        );
        setExercises((prev) => [...prev, challenge]);
      }
      setCurrentIndex((i) => i + 1);
      setLastResult(null);
      return;
    }
    const session = recordEnglishSession({ mode, exerciseIds: exercises.map((e) => e.id), answers });
    onFinish(session);
  };

  const renderExercise = () => {
    // Keyed by exercise id so each question mounts fresh — otherwise a picked
    // answer/typed draft would "leak" into the next question's component state.
    switch (current.type) {
      case 'listening':
        return <ListeningExercise key={current.id} exercise={current} onAnswered={handleAnswered} />;
      case 'dictation':
        return <DictationExercise key={current.id} exercise={current} onAnswered={handleAnswered} />;
      case 'writing':
        return <WritingExercise key={current.id} exercise={current} onAnswered={handleAnswered} />;
      case 'speaking':
        return <SpeakingExercise key={current.id} exercise={current} onAnswered={handleAnswered} />;
      default:
        return <McExercise key={current.id} exercise={current} onAnswered={handleAnswered} />;
    }
  };

  const showsMcFeedback = current.type === 'grammar' || current.type === 'vocabulary' || current.type === 'business' || current.type === 'listening';

  return (
    <ExerciseShell
      exercise={current}
      index={currentIndex}
      total={total}
      answered={answered}
      isLast={currentIndex === total - 1}
      onNext={handleNext}
      feedback={showsMcFeedback && lastResult ? <McFeedback exercise={current} correct={lastResult.correct} /> : undefined}
    >
      {renderExercise()}
    </ExerciseShell>
  );
}
