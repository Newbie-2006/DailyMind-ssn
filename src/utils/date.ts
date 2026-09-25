import type { ISODate, TimeOfDay } from '../types';

/**
 * Dates are formatted through `Intl`, so month and weekday names follow the
 * chosen language. `I18nProvider` sets the locale; everything else calls these
 * helpers unchanged.
 */
let activeLocale = 'en-IN';

export function setDateLocale(locale: string): void {
  activeLocale = locale;
}

/** `Intl` formatters are expensive to build, so each one is made once. */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${activeLocale}:${JSON.stringify(options)}`;
  let cached = formatterCache.get(key);
  if (!cached) {
    try {
      cached = new Intl.DateTimeFormat(activeLocale, options);
    } catch {
      // An unsupported locale should never cost us a rendered date.
      cached = new Intl.DateTimeFormat('en-IN', options);
    }
    formatterCache.set(key, cached);
  }
  return cached;
}

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

/** `24 Sep 2026`, localised. */
export function formatDate(iso: ISODate): string {
  return formatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(fromISODate(iso));
}

/** `Wed, 24 Sep 2026`, localised. */
export function formatDateWithWeekday(iso: ISODate): string {
  return formatter({
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(fromISODate(iso));
}

/** `24 September 2026`, localised. */
export function formatDateLong(iso: ISODate): string {
  return formatter({ day: 'numeric', month: 'long', year: 'numeric' }).format(fromISODate(iso));
}

/**
 * `today` / `yesterday` / `tomorrow`, or null when the date needs spelling out.
 * The caller turns this into words, because the words are translated.
 */
export function relativeDayKey(
  iso: ISODate,
  reference: ISODate = today(),
): 'today' | 'yesterday' | 'tomorrow' | null {
  if (iso === reference) return 'today';
  if (iso === addDays(reference, -1)) return 'yesterday';
  if (iso === addDays(reference, 1)) return 'tomorrow';
  return null;
}

export function weekdayShort(iso: ISODate): string {
  return formatter({ weekday: 'short' }).format(fromISODate(iso));
}

export function weekdayLong(iso: ISODate): string {
  return formatter({ weekday: 'long' }).format(fromISODate(iso));
}

/** Weekday name for a day number (0 = Sunday), for pickers that have no date. */
export function weekdayNameFor(day: number, style: 'short' | 'long' = 'short'): string {
  // 2024-01-07 was a Sunday, so adding the day number lands on the right one.
  const reference = new Date(2024, 0, 7 + day);
  return formatter({ weekday: style }).format(reference);
}

export function dayOfMonth(iso: ISODate): number {
  return fromISODate(iso).getDate();
}

/** `7:00 AM` from `07:00`. */
export function formatTime(time: TimeOfDay): string {
  const [hRaw, mRaw] = time.split(':');
  const hours = Number(hRaw);
  const minutes = Number(mRaw ?? '0');
  if (Number.isNaN(hours)) return time;

  const reference = new Date(2024, 0, 1, hours, Number.isNaN(minutes) ? 0 : minutes);
  return formatter({ hour: 'numeric', minute: '2-digit' }).format(reference);
}

/** Sort key for `HH:mm`; invalid values sink to the end of the day. */
export function timeToMinutes(time: TimeOfDay): number {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return 24 * 60;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Which part of the day it is. The greeting itself is translated. */
export function timeOfDay(date: Date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/** True when the wall clock has passed this routine's time today. */
export function isPastTime(time: TimeOfDay, now: Date = new Date()): boolean {
  return now.getHours() * 60 + now.getMinutes() > timeToMinutes(time);
}

export function monthLabel(iso: ISODate): string {
  return formatter({ month: 'long', year: 'numeric' }).format(fromISODate(iso));
}
