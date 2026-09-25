import type {
  CompletionLog,
  DayProgress,
  ISODate,
  RepeatRule,
  Routine,
  RoutineOccurrence,
} from '../types';
import { timeToMinutes, weekdayNameFor, weekdayOf } from '../utils/date';
import type { TranslateFn } from '../i18n/translate';
import { percentOf } from '../utils/format';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKENDS = [0, 6];

/** Weekday set implied by a repeat rule; `custom` keeps whatever was chosen. */
export function daysForRepeat(repeat: RepeatRule, custom: number[]): number[] {
  switch (repeat) {
    case 'daily':
      return ALL_DAYS;
    case 'weekdays':
      return WEEKDAYS;
    case 'weekends':
      return WEEKENDS;
    case 'custom':
      return [...custom].sort((a, b) => a - b);
  }
}

export function describeRepeat(routine: Routine, t: TranslateFn): string {
  switch (routine.repeat) {
    case 'daily':
      return t('repeat.describe.daily');
    case 'weekdays':
      return t('repeat.describe.weekdays');
    case 'weekends':
      return t('repeat.describe.weekends');
    case 'custom': {
      if (routine.days.length === 0) return t('repeat.describe.none');
      if (routine.days.length === 7) return t('repeat.describe.daily');
      return routine.days.map((day) => weekdayNameFor(day)).join(', ');
    }
  }
}

export function occursOn(routine: Routine, date: ISODate): boolean {
  return routine.days.includes(weekdayOf(date));
}

export function sortByTime(routines: Routine[]): Routine[] {
  return [...routines].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

/** Every routine scheduled for `date`, in clock order, with its tick state. */
export function occurrencesFor(
  routines: Routine[],
  completions: CompletionLog,
  date: ISODate,
): RoutineOccurrence[] {
  const done = completions[date] ?? [];
  return sortByTime(routines.filter((routine) => occursOn(routine, date))).map((routine) => ({
    routine,
    date,
    completed: done.includes(routine.id),
  }));
}

export function progressFor(
  routines: Routine[],
  completions: CompletionLog,
  date: ISODate,
): DayProgress {
  const occurrences = occurrencesFor(routines, completions, date);
  const completed = occurrences.filter((o) => o.completed).length;
  return {
    date,
    total: occurrences.length,
    completed,
    percent: percentOf(completed, occurrences.length),
  };
}

/** Returns the log with `routineId` toggled on `date`. Never mutates. */
export function toggleCompletion(
  completions: CompletionLog,
  routineId: string,
  date: ISODate,
): CompletionLog {
  const done = completions[date] ?? [];
  const next = done.includes(routineId)
    ? done.filter((id) => id !== routineId)
    : [...done, routineId];
  return { ...completions, [date]: next };
}

/** Drops a deleted routine from the history so insights stay truthful. */
export function purgeRoutine(completions: CompletionLog, routineId: string): CompletionLog {
  const next: CompletionLog = {};
  for (const [date, ids] of Object.entries(completions)) {
    next[date] = ids.filter((id) => id !== routineId);
  }
  return next;
}

/** Morning is anything scheduled before noon. */
export function isMorning(routine: Routine): boolean {
  return timeToMinutes(routine.time) < 12 * 60;
}
