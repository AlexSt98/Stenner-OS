import { useMemo, useState } from 'react';
import { Flame, Star, CheckCircle2, ArrowLeft, PartyPopper } from 'lucide-react';
import { useStore } from '../store/useStore';
import { todayISO } from '../lib/date';
import { englishSessionForDate, englishProgressByType, englishMistakesByTopic } from '../store/selectors';
import { ENGLISH_EXERCISES, getDailyNine } from '../lib/english/exercises';
import { Button } from '../components/common/Button';
import { ProgressBars } from '../components/english/ProgressBars';
import { NeedsPractice } from '../components/english/NeedsPractice';
import { SessionRunner } from '../components/english/SessionRunner';
import type { EnglishSession } from '../types';

type Mode = 'dashboard' | 'daily' | 'weak-areas' | 'summary';

export function EnglishLabPage() {
  const englishSessions = useStore((s) => s.englishSessions);
  const englishStats = useStore((s) => s.englishStats);
  const [mode, setMode] = useState<Mode>('dashboard');
  const [summary, setSummary] = useState<EnglishSession | null>(null);

  const today = todayISO();
  const todaySession = englishSessionForDate(englishSessions, today);
  const progress = useMemo(() => englishProgressByType(englishSessions), [englishSessions]);
  const mistakes = useMemo(() => englishMistakesByTopic(englishSessions), [englishSessions]);
  const dailyNine = useMemo(() => getDailyNine(today), [today]);

  const weakExercises = useMemo(() => {
    const tags = mistakes.map((m) => m.topicTag);
    const pool = ENGLISH_EXERCISES.filter((e) => tags.includes(e.topicTag));
    return pool.slice(0, 10);
  }, [mistakes]);

  if (mode === 'daily') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <BackBar onBack={() => setMode('dashboard')} />
        <SessionRunner
          initialExercises={dailyNine}
          mode="daily"
          appendChallenge
          onFinish={(session) => {
            setSummary(session);
            setMode('summary');
          }}
        />
      </div>
    );
  }

  if (mode === 'weak-areas') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <BackBar onBack={() => setMode('dashboard')} />
        <SessionRunner
          initialExercises={weakExercises}
          mode="weak-areas"
          onFinish={(session) => {
            setSummary(session);
            setMode('summary');
          }}
        />
      </div>
    );
  }

  if (mode === 'summary' && summary) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="stenner-card p-8 text-center">
          <PartyPopper size={32} className="text-yellow-400 mx-auto mb-3" />
          <h1 className="text-[22px] font-bold">Session complete!</h1>
          <p className="text-[14px] text-zinc-400 mt-1.5">
            Score: {summary.score} / {summary.exerciseIds.length} · +{summary.xpEarned} XP
          </p>
          {summary.mode === 'daily' && (
            <p className="text-[13px] text-orange-400 mt-2 flex items-center justify-center gap-1.5">
              <Flame size={14} /> {englishStats.streak} day streak
            </p>
          )}
          <Button variant="primary" className="mt-6" onClick={() => setMode('dashboard')}>
            Back to English Lab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-[20px] font-bold flex items-center gap-2">🇬🇧 ENGLISH LAB</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">Your daily space to practice English — part of the same system, not a school app.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <div className="stenner-card p-5 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wide text-zinc-500">DAILY PRACTICE</div>
            <div className="text-[18px] font-bold mt-1.5">10 exercises · ~8 minutes</div>
            <p className="text-[12.5px] text-zinc-500 mt-1">A quick mix of grammar, vocabulary, listening, business English, writing and speaking.</p>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <Button variant="primary" onClick={() => setMode('daily')}>
              {todaySession ? 'Practice again' : "Start Today's Practice"}
            </Button>
            {todaySession && (
              <span className="flex items-center gap-1.5 text-[12.5px] text-green-400 font-medium">
                <CheckCircle2 size={14} /> Today's Score: {todaySession.score} / {todaySession.exerciseIds.length}
              </span>
            )}
          </div>
        </div>

        <div className="stenner-card p-5 flex flex-col justify-center gap-4">
          <div className="flex items-center gap-2.5">
            <Flame size={18} className="text-orange-400" />
            <div>
              <div className="text-[18px] font-bold leading-none">{englishStats.streak} days</div>
              <div className="text-[11px] text-zinc-500 mt-1">Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Star size={18} className="text-yellow-400" />
            <div>
              <div className="text-[18px] font-bold leading-none">+{todaySession?.xpEarned ?? 0}</div>
              <div className="text-[11px] text-zinc-500 mt-1">XP today</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="stenner-card p-5">
          <div className="text-[12.5px] font-bold tracking-wide text-zinc-300 mb-3.5">ENGLISH PROGRESS</div>
          <ProgressBars progress={progress} />
        </div>
        <NeedsPractice mistakes={mistakes} onPractice={() => setMode('weak-areas')} />
      </div>
    </div>
  );
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-white">
      <ArrowLeft size={13} /> Back to English Lab
    </button>
  );
}
