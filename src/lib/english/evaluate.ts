import type { EnglishExercise } from '../../types';

// V1 has no external AI connected — this is a local heuristic evaluator, not
// a fake button. It checks for key phrases from the exercise, basic length,
// and a few professionalism markers. src/lib/integrations/ai.ts is the seam
// to swap this for a real model later without touching the exercise UI.

export interface WritingEvalResult {
  score: number; // 0-100
  passed: boolean; // score >= 60
  feedback: string[];
}

const POLITENESS_MARKERS = ['please', 'thank', 'appreciate', 'happy to', 'sure', 'could', 'would', 'let me know'];

export function evaluateWriting(userText: string, exercise: EnglishExercise): WritingEvalResult {
  const text = userText.trim();
  const lower = text.toLowerCase();
  const feedback: string[] = [];

  if (text.length === 0) {
    return { score: 0, passed: false, feedback: ['No answer submitted.'] };
  }

  let score = 30; // baseline for attempting

  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 8) {
    score += 15;
  } else {
    feedback.push('Try writing a bit more — aim for at least a full sentence or two.');
  }

  const keyPhrases = exercise.keyPhrases ?? [];
  const matched = keyPhrases.filter((kp) => lower.includes(kp.toLowerCase()));
  if (keyPhrases.length > 0) {
    score += Math.round((matched.length / keyPhrases.length) * 35);
    if (matched.length === 0) {
      feedback.push(`Consider phrases like "${keyPhrases[0]}" to sound more natural here.`);
    } else {
      feedback.push(`Good use of natural phrasing (e.g. "${matched[0]}").`);
    }
  }

  const politeness = POLITENESS_MARKERS.filter((p) => lower.includes(p));
  if (politeness.length > 0) {
    score += 10;
    feedback.push('Nice, professional tone.');
  }

  if (/[.!?]$/.test(text)) {
    score += 5;
  } else {
    feedback.push('End sentences with proper punctuation.');
  }

  if (text[0] && text[0] === text[0].toLowerCase() && /[a-z]/i.test(text[0])) {
    feedback.push('Remember to start with a capital letter.');
  } else {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));
  if (feedback.length === 0) feedback.push('Solid, professional response.');

  return { score, passed: score >= 60, feedback };
}

export interface SpeakingEvalResult {
  fluency: number;
  grammar: number;
  vocabulary: number;
  clarity: number;
  overall: number;
  passed: boolean;
  feedback: string[];
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically'];

export function evaluateSpeaking(transcript: string, exercise: EnglishExercise): SpeakingEvalResult {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const feedback: string[] = [];

  if (words.length === 0) {
    return { fluency: 0, grammar: 0, vocabulary: 0, clarity: 0, overall: 0, passed: false, feedback: ['No speech detected — try again.'] };
  }

  // Fluency: rewards a reasonably full response, penalizes filler words.
  const fillerCount = FILLER_WORDS.filter((f) => lower.includes(f)).length;
  const fluency = Math.max(20, Math.min(100, 60 + words.length * 2 - fillerCount * 10));

  // Vocabulary: overlap with the exercise's suggested key phrases.
  const keyPhrases = exercise.keyPhrases ?? [];
  const matched = keyPhrases.filter((kp) => lower.includes(kp.toLowerCase()));
  const vocabulary = keyPhrases.length > 0 ? Math.round(40 + (matched.length / keyPhrases.length) * 60) : 65;

  // Grammar: crude proxy — sentence-like structure and reasonable length.
  const hasVerbLikeStructure = /\b(i|we|it|this|they|that)\b/i.test(text);
  const grammar = Math.min(100, (hasVerbLikeStructure ? 60 : 40) + Math.min(30, words.length));

  // Clarity: not too short, not a wall of filler.
  const clarity = Math.max(20, Math.min(100, 80 - fillerCount * 15 + Math.min(20, words.length)));

  const overall = Math.round((fluency + grammar + vocabulary + clarity) / 4);

  if (fillerCount > 0) feedback.push(`Try cutting filler words like "${FILLER_WORDS.find((f) => lower.includes(f))}".`);
  if (matched.length > 0) feedback.push(`Good — you used natural phrasing (e.g. "${matched[0]}").`);
  if (words.length < 8) feedback.push('Try to speak a bit longer for a fuller answer.');
  if (feedback.length === 0) feedback.push('Clear, confident answer.');

  return { fluency, grammar, vocabulary, clarity, overall, passed: overall >= 60, feedback };
}
