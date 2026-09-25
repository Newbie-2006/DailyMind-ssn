import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppData } from './useAppData';
import { useTranslation } from '../i18n/useTranslation';
import {
  buildReminderSchedule,
  notifications,
  remindersSurviveClose,
  type NotificationPermission,
} from '../services/notificationService';

/**
 * Keeps the device's scheduled reminders in step with the routines and
 * preferences. Mounted once, near the root, so a reminder created on one screen
 * is scheduled whichever screen the person is looking at.
 */
export function useReminderSync(): void {
  const { routines, settings } = useAppData();
  const { t, language } = useTranslation();

  // The reminder text is translated, so a language change reschedules.
  const schedule = useMemo(
    () => buildReminderSchedule(routines, settings.notifications, t),
    [routines, settings.notifications, t],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const permission = await notifications.checkPermission();
      if (cancelled || permission !== 'granted') return;
      try {
        await notifications.sync(schedule);
      } catch {
        // A failed schedule must never break the screen the person is on; the
        // notifications page shows the real state when they next open it.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [schedule, language]);
}

/** State and actions for the notifications settings screen. */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('prompt');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void notifications.checkPermission().then((state) => {
      if (cancelled) return;
      setPermission(state);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const request = useCallback(async () => {
    const next = await notifications.requestPermission();
    setPermission(next);
    return next;
  }, []);

  return { permission, checking, request, remindersSurviveClose };
}
