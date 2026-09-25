import { useState } from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';
import { useToast } from '../components/ui/toastContext';

export function PersonalInformation() {
  const { settings, actions } = useAppData();
  const { notify } = useToast();

  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);

  const save = () => {
    actions.updateSettings({ name: name.trim() || settings.name, email: email.trim() });
    notify('Details saved');
  };

  return (
    <div className="pb-10">
      <PageHeader title="Personal information" onBack fallbackTo="/profile" />

      <div className="space-y-5 px-5 pt-2">
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          hint="Used to identify you in DailyMind. It is not sent anywhere."
        />

        <Button size="lg" onClick={save}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

const notificationRows = [
  {
    key: 'routineReminders' as const,
    label: 'Routine reminders',
    description: 'A quiet nudge at the time a routine is due.',
  },
  {
    key: 'memoryPrompts' as const,
    label: 'Memory prompts',
    description: 'An occasional invitation to write something down.',
  },
  {
    key: 'weeklySummary' as const,
    label: 'Weekly summary',
    description: 'A short description of how the week went.',
  },
];

export function NotificationSettingsPage() {
  const { settings, actions } = useAppData();

  return (
    <div className="pb-10">
      <PageHeader title="Notifications" onBack fallbackTo="/profile" />

      <div className="space-y-5 px-5 pt-2">
        <Card className="space-y-1 px-4 py-3">
          {notificationRows.map((row) => (
            <Toggle
              key={row.key}
              checked={settings.notifications[row.key]}
              onChange={(next) =>
                actions.updateSettings({
                  notifications: { ...settings.notifications, [row.key]: next },
                })
              }
              label={row.label}
              description={row.description}
              showLabel
            />
          ))}
        </Card>

        <p className="px-1 text-[0.8125rem] leading-relaxed text-ink-faint">
          These preferences are saved on this device. Delivering notifications needs a real device
          permission, which this version does not ask for.
        </p>
      </div>
    </div>
  );
}

export function HelpSupport() {
  return (
    <div className="pb-10">
      <PageHeader title="Help and support" onBack fallbackTo="/profile" />

      <div className="space-y-6 px-5 pt-2">
        <section>
          <SectionTitle>Getting started</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {[
              {
                title: 'Saving a memory',
                body: 'Open Memories and tap the plus. A title is all that is needed; a photo, people and tags are optional.',
              },
              {
                title: 'Marking a routine done',
                body: 'Tap the circle beside it on Home or Routines. Tap it again to undo.',
              },
              {
                title: 'Asking the assistant',
                body: 'Ask in your own words, or tap one of the suggestions underneath.',
              },
              {
                title: 'Sharing with family',
                body: 'Caregiver access lets you choose exactly what each person can see.',
              },
            ].map((item) => (
              <div key={item.title} className="px-4 py-3.5">
                <h3 className="text-[0.9375rem] text-ink">{item.title}</h3>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle>Contact</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {[
              { icon: Mail, label: 'help@dailymind.example', meta: 'Email' },
              { icon: Phone, label: '+91 80 4000 1234', meta: 'Mon to Fri, 9am to 6pm' },
              { icon: MessageCircle, label: 'Ask the assistant', meta: 'Inside the app' },
            ].map(({ icon: Icon, label, meta }) => (
              <div key={label} className="flex items-center gap-3.5 px-4 py-3.5">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
                >
                  <Icon size={17} strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] text-ink">{label}</span>
                  <span className="block text-[0.8125rem] text-ink-faint">{meta}</span>
                </span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
