import { useState } from 'react';
import { KeyRound, Plus, Trash2, Users } from 'lucide-react';
import type { Caregiver, CaregiverPermissions } from '../types';
import { useAppData } from '../hooks/useAppData';
import { initials } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Modal } from '../components/ui/Modal';
import { TextField } from '../components/ui/Field';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translate';

const permissionRows: {
  key: keyof CaregiverPermissions;
  labelKey: TranslationKey;
  bodyKey: TranslationKey;
}[] = [
  { key: 'routines', labelKey: 'caregivers.perm.routines', bodyKey: 'caregivers.perm.routinesBody' },
  { key: 'memories', labelKey: 'caregivers.perm.memories', bodyKey: 'caregivers.perm.memoriesBody' },
  { key: 'insights', labelKey: 'caregivers.perm.insights', bodyKey: 'caregivers.perm.insightsBody' },
  { key: 'location', labelKey: 'caregivers.perm.location', bodyKey: 'caregivers.perm.locationBody' },
  { key: 'profile', labelKey: 'caregivers.perm.profile', bodyKey: 'caregivers.perm.profileBody' },
];

export function CaregiverAccess() {
  const { caregivers, actions } = useAppData();
  const { notify } = useToast();
  const { t } = useTranslation();

  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Caregiver | null>(null);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [email, setEmail] = useState('');

  const addCaregiver = () => {
    if (!name.trim()) return;
    actions.addCaregiver({
      name: name.trim(),
      relation: relation.trim() || t('caregivers.defaultRelation'),
      email: email.trim(),
      active: true,
      // A new caregiver starts with the least access, not the most. Location in
      // particular is never on by default.
      permissions: {
        routines: true,
        memories: false,
        insights: false,
        profile: true,
        location: false,
      },
    });
    setName('');
    setRelation('');
    setEmail('');
    setAdding(false);
    notify(t('caregivers.addedToast'));
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={t('caregivers.title')}
        onBack
        fallbackTo="/profile"
        actions={
          <IconButton label={t('caregivers.add')} tone="filled" onClick={() => setAdding(true)}>
            <Plus size={20} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        }
      />

      <div className="dm-gutter space-y-6 pt-6">
        <Card surface="sage" className="flex items-start gap-3 px-4 py-4">
          <Users
            size={18}
            strokeWidth={1.6}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-forest-soft"
          />
          <p className="text-[0.875rem] leading-relaxed text-forest-deep">
            {t('caregivers.intro')}
          </p>
        </Card>

        {caregivers.length === 0 ? (
          <EmptyState
            icon={<Users size={24} strokeWidth={1.5} />}
            title={t('caregivers.empty.title')}
            body={t('caregivers.empty.body')}
            action={<Button onClick={() => setAdding(true)}>{t('caregivers.add')}</Button>}
          />
        ) : (
          caregivers.map((caregiver) => (
            <section key={caregiver.id}>
              <Card className="px-4 py-4">
                <div className="flex items-center gap-3.5">
                  <span className="size-12 shrink-0 overflow-hidden rounded-full bg-sage-wash">
                    {caregiver.avatar ? (
                      <img
                        src={caregiver.avatar}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-[0.875rem] font-medium text-forest">
                        {initials(caregiver.name)}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-medium text-ink">
                      {caregiver.name}{' '}
                      <span className="font-normal text-ink-faint">({caregiver.relation})</span>
                    </p>
                    <p className="truncate text-[0.8125rem] text-ink-faint">{caregiver.email}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.75rem] ${
                      caregiver.active
                        ? 'bg-sage-wash text-forest-soft'
                        : 'bg-surface-sunk text-ink-faint'
                    }`}
                  >
                    {caregiver.active ? t('caregivers.active') : t('caregivers.paused')}
                  </span>
                </div>

                <div className="mt-4 border-t border-line-soft pt-3.5">
                  <Toggle
                    checked={caregiver.active}
                    onChange={(next) => actions.updateCaregiver(caregiver.id, { active: next })}
                    label={t('caregivers.sharingOn')}
                    description={
                      caregiver.active
                        ? t('caregivers.sharingOnBody', { name: caregiver.name })
                        : t('caregivers.sharingOffBody', { name: caregiver.name })
                    }
                    showLabel
                  />
                </div>

                <div
                  className={`mt-3 space-y-1 border-t border-line-soft pt-3.5 transition-opacity duration-200 ${
                    caregiver.active ? '' : 'opacity-50'
                  }`}
                >
                  <h3 className="mb-2 text-[0.8125rem] font-medium text-ink-soft">
                    {t('caregivers.permissions')}
                  </h3>
                  {permissionRows.map((row) => (
                    <Toggle
                      key={row.key}
                      checked={caregiver.permissions[row.key]}
                      disabled={!caregiver.active}
                      onChange={(next) =>
                        actions.setCaregiverPermission(caregiver.id, row.key, next)
                      }
                      label={t(row.labelKey)}
                      description={t(row.bodyKey)}
                      showLabel
                    />
                  ))}
                </div>

                {/*
                  The sign-in code. This is what turns a row in a list into an
                  account the caregiver can actually use on their own phone.
                */}
                <div className="mt-3 border-t border-line-soft pt-3.5">
                  <h3 className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-soft">
                    <KeyRound size={14} strokeWidth={1.8} aria-hidden="true" />
                    {t('caregivers.accessSection')}
                  </h3>
                  <p className="text-[0.8125rem] leading-relaxed text-ink-faint">
                    {t('caregivers.accessBody', { name: caregiver.name })}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex-1 rounded-2xl bg-surface-sunk px-4 py-3 text-center font-mono text-[1.0625rem] tracking-[0.3em] text-ink">
                      {caregiver.accessCode ?? (
                        <span className="font-sans tracking-normal text-ink-faint">
                          {t('caregivers.noCode')}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        actions.issueAccessCode(caregiver.id);
                        notify(t('caregivers.codeCreatedToast'));
                      }}
                      className="tap inline-flex min-h-10 items-center gap-1.5 rounded-full bg-sage-wash px-3.5 text-[0.8125rem] font-medium text-forest-deep"
                    >
                      {caregiver.accessCode
                        ? t('caregivers.regenerateCode')
                        : t('caregivers.generateCode')}
                    </button>

                    {caregiver.accessCode ? (
                      <button
                        type="button"
                        onClick={() => {
                          actions.revokeAccessCode(caregiver.id);
                          notify(t('caregivers.codeRevokedToast'));
                        }}
                        className="tap inline-flex min-h-10 items-center rounded-full px-3 text-[0.8125rem] text-ink-soft active:bg-surface-sunk"
                      >
                        {t('caregivers.revokeCode')}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3.5">
                  <button
                    type="button"
                    onClick={() => setRemoving(caregiver)}
                    className="tap inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] text-ink-soft active:bg-surface-sunk"
                  >
                    <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                    {t('caregivers.removeAccess')}
                  </button>
                </div>
              </Card>
            </section>
          ))
        )}
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title={t('caregivers.addTitle')}
        description={t('caregivers.addBody')}
        actions={
          <>
            <Button size="lg" onClick={addCaregiver} disabled={!name.trim()}>
              {t('caregivers.addConfirm')}
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setAdding(false)}>
              {t('common.cancel')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label={t('caregivers.nameLabel')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Priya"
          />
          <TextField
            label={t('caregivers.relationLabel')}
            value={relation}
            onChange={(event) => setRelation(event.target.value)}
          />
          <TextField
            label={t('caregivers.emailLabel')}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="priya@example.com"
          />
        </div>
      </Modal>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing ? t('caregivers.removeTitle', { name: removing.name }) : ''}
        description={t('caregivers.removeBody')}
        actions={
          <>
            <Button
              size="lg"
              onClick={() => {
                if (removing) actions.removeCaregiver(removing.id);
                setRemoving(null);
                notify(t('caregivers.removedToast'));
              }}
            >
              {t('caregivers.removeAccess')}
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setRemoving(null)}>
              {t('common.cancel')}
            </Button>
          </>
        }
      />
    </div>
  );
}
