import {
  format,
  parseISO,
  isToday as fnsIsToday,
  isYesterday as fnsIsYesterday,
  isThisWeek,
  isThisMonth,
  startOfWeek,
  addDays,
  isSameDay,
} from 'date-fns';

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');
export const yesterdayISO = () => format(addDays(new Date(), -1), 'yyyy-MM-dd');
export const nowISO = () => new Date().toISOString();
export const nowTimeHHmm = () => format(new Date(), 'HH:mm');

export function fmtDateLong(d: Date = new Date()) {
  return format(d, "EEEE, MMMM d, yyyy").toUpperCase();
}

export function fmtDateShort(iso: string) {
  return format(parseISO(iso), 'MMM d');
}

export function isTodayISO(iso: string | null) {
  if (!iso) return false;
  return fnsIsToday(parseISO(iso));
}

export function isYesterdayISO(iso: string | null) {
  if (!iso) return false;
  return fnsIsYesterday(parseISO(iso));
}

export function fmtDateTime(iso: string) {
  return format(parseISO(iso), 'MMMM d, yyyy · h:mm a');
}

export function isThisWeekISO(iso: string | null) {
  if (!iso) return false;
  return isThisWeek(parseISO(iso), { weekStartsOn: 1 });
}

export function isThisMonthISO(iso: string | null) {
  if (!iso) return false;
  return isThisMonth(parseISO(iso));
}

export function weekDays(anchor: Date = new Date()) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 5 }, (_, i) => addDays(start, i)); // Mon–Fri, matches reference
}

export function sameDay(a: string, b: Date) {
  return isSameDay(parseISO(a), b);
}

export function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function timeAgo(iso: string) {
  const diffMs = Date.now() - parseISO(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function fmtHM(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
