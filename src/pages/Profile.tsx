import { useState } from 'react';
import {
  Activity,
  Bell,
  ChevronRight,
  CircleHelp,
  HeartHandshake,
  Mic,
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

interface Row {
  to: string;
  label: string;
  icon: LucideIcon;
  meta?: string;
}

export function Profile() {
  const { settings, caregivers, memories, family, gary, actions } = useAppData();
  const { notify } = useToast();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const activeCaregivers = caregivers.filter((caregiver) => caregiver.active).length;

  const rows: Row[] = [
    { to: '/profile/personal', label: 'Personal information', icon: User },
    {
      to: '/caregivers',
      label: 'Caregiver access',
      icon: Users,
      meta: activeCaregivers > 0 ? `${activeCaregivers} active` : 'None',
    },
    {
      to: '/profile/gary',
      label: 'Gary voice assistant',
      icon: Mic,
      meta: gary.apiKey ? 'Set up' : 'Not set up',
    },
    {
      to: '/family',
      label: 'Family details',
      icon: HeartHandshake,
      meta: family.length > 0 ? `${family.length} saved` : 'None',
    },
    { to: '/monitoring', label: 'Safety monitoring', icon: Activity },
    { to: '/privacy', label: 'Privacy and sharing', icon: ShieldCheck },
    { to: '/profile/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile/help', label: 'Help and support', icon: CircleHelp },
  ];

  return (
    <div className="pb-10">
      <LargeHeader title="Profile" />

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
            <p className="mt-1 text-[0.8125rem] text-ink-faint">Memories</p>
          </div>
          <div className="px-4 py-3.5 text-center">
            <p className="font-display text-[1.25rem] leading-none text-ink">{activeCaregivers}</p>
            <p className="mt-1 text-[0.8125rem] text-ink-faint">Sharing with</p>
          </div>
        </Card>

        <Card className="divide-y divide-line-soft">
          {rows.map(({ to, label, icon: Icon, meta }) => (
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
              <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">{label}</span>
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
          <Sprout size={18} strokeWidth={1.6} aria-hidden="true" className="mt-0.5 shrink-0 text-forest-soft" />
          <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
            Everything you write stays on this device. DailyMind only shares what you switch on
            yourself. When Gary is set up, the details needed to answer a question are sent to
            Anthropic to produce the reply.
          </p>
        </Card>

        <Button variant="quiet" size="lg" onClick={() => setConfirmingReset(true)}>
          <RotateCcw size={17} strokeWidth={1.8} aria-hidden="true" />
          Restore the sample content
        </Button>
      </div>

      <Modal
        open={confirmingReset}
        onClose={() => setConfirmingReset(false)}
        title="Restore sample content?"
        description="Your memories, routines, family details and settings on this device will be replaced with the sample ones. Gary’s setup is kept. This cannot be undone."
        actions={
          <>
            <Button
              size="lg"
              onClick={() => {
                actions.resetToSample();
                setConfirmingReset(false);
                notify('Sample content restored');
              }}
            >
              Restore sample content
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingReset(false)}>
              Cancel
            </Button>
          </>
        }
      />
    </div>
  );
}
