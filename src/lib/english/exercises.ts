import type { EnglishExercise, EnglishExerciseType } from '../../types';

export const XP_BY_TYPE: Record<EnglishExerciseType, number> = {
  grammar: 10,
  vocabulary: 10,
  business: 15,
  listening: 20,
  dictation: 20,
  writing: 15,
  speaking: 30,
};

// A hand-written question bank. Not AI-generated — deterministic and free to
// run fully offline. getDailyExercises() below rotates through it so V1
// never needs a network call, but the shape is what a future generator
// (src/lib/integrations/ai.ts) would need to produce to slot in seamlessly.

export const ENGLISH_EXERCISES: EnglishExercise[] = [
  // ── Grammar ──────────────────────────────────────────────
  {
    id: 'g1',
    type: 'grammar',
    topicTag: 'Past Simple vs Present Perfect',
    prompt: 'Which sentence is correct?',
    options: ['I have sent the email yesterday.', 'I sent the email yesterday.', 'I have send the email yesterday.'],
    correctIndex: 1,
    explanation: "Use Past Simple with a finished time reference like \"yesterday.\" Present Perfect (\"have sent\") pairs with unfinished time frames like \"today\" or \"this week,\" or no specific time at all.",
  },
  {
    id: 'g2',
    type: 'grammar',
    topicTag: 'Prepositions',
    prompt: 'The meeting is scheduled ______ Monday ______ 10 AM.',
    options: ['on / at', 'in / on', 'at / in', 'on / in'],
    correctIndex: 0,
    explanation: 'Use "on" with days of the week and "at" with clock times: on Monday, at 10 AM.',
  },
  {
    id: 'g3',
    type: 'grammar',
    topicTag: 'Present Perfect Continuous',
    prompt: 'She ______ working here since 2021.',
    options: ['is', 'has been', 'was', 'had'],
    correctIndex: 1,
    explanation: '"Since 2021" signals an action that started in the past and continues now — Present Perfect Continuous ("has been working").',
  },
  {
    id: 'g4',
    type: 'grammar',
    topicTag: 'Conditionals',
    prompt: 'If I ______ more time, I would finish the report today.',
    options: ['have', 'had', 'has', 'having'],
    correctIndex: 1,
    explanation: 'Second conditional (hypothetical present): If + past simple, ... would + base verb.',
  },
  {
    id: 'g5',
    type: 'grammar',
    topicTag: 'Subject-Verb Agreement',
    prompt: 'Neither the designer nor the developers ______ available today.',
    options: ['is', 'are', 'was', 'be'],
    correctIndex: 1,
    explanation: 'With "neither...nor," the verb agrees with the noun closest to it — "the developers" is plural, so "are."',
  },

  // ── Vocabulary ───────────────────────────────────────────
  {
    id: 'v1',
    type: 'vocabulary',
    topicTag: 'Business vocabulary',
    prompt: 'We need to finish this before the client ______.',
    options: ['feedback', 'deadline', 'meeting', 'schedule'],
    correctIndex: 1,
    definition: 'Deadline (noun): the latest time by which something must be completed.',
    explanation: '"Deadline" fits — a time limit set by the client for finishing the work.',
  },
  {
    id: 'v2',
    type: 'vocabulary',
    topicTag: 'Verb forms',
    prompt: 'Could you ______ me a quick summary of the report?',
    options: ['send', 'sending', 'sent', 'to send'],
    correctIndex: 0,
    definition: 'After the modal "could," verbs take their base form.',
    explanation: 'Modals like "could," "can," "should" are always followed by the base form: "could send," not "could sending."',
  },
  {
    id: 'v3',
    type: 'vocabulary',
    topicTag: 'Word forms',
    prompt: 'The new update will ______ the loading speed significantly.',
    options: ['improve', 'improving', 'improvement', 'improves'],
    correctIndex: 0,
    definition: 'Improve (verb): to make or become better.',
    explanation: 'After "will," use the base form of the verb: "will improve."',
  },
  {
    id: 'v4',
    type: 'vocabulary',
    topicTag: 'Business vocabulary',
    prompt: "Let's ______ a meeting for next Tuesday.",
    options: ['do', 'make', 'schedule', 'take'],
    correctIndex: 2,
    definition: 'Schedule (verb): to arrange for something to happen at a particular time.',
    explanation: '"Schedule a meeting" is the natural collocation in business English.',
  },
  {
    id: 'v5',
    type: 'vocabulary',
    topicTag: 'Adjectives',
    prompt: "He's very ______ — he always catches small errors before launch.",
    options: ['detail-oriented', 'detailed-orient', 'detail-orienting', 'detailer'],
    correctIndex: 0,
    definition: 'Detail-oriented (adj.): paying close attention to small elements of a task.',
    explanation: '"Detail-oriented" is the standard compound adjective used on resumes and in performance reviews.',
  },

  // ── Listening ────────────────────────────────────────────
  {
    id: 'l1',
    type: 'listening',
    topicTag: 'Listening comprehension',
    audioText: 'Could you send me the updated presentation before the meeting?',
    prompt: 'What does the speaker ask you to do?',
    options: ['Join the meeting', 'Send the presentation', 'Cancel the meeting', 'Create a new presentation'],
    correctIndex: 1,
    explanation: 'The speaker directly asks: "Could you send me the updated presentation..."',
  },
  {
    id: 'l2',
    type: 'listening',
    topicTag: 'Listening comprehension',
    audioText: 'The client asked us to move the deadline to next Friday.',
    prompt: 'What happened to the deadline?',
    options: ['It was cancelled', 'It was moved earlier', 'It was moved to next Friday', 'It stayed the same'],
    correctIndex: 2,
    explanation: 'The sentence says the deadline was moved "to next Friday" — a later date, not earlier or unchanged.',
  },
  {
    id: 'l3',
    type: 'listening',
    topicTag: 'Listening comprehension',
    audioText: 'I think we should redesign the logo before launching the new website.',
    prompt: 'What does the speaker suggest?',
    options: ['Launch the website first', 'Redesign the logo first', 'Cancel the launch', 'Hire a new designer'],
    correctIndex: 1,
    explanation: 'The speaker says the logo redesign should happen "before launching," i.e., first.',
  },
  {
    id: 'l4',
    type: 'listening',
    topicTag: 'Listening comprehension',
    audioText: 'Our weekly meeting has been moved from Monday to Wednesday at 3 PM.',
    prompt: 'When is the meeting now?',
    options: ['Monday at 3 PM', 'Wednesday at 3 PM', 'Wednesday at 10 AM', 'Monday morning'],
    correctIndex: 1,
    explanation: 'The meeting moved TO Wednesday, at the time stated: 3 PM.',
  },

  // ── Listening dictation ──────────────────────────────────
  { id: 'd1', type: 'dictation', topicTag: 'Dictation', audioText: 'Can you send me the file today?', prompt: 'Type exactly what you hear.', explanation: 'Listen for the full question, including "today" at the end.' },
  { id: 'd2', type: 'dictation', topicTag: 'Dictation', audioText: 'The meeting starts at eleven o\'clock.', prompt: 'Type exactly what you hear.', explanation: 'Note the time phrase "eleven o\'clock."' },
  { id: 'd3', type: 'dictation', topicTag: 'Dictation', audioText: "I'll follow up with you by email.", prompt: 'Type exactly what you hear.', explanation: '"Follow up" is a common two-word business verb.' },

  // ── Business English ─────────────────────────────────────
  {
    id: 'b1',
    type: 'business',
    topicTag: 'Workplace conversations',
    scenario: 'Your manager says:',
    prompt: '"Could you walk me through the changes?"',
    options: [
      'Yes, I can explain you the changes.',
      'Sure, let me walk you through the main changes.',
      'Yes, I walked the changes.',
      'I explain the changes for you.',
    ],
    correctIndex: 1,
    explanation: '"Walk someone through something" is the natural phrase — mirroring it back sounds fluent and professional.',
  },
  {
    id: 'b2',
    type: 'business',
    topicTag: 'Emails',
    scenario: "You're writing to a client who is unhappy about a delay.",
    prompt: 'Which opening line is the most professional?',
    options: [
      "Sorry the thing is late.",
      'We apologize for the delay and appreciate your patience.',
      "It's not really our fault it's late.",
      'The delay happened, sorry.',
    ],
    correctIndex: 1,
    explanation: 'A professional apology acknowledges the issue directly and thanks the client — no excuses, no vague "the thing."',
  },
  {
    id: 'b3',
    type: 'business',
    topicTag: 'Meetings',
    scenario: 'In a meeting, someone shares an idea you disagree with.',
    prompt: 'Which is the most diplomatic response?',
    options: [
      "That's a bad idea.",
      'I see your point, but have we considered this alternative?',
      "No, that won't work.",
      'I disagree completely.',
    ],
    correctIndex: 1,
    explanation: 'Acknowledging the point before offering an alternative keeps the conversation collaborative.',
  },
  {
    id: 'b4',
    type: 'business',
    topicTag: 'Presentations',
    scenario: "You're presenting quarterly results.",
    prompt: 'Which phrase best introduces a chart?',
    options: ['Look at this.', 'As you can see in this chart, revenue grew by 12%.', "Here's a chart.", 'This is the chart I made.'],
    correctIndex: 1,
    explanation: '"As you can see in this chart..." is the standard presentation phrase that connects the visual to your point.',
  },
  {
    id: 'b5',
    type: 'business',
    topicTag: 'Workplace conversations',
    scenario: 'A coworker asks for help with a task close to a deadline.',
    prompt: 'Which response sounds most professional?',
    options: [
      'I\'m busy, ask someone else.',
      "Sure, I can help — let me finish this first and I'll join you in 10 minutes.",
      'Not now.',
      "Maybe later, I don't know.",
    ],
    correctIndex: 1,
    explanation: 'It says yes, sets a clear expectation, and stays polite — professional and realistic.',
  },

  // ── Writing ──────────────────────────────────────────────
  {
    id: 'w1',
    type: 'writing',
    topicTag: 'Professional emails',
    scenario: 'Your coworker asks:',
    prompt: '"Can you send me the file today?" — Write a short, professional response.',
    modelAnswer: "Sure, I'll send it over by the end of the day.",
    keyPhrases: ['sure', 'send', 'today', 'end of the day', 'will'],
    explanation: 'A strong reply confirms clearly ("sure" / "yes") and commits to a timeframe ("by the end of the day").',
  },
  {
    id: 'w2',
    type: 'writing',
    topicTag: 'Emails',
    scenario: 'A client emails asking why the project is delayed.',
    prompt: 'Write a short, professional explanation (2–3 sentences).',
    modelAnswer:
      "Thank you for reaching out. We ran into an unexpected issue that pushed the timeline back, and we're working to deliver as soon as possible. We appreciate your patience.",
    keyPhrases: ['thank you', 'apologize', 'delay', 'update', 'appreciate', 'sorry'],
    explanation: 'Good delay emails acknowledge the client, briefly explain the cause, and thank them for patience — no over-explaining.',
  },
  {
    id: 'w3',
    type: 'writing',
    topicTag: 'Workplace conversations',
    scenario: 'Your manager asks for a quick status update on your project.',
    prompt: 'Write a brief update (2–3 sentences).',
    modelAnswer: "We're on track and about 80% done. The remaining work is the final review, which should wrap up by Friday.",
    keyPhrases: ['on track', 'progress', 'done', 'complete', 'update', 'finish'],
    explanation: 'Great status updates lead with where things stand, then what remains and when.',
  },

  // ── Speaking ─────────────────────────────────────────────
  {
    id: 's1',
    type: 'speaking',
    topicTag: 'Meetings',
    scenario: "Imagine you're in a meeting. Your manager asks:",
    prompt: 'What do you think about this approach?',
    keyPhrases: ['i think', 'in my opinion', 'however', 'because', 'suggest'],
    explanation: 'Strong answers state an opinion clearly ("I think..."), then back it up with a reason ("because...").',
  },
  {
    id: 's2',
    type: 'speaking',
    topicTag: 'Workplace conversations',
    scenario: 'A new coworker asks you to describe your role.',
    prompt: 'Briefly describe what you do at work.',
    keyPhrases: ["i'm responsible", 'i work on', 'my role', 'i handle', 'i focus on'],
    explanation: "Describing a role well usually starts with \"I'm responsible for...\" or \"I work on...\" followed by a concrete example.",
  },
  {
    id: 's3',
    type: 'speaking',
    topicTag: 'Presentations',
    scenario: "You're presenting a new idea to your team.",
    prompt: 'Pitch your idea in 30 seconds.',
    keyPhrases: ["i'd like to propose", 'the idea is', 'benefit', 'because'],
    explanation: 'A tight pitch names the idea, the benefit, and why it matters — in that order.',
  },
];

/** Simple deterministic string hash so "today" always maps to the same seed. */
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const CORE_TYPES = ['grammar', 'vocabulary', 'listening', 'business', 'writing', 'speaking'] as const;

/**
 * Today's first 9 exercises, deterministic from the date — stable all day,
 * different tomorrow, no server or randomness bugs involved.
 */
export function getDailyNine(date: string): EnglishExercise[] {
  const seed = hashString(date);
  const byType = (t: string) => ENGLISH_EXERCISES.filter((e) => e.type === t);
  const pick = <T,>(arr: T[], offset: number): T => arr[(seed + offset) % arr.length];

  return CORE_TYPES.flatMap((t, i) => {
    const pool = byType(t);
    if (pool.length === 0) return [];
    // grammar/vocabulary/listening get a bonus second pick, business/writing/speaking get one
    const count = t === 'grammar' || t === 'vocabulary' || t === 'listening' ? 2 : 1;
    return Array.from({ length: Math.min(count, pool.length) }, (_, j) => pick(pool, i * 7 + j * 13));
  }).slice(0, 9);
}

/**
 * Exercise #10, the "Challenge": a retry of the first mistake made in this
 * session (same topic, different question when possible), or a bonus pick
 * from today's seed if the first 9 were all correct.
 */
export function pickChallengeExercise(date: string, missedSoFar: EnglishExercise[], answeredIds: string[]): EnglishExercise {
  const seed = hashString(date);
  if (missedSoFar.length > 0) {
    const missed = missedSoFar[0];
    const sameTopic = ENGLISH_EXERCISES.find((e) => e.topicTag === missed.topicTag && e.id !== missed.id);
    return sameTopic ?? missed;
  }
  const rest = ENGLISH_EXERCISES.filter((e) => !answeredIds.includes(e.id));
  const pool = rest.length > 0 ? rest : ENGLISH_EXERCISES;
  return pool[seed % pool.length];
}
