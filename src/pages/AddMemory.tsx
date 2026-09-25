import { useMemo, useRef, useState } from 'react';
import { Camera, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MemoryCategory, MemoryDraft } from '../types';
import { useAppData } from '../hooks/useAppData';
import { knownPeople } from '../services/memoryService';
import { suggestedTags } from '../data/seed';
import { fileToStorableImage } from '../utils/image';
import { today } from '../utils/date';
import { PageHeader } from '../components/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { ChoiceChip, FieldGroup, TextAreaField, TextField } from '../components/ui/Field';
import { Tag } from '../components/ui/Tag';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translate';

const categories: { id: MemoryCategory; labelKey: TranslationKey }[] = [
  { id: 'photo', labelKey: 'memories.category.photo' },
  { id: 'people', labelKey: 'memories.category.people' },
  { id: 'event', labelKey: 'memories.category.event' },
];

/** Serves both "Add Memory" and editing an existing one - the form is the same. */
export function AddMemory() {
  const { memoryId } = useParams<{ memoryId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { memories, actions } = useAppData();
  const { t } = useTranslation();

  const existing = memoryId ? memories.find((memory) => memory.id === memoryId) : undefined;
  const isEditing = Boolean(existing);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [date, setDate] = useState(existing?.date ?? today());
  const [image, setImage] = useState<string | undefined>(existing?.image);
  const [category, setCategory] = useState<MemoryCategory>(existing?.category ?? 'photo');
  const [people, setPeople] = useState<string[]>(existing?.people ?? []);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [personDraft, setPersonDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  const peopleSuggestions = useMemo(
    () => knownPeople(memories).filter((person) => !people.includes(person)).slice(0, 6),
    [memories, people],
  );

  const tagSuggestions = useMemo(
    () => suggestedTags.filter((tag) => !tags.includes(tag)).slice(0, 8),
    [tags],
  );

  const titleValid = title.trim().length > 0;

  const pickImage = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setImageError(null);
    try {
      setImage(await fileToStorableImage(file));
    } catch {
      setImageError(t('memoryForm.photoError'));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    setTouched(true);
    if (!titleValid) return;

    const draft: MemoryDraft = {
      title: title.trim(),
      description: description.trim(),
      date,
      image,
      category,
      people,
      tags,
    };

    if (existing) {
      actions.updateMemory(existing.id, draft);
      notify(t('memoryForm.updatedToast'));
      navigate(`/memories/${existing.id}`, { replace: true });
    } else {
      const created = actions.addMemory(draft);
      notify(t('memoryForm.savedToast'));
      navigate(`/memories/${created.id}`, { replace: true });
    }
  };

  const addPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || people.includes(trimmed)) return;
    setPeople([...people, trimmed]);
    setPersonDraft('');
  };

  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
    setTagDraft('');
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={isEditing ? t('memoryForm.editTitle') : t('memoryForm.addTitle')}
        onBack
        fallbackTo="/memories"
        actions={
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="tap mr-1 inline-flex min-h-10 items-center rounded-full bg-forest px-4 text-[0.875rem] font-medium text-canvas active:scale-[0.98] disabled:opacity-45"
          >
            {t('common.save')}
          </button>
        }
      />

      <div className="space-y-6 px-5 pt-2">
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              void pickImage(event.target.files?.[0]);
              event.target.value = '';
            }}
          />

          {image ? (
            <div className="relative overflow-hidden rounded-card">
              <img src={image} alt="" className="h-52 w-full object-cover" decoding="async" />
              <div className="absolute right-3 bottom-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="tap inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface/95 px-3.5 text-[0.8125rem] font-medium text-ink shadow-soft"
                >
                  <RefreshCw size={14} strokeWidth={1.9} aria-hidden="true" />
                  {t('common.change')}
                </button>
                <IconButton
                  label={t('memoryForm.removePhoto')}
                  onClick={() => setImage(undefined)}
                  className="bg-surface/95 shadow-soft"
                >
                  <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="tap flex h-44 w-full flex-col items-center justify-center gap-2.5 rounded-card border border-dashed border-beige-deep bg-surface-sunk text-ink-soft transition-colors duration-150 active:bg-beige"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-surface text-forest-soft">
                <Camera size={22} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span className="text-[0.9375rem] font-medium text-ink">
                {busy ? t('memoryForm.preparingPhoto') : t('memoryForm.addPhoto')}
              </span>
              <span className="text-[0.8125rem] text-ink-faint">{t('common.optional')}</span>
            </button>
          )}

          {imageError ? (
            <p role="alert" className="mt-2 text-[0.8125rem] text-clay">
              {imageError}
            </p>
          ) : null}
        </div>

        <TextField
          label={t('memoryForm.title')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={t('memoryForm.titlePlaceholder')}
          aria-invalid={touched && !titleValid}
        />
        {touched && !titleValid ? (
          <p role="alert" className="-mt-4 text-[0.8125rem] text-clay">
            {t('memoryForm.titleRequired')}
          </p>
        ) : null}

        <TextField
          label={t('memoryForm.date')}
          type="date"
          value={date}
          max={today()}
          onChange={(event) => setDate(event.target.value || today())}
        />

        <TextAreaField
          label={t('memoryForm.description')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t('memoryForm.descriptionPlaceholder')}
          rows={5}
        />

        <FieldGroup label={t('memoryForm.kind')}>
          <div className="flex flex-wrap gap-2">
            {categories.map((option) => (
              <ChoiceChip
                key={option.id}
                selected={category === option.id}
                onClick={() => setCategory(option.id)}
              >
                {t(option.labelKey)}
              </ChoiceChip>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label={t('memoryForm.people')}>
          {people.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {people.map((person) => (
                <Tag
                  key={person}
                  tone="beige"
                  onRemove={() => setPeople(people.filter((name) => name !== person))}
                >
                  {person}
                </Tag>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            <input
              value={personDraft}
              onChange={(event) => setPersonDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addPerson(personDraft);
                }
              }}
              placeholder={t('memoryForm.peoplePlaceholder')}
              aria-label={t('memoryForm.addPerson')}
              className="min-h-12 w-full rounded-2xl border border-line-soft bg-surface-sunk px-4 text-[0.9375rem] placeholder:text-ink-faint focus:border-sage focus:bg-surface focus:outline-none"
            />
            <IconButton label={t('memoryForm.addPersonAction')} onClick={() => addPerson(personDraft)}>
              <Plus size={19} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </div>

          {peopleSuggestions.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {peopleSuggestions.map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => addPerson(person)}
                  className="tap min-h-9 rounded-full bg-surface-sunk px-3 text-[0.8125rem] text-ink-soft active:bg-beige"
                >
                  + {person}
                </button>
              ))}
            </div>
          ) : null}
        </FieldGroup>

        <FieldGroup label={t('memoryForm.tags')}>
          {tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag} onRemove={() => setTags(tags.filter((name) => name !== tag))}>
                  {tag}
                </Tag>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag(tagDraft);
                }
              }}
              placeholder={t('memoryForm.addTag')}
              aria-label={t('memoryForm.addTag')}
              className="min-h-12 w-full rounded-2xl border border-line-soft bg-surface-sunk px-4 text-[0.9375rem] placeholder:text-ink-faint focus:border-sage focus:bg-surface focus:outline-none"
            />
            <IconButton label={t('memoryForm.addTagAction')} onClick={() => addTag(tagDraft)}>
              <Plus size={19} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </div>

          {tagSuggestions.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="tap min-h-9 rounded-full bg-surface-sunk px-3 text-[0.8125rem] text-ink-soft active:bg-beige"
                >
                  + {tag}
                </button>
              ))}
            </div>
          ) : null}
        </FieldGroup>

        <Button size="lg" onClick={save} disabled={busy}>
          {isEditing ? t('common.saveChanges') : t('memoryForm.saveMemory')}
        </Button>
      </div>
    </div>
  );
}
