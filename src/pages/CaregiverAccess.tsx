import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
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

const permissionRows: {
  key: keyof CaregiverPermissions;
  label: string;
  description: string;
}[] = [
  {
    key: 'routines',
    label: 'Routines and activities',
    description: 'What is on each day, and what was completed.',
  },
  { key: 'memories', label: 'Memories', description: 'The moments you have saved.' },
  {
    key: 'insights',
    label: 'Routine insights',
    description: 'Plain observations about your week.',
  },
  { key: 'profile', label: 'Basic profile information', description: 'Your name and email.' },
];

export function CaregiverAccess() {
  const { caregivers, actions } = useAppData();
  const { notify } = useToast();

  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Caregiver | null>(null);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [email, setEmail] = useState('');

  const addCaregiver = () => {
    if (!name.trim()) return;
    actions.addCaregiver({
      name: name.trim(),
      relation: relation.trim() || 'Caregiver',
      email: email.trim(),
      active: true,
      // A new caregiver starts with the least access, not the most.
      permissions: { routines: true, memories: false, insights: false, profile: true },
    });
    setName('');
    setRelation('');
    setEmail('');
    setAdding(false);
    notify('Caregiver added');
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Caregiver access"
        onBack
        fallbackTo="/profile"
        actions={
          <IconButton label="Add a caregiver" tone="filled" onClick={() => setAdding(true)}>
            <Plus size={20} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        }
      />

      <div className="space-y-6 px-5 pt-2">
        <Card surface="sage" className="flex items-start gap-3 px-4 py-4">
          <Users size={18} strokeWidth={1.6} aria-hidden="true" className="mt-0.5 shrink-0 text-forest-soft" />
          <p className="text-[0.875rem] leading-relaxed text-forest-deep">
            Share selected information with trusted caregivers. You choose what each person can see,
            and you can turn any of it off at any time.
          </p>
        </Card>

        {caregivers.length === 0 ? (
          <EmptyState
            icon={<Users size={24} strokeWidth={1.5} />}
            title="No one has access"
            body="Nothing is shared until you invite someone and switch on what they can see."
            action={<Button onClick={() => setAdding(true)}>Add a caregiver</Button>}
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
                    {caregiver.active ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="mt-4 border-t border-line-soft pt-3.5">
                  <Toggle
                    checked={caregiver.active}
                    onChange={(next) => actions.updateCaregiver(caregiver.id, { active: next })}
                    label="Sharing is on"
                    description={
                      caregiver.active
                        ? `${caregiver.name} can see what is switched on below.`
                        : `${caregiver.name} cannot see anything while this is off.`
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
                    Sharing permissions
                  </h3>
                  {permissionRows.map((row) => (
                    <Toggle
                      key={row.key}
                      checked={caregiver.permissions[row.key]}
                      disabled={!caregiver.active}
                      onChange={(next) =>
                        actions.setCaregiverPermission(caregiver.id, row.key, next)
                      }
                      label={row.label}
                      description={row.description}
                      showLabel
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setRemoving(caregiver)}
                  className="tap mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] text-ink-soft active:bg-surface-sunk"
                >
                  <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                  Remove access
                </button>
              </Card>
            </section>
          ))
        )}
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a caregiver"
        description="They start with the least access. You decide what to switch on afterwards."
        actions={
          <>
            <Button size="lg" onClick={addCaregiver} disabled={!name.trim()}>
              Add caregiver
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Priya"
          />
          <TextField
            label="Relationship"
            value={relation}
            onChange={(event) => setRelation(event.target.value)}
            placeholder="Daughter"
          />
          <TextField
            label="Email"
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
        title={removing ? `Remove ${removing.name}?` : ''}
        description="They will no longer be able to see anything from DailyMind."
        actions={
          <>
            <Button
              size="lg"
              onClick={() => {
                if (removing) actions.removeCaregiver(removing.id);
                setRemoving(null);
                notify('Access removed');
              }}
            >
              Remove access
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
          </>
        }
      />
    </div>
  );
}
