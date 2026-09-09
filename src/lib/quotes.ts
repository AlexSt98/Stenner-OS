export interface Quote {
  en: string;
  es: string;
}

// Curated bilingual quotes — one shown per day, rotating deterministically by
// day-of-year so it's stable all day and different tomorrow (no flicker,
// no network call).
export const QUOTES: Quote[] = [
  { en: 'Discipline builds the freedom you want.', es: 'La disciplina construye la libertad que quieres.' },
  { en: 'Small steps, every day, add up to everything.', es: 'Pequeños pasos, cada día, suman todo.' },
  { en: 'Done is better than perfect.', es: 'Hecho es mejor que perfecto.' },
  { en: 'Your focus decides your reality.', es: 'Tu enfoque decide tu realidad.' },
  { en: 'Creativity is intelligence having fun.', es: 'La creatividad es la inteligencia divirtiéndose.' },
  { en: 'Progress, not perfection.', es: 'Progreso, no perfección.' },
  { en: 'Start where you are. Use what you have.', es: 'Empieza donde estás. Usa lo que tienes.' },
  { en: 'Consistency is louder than intensity.', es: 'La constancia habla más fuerte que la intensidad.' },
  { en: 'Rest is part of the work.', es: 'Descansar también es parte del trabajo.' },
  { en: 'Every idea deserves a first draft.', es: 'Toda idea merece un primer borrador.' },
  { en: 'You are one task away from momentum.', es: 'Estás a una tarea de recuperar el impulso.' },
  { en: 'Clarity comes from action, not thought.', es: 'La claridad viene de la acción, no del pensamiento.' },
  { en: 'Build the life you want to show up for.', es: 'Construye la vida para la que quieres presentarte.' },
  { en: 'Make today someone future-you thanks you for.', es: 'Haz hoy algo que tu yo futuro te agradezca.' },
  { en: 'Slow progress is still progress.', es: 'El progreso lento sigue siendo progreso.' },
  { en: 'Great work is built in ordinary hours.', es: 'El gran trabajo se construye en horas ordinarias.' },
  { en: 'Show up. That is most of the work.', es: 'Preséntate. Eso ya es la mayor parte del trabajo.' },
  { en: 'A calm mind gets more done than a rushed one.', es: 'Una mente en calma logra más que una apurada.' },
  { en: 'Your only competition is who you were yesterday.', es: 'Tu única competencia es quien fuiste ayer.' },
  { en: 'Ideas are cheap. Execution is everything.', es: 'Las ideas son baratas. La ejecución lo es todo.' },
  { en: 'One honest hour beats a distracted day.', es: 'Una hora honesta vale más que un día distraído.' },
  { en: 'Systems outlast motivation.', es: 'Los sistemas duran más que la motivación.' },
  { en: 'The work you avoid is usually the work that matters.', es: 'El trabajo que evitas suele ser el que más importa.' },
  { en: 'Learning a language is learning a new way to think.', es: 'Aprender un idioma es aprender una nueva forma de pensar.' },
  { en: 'You do not need to feel ready. You need to begin.', es: 'No necesitas sentirte listo. Necesitas empezar.' },
  { en: 'Momentum is built one small win at a time.', es: 'El impulso se construye una pequeña victoria a la vez.' },
  { en: 'Design the day instead of reacting to it.', es: 'Diseña el día en lugar de reaccionar a él.' },
  { en: 'What you repeat, you become.', es: 'Lo que repites, te vuelves.' },
  { en: 'Good enough today beats perfect someday.', es: 'Suficientemente bueno hoy vence a perfecto algún día.' },
  { en: 'A tidy plan turns chaos into momentum.', es: 'Un plan ordenado convierte el caos en impulso.' },
];

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/** Deterministic pick for "today" — same all day, rotates daily. */
export function getDailyQuote(date: Date = new Date()): Quote {
  return QUOTES[dayOfYear(date) % QUOTES.length];
}
