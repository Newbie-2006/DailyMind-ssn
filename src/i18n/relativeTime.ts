import type { TranslateFn } from './translate';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "just now", "5 minutes ago", "2 hours ago". Used wherever the app reports how
 * fresh a location is - being specific about age is the whole point, so this
 * never rounds an old fix into sounding current.
 */
export function formatRelativeTime(
  timestamp: number,
  t: TranslateFn,
  now: number = Date.now(),
): string {
  const elapsed = Math.max(0, now - timestamp);

  if (elapsed < MINUTE) return t('time.justNow');
  if (elapsed < HOUR) {
    const count = Math.floor(elapsed / MINUTE);
    return t('time.minutesAgo', { count });
  }
  if (elapsed < DAY) {
    const count = Math.floor(elapsed / HOUR);
    return t('time.hoursAgo', { count });
  }
  const count = Math.floor(elapsed / DAY);
  return t('time.daysAgo', { count });
}

/** A fix older than this is reported as stale rather than current. */
export const STALE_AFTER_MS = 15 * MINUTE;

export function isStale(timestamp: number, now: number = Date.now()): boolean {
  return now - timestamp > STALE_AFTER_MS;
}
