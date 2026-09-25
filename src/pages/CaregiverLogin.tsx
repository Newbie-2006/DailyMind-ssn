import { useState, type FormEvent } from 'react';
import { Info, Users } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { signIn, resolveSession, type SignInFailure } from '../services/caregiverAuth';
import { PlainShell } from '../layouts/AppShell';
import { BrandMark } from '../components/BrandMark';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useTranslation } from '../i18n/useTranslation';

const failureKeys: Record<SignInFailure, 'caregiverLogin.errorInvalid' | 'caregiverLogin.errorPaused' | 'caregiverLogin.errorSharingOff'> = {
  invalid: 'caregiverLogin.errorInvalid',
  paused: 'caregiverLogin.errorPaused',
  'sharing-off': 'caregiverLogin.errorSharingOff',
};

export function CaregiverLogin() {
  const navigate = useNavigate();
  const { caregivers, settings, caregiverSession, actions } = useAppData();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [failure, setFailure] = useState<SignInFailure | null>(null);

  // Already signed in: go straight through rather than asking twice.
  if (resolveSession(caregiverSession, caregivers, settings)) {
    return <Navigate to="/caregiver" replace />;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = signIn(email, code, caregivers, settings);

    if (!result.ok) {
      setFailure(result.reason);
      return;
    }

    actions.signInCaregiver(result.session);
    navigate('/caregiver', { replace: true });
  };

  return (
    <PlainShell>
      <div className="flex min-h-full flex-1 flex-col overflow-y-auto">
        <div className="dm-page flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center py-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <BrandMark size={44} />
              <h1 className="mt-5 font-display text-[1.625rem] leading-tight tracking-[-0.015em] text-ink">
                {t('caregiverLogin.title')}
              </h1>
              <p className="mt-3 max-w-[20rem] text-[0.9375rem] leading-relaxed text-ink-soft">
                {t('caregiverLogin.intro')}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <TextField
                label={t('caregiverLogin.email')}
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFailure(null);
                }}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                placeholder="priya@example.com"
              />

              <TextField
                label={t('caregiverLogin.code')}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  setFailure(null);
                }}
                placeholder={t('caregiverLogin.codePlaceholder')}
                autoCapitalize="characters"
                autoComplete="one-time-code"
                spellCheck={false}
                maxLength={8}
                className="[&_input]:text-center [&_input]:text-[1.25rem] [&_input]:tracking-[0.35em]"
              />

              {failure ? (
                <p role="alert" className="rounded-2xl bg-clay-soft px-4 py-3 text-[0.875rem] leading-relaxed text-clay">
                  {t(failureKeys[failure])}
                </p>
              ) : null}

              <Button type="submit" size="lg">
                <Users size={18} strokeWidth={1.8} aria-hidden="true" />
                {t('caregiverLogin.signIn')}
              </Button>
            </form>
          </div>

          <div className="space-y-4 pt-6">
            <Card surface="beige" className="flex items-start gap-3 px-4 py-4">
              <Info
                size={16}
                strokeWidth={1.7}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-ink-soft"
              />
              <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
                {t('caregiverLogin.localOnly')}
              </p>
            </Card>

            <Link
              to="/home"
              className="tap block text-center text-[0.875rem] font-medium text-forest underline-offset-4 hover:underline"
            >
              {t('caregiverLogin.backToApp')}
            </Link>
          </div>
        </div>
      </div>
    </PlainShell>
  );
}
