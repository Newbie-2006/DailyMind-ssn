import { useState } from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translate';

export function PersonalInformation() {
  const { settings, actions } = useAppData();
  const { notify } = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);

  const save = () => {
    actions.updateSettings({ name: name.trim() || settings.name, email: email.trim() });
    notify(t('personal.savedToast'));
  };

  return (
    <div className="pb-10">
      <PageHeader title={t('personal.title')} onBack fallbackTo="/profile" />

      <div className="dm-gutter space-y-5 pt-6">
        <TextField
          label={t('personal.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
        <TextField
          label={t('personal.email')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          hint={t('personal.emailHint')}
        />

        <Button size="lg" onClick={save}>
          {t('common.saveChanges')}
        </Button>
      </div>
    </div>
  );
}

const helpTopics: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: 'help.savingMemory', bodyKey: 'help.savingMemoryBody' },
  { titleKey: 'help.markingRoutine', bodyKey: 'help.markingRoutineBody' },
  { titleKey: 'help.askingAssistant', bodyKey: 'help.askingAssistantBody' },
  { titleKey: 'help.sharingFamily', bodyKey: 'help.sharingFamilyBody' },
];

export function HelpSupport() {
  const { t } = useTranslation();

  const contacts = [
    { icon: Mail, label: 'help@dailymind.example', meta: t('help.email') },
    { icon: Phone, label: '+91 80 4000 1234', meta: t('help.phoneHours') },
    { icon: MessageCircle, label: t('help.askAssistant'), meta: t('help.inApp') },
  ];

  return (
    <div className="pb-10">
      <PageHeader title={t('help.title')} onBack fallbackTo="/profile" />

      <div className="dm-gutter space-y-6 pt-6">
        <section>
          <SectionTitle>{t('help.gettingStarted')}</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {helpTopics.map((item) => (
              <div key={item.titleKey} className="px-4 py-3.5">
                <h3 className="text-[0.9375rem] text-ink">{t(item.titleKey)}</h3>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                  {t(item.bodyKey)}
                </p>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle>{t('help.contact')}</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {contacts.map(({ icon: Icon, label, meta }) => (
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
