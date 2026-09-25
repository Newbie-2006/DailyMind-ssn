import { useMemo } from 'react';
import { ChevronRight, Eye, MapPin } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import type { Caregiver } from '../types';
import { useAppData } from '../hooks/useAppData';
import { authorizeLocationRead, canAccess } from '../services/caregiverAccess';
import { occurrencesFor, progressFor } from '../services/routineService';
import { nextReminderToday } from '../services/notificationService';
import { formatTime, today } from '../utils/date';
import { initials } from '../utils/format';
import { Card, SectionTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ProgressCard';
import { StatusDot } from '../components/StatusDot';
import { RoutineIconGlyph } from '../components/RoutineIconGlyph';
import { useTranslation } from '../i18n/useTranslation';
import { formatRelativeTime, isStale } from '../i18n/relativeTime';

/**
 * What a caregiver sees. Every section is gated on that caregiver's own
 * permissions through `caregiverAccess`, exactly as a server endpoint would be.
 *
 * It is reached from the person's own device, so the banner says plainly that
 * this is a preview rather than a separate caregiver login.
 */
export function CaregiverDashboard() {
  // Supplied by the caregiver shell, which has already verified the session.
  const caregiver = useOutletContext<Caregiver>();
  const { caregivers, settings, routines, completions, location } = useAppData();
  const { t } = useTranslation();

  const date = today();

  const access = useMemo(
    () => ({ caregiverId: caregiver.id, caregivers, settings }),
    [caregiver.id, caregivers, settings],
  );

  const routinesVisible = canAccess(access, 'routines').allowed;
  const locationRead = authorizeLocationRead(access, location);

  const progress = progressFor(routines, completions, date);
  const occurrences = occurrencesFor(routines, completions, date);
  const remaining = occurrences.filter((occurrence) => !occurrence.completed).length;
  const next = nextReminderToday(routines, date);

  const sharingActive = settings.sharingEnabled && caregiver.active;

  return (
    <div className="pb-10">
      <div className="dm-gutter space-y-6 pt-6">
        <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
          <Eye
            size={16}
            strokeWidth={1.7}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-ink-soft"
          />
          <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
            {t('caregiverArea.signedInAs', { name: caregiver.name })}
          </p>
        </Card>

        <Card className="flex items-center gap-3.5 px-4 py-4">
          <span className="size-12 shrink-0 overflow-hidden rounded-full bg-sage-wash">
            {settings.avatar ? (
              <img src={settings.avatar} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-[0.875rem] font-medium text-forest">
                {initials(settings.name)}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] text-ink-faint">{t('dashboard.person')}</p>
            <p className="truncate text-[1.0625rem] text-ink">{settings.name}</p>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <StatusDot tone={sharingActive ? 'active' : 'off'} />
            <span className="text-[0.8125rem] text-ink-soft">
              {sharingActive ? t('dashboard.connected') : t('dashboard.paused')}
            </span>
          </span>
        </Card>

        <section>
          <SectionTitle>{t('dashboard.dailyTasks')}</SectionTitle>
          {routinesVisible ? (
            <Card className="px-5 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[0.9375rem] text-ink">
                  {t('dashboard.completedCount', {
                    completed: progress.completed,
                    total: progress.total,
                  })}
                </p>
                <span className="text-[1.0625rem] font-medium tabular-nums text-forest">
                  {progress.percent}%
                </span>
              </div>
              <p className="mt-1 text-[0.875rem] text-ink-soft">
                {t('dashboard.remainingCount', { count: remaining })}
              </p>
              <ProgressBar percent={progress.percent} className="mt-3.5" />
            </Card>
          ) : (
            <NotShared name={settings.name} />
          )}
        </section>

        {routinesVisible ? (
          <section>
            <SectionTitle>{t('dashboard.reminders')}</SectionTitle>
            <Card className="flex items-center gap-3.5 px-4 py-4">
              {next ? (
                <>
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
                  >
                    <RoutineIconGlyph icon={next.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.8125rem] text-ink-faint">
                      {t('dashboard.nextReminder')}
                    </span>
                    <span className="block truncate text-[0.9375rem] text-ink">{next.name}</span>
                  </span>
                  <span className="shrink-0 text-[0.875rem] tabular-nums text-ink-soft">
                    {formatTime(next.time)}
                  </span>
                </>
              ) : (
                <p className="text-[0.875rem] text-ink-soft">{t('dashboard.noReminders')}</p>
              )}
            </Card>
          </section>
        ) : null}

        <section>
          <SectionTitle>{t('dashboard.location')}</SectionTitle>
          <Card className="px-4 py-4">
            <div className="flex items-center gap-3">
              <StatusDot
                tone={
                  locationRead.status === 'ok'
                    ? isStale(locationRead.fix.timestamp)
                      ? 'stale'
                      : 'active'
                    : locationRead.status === 'no-fix'
                      ? 'error'
                      : 'off'
                }
              />
              <p className="flex-1 text-[0.9375rem] text-ink">
                {locationRead.status === 'ok'
                  ? isStale(locationRead.fix.timestamp)
                    ? t('locationView.stale', {
                        when: formatRelativeTime(locationRead.fix.timestamp, t),
                      })
                    : t('locationView.active')
                  : locationRead.status === 'no-fix'
                    ? t('locationView.unavailable')
                    : locationRead.reason === 'permission-off'
                      ? t('dashboard.notShared')
                      : t('locationView.disabled')}
              </p>
            </div>

            {locationRead.status === 'ok' ? (
              <>
                <p className="mt-2 pl-[1.375rem] text-[0.8125rem] text-ink-soft">
                  {t('location.lastUpdated')}:{' '}
                  {formatRelativeTime(locationRead.fix.timestamp, t)}
                </p>
                <Link
                  to="/caregiver/location"
                  className="tap mt-3.5 flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-forest text-[0.875rem] font-medium text-canvas active:scale-[0.99]"
                >
                  <MapPin size={16} strokeWidth={1.9} aria-hidden="true" />
                  {t('dashboard.viewLocation')}
                </Link>
              </>
            ) : null}
          </Card>
        </section>
      </div>
    </div>
  );
}

function NotShared({ name }: { name: string }) {
  const { t } = useTranslation();
  return (
    <Card className="flex items-center gap-3 px-4 py-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] text-ink">{t('dashboard.notShared')}</span>
        <span className="mt-0.5 block text-[0.8125rem] text-ink-soft">
          {t('dashboard.notSharedBody', { name })}
        </span>
      </span>
      <ChevronRight
        size={18}
        strokeWidth={1.7}
        aria-hidden="true"
        className="shrink-0 text-ink-faint"
      />
    </Card>
  );
}
