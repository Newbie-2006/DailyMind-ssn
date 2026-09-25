import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { LocationErrorCode, LocationFix, LocationFrequency } from '../types';

/**
 * Location is split into three jobs that never mix:
 *
 *   collection    - asking the device where it is (this file, `collectFix`)
 *   transmission  - deciding whether a new fix is worth storing (`shouldStore`)
 *                   and writing it (the provider, which a real backend would
 *                   replace with a POST)
 *   display       - the screens, which only ever read the stored fix
 *
 * Nothing here decides who may *see* a position; that is `caregiverAccess.ts`.
 */

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface FrequencyProfile {
  /** Do not record again until this much time has passed. */
  minIntervalMs: number;
  /** ...unless the person has moved at least this far. */
  minDistanceM: number;
}

/**
 * Deliberately coarse. A caregiver needs to know roughly where someone is, not
 * to follow them metre by metre, and a phone that wakes its GPS every few
 * seconds is a phone that is flat by lunchtime.
 */
export const frequencyProfiles: Record<LocationFrequency, FrequencyProfile> = {
  frequent: { minIntervalMs: 2 * 60_000, minDistanceM: 50 },
  balanced: { minIntervalMs: 5 * 60_000, minDistanceM: 100 },
  saver: { minIntervalMs: 15 * 60_000, minDistanceM: 250 },
};

export class LocationError extends Error {
  readonly code: LocationErrorCode;

  constructor(code: LocationErrorCode) {
    super(code);
    this.name = 'LocationError';
    this.code = code;
  }
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function hasWebGeolocation(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export function isSupported(): boolean {
  return isNative() || hasWebGeolocation();
}

/** Reads permission without prompting, so a screen can explain before asking. */
export async function checkPermission(): Promise<PermissionState> {
  if (!isSupported()) return 'unsupported';

  if (isNative()) {
    try {
      const status = await Geolocation.checkPermissions();
      return normalise(status.location);
    } catch {
      return 'prompt';
    }
  }

  // Not every browser implements the Permissions API for geolocation.
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
    if (status) return normalise(status.state);
  } catch {
    // Fall through: we simply do not know until we ask.
  }
  return 'prompt';
}

/** Prompts. Android shows its own dialog; the browser shows the URL-bar prompt. */
export async function requestPermission(): Promise<PermissionState> {
  if (!isSupported()) return 'unsupported';

  if (isNative()) {
    try {
      const status = await Geolocation.requestPermissions({ permissions: ['location'] });
      return normalise(status.location);
    } catch {
      return 'denied';
    }
  }

  // The web has no explicit request, so asking for a position is the prompt.
  try {
    await collectFix();
    return 'granted';
  } catch (error) {
    if (error instanceof LocationError && error.code === 'permission-denied') return 'denied';
    return 'prompt';
  }
}

function normalise(state: string): PermissionState {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  return 'prompt';
}

/** COLLECTION. Asks the device for one position. Never stores anything. */
export async function collectFix(timeoutMs = 12_000): Promise<LocationFix> {
  if (!isSupported()) throw new LocationError('unsupported');

  if (isNative()) {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 30_000,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        timestamp: position.timestamp || Date.now(),
      };
    } catch (error) {
      throw toLocationError(error);
    }
  }

  return new Promise<LocationFix>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          timestamp: position.timestamp || Date.now(),
        }),
      (error) => reject(toLocationError(error)),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}

function toLocationError(error: unknown): LocationError {
  const code = (error as { code?: number } | undefined)?.code;
  // GeolocationPositionError: 1 denied, 2 unavailable, 3 timeout.
  if (code === 1) return new LocationError('permission-denied');
  if (code === 3) return new LocationError('timeout');
  if (code === 2) return new LocationError('unavailable');

  const message = String((error as { message?: string } | undefined)?.message ?? '').toLowerCase();
  if (message.includes('denied') || message.includes('permission')) {
    return new LocationError('permission-denied');
  }
  return new LocationError('unavailable');
}

/** Great-circle distance in metres. Good enough well inside GPS noise. */
export function distanceBetween(a: LocationFix, b: LocationFix): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * TRANSMISSION policy. A fix is worth storing when enough time has passed *or*
 * the person has actually moved. Everything else is battery and data spent on
 * saying "still here".
 */
export function shouldStore(
  previous: LocationFix | null,
  next: LocationFix,
  frequency: LocationFrequency,
): boolean {
  if (!previous) return true;

  const profile = frequencyProfiles[frequency];
  const elapsed = next.timestamp - previous.timestamp;
  if (elapsed >= profile.minIntervalMs) return true;

  return distanceBetween(previous, next) >= profile.minDistanceM;
}

/** How long to wait before polling again, given the chosen frequency. */
export function pollIntervalMs(frequency: LocationFrequency): number {
  return frequencyProfiles[frequency].minIntervalMs;
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/** A link a caregiver can open in whichever map app they have. */
export function mapsUrl(fix: LocationFix): string {
  return `https://www.openstreetmap.org/?mlat=${fix.latitude}&mlon=${fix.longitude}#map=16/${fix.latitude}/${fix.longitude}`;
}
