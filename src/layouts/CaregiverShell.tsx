import { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { resolveSession } from '../services/caregiverAuth';
import { Frame } from './AppShell';
import { PageBar } from '../components/TopBar';
import { IconButton } from '../components/ui/Button';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';

/**
 * The signed-in caregiver's shell. It is a separate frame from the person's own
 * app: a caregiver has no tabs of their own to browse, only what has been
 * shared with them.
 *
 * The session is re-checked on every render, so revoking a code or pausing a
 * caregiver drops them out immediately rather than at their next sign-in.
 */
export function CaregiverShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { t } = useTranslation();
  const { caregivers, settings, caregiverSession, actions } = useAppData();

  const scroller = useRef<HTMLElement>(null);
  const caregiver = resolveSession(caregiverSession, caregivers, settings);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (!caregiver) return <Navigate to="/caregiver/login" replace />;

  const signOut = () => {
    actions.signOutCaregiver();
    notify(t('caregiverArea.signedOutToast'));
    navigate('/caregiver/login', { replace: true });
  };

  return (
    <Frame>
      <PageBar
        title={t('caregiverArea.title')}
        showBack={false}
        actions={
          <IconButton label={t('caregiverArea.signOut')} onClick={signOut}>
            <LogOut size={19} strokeWidth={1.8} aria-hidden="true" />
          </IconButton>
        }
      />
      <main
        ref={scroller}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      >
        <Outlet context={caregiver} />
      </main>
    </Frame>
  );
}
