// XP / level math lives in one place so Home, Stats and the sidebar agree.
export const XP_PER_LEVEL = 100;
export const XP_PER_TASK = 100;

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL));
}

export function xpIntoLevel(xp: number) {
  return xp % XP_PER_LEVEL;
}

export function xpProgressPct(xp: number) {
  return Math.round((xpIntoLevel(xp) / XP_PER_LEVEL) * 100);
}
