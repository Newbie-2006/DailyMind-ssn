import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RepeatRule, RoutineDraft, RoutineIcon } from '../types';
import { useAppData } from '../hooks/useAppData';
import { daysForRepeat } from '../services/routineService';
import { PageHeader } from '../components/PageHeader';
import { RoutineIconGlyph } from '../components/RoutineIconGlyph';
import { routineIconOptions } from '../data/routineIcons';
import { Button } from '../components/ui/Button';
import { ChoiceChip, FieldGroup, TextAreaField, TextField } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';
import { weekdayNameFor } from '../utils/date';
import type { TranslationKey } from '../i18n/translate';

const repeatOptions: { id: RepeatRule; labelKey: TranslationKey }[] = [
  { id: 'daily', labelKey: 'repeat.daily' },
  { id: 'weekdays', labelKey: 'repeat.weekdays' },
  { id: 'weekends', labelKey: 'repeat.weekends' },
  { id: 'custom', labelKey: 'repeat.custom' },
];

/** Monday first. Each initial comes from the localised weekday name. */
const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

/** Serves both "Add Routine" and editing an existing one. */
export function AddRoutine() {
  const { routineId } = useParams<{ routineId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { routines, actions } = useAppData();
  const { t } = useTranslation();

  const existing = routineId ? routines.find((routine) => routine.id === routineId) : undefined;
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [time, setTime] = useState(existing?.time ?? '07:00');
  const [icon, setIcon] = useState<RoutineIcon>(existing?.icon ?? 'walk');
  const [repeat, setRepeat] = useState<RepeatRule>(existing?.repeat ?? 'daily');
  const [customDays, setCustomDays] = useState<number[]>(
    existing?.repeat === 'custom' ? existing.days : [1, 2, 3, 4, 5],
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [reminderEnabled, setReminderEnabled] = useState(existing?.reminderEnabled !== false);
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length > 0;
  const daysValid = repeat !== 'custom' || customDays.length > 0;

  const toggleDay = (day: number) => {
    setCustomDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort(),
    );
  };

  const save = () => {
    setTouched(true);
    if (!nameValid || !daysValid) return;

    const draft: RoutineDraft = {
      name: name.trim(),
      time,
      icon,
      repeat,
      days: daysForRepeat(repeat, customDays),
      note: note.trim() || undefined,
      reminderEnabled,
    };

    if (existing) {
      actions.updateRoutine(existing.id, draft);
      notify(t('routineForm.updatedToast'));
      navigate(`/routines/${existing.id}`, { replace: true });
    } else {
      actions.addRoutine(draft);
      notify(t('routineForm.addedToast'));
      navigate('/routines', { replace: true });
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={isEditing ? t('routineForm.editTitle') : t('routineForm.addTitle')}
        onBack
        fallbackTo="/routines"
        actions={
          <button
            type="button"
            onClick={save}
            className="tap mr-1 inline-flex min-h-10 items-center rounded-full bg-forest px-4 text-[0.875rem] font-medium text-canvas active:scale-[0.98]"
          >
            {t('common.save')}
          </button>
        }
      />

      <div className="dm-gutter space-y-6 pt-6">
        <div>
          <TextField
            label={t('routineForm.name')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={t('routineForm.namePlaceholder')}
            aria-invalid={touched && !nameValid}
          />
          {touched && !nameValid ? (
            <p role="alert" className="mt-1.5 text-[0.8125rem] text-clay">
              {t('routineForm.nameRequired')}
            </p>
          ) : null}
        </div>

        <FieldGroup label={t('routineForm.icon')}>
          <div className="grid grid-cols-5 gap-2">
            {routineIconOptions.map((option) => {
              const selected = icon === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setIcon(option.id)}
                  aria-pressed={selected}
                  aria-label={t(option.labelKey)}
                  title={t(option.labelKey)}
                  className={`tap flex h-14 flex-col items-center justify-center gap-1 rounded-2xl transition-colors duration-150 ${
                    selected
                      ? 'bg-forest text-canvas'
                      : 'bg-surface-sunk text-forest-soft active:bg-beige'
                  }`}
                >
                  <RoutineIconGlyph icon={option.id} size={19} />
                  <span className="text-[0.625rem] leading-none opacity-80">
                    {t(option.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </FieldGroup>

        <TextField
          label={t('routineForm.time')}
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value || '07:00')}
        />

        <FieldGroup label={t('routineForm.repeat')}>
          <div className="flex flex-wrap gap-2">
            {repeatOptions.map((option) => (
              <ChoiceChip
                key={option.id}
                selected={repeat === option.id}
                onClick={() => setRepeat(option.id)}
              >
                {t(option.labelKey)}
              </ChoiceChip>
            ))}
          </div>

          {repeat === 'custom' ? (
            <div className="mt-3.5">
              <div className="flex justify-between gap-1.5">
                {weekdayOrder.map((day) => {
                  const selected = customDays.includes(day);
                  const dayName = weekdayNameFor(day, 'long');
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      aria-pressed={selected}
                      aria-label={dayName}
                      className={`tap flex size-11 items-center justify-center rounded-full text-[0.875rem] transition-colors duration-150 ${
                        selected
                          ? 'bg-forest font-medium text-canvas'
                          : 'bg-surface-sunk text-ink-soft active:bg-beige'
                      }`}
                    >
                      {weekdayNameFor(day).slice(0, 1)}
                    </button>
                  );
                })}
              </div>
              {touched && !daysValid ? (
                <p role="alert" className="mt-2 text-[0.8125rem] text-clay">
                  {t('routineForm.chooseDay')}
                </p>
              ) : null}
            </div>
          ) : null}
        </FieldGroup>

        <Card className="px-4 py-3">
          <Toggle
            checked={reminderEnabled}
            onChange={setReminderEnabled}
            label={t('routineForm.reminderLabel')}
            description={t('routineForm.reminderHint')}
            showLabel
          />
        </Card>

        <TextAreaField
          label={t('routineForm.note')}
          hint={t('routineForm.noteHint')}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder={t('routineForm.notePlaceholder')}
        />

        <Button size="lg" onClick={save}>
          {isEditing ? t('common.saveChanges') : t('routineForm.saveRoutine')}
        </Button>
      </div>
    </div>
  );
}
