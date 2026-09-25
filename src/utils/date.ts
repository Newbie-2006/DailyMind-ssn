import type { ISODate, TimeOfDay } from '../types';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` for a Date, in local time (never UTC-shifted). */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses `YYYY-MM-DD` as a local midnight Date. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function today(): ISODate {
  return toISODate(new Date());
}

export function addDays(iso: ISODate, amount: number): ISODate {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function weekdayOf(iso: ISODate): number {
  return fromISODate(iso).getDay();
}

/** The Monday-based week containing `iso`, as seven ISO dates. */
export function weekOf(iso: ISODate): ISODate[] {
  const date = fromISODate(iso);
  const offset = (date.getDay() + 6) % 7;
  const monday = addDays(iso, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** The `count` days ending on `iso`, oldest first. */
export function lastNDays(iso: ISODate, count: number): ISODate[] {
  return Array.from({ length: count }, (_, i) => addDays(iso, i - (count - 1)));
}

/** `24 Sep 2026` */
export function formatDate(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** `Wed, 24 Sep 2026` */
export function formatDateWithWeekday(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${formatDate(iso)}`;
}

/** `24 September 2026` */
export function formatDateLong(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** `Today`, `Yesterday`, `Tomorrow`, or a plain date. */
export function formatRelativeDay(iso: ISODate, reference: ISODate = today()): string {
  if (iso === reference) return 'Today';
  if (iso === addDays(reference, -1)) return 'Yesterday';
  if (iso === addDays(reference, 1)) return 'Tomorrow';
  return formatDate(iso);
}

export function weekdayShort(iso: ISODate): string {
  return WEEKDAYS_SHORT[weekdayOf(iso)];
}

export function weekdayLong(iso: ISODate): string {
  return WEEKDAYS_LONG[weekdayOf(iso)];
}

export function dayOfMonth(iso: ISODate): number {
  return fromISODate(iso).getDate();
}

/** `7:00 AM` from `07:00`. */
export function formatTime(time: TimeOfDay): string {
  const [hRaw, mRaw] = time.split(':');
  const h = Number(hRaw);
  const minutes = mRaw ?? '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

/** Sort key for `HH:mm`; invalid values sink to the end of the day. */
export function timeToMinutes(time: TimeOfDay): number {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return 24 * 60;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** True when the wall clock has passed this routine's time today. */
export function isPastTime(time: TimeOfDay, now: Date = new Date()): boolean {
  return now.getHours() * 60 + now.getMinutes() > timeToMinutes(time);
}

export function monthLabel(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}
