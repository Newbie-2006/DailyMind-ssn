/**
 * The only place in the app that touches localStorage.
 *
 * Everything above this file works with plain values, so swapping the browser
 * for a real backend later means reimplementing `readKey` / `writeKey` rather
 * than touching any screen.
 */

const NAMESPACE = 'dailymind';
const VERSION = 1;

export const StorageKeys = {
  memories: 'memories',
  routines: 'routines',
  completions: 'completions',
  reminders: 'reminders',
  settings: 'settings',
  caregivers: 'caregivers',
  family: 'family',
  gary: 'gary',
  seeded: 'seeded',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

function fullKey(key: StorageKey): string {
  return `${NAMESPACE}.v${VERSION}.${key}`;
}

/** Private browsing and blocked site data both make storage throw on access. */
function available(): Storage | null {
  try {
    const probe = `${NAMESPACE}.probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** In-memory stand-in so the app still works when storage is unavailable. */
const memoryFallback = new Map<string, string>();

export function readKey<T>(key: StorageKey, fallback: T): T {
  const store = available();
  try {
    const raw = store
      ? store.getItem(fullKey(key))
      : (memoryFallback.get(fullKey(key)) ?? null);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt or unreadable entry: fall back rather than crash the screen.
    return fallback;
  }
}

export function writeKey<T>(key: StorageKey, value: T): void {
  const serialized = JSON.stringify(value);
  const store = available();
  try {
    if (store) store.setItem(fullKey(key), serialized);
    else memoryFallback.set(fullKey(key), serialized);
  } catch {
    // Most likely a full quota (a large photo). Keep the session usable.
    memoryFallback.set(fullKey(key), serialized);
  }
}

/**
 * Gary's setup (the caregiver's API key, language and form of address) is not
 * sample content, so restoring the samples leaves it where it is.
 */
const SURVIVES_RESET: StorageKey[] = [StorageKeys.gary];

export function clearAll(): void {
  const store = available();
  const toClear = Object.values(StorageKeys).filter((key) => !SURVIVES_RESET.includes(key));
  try {
    if (store) {
      toClear.forEach((key) => store.removeItem(fullKey(key)));
    }
  } catch {
    // Nothing to do: the fallback clear below still applies.
  }
  toClear.forEach((key) => memoryFallback.delete(fullKey(key)));
}
