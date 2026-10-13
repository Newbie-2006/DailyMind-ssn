import { useState } from 'react';
import { Camera, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { FamilyMember } from '../types';
import { useAppData } from '../hooks/useAppData';
import { fileToStorableImage } from '../utils/image';
import { initials } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { ChoiceChip, TextAreaField, TextField } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/toastContext';

const RELATIONS = ['Daughter', 'Son', 'Wife', 'Husband', 'Granddaughter', 'Grandson', 'Sister', 'Brother'];

interface Draft {
  name: string;
  relation: string;
  notes: string;
  photo?: string;
}

const emptyDraft: Draft = { name: '', relation: '', notes: '' };

/**
 * The people Gary may name. Gary only ever answers "what is my daughter's
 * name?" from this list; if it is not here, he says so.
 */
export function Family() {
  const { family, actions } = useAppData();
  const { notify } = useToast();

  const [editing, setEditing] = useState<FamilyMember | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [removing, setRemoving] = useState<FamilyMember | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const startAdd = () => {
    setDraft(emptyDraft);
    setPhotoError(null);
    setEditing('new');
  };

  const startEdit = (member: FamilyMember) => {
    setDraft({ name: member.name, relation: member.relation, notes: member.notes ?? '', photo: member.photo });
    setPhotoError(null);
    setEditing(member);
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const photo = await fileToStorableImage(file);
      setDraft((current) => ({ ...current, photo }));
      setPhotoError(null);
    } catch {
      setPhotoError('That photo could not be used. Try another one.');
    }
  };

  const save = () => {
    const name = draft.name.trim();
    const relation = draft.relation.trim();
    if (!name || !relation) return;
    const values = { name, relation, notes: draft.notes.trim() || undefined, photo: draft.photo };
    if (editing === 'new') {
      actions.addFamilyMember(values);
      notify(`${name} added`);
    } else if (editing) {
      actions.updateFamilyMember(editing.id, values);
      notify('Saved');
    }
    setEditing(null);
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Family details"
        onBack
        fallbackTo="/profile"
        actions={
          <IconButton label="Add a family member" tone="filled" onClick={startAdd}>
            <Plus size={20} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        }
      />

      <div className="space-y-4 px-5 pt-2">
        <Card surface="sage" className="flex items-start gap-3 px-4 py-4">
          <Users size={18} strokeWidth={1.6} aria-hidden="true" className="mt-0.5 shrink-0 text-forest-soft" />
          <p className="text-[0.875rem] leading-relaxed text-forest-deep">
            Gary uses these when asked about family, such as “what is my daughter’s name?”. He never
            guesses a name that is not saved here.
          </p>
        </Card>

        {family.length === 0 ? (
          <EmptyState
            icon={<Users size={24} strokeWidth={1.5} />}
            title="No family details yet"
            body="Add the people who matter most, with how they are related."
            action={<Button onClick={startAdd}>Add a family member</Button>}
          />
        ) : (
          <Card className="divide-y divide-line-soft">
            {family.map((member) => (
              <div key={member.id} className="flex items-center gap-3.5 px-4 py-3.5">
                <Avatar name={member.name} photo={member.photo} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-ink">{member.name}</p>
                  <p className="truncate text-[0.8125rem] text-ink-faint">
                    {member.relation}
                    {member.notes ? ` · ${member.notes}` : ''}
                  </p>
                </div>
                <IconButton label={`Edit ${member.name}`} onClick={() => startEdit(member)}>
                  <Pencil size={17} strokeWidth={1.8} aria-hidden="true" />
                </IconButton>
                <IconButton label={`Remove ${member.name}`} onClick={() => setRemoving(member)}>
                  <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                </IconButton>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a family member' : 'Edit family member'}
        actions={
          <>
            <Button size="lg" onClick={save} disabled={!draft.name.trim() || !draft.relation.trim()}>
              Save
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="max-h-[55dvh] space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center gap-3.5">
            <Avatar name={draft.name || '?'} photo={draft.photo} />
            <label className="tap inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-sage-soft px-4 text-[0.875rem] font-medium text-forest-deep">
              <Camera size={16} strokeWidth={1.8} aria-hidden="true" />
              {draft.photo ? 'Change photo' : 'Add a photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  void pickPhoto(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </label>
            {draft.photo ? (
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, photo: undefined }))}
                className="tap min-h-11 rounded-full px-3 text-[0.8125rem] text-ink-soft"
              >
                Remove
              </button>
            ) : null}
          </div>
          {photoError ? (
            <p role="alert" className="text-[0.8125rem] text-clay">
              {photoError}
            </p>
          ) : null}

          <TextField
            label="Name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Priya"
          />
          <div>
            <TextField
              label="Relation"
              value={draft.relation}
              onChange={(event) => setDraft((current) => ({ ...current, relation: event.target.value }))}
              placeholder="Daughter"
              hint="In English, so Gary can match it in any language."
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {RELATIONS.map((relation) => (
                <ChoiceChip
                  key={relation}
                  selected={draft.relation === relation}
                  onClick={() => setDraft((current) => ({ ...current, relation }))}
                >
                  {relation}
                </ChoiceChip>
              ))}
            </div>
          </div>
          <TextAreaField
            label="Notes (optional)"
            rows={3}
            value={draft.notes}
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Lives nearby and visits on Sundays."
          />
        </div>
      </Modal>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing ? `Remove ${removing.name}?` : ''}
        description="Gary will no longer be able to tell anyone about them."
        actions={
          <>
            <Button
              size="lg"
              onClick={() => {
                if (removing) actions.removeFamilyMember(removing.id);
                setRemoving(null);
                notify('Removed');
              }}
            >
              Remove
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

function Avatar({ name, photo }: { name: string; photo?: string }) {
  return (
    <span className="size-12 shrink-0 overflow-hidden rounded-full bg-sage-wash">
      {photo ? (
        <img src={photo} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <span className="flex size-full items-center justify-center text-[0.875rem] font-medium text-forest">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
