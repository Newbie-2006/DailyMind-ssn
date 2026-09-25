import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppData } from './useAppData';
import {
  LocationError,
  checkPermission,
  collectFix,
  isOnline,
  isSupported,
  pollIntervalMs,
  requestPermission,
  shouldStore,
  type PermissionState,
} from '../services/locationService';

/**
 * Drives location collection while the app is in the foreground.
 *
 * It deliberately does not run in the background: DailyMind promises "the
 * latest position while the app is open", and a background service would be a
 * much larger permission ask than the feature needs. The collection schedule
 * lives in `locationService`, so changing it later is a one-file change.
 */
export function useLocationSharing() {
  const { location, actions } = useAppData();
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [busy, setBusy] = useState(false);

  // Lets the polling loop read the newest state without re-arming the timer on
  // every stored fix.
  const latest = useRef(location);
  useEffect(() => {
    latest.current = location;
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    void checkPermission().then((state) => {
      if (!cancelled) setPermission(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * One collection pass: ask the device, then apply the transmission policy.
   * `silent` is used by the background poll, which should not flash a spinner
   * on a button the person is not waiting on.
   */
  const updateNow = useCallback(
    async (silent = false): Promise<'ok' | 'skipped' | PermissionState | 'error'> => {
      if (!isSupported()) {
        actions.setLocationError('unsupported');
        return 'unsupported';
      }
      if (!isOnline()) {
        // The fix itself does not need the network, but a real backend would,
        // so the person is told rather than left thinking it synced.
        actions.setLocationError('offline');
      }

      if (!silent) setBusy(true);
      try {
        const fix = await collectFix();
        const previous = latest.current.lastFix;

        if (!shouldStore(previous, fix, latest.current.frequency)) return 'skipped';

        actions.recordLocationFix(fix);
        return 'ok';
      } catch (error) {
        const code = error instanceof LocationError ? error.code : 'unavailable';
        actions.setLocationError(code);
        if (code === 'permission-denied') setPermission('denied');
        return 'error';
      } finally {
        if (!silent) setBusy(false);
      }
    },
    [actions],
  );

  /** Poll on the chosen cadence, and only while sharing is actually on. */
  useEffect(() => {
    if (!location.sharingEnabled || permission !== 'granted') return;

    // Reading the device's position is the textbook "synchronise with an
    // external system", which is what this effect is for. The silent flag
    // means no state is set synchronously on this path.
    // oxlint-disable-next-line react/set-state-in-effect
    void updateNow(true);
    const interval = window.setInterval(() => {
      // Collecting while hidden would spend battery on a screen nobody sees.
      if (document.visibilityState === 'visible') void updateNow(true);
    }, pollIntervalMs(location.frequency));

    return () => window.clearInterval(interval);
  }, [location.sharingEnabled, location.frequency, permission, updateNow]);

  const startSharing = useCallback(async (): Promise<PermissionState> => {
    const state = permission === 'granted' ? 'granted' : await requestPermission();
    setPermission(state);
    if (state !== 'granted') return state;

    actions.setLocationSharing(true);
    await updateNow();
    return state;
  }, [permission, actions, updateNow]);

  const stopSharing = useCallback(() => {
    actions.setLocationSharing(false);
  }, [actions]);

  return {
    location,
    permission,
    busy,
    supported: isSupported(),
    startSharing,
    stopSharing,
    updateNow,
    setFrequency: actions.setLocationFrequency,
  };
}
