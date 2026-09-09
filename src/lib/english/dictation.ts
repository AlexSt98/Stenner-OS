/** Normalizes for lenient dictation comparison: lowercase, strip punctuation, collapse whitespace. */
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string) {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Allows small typos: within ~15% edit distance of the target (min 2 chars of slack). */
export function checkDictation(userText: string, expected: string): { correct: boolean; distance: number } {
  const a = normalize(userText);
  const b = normalize(expected);
  const distance = levenshtein(a, b);
  const tolerance = Math.max(2, Math.round(b.length * 0.15));
  return { correct: distance <= tolerance, distance };
}
