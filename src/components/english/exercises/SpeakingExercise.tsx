import { useRef, useState } from 'react';
import { Mic, Square, Check, AlertTriangle } from 'lucide-react';
import type { EnglishExercise } from '../../../types';
import { evaluateSpeaking } from '../../../lib/english/evaluate';
import type { AnswerResult } from './McExercise';

// The Web Speech API's SpeechRecognition isn't in TS's DOM lib yet — this is
// the minimal shape STENNER OS actually uses.
interface MinimalRecognitionEvent {
  results: { [i: number]: { [j: number]: { transcript: string } }; length: number };
}
interface MinimalRecognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: MinimalRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognition(): MinimalRecognition | null {
  const w = window as unknown as { SpeechRecognition?: new () => MinimalRecognition; webkitSpeechRecognition?: new () => MinimalRecognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

interface SpeakingExerciseProps {
  exercise: EnglishExercise;
  onAnswered: (result: AnswerResult) => void;
}

export function SpeakingExercise({ exercise, onAnswered }: SpeakingExerciseProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ReturnType<typeof evaluateSpeaking> | null>(null);
  const recognitionRef = useRef<MinimalRecognition | null>(null);

  const supported = typeof window !== 'undefined' && !!getRecognition();

  const finish = (finalTranscript: string) => {
    const evaluated = evaluateSpeaking(finalTranscript, exercise);
    setResult(evaluated);
    onAnswered({ correct: evaluated.passed, userResponse: finalTranscript, score: evaluated.overall });
  };

  const startRecording = () => {
    const recognition = getRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    let collected = '';
    recognition.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++) collected += e.results[i][0].transcript + ' ';
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => {
      setRecording(false);
      setTranscript(collected.trim());
      finish(collected.trim());
    };
    setRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  if (!supported) {
    return (
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-yellow-500/25 bg-yellow-500/[0.06] text-[13px] text-yellow-300">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <div>
          Speech recognition isn't supported in this browser. Try Chrome or Edge on desktop — or type your answer instead.
          <TypedFallback exercise={exercise} onAnswered={onAnswered} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {!result && (
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[13.5px] transition-colors ${
            recording ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
          }`}
        >
          {recording ? <Square size={14} /> : <Mic size={14} />}
          {recording ? 'Stop recording' : 'Start Recording'}
        </button>
      )}
      {recording && <p className="text-[12px] text-zinc-500 mt-2 animate-pulse">Listening...</p>}

      {result && (
        <div className="space-y-3">
          <p className="text-[13px] text-zinc-400 italic">"{transcript || '(no speech captured)'}"</p>
          <div className="grid grid-cols-4 gap-2.5">
            {(
              [
                ['Fluency', result.fluency],
                ['Grammar', result.grammar],
                ['Vocabulary', result.vocabulary],
                ['Clarity', result.clarity],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="stenner-card px-2.5 py-2 text-center">
                <div className="text-[10px] text-zinc-500">{label}</div>
                <div className="text-[15px] font-bold mt-0.5">{val}</div>
              </div>
            ))}
          </div>
          <div className={`p-3.5 rounded-xl border text-[13px] ${result.passed ? 'border-green-500/25 bg-green-500/[0.06]' : 'border-yellow-500/25 bg-yellow-500/[0.06]'}`}>
            <div className={`font-semibold flex items-center gap-1.5 ${result.passed ? 'text-green-400' : 'text-yellow-400'}`}>
              <Check size={14} /> Overall: {result.overall}/100
            </div>
            <ul className="mt-2 space-y-1 text-zinc-400 list-disc list-inside">
              {result.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fallback so an unsupported browser never turns this into a dead exercise. */
function TypedFallback({ exercise, onAnswered }: SpeakingExerciseProps) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="mt-3">
      <textarea
        disabled={done}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="stenner-input w-full px-3 py-2 text-[13px]"
        placeholder="Type what you would say..."
      />
      {!done && (
        <button
          onClick={() => {
            const evaluated = evaluateSpeaking(text, exercise);
            onAnswered({ correct: evaluated.passed, userResponse: text, score: evaluated.overall });
            setDone(true);
          }}
          disabled={!text.trim()}
          className="mt-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
        >
          Submit
        </button>
      )}
    </div>
  );
}
