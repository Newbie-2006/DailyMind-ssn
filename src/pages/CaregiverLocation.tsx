import { useMemo } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { authorizeLocationRead } from '../services/caregiverAccess';
import { mapsUrl } from '../services/locationService';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { LocationMap } from '../components/LocationMap';
import { StatusDot } from '../components/StatusDot';
import { useTranslation } from '../i18n/useTranslation';
import { formatRelativeTime, isStale } from '../i18n/relativeTime';

/**
 * The caregiver's view of a position. Every read goes through
 * `authorizeLocationRead`, so a caregiver who is paused, whose sharing is off,
 * or who was never granted the location permission simply has no coordinates to
 * render - the screen has no other path to them.
 */
export function CaregiverLocation() {
  const { caregiverId } = useParams<{ caregiverId: string }>();
  const { caregivers, settings, location } = useAppData();
  const { t } = useTranslation();

  const caregiver = caregivers.find((entry) => entry.id === caregiverId);

  const result = useMemo(
    () =>
      authorizeLocationRead(
        { caregiverId: caregiverId ?? '', caregivers, settings },
        location,
      ),
    [caregiverId, caregivers, settings, location],
  );

  if (!caregiver) return <Navigate to="/caregivers" replace />;

  return (
    <div className="pb-10">
      <PageHeader
        title={t('locationView.title')}
        onBack
        fallbackTo={`/caregivers/${caregiver.id}/dashboard`}
      />

      <div className="space-y-5 px-5 pt-2">
        {result.status === 'denied' ? (
          <Card className="flex items-start gap-3 px-4 py-4">
            <ShieldAlert
              size={18}
              strokeWidth={1.6}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-clay"
            />
            <div>
              <p className="text-[0.9375rem] text-ink">
                {result.reason === 'not-sharing'
                  ? t('locationView.disabled')
                  : t('locationView.noAccess')}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                {result.reason === 'not-sharing'
                  ? t('location.notSharing')
                  : t('locationView.noAccessBody')}
              </p>
            </div>
          </Card>
        ) : null}

        {result.status === 'no-fix' ? (
          <Card className="px-4 py-4">
            <p className="text-[0.9375rem] text-ink">{t('locationView.unavailable')}</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
              {t('location.unavailableBody')}
            </p>
          </Card>
        ) : null}

        {result.status === 'ok' ? (
          <>
            <Card className="overflow-hidden">
              <LocationMap fix={result.fix} className="h-64" />
              <div className="px-4 py-4">
                <p className="font-display text-[1.25rem] leading-tight text-ink">
                  {t('locationView.personLocation', { name: settings.name })}
                </p>

                <div className="mt-3 flex items-center gap-2.5">
                  <StatusDot tone={isStale(result.fix.timestamp) ? 'stale' : 'active'} />
                  <p className="text-[0.875rem] text-ink-soft">
                    {isStale(result.fix.timestamp)
                      ? t('locationView.stale', {
                          when: formatRelativeTime(result.fix.timestamp, t),
                        })
                      : t('locationView.active')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="divide-y divide-line-soft">
              <Row label={t('location.lastUpdated')}>
                {formatRelativeTime(result.fix.timestamp, t)}
              </Row>
              {result.fix.accuracy ? (
                <Row label={t('location.accuracy')}>
                  {t('location.accuracyValue', { metres: Math.round(result.fix.accuracy) })}
                </Row>
              ) : null}
              <Row label={t('location.coordinates')}>
                <span className="tabular-nums">
                  {result.fix.latitude.toFixed(5)}, {result.fix.longitude.toFixed(5)}
                </span>
              </Row>
            </Card>

            <a
              href={mapsUrl(result.fix)}
              target="_blank"
              rel="noreferrer noopener"
              className="tap flex min-h-12 items-center justify-center gap-2 rounded-full bg-sage-wash text-[0.875rem] font-medium text-forest-deep active:scale-[0.99]"
            >
              <ExternalLink size={16} strokeWidth={1.9} aria-hidden="true" />
              {t('locationView.openInMaps')}
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex-1 text-[0.875rem] text-ink-soft">{label}</span>
      <span className="text-right text-[0.875rem] text-ink">{children}</span>
    </div>
  );
}
