import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { NotificationSettings, Routine } from '../types';
import { occursOn } from './routineService';
import { timeToMinutes } from '../utils/date';
import type { TranslateFn } from '../i18n/translate';

/**
 * Reminders behind one interface, with two implementations:
 *
 *   native - Capacitor LocalNotifications. Scheduled by the OS, so they arrive
 *            even when DailyMind is closed and they survive a restart.
 *   web    - the Notification API plus in-page timers. They only fire while a
 *            tab is open, which the settings screen says plainly rather than
 *            pretending otherwise.
 */

export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface ScheduledReminder {
  /** Stable numeric id so an update replaces rather than duplicates. */
  id: number;
  title: string;
  body: string;
  /** Local time of day, 'HH:mm'. */
  time: string;
  /** Weekday numbers (0 = Sunday) this reminder repeats on. */
  days: number[];
}

export interface NotificationProvider {
  readonly id: 'native' | 'web';
  checkPermission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  /** Replaces every DailyMind reminder with exactly this set. */
  sync(reminders: ScheduledReminder[]): Promise<void>;
  cancelAll(): Promise<void>;
  showNow(title: string, body: string): Promise<void>;
}

const CHANNEL_ID = 'dailymind-reminders';

class NativeNotificationProvider implements NotificationProvider {
  readonly id = 'native' as const;
  private channelReady = false;

  private async ensureChannel(): Promise<void> {
    if (this.channelReady) return;
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Reminders',
        description: 'Daily task and routine reminders',
        importance: 4,
        visibility: 1,
      });
    } catch {
      // Channels only exist on Android; elsewhere this is simply a no-op.
    }
    this.channelReady = true;
  }

  async checkPermission(): Promise<NotificationPermission> {
    try {
      const status = await LocalNotifications.checkPermissions();
      return normalise(status.display);
    } catch {
      return 'prompt';
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    try {
      const status = await LocalNotifications.requestPermissions();
      return normalise(status.display);
    } catch {
      return 'denied';
    }
  }

  async sync(reminders: ScheduledReminder[]): Promise<void> {
    await this.ensureChannel();
    await this.cancelAll();
    if (reminders.length === 0) return;

    // One OS notification per reminder per weekday, repeating weekly. Android
    // reschedules these itself, so they outlive an app restart.
    const notifications = reminders.flatMap((reminder) => {
      const [hour, minute] = reminder.time.split(':').map(Number);
      return reminder.days.map((weekday) => ({
        id: reminder.id * 10 + weekday,
        title: reminder.title,
        body: reminder.body,
        channelId: CHANNEL_ID,
        schedule: {
          on: { weekday: weekday + 1, hour, minute },
          allowWhileIdle: true,
        },
      }));
    });

    await LocalNotifications.schedule({ notifications });
  }

  async cancelAll(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch {
      // Nothing pending, or the platform refused; either way there is nothing
      // left to cancel.
    }
  }

  async showNow(title: string, body: string): Promise<void> {
    await this.ensureChannel();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 100000,
          title,
          body,
          channelId: CHANNEL_ID,
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
  }
}

/**
 * The browser has no scheduler, so this keeps timers for the next occurrence of
 * each reminder while the page is open. Closing the tab cancels them, which is
 * why the UI says so.
 */
class WebNotificationProvider implements NotificationProvider {
  readonly id = 'web' as const;
  private timers: number[] = [];

  private supported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async checkPermission(): Promise<NotificationPermission> {
    if (!this.supported()) return 'unsupported';
    return normalise(Notification.permission);
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.supported()) return 'unsupported';
    try {
      return normalise(await Notification.requestPermission());
    } catch {
      return 'denied';
    }
  }

  async sync(reminders: ScheduledReminder[]): Promise<void> {
    await this.cancelAll();
    if ((await this.checkPermission()) !== 'granted') return;

    for (const reminder of reminders) {
      const delay = msUntilNext(reminder);
      if (delay === null) continue;
      const timer = window.setTimeout(() => {
        void this.showNow(reminder.title, reminder.body);
        // Re-arm for the following week so a long-lived tab keeps working.
        void this.sync(reminders);
      }, delay);
      this.timers.push(timer);
    }
  }

  async cancelAll(): Promise<void> {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
  }

  async showNow(title: string, body: string): Promise<void> {
    if ((await this.checkPermission()) !== 'granted') return;
    try {
      new Notification(title, { body, icon: '/favicon.svg', tag: 'dailymind' });
    } catch {
      // Some browsers only allow notifications from a service worker. Failing
      // to show one must never take a screen down.
    }
  }
}

function normalise(state: string): NotificationPermission {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  return 'prompt';
}

/** Milliseconds until this reminder is next due, or null if it never is. */
function msUntilNext(reminder: ScheduledReminder, now: Date = new Date()): number | null {
  if (reminder.days.length === 0) return null;
  const [hour, minute] = reminder.time.split(':').map(Number);
  if (Number.isNaN(hour)) return null;

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hour, Number.isNaN(minute) ? 0 : minute, 0, 0);
    if (candidate.getTime() <= now.getTime()) continue;
    if (!reminder.days.includes(candidate.getDay())) continue;
    return candidate.getTime() - now.getTime();
  }
  return null;
}

export const notifications: NotificationProvider = Capacitor.isNativePlatform()
  ? new NativeNotificationProvider()
  : new WebNotificationProvider();

/** True when scheduled reminders survive the app being closed. */
export const remindersSurviveClose = Capacitor.isNativePlatform();

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Turns the person's routines and preferences into the exact set of reminders
 * that should exist. Pure, so it can be reasoned about without a device.
 */
export function buildReminderSchedule(
  routines: Routine[],
  settings: NotificationSettings,
  t: TranslateFn,
): ScheduledReminder[] {
  if (!settings.routineReminders) return [];

  const schedule: ScheduledReminder[] = [];

  routines.forEach((routine, index) => {
    if (routine.reminderEnabled === false) return;
    if (routine.days.length === 0) return;

    schedule.push({
      // Index-based so ids stay small and stable within one sync.
      id: 100 + index,
      title: t('notify.routineTitle'),
      body: t('notify.routineBody', { name: routine.name }),
      time: routine.time,
      days: routine.days,
    });
  });

  if (settings.dailySummary) {
    const todaysCount = routines.filter((routine) => routine.days.length > 0).length;
    schedule.push({
      id: 10,
      title: t('notify.summaryTitle'),
      body:
        todaysCount === 0
          ? t('notify.summaryBodyNone')
          : t('notify.summaryBody', { count: todaysCount }),
      time: settings.summaryTime,
      days: ALL_DAYS,
    });
  }

  if (settings.eveningCheck) {
    schedule.push({
      id: 11,
      title: t('notify.eveningTitle'),
      body: t('notify.eveningBodyNone'),
      time: settings.eveningTime,
      days: ALL_DAYS,
    });
  }

  return schedule;
}

/** The next reminder due after `now`, used by the caregiver dashboard. */
export function nextReminderToday(
  routines: Routine[],
  date: string,
  now: Date = new Date(),
): Routine | undefined {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return routines
    .filter((routine) => occursOn(routine, date) && routine.reminderEnabled !== false)
    .filter((routine) => timeToMinutes(routine.time) > minutes)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))[0];
}
