import { useCallback, useEffect, useRef, useState } from 'react';
import type { HardwareEvent, DeviceStatus } from '../types/hardware';
import {
  fetchHardwareEvents,
  fetchDeviceStatuses,
  acknowledgeEvent as ackEvent,
} from '../services/hardwareService';

const POLL_INTERVAL_MS = 10_000; // 10 seconds

export interface UseHardwareEventsResult {
  events: HardwareEvent[];
  devices: DeviceStatus[];
  loading: boolean;
  error: string | null;
  /** Force an immediate refresh. */
  refresh: () => void;
  /** Acknowledge a single event by ID. */
  acknowledgeEvent: (eventId: string) => Promise<void>;
  /** Number of unacknowledged alert events (SOS or suspected fall). */
  unacknowledgedCount: number;
}

export function useHardwareEvents(): UseHardwareEventsResult {
  const [events, setEvents] = useState<HardwareEvent[]>([]);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const load = useCallback(async () => {
    try {
      const [evts, devs] = await Promise.all([
        fetchHardwareEvents(50),
        fetchDeviceStatuses(),
      ]);
      setEvents(evts);
      setDevices(devs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hardware data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling.
  // The load function is stable (useCallback with []) so this effect runs once.
  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      if (cancelled) return;
      await load();
    };
    doLoad();
    timerRef.current = setInterval(doLoad, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [load]);

  const refresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  const acknowledgeEvent = useCallback(
    async (eventId: string) => {
      await ackEvent(eventId);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, acknowledged: true } : e,
        ),
      );
    },
    [],
  );

  const unacknowledgedCount = events.filter(
    (e) =>
      !e.acknowledged &&
      (e.eventType === 'sos_button' || e.eventType === 'suspected_fall'),
  ).length;

  return {
    events,
    devices,
    loading,
    error,
    refresh,
    acknowledgeEvent,
    unacknowledgedCount,
  };
}
