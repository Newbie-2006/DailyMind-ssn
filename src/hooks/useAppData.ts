import { useContext, useMemo } from 'react';
import { AppDataContext, type AppDataValue } from './AppDataContext';
import type { ISODate } from '../types';
import { today } from '../utils/date';
import { occurrencesFor, progressFor } from '../services/routineService';
import { buildInsights } from '../services/insightsService';
import { useTranslation } from '../i18n/useTranslation';
import type { InsightRange } from '../types';

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error('useAppData must be used inside an AppDataProvider');
  }
  return value;
}

export function useSettings() {
  const { settings, actions } = useAppData();
  return { settings, updateSettings: actions.updateSettings };
}

export function useMemories() {
  const { memories, actions } = useAppData();
  return {
    memories,
    addMemory: actions.addMemory,
    updateMemory: actions.updateMemory,
    deleteMemory: actions.deleteMemory,
  };
}

/** Routines for a single day, plus that day's progress. */
export function useDay(date: ISODate = today()) {
  const { routines, completions, actions } = useAppData();

  const occurrences = useMemo(
    () => occurrencesFor(routines, completions, date),
    [routines, completions, date],
  );

  const progress = useMemo(
    () => progressFor(routines, completions, date),
    [routines, completions, date],
  );

  return { occurrences, progress, toggleRoutine: actions.toggleRoutine, date };
}

export function useInsights(range: InsightRange = 'week') {
  const { routines, completions } = useAppData();
  const { t } = useTranslation();
  return useMemo(
    () => buildInsights(routines, completions, t, range),
    [routines, completions, t, range],
  );
}
