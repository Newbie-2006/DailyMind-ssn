/**
 * Client for the DailyMind hardware event API.
 *
 * Talks to the backend's /api/hardware/* endpoints.  Never touches
 * /gary/reply or any AI endpoint.
 */

import type { HardwareEvent, DeviceStatus } from '../types/hardware';

const baseUrl = import.meta.env.VITE_GARY_API_URL?.replace(/\/$/, '') ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error ?? `Hardware API ${path} returned ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

/** Fetch the most recent hardware events (most recent first). */
export async function fetchHardwareEvents(
  limit = 50,
): Promise<HardwareEvent[]> {
  return apiFetch<HardwareEvent[]>(
    `/api/hardware/events?limit=${limit}`,
  );
}

/** Fetch the status of all known devices. */
export async function fetchDeviceStatuses(): Promise<DeviceStatus[]> {
  return apiFetch<DeviceStatus[]>('/api/hardware/device-status');
}

/** Acknowledge (mark as seen) a hardware event by ID. */
export async function acknowledgeEvent(eventId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(
    `/api/hardware/events/${encodeURIComponent(eventId)}/acknowledge`,
    { method: 'POST' },
  );
}
