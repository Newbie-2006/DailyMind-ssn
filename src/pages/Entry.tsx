import { Navigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { PlainShell } from '../layouts/AppShell';
import { LoadingState } from '../components/ui/EmptyState';
import { useTranslation } from '../i18n/useTranslation';

/**
 * Decides where a cold start lands: the welcome screen the first time, the home
 * screen afterwards. It waits for storage so a returning person never sees the
 * onboarding flash past.
 */
export function Entry() {
  const { ready, settings } = useAppData();
  const { t } = useTranslation();

  if (!ready) {
    return (
      <PlainShell>
        <div className="flex flex-1 items-center justify-center">
          <LoadingState label={t('welcome.opening')} />
        </div>
      </PlainShell>
    );
  }

  return <Navigate to={settings.onboarded ? '/home' : '/welcome'} replace />;
}
