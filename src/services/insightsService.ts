import type {
  CompletionLog,
  DayProgress,
  ISODate,
  InsightRange,
  Observation,
  Routine,
  WeeklyInsights,
} from '../types';
import { addDays, today, weekOf } from '../utils/date';
import { percentOf, pluralize } from '../utils/format';
import { isMorning, occurrencesFor, progressFor } from './routineService';

/**
 * Language rule for everything in this file: describe what the log says and
 * nothing more. No health claims, no diagnosis, no judgement about the person.
 * "This activity was missed more often" - never "you are declining".
 */

function totalsFor(
  routines: Routine[],
  completions: CompletionLog,
  dates: ISODate[],
): { total: number; completed: number } {
  return dates.reduce(
    (acc, date) => {
      const progress = progressFor(routines, completions, date);
      return { total: acc.total + progress.total, completed: acc.completed + progress.completed };
    },
    { total: 0, completed: 0 },
  );
}

function morningTotals(
  routines: Routine[],
  completions: CompletionLog,
  dates: ISODate[],
): { total: number; completed: number } {
  const morning = routines.filter(isMorning);
  return totalsFor(morning, completions, dates);
}

function missedCounts(
  routines: Routine[],
  completions: CompletionLog,
  dates: ISODate[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const date of dates) {
    for (const occurrence of occurrencesFor(routines, completions, date)) {
      if (!occurrence.completed) {
        counts.set(occurrence.routine.id, (counts.get(occurrence.routine.id) ?? 0) + 1);
      }
    }
  }
  return counts;
}

/** The dates covered by the selected range, oldest first. */
export function datesForRange(range: InsightRange, reference: ISODate = today()): ISODate[] {
  if (range === 'week') return weekOf(reference);
  return Array.from({ length: 28 }, (_, i) => addDays(reference, i - 27));
}

export function buildInsights(
  routines: Routine[],
  completions: CompletionLog,
  range: InsightRange = 'week',
  reference: ISODate = today(),
): WeeklyInsights {
  const dates = datesForRange(range, reference);
  // A day that has not happened yet is not a missed day, so totals only ever
  // cover elapsed days. The chart still draws the whole range.
  const elapsed = dates.filter((date) => date <= reference);
  const previousDates = elapsed.map((date) => addDays(date, -dates.length));

  const days: DayProgress[] = dates.map((date) => progressFor(routines, completions, date));
  const current = totalsFor(routines, completions, elapsed);
  const previous = totalsFor(routines, completions, previousDates);
  const morning = morningTotals(routines, completions, elapsed);

  const percent = percentOf(current.completed, current.total);
  const previousPercent = percentOf(previous.completed, previous.total);

  const scored = days.filter((day) => day.date <= reference && day.total > 0);
  const bestDay = scored.length
    ? scored.reduce((best, day) => (day.percent > best.percent ? day : best))
    : undefined;

  const missed = missedCounts(routines, completions, elapsed);
  let mostMissed: WeeklyInsights['mostMissed'];
  let topCount = 0;
  for (const [routineId, count] of missed) {
    if (count > topCount) {
      const routine = routines.find((r) => r.id === routineId);
      if (routine) {
        mostMissed = { routine, missed: count };
        topCount = count;
      }
    }
  }

  const rangeLabel = range === 'week' ? 'this week' : 'over the last four weeks';

  return {
    range: { start: dates[0], end: dates[dates.length - 1] },
    days,
    total: current.total,
    completed: current.completed,
    percent,
    previousPercent,
    morningPercent: percentOf(morning.completed, morning.total),
    bestDay,
    mostMissed,
    observations: buildObservations({
      percent,
      previousPercent,
      morningPercent: percentOf(morning.completed, morning.total),
      mostMissed,
      completed: current.completed,
      rangeLabel,
      hasPrevious: previous.total > 0,
    }),
  };
}

interface ObservationInput {
  percent: number;
  previousPercent: number;
  morningPercent: number;
  mostMissed?: { routine: Routine; missed: number };
  completed: number;
  rangeLabel: string;
  hasPrevious: boolean;
}

function buildObservations(input: ObservationInput): Observation[] {
  const observations: Observation[] = [];
  const { percent, previousPercent, morningPercent, mostMissed, rangeLabel, hasPrevious } = input;

  if (morningPercent >= 70) {
    observations.push({
      id: 'morning-steady',
      tone: 'positive',
      title: 'Good consistency',
      body: `You completed ${morningPercent}% of your morning routines ${rangeLabel}.`,
    });
  } else if (morningPercent > 0) {
    observations.push({
      id: 'morning-mixed',
      tone: 'neutral',
      title: 'Mornings were mixed',
      body: `You completed ${morningPercent}% of your morning routines ${rangeLabel}.`,
    });
  }

  if (hasPrevious) {
    const delta = percent - previousPercent;
    if (delta >= 8) {
      observations.push({
        id: 'trend-up',
        tone: 'positive',
        title: 'More completed than last time',
        body: `Overall completion was ${percent}%, compared with ${previousPercent}% in the period before.`,
      });
    } else if (delta <= -8) {
      observations.push({
        id: 'trend-down',
        tone: 'attention',
        title: 'A change from your usual pattern',
        body: `Overall completion was ${percent}%, compared with ${previousPercent}% in the period before. This is a description of your log, not a judgement.`,
      });
    } else {
      observations.push({
        id: 'trend-steady',
        tone: 'neutral',
        title: 'A steady stretch',
        body: `Overall completion was ${percent}%, close to the ${previousPercent}% in the period before.`,
      });
    }
  }

  if (mostMissed && mostMissed.missed > 1) {
    observations.push({
      id: 'most-missed',
      tone: 'attention',
      title: `${mostMissed.routine.name} was missed most often`,
      body: `It was not marked complete on ${mostMissed.missed} ${pluralize(
        mostMissed.missed,
        'day',
      )} ${rangeLabel}. You may want to move it to a different time.`,
    });
  }

  return observations;
}

/** Consecutive days up to `reference` where every scheduled routine was ticked. */
export function currentStreak(
  routines: Routine[],
  completions: CompletionLog,
  reference: ISODate = today(),
): number {
  let streak = 0;
  for (let offset = 0; offset < 120; offset += 1) {
    const date = addDays(reference, -offset);
    const progress = progressFor(routines, completions, date);
    if (progress.total === 0) continue;
    if (progress.completed === progress.total) streak += 1;
    else break;
  }
  return streak;
}
