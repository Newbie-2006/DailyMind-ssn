import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { photos } from '../data/photos';
import { useAppData } from '../hooks/useAppData';
import { PlainShell } from '../layouts/AppShell';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../i18n/useTranslation';

export function Welcome() {
  const navigate = useNavigate();
  const { actions } = useAppData();
  const { t } = useTranslation();

  const start = () => {
    actions.completeOnboarding();
    navigate('/home', { replace: true });
  };

  return (
    <PlainShell>
      <div className="relative flex min-h-full flex-1 flex-col overflow-y-auto">
        <div className="relative h-[44vh] min-h-[16rem] w-full shrink-0 overflow-hidden">
          <img
            src={photos.hero}
            alt={t('welcome.heroAlt')}
            className="size-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          {/* Lets the photograph settle into the cream rather than stopping at an edge. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-canvas"
          />
        </div>

        <div className="safe-bottom flex flex-1 flex-col px-7 pt-2 pb-8">
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="font-display text-[2.5rem] leading-none tracking-[-0.02em] text-forest-deep">
              DailyMind
            </h1>

            <p className="mt-5 font-display text-[1.5rem] leading-[1.35] tracking-[-0.01em] text-ink">
              {t('welcome.tagline1')}
              <br />
              {t('welcome.tagline2')}
              <br />
              {t('welcome.tagline3')}
            </p>

            <p className="mt-5 max-w-[19rem] text-[0.9375rem] leading-relaxed text-ink-soft">
              {t('welcome.subtitle')}
            </p>
          </div>

          <div className="mt-8">
            <Button size="lg" onClick={start}>
              {t('welcome.getStarted')}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Button>

            <p className="mt-6 text-center text-[0.875rem] text-ink-soft">
              {t('welcome.haveAccount')}{' '}
              <button
                type="button"
                onClick={start}
                className="tap font-medium text-forest underline underline-offset-4"
              >
                {t('welcome.signIn')}
              </button>
            </p>

            <p className="mt-4 text-center">
              <Link
                to="/caregiver/login"
                className="tap text-[0.875rem] text-ink-faint underline underline-offset-4"
              >
                {t('welcome.caregiverLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PlainShell>
  );
}
