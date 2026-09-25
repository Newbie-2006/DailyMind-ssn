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
import { useToast } from '../components/ui/toastContext';

const repeatOptions: { id: RepeatRule; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Mon-Fri' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'custom', label: 'Custom' },
];

const weekdayLabels = [
  { day: 1, label: 'M', name: 'Monday' },
  { day: 2, label: 'T', name: 'Tuesday' },
  { day: 3, label: 'W', name: 'Wednesday' },
  { day: 4, label: 'T', name: 'Thursday' },
  { day: 5, label: 'F', name: 'Friday' },
  { day: 6, label: 'S', name: 'Saturday' },
  { day: 0, label: 'S', name: 'Sunday' },
];

/** Serves both "Add Routine" and editing an existing one. */
export function AddRoutine() {
  const { routineId } = useParams<{ routineId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { routines, actions } = useAppData();

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
    };

    if (existing) {
      actions.updateRoutine(existing.id, draft);
      notify('Routine updated');
      navigate(`/routines/${existing.id}`, { replace: true });
    } else {
      actions.addRoutine(draft);
      notify('Routine added');
      navigate('/routines', { replace: true });
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={isEditing ? 'Edit routine' : 'Add routine'}
        onBack
        fallbackTo="/routines"
        actions={
          <button
            type="button"
            onClick={save}
            className="tap mr-1 inline-flex min-h-10 items-center rounded-full bg-forest px-4 text-[0.875rem] font-medium text-canvas active:scale-[0.98]"
          >
            Save
          </button>
        }
      />

      <div className="space-y-6 px-5 pt-2">
        <div>
          <TextField
            label="Routine name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Morning walk"
            aria-invalid={touched && !nameValid}
          />
          {touched && !nameValid ? (
            <p role="alert" className="mt-1.5 text-[0.8125rem] text-clay">
              Give the routine a name so you recognise it.
            </p>
          ) : null}
        </div>

        <FieldGroup label="Icon">
          <div className="grid grid-cols-5 gap-2">
            {routineIconOptions.map((option) => {
              const selected = icon === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setIcon(option.id)}
                  aria-pressed={selected}
                  aria-label={option.label}
                  title={option.label}
                  className={`tap flex h-14 flex-col items-center justify-center gap-1 rounded-2xl transition-colors duration-150 ${
                    selected
                      ? 'bg-forest text-canvas'
                      : 'bg-surface-sunk text-forest-soft active:bg-beige'
                  }`}
                >
                  <RoutineIconGlyph icon={option.id} size={19} />
                  <span className="text-[0.625rem] leading-none opacity-80">{option.label}</span>
                </button>
              );
            })}
          </div>
        </FieldGroup>

        <TextField
          label="Time"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value || '07:00')}
        />

        <FieldGroup label="Repeat">
          <div className="flex flex-wrap gap-2">
            {repeatOptions.map((option) => (
              <ChoiceChip
                key={option.id}
                selected={repeat === option.id}
                onClick={() => setRepeat(option.id)}
              >
                {option.label}
              </ChoiceChip>
            ))}
          </div>

          {repeat === 'custom' ? (
            <div className="mt-3.5">
              <div className="flex justify-between gap-1.5">
                {weekdayLabels.map(({ day, label, name: dayName }) => {
                  const selected = customDays.includes(day);
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
                      {label}
                    </button>
                  );
                })}
              </div>
              {touched && !daysValid ? (
                <p role="alert" className="mt-2 text-[0.8125rem] text-clay">
                  Choose at least one day.
                </p>
              ) : null}
            </div>
          ) : null}
        </FieldGroup>

        <TextAreaField
          label="Note"
          hint="Optional. A short reminder to yourself."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="After breakfast, with a full glass of water."
        />

        <Button size="lg" onClick={save}>
          {isEditing ? 'Save changes' : 'Save routine'}
        </Button>
      </div>
    </div>
  );
}
