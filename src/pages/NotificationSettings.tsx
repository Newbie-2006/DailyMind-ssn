import { useMemo } from 'react';
import { BellOff, BellRing, Info } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useNotificationPermission } from '../hooks/useReminders';
import {
  buildReminderSchedule,
  notifications,
  remindersSurviveClose,
} from '../services/notificationService';
import { sortByTime } from '../services/routineService';
import { formatTime } from '../utils/date';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { TextField } from '../components/ui/Field';
import { RoutineIconGlyph } from '../components/RoutineIconGlyph';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';

export function NotificationSettingsPage() {
  const { settings, routines, actions } = useAppData();
  const { notify } = useToast();
  const { t } = useTranslation();
  const { permission, checking, request } = useNotificationPermission();

  const prefs = settings.notifications;
  const granted = permission === 'granted';

  const schedule = useMemo(
    () => buildReminderSchedule(routines, prefs, t),
    [routines, prefs, t],
  );

  const update = (patch: Partial<typeof prefs>) => {
    actions.updateSettings({ notifications: { ...prefs, ...patch } });
  };

  const askPermission = async () => {
    const next = await request();
    if (next === 'granted') {
      await notifications.sync(schedule);
    }
  };

  const sendTest = async () => {
    await notifications.showNow(t('notify.testTitle'), t('notify.testBody'));
    notify(t('notifications.testSent'));
  };

  return (
    <div className="pb-10">
      <PageHeader title={t('notifications.title')} onBack fallbackTo="/profile" />

      <div className="dm-gutter space-y-6 pt-6">
        {/* Permission comes first: nothing below it matters until it is granted. */}
        {!checking && permission === 'unsupported' ? (
          <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
            <BellOff
              size={18}
              strokeWidth={1.6}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-ink-soft"
            />
            <div>
              <p className="text-[0.9375rem] text-ink">{t('notifications.unsupported')}</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                {t('notifications.unsupportedBody')}
              </p>
            </div>
          </Card>
        ) : null}

        {!checking && permission === 'prompt' ? (
          <Card surface="sage" className="px-4 py-4">
            <div className="flex items-start gap-3">
              <BellRing
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-forest-soft"
              />
              <div className="min-w-0">
                <p className="text-[0.9375rem] text-forest-deep">
                  {t('notifications.permissionNeeded')}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                  {t('notifications.permissionNeededBody')}
                </p>
                <Button className="mt-3.5" onClick={() => void askPermission()}>
                  {t('notifications.grant')}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {!checking && permission === 'denied' ? (
          <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
            <BellOff
              size={18}
              strokeWidth={1.6}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-clay"
            />
            <div>
              <p className="text-[0.9375rem] text-ink">{t('notifications.denied')}</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                {t('notifications.deniedBody')}
              </p>
            </div>
          </Card>
        ) : null}

        <section className={granted ? '' : 'opacity-60'}>
          <SectionTitle>{t('notifications.title')}</SectionTitle>
          <Card className="space-y-1 px-4 py-3">
            <Toggle
              checked={prefs.routineReminders}
              disabled={!granted}
              onChange={(next) => update({ routineReminders: next })}
              label={t('notifications.routineReminders')}
              description={t('notifications.routineRemindersBody')}
              showLabel
            />
            <Toggle
              checked={prefs.dailySummary}
              disabled={!granted}
              onChange={(next) => update({ dailySummary: next })}
              label={t('notifications.dailySummary')}
              description={t('notifications.dailySummaryBody')}
              showLabel
            />
            {prefs.dailySummary ? (
              <div className="pt-2 pb-1">
                <TextField
                  label={t('notifications.summaryTime')}
                  type="time"
                  value={prefs.summaryTime}
                  disabled={!granted}
                  onChange={(event) => update({ summaryTime: event.target.value || '08:00' })}
                />
              </div>
            ) : null}

            <Toggle
              checked={prefs.eveningCheck}
              disabled={!granted}
              onChange={(next) => update({ eveningCheck: next })}
              label={t('notifications.eveningCheck')}
              description={t('notifications.eveningCheckBody')}
              showLabel
            />
            {prefs.eveningCheck ? (
              <div className="pt-2 pb-1">
                <TextField
                  label={t('notifications.eveningTime')}
                  type="time"
                  value={prefs.eveningTime}
                  disabled={!granted}
                  onChange={(event) => update({ eveningTime: event.target.value || '19:00' })}
                />
              </div>
            ) : null}

            <Toggle
              checked={prefs.memoryPrompts}
              disabled={!granted}
              onChange={(next) => update({ memoryPrompts: next })}
              label={t('notifications.memoryPrompts')}
              description={t('notifications.memoryPromptsBody')}
              showLabel
            />
          </Card>
        </section>

        <section className={granted && prefs.routineReminders ? '' : 'opacity-60'}>
          <SectionTitle>{t('notifications.perRoutine')}</SectionTitle>
          <p className="mb-3 text-[0.8125rem] leading-relaxed text-ink-faint">
            {t('notifications.perRoutineBody')}
          </p>
          <Card className="divide-y divide-line-soft">
            {sortByTime(routines).map((routine) => (
              <div key={routine.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
                >
                  <RoutineIconGlyph icon={routine.icon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] text-ink">{routine.name}</span>
                  <span className="block text-[0.8125rem] text-ink-faint">
                    {formatTime(routine.time)}
                  </span>
                </span>
                <Toggle
                  checked={routine.reminderEnabled !== false}
                  disabled={!granted || !prefs.routineReminders}
                  onChange={(next) => actions.updateRoutine(routine.id, { reminderEnabled: next })}
                  label={routine.name}
                />
              </div>
            ))}
          </Card>
        </section>

        <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
          <Info
            size={16}
            strokeWidth={1.7}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-ink-soft"
          />
          <div className="min-w-0">
            <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
              {t('notifications.scheduled', { count: schedule.length })}
            </p>
            {!remindersSurviveClose ? (
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-faint">
                {t('notifications.webLimitation')}
              </p>
            ) : null}
          </div>
        </Card>

        <Button variant="secondary" size="lg" disabled={!granted} onClick={() => void sendTest()}>
          {t('notifications.testReminder')}
        </Button>
      </div>
    </div>
  );
}
