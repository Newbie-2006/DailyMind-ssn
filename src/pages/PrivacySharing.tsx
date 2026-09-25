import { ChevronRight, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';

export function PrivacySharing() {
  const { settings, caregivers, actions } = useAppData();
  const activeCaregivers = caregivers.filter((caregiver) => caregiver.active);

  return (
    <div className="pb-10">
      <PageHeader title="Privacy and sharing" onBack fallbackTo="/profile" />

      <div className="space-y-6 px-5 pt-2">
        <Card surface="sage" className="flex items-start gap-3 px-4 py-4">
          <ShieldCheck
            size={18}
            strokeWidth={1.6}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-forest-soft"
          />
          <p className="text-[0.875rem] leading-relaxed text-forest-deep">
            Nothing leaves this device unless you switch it on. DailyMind never shares a memory,
            a routine or an observation on its own.
          </p>
        </Card>

        <section>
          <SectionTitle>Sharing</SectionTitle>
          <Card className="px-4 py-3">
            <Toggle
              checked={settings.sharingEnabled}
              onChange={(next) => actions.updateSettings({ sharingEnabled: next })}
              label="Allow caregiver sharing"
              description="Turning this off pauses sharing for everyone at once, without changing their individual settings."
              showLabel
            />
          </Card>

          <Link
            to="/caregivers"
            className="tap mt-3 flex min-h-14 items-center gap-3.5 rounded-card bg-surface px-4 py-3 shadow-soft active:bg-surface-sunk"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] text-ink">Who has access</span>
              <span className="mt-0.5 block text-[0.8125rem] text-ink-faint">
                {activeCaregivers.length === 0
                  ? 'No one at the moment'
                  : activeCaregivers.map((caregiver) => caregiver.name).join(', ')}
              </span>
            </span>
            <ChevronRight
              size={18}
              strokeWidth={1.7}
              aria-hidden="true"
              className="shrink-0 text-ink-faint"
            />
          </Link>
        </section>

        <section>
          <SectionTitle>Where your information lives</SectionTitle>
          <Card className="divide-y divide-line-soft">
            <div className="flex items-start gap-3.5 px-4 py-4">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
              >
                <Smartphone size={17} strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[0.9375rem] text-ink">On this device</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                  Memories, routines and completions are stored in this browser. Clearing the
                  browser&rsquo;s data removes them.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 px-4 py-4">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
              >
                <Lock size={17} strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[0.9375rem] text-ink">Nothing is sent away</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                  There is no account and no upload in this version. The assistant answers from
                  what is already on the device.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
