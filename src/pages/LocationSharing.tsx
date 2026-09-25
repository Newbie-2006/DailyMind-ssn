import { Info, MapPin, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LocationFrequency } from '../types';
import { useAppData } from '../hooks/useAppData';
import { useLocationSharing } from '../hooks/useLocationSharing';
import { caregiversWithLocationAccess } from '../services/caregiverAccess';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusDot } from '../components/StatusDot';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';
import { formatRelativeTime } from '../i18n/relativeTime';
import type { TranslationKey } from '../i18n/translate';

const frequencies: { id: LocationFrequency; labelKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { id: 'frequent', labelKey: 'location.freq.frequent', bodyKey: 'location.freq.frequentBody' },
  { id: 'balanced', labelKey: 'location.freq.balanced', bodyKey: 'location.freq.balancedBody' },
  { id: 'saver', labelKey: 'location.freq.saver', bodyKey: 'location.freq.saverBody' },
];

export function LocationSharing() {
  const { caregivers, settings } = useAppData();
  const { t } = useTranslation();
  const { notify } = useToast();
  const { location, permission, busy, supported, startSharing, stopSharing, updateNow, setFrequency } =
    useLocationSharing();

  const withAccess = caregiversWithLocationAccess(caregivers, settings);
  const fix = location.lastFix;

  const start = async () => {
    const state = await startSharing();
    if (state === 'granted') notify(t('location.startedToast'));
  };

  const stop = () => {
    stopSharing();
    notify(t('location.stoppedToast'));
  };

  const refresh = async () => {
    const result = await updateNow();
    if (result === 'ok' || result === 'skipped') notify(t('location.updatedToast'));
  };

  return (
    <div className="pb-10">
      <PageHeader title={t('location.title')} onBack fallbackTo="/profile" />

      <div className="space-y-6 px-5 pt-2">
        <Card surface="sage" className="flex items-start gap-3 px-4 py-4">
          <MapPin
            size={18}
            strokeWidth={1.6}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-forest-soft"
          />
          <p className="text-[0.875rem] leading-relaxed text-forest-deep">{t('location.intro')}</p>
        </Card>

        {!supported ? (
          <Card surface="beige" className="px-4 py-4">
            <p className="text-[0.9375rem] text-ink">{t('location.unsupported')}</p>
          </Card>
        ) : null}

        {/* The explanation always comes before the prompt. */}
        {supported && permission !== 'granted' && !location.sharingEnabled ? (
          <Card className="px-4 py-4">
            <div className="flex items-start gap-3">
              <ShieldAlert
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-clay"
              />
              <div className="min-w-0">
                <p className="text-[0.9375rem] text-ink">
                  {permission === 'denied'
                    ? t('location.permissionDenied')
                    : t('location.permissionTitle')}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                  {permission === 'denied'
                    ? t('location.permissionDeniedBody')
                    : t('location.permissionBody')}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        <section>
          <SectionTitle>{t('location.status')}</SectionTitle>
          <Card className="divide-y divide-line-soft">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <StatusDot tone={location.sharingEnabled ? 'active' : 'off'} />
              <span className="flex-1 text-[0.9375rem] text-ink">
                {location.sharingEnabled ? t('location.sharing') : t('location.notSharing')}
              </span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-[0.875rem] text-ink-soft">
                {t('location.lastUpdated')}
              </span>
              <span className="text-[0.875rem] text-ink">
                {fix ? formatRelativeTime(fix.timestamp, t) : t('location.never')}
              </span>
            </div>

            {fix?.accuracy ? (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex-1 text-[0.875rem] text-ink-soft">{t('location.accuracy')}</span>
                <span className="text-[0.875rem] text-ink">
                  {t('location.accuracyValue', { metres: Math.round(fix.accuracy) })}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-[0.875rem] text-ink-soft">
                {t('location.sharedWith')}
              </span>
              <span className="text-right text-[0.875rem] text-ink">
                {withAccess.length > 0
                  ? withAccess.map((caregiver) => caregiver.name).join(', ')
                  : t('location.sharedWithNobody')}
              </span>
            </div>
          </Card>

          {location.lastError === 'offline' ? (
            <p role="status" className="mt-2 px-1 text-[0.8125rem] text-ink-faint">
              {t('location.offline')}
            </p>
          ) : null}
          {location.lastError === 'unavailable' || location.lastError === 'timeout' ? (
            <p role="alert" className="mt-2 px-1 text-[0.8125rem] text-clay">
              {t('location.unavailableBody')}
            </p>
          ) : null}
        </section>

        <div className="space-y-3">
          {location.sharingEnabled ? (
            <>
              <Button size="lg" variant="secondary" disabled={busy} onClick={() => void refresh()}>
                <RefreshCw size={17} strokeWidth={1.8} aria-hidden="true" />
                {busy ? t('location.updating') : t('location.updateNow')}
              </Button>
              <Button size="lg" variant="quiet" onClick={stop}>
                {t('location.stopSharing')}
              </Button>
            </>
          ) : (
            <Button size="lg" disabled={!supported || busy} onClick={() => void start()}>
              {permission === 'granted' ? t('location.startSharing') : t('location.permissionGrant')}
            </Button>
          )}
        </div>

        <section>
          <SectionTitle>{t('location.updateFrequency')}</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {frequencies.map((option) => {
              const selected = location.frequency === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFrequency(option.id)}
                  className="tap flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 active:bg-surface-sunk"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-forest' : 'border-beige-deep'
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${selected ? 'bg-forest' : 'bg-transparent'}`}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] text-ink">{t(option.labelKey)}</span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-soft">
                      {t(option.bodyKey)}
                    </span>
                  </span>
                </button>
              );
            })}
          </Card>
        </section>

        <section>
          <SectionTitle>{t('location.whoCanSee')}</SectionTitle>
          {withAccess.length === 0 ? (
            <Card className="flex items-start gap-3 px-4 py-4">
              <Users
                size={17}
                strokeWidth={1.7}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-ink-faint"
              />
              <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
                {t('location.noCaregiverWithAccess')}
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-line-soft">
              {withAccess.map((caregiver) => (
                <Link
                  key={caregiver.id}
                  to="/caregivers"
                  className="tap flex min-h-14 items-center gap-3 px-4 py-3 active:bg-surface-sunk"
                >
                  <StatusDot tone="active" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] text-ink">
                      {caregiver.name}
                    </span>
                    <span className="block text-[0.8125rem] text-ink-faint">
                      {caregiver.relation}
                    </span>
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </section>

        <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
          <Info
            size={16}
            strokeWidth={1.7}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-ink-soft"
          />
          <div>
            <p className="text-[0.875rem] text-ink">{t('location.howItWorks')}</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
              {t('location.howItWorksBody')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
