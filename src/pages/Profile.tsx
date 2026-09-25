import { useState } from 'react';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Languages,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sprout,
  User,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { initials } from '../utils/format';
import { LargeHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';
import { languageOptions } from '../i18n/languages';
import type { TranslationKey } from '../i18n/translate';

interface Row {
  to: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  meta?: string;
}

export function Profile() {
  const { settings, caregivers, memories, location, actions } = useAppData();
  const { notify } = useToast();
  const { t, language } = useTranslation();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const activeCaregivers = caregivers.filter((caregiver) => caregiver.active).length;
  const currentLanguage = languageOptions.find((option) => option.code === language);

  const rows: Row[] = [
    { to: '/profile/personal', labelKey: 'profile.personalInfo', icon: User },
    {
      to: '/caregivers',
      labelKey: 'profile.caregiverAccess',
      icon: Users,
      meta: activeCaregivers > 0 ? t('profile.activeCount', { count: activeCaregivers }) : t('profile.none'),
    },
    {
      to: '/profile/location',
      labelKey: 'profile.location',
      icon: MapPin,
      meta: location.sharingEnabled ? t('common.enabled') : t('common.disabled'),
    },
    {
      to: '/profile/language',
      labelKey: 'profile.language',
      icon: Languages,
      meta: currentLanguage?.nativeName,
    },
    { to: '/privacy', labelKey: 'profile.privacy', icon: ShieldCheck },
    { to: '/profile/notifications', labelKey: 'profile.notifications', icon: Bell },
    { to: '/profile/help', labelKey: 'profile.help', icon: CircleHelp },
  ];

  return (
    <div className="pb-10">
      <LargeHeader title={t('profile.title')} />

      <div className="space-y-6 px-5 pt-1">
        <div className="flex flex-col items-center pt-2 pb-1 text-center">
          <span className="size-24 overflow-hidden rounded-full bg-sage-wash">
            {settings.avatar ? (
              <img
                src={settings.avatar}
                alt=""
                className="size-full object-cover"
                decoding="async"
              />
            ) : (
              <span className="flex size-full items-center justify-center font-display text-[1.5rem] text-forest">
                {initials(settings.name)}
              </span>
            )}
          </span>
          <h2 className="mt-3.5 font-display text-[1.375rem] leading-tight text-ink">
            {settings.name}
          </h2>
          <p className="mt-0.5 text-[0.875rem] text-ink-soft">{settings.email}</p>
        </div>

        <Card className="grid grid-cols-2 divide-x divide-line-soft">
          <div className="px-4 py-3.5 text-center">
            <p className="font-display text-[1.25rem] leading-none text-ink">{memories.length}</p>
            <p className="mt-1 text-[0.8125rem] text-ink-faint">{t('profile.memoriesStat')}</p>
          </div>
          <div className="px-4 py-3.5 text-center">
            <p className="font-display text-[1.25rem] leading-none text-ink">{activeCaregivers}</p>
            <p className="mt-1 text-[0.8125rem] text-ink-faint">{t('profile.sharingStat')}</p>
          </div>
        </Card>

        <Card className="divide-y divide-line-soft">
          {rows.map(({ to, labelKey, icon: Icon, meta }) => (
            <Link
              key={to}
              to={to}
              className="tap flex min-h-14 items-center gap-3.5 px-4 py-3 transition-colors duration-150 active:bg-surface-sunk"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
              >
                <Icon size={17} strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">{t(labelKey)}</span>
              {meta ? <span className="shrink-0 text-[0.8125rem] text-ink-faint">{meta}</span> : null}
              <ChevronRight
                size={18}
                strokeWidth={1.7}
                aria-hidden="true"
                className="shrink-0 text-ink-faint"
              />
            </Link>
          ))}
        </Card>

        <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
          <Sprout
            size={18}
            strokeWidth={1.6}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-forest-soft"
          />
          <p className="text-[0.8125rem] leading-relaxed text-ink-soft">{t('profile.privacyNote')}</p>
        </Card>

        <Button variant="quiet" size="lg" onClick={() => setConfirmingReset(true)}>
          <RotateCcw size={17} strokeWidth={1.8} aria-hidden="true" />
          {t('profile.restoreSample')}
        </Button>
      </div>

      <Modal
        open={confirmingReset}
        onClose={() => setConfirmingReset(false)}
        title={t('profile.restoreTitle')}
        description={t('profile.restoreBody')}
        actions={
          <>
            <Button
              size="lg"
              onClick={() => {
                actions.resetToSample();
                setConfirmingReset(false);
                notify(t('profile.restoredToast'));
              }}
            >
              {t('profile.restoreConfirm')}
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingReset(false)}>
              {t('common.cancel')}
            </Button>
          </>
        }
      />
    </div>
  );
}
