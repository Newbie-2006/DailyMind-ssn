import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Caregiver,
  CaregiverPermissions,
  CompletionLog,
  ISODate,
  Memory,
  MemoryDraft,
  Reminder,
  ReminderDraft,
  Routine,
  RoutineDraft,
  Settings,
} from '../types';
import {
  buildSeedCompletions,
  seedCaregivers,
  seedMemories,
  seedRoutines,
  seedSettings,
} from '../data/seed';
import { StorageKeys, clearAll, writeKey } from '../services/storage';
import { clearInitialStateCache, initialState } from '../services/bootstrap';
import { purgeRoutine, toggleCompletion } from '../services/routineService';
import { createId } from '../utils/format';
import { AppDataContext, type AppDataValue } from './AppDataContext';

/**
 * Loads once from storage, keeps everything in memory while the app runs, and
 * writes each slice back as it changes. Screens never read storage directly.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  // Storage is read synchronously, before the first paint.
  const [memories, setMemories] = useState<Memory[]>(() => initialState().memories);
  const [routines, setRoutines] = useState<Routine[]>(() => initialState().routines);
  const [completions, setCompletions] = useState<CompletionLog>(() => initialState().completions);
  const [reminders, setReminders] = useState<Reminder[]>(() => initialState().reminders);
  const [settings, setSettings] = useState<Settings>(() => initialState().settings);
  const [caregivers, setCaregivers] = useState<Caregiver[]>(() => initialState().caregivers);

  // Each slice is written back whenever it changes. The first pass rewrites
  // what was just read, which costs nothing and keeps the rule simple.
  useEffect(() => {
    writeKey(StorageKeys.memories, memories);
  }, [memories]);

  useEffect(() => {
    writeKey(StorageKeys.routines, routines);
  }, [routines]);

  useEffect(() => {
    writeKey(StorageKeys.completions, completions);
  }, [completions]);

  useEffect(() => {
    writeKey(StorageKeys.reminders, reminders);
  }, [reminders]);

  useEffect(() => {
    writeKey(StorageKeys.settings, settings);
  }, [settings]);

  useEffect(() => {
    writeKey(StorageKeys.caregivers, caregivers);
  }, [caregivers]);

  const addMemory = useCallback((draft: MemoryDraft): Memory => {
    const memory: Memory = { ...draft, id: createId('mem'), createdAt: new Date().toISOString() };
    setMemories((current) => [memory, ...current]);
    return memory;
  }, []);

  const updateMemory = useCallback((id: string, patch: Partial<MemoryDraft>) => {
    setMemories((current) =>
      current.map((memory) => (memory.id === id ? { ...memory, ...patch } : memory)),
    );
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories((current) => current.filter((memory) => memory.id !== id));
    // A reminder that came from this memory has nothing left to point at.
    setReminders((current) => current.filter((reminder) => reminder.memoryId !== id));
  }, []);

  const addReminder = useCallback((draft: ReminderDraft): Reminder => {
    const reminder: Reminder = {
      ...draft,
      id: createId('rem'),
      createdAt: new Date().toISOString(),
    };
    setReminders((current) => [...current, reminder]);
    return reminder;
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
  }, []);

  const addRoutine = useCallback((draft: RoutineDraft): Routine => {
    const routine: Routine = { ...draft, id: createId('rt'), createdAt: new Date().toISOString() };
    setRoutines((current) => [...current, routine]);
    return routine;
  }, []);

  const updateRoutine = useCallback((id: string, patch: Partial<RoutineDraft>) => {
    setRoutines((current) =>
      current.map((routine) => (routine.id === id ? { ...routine, ...patch } : routine)),
    );
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setRoutines((current) => current.filter((routine) => routine.id !== id));
    setCompletions((current) => purgeRoutine(current, id));
  }, []);

  const toggleRoutine = useCallback((routineId: string, date: ISODate) => {
    setCompletions((current) => toggleCompletion(current, routineId, date));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setSettings((current) => ({ ...current, onboarded: true }));
  }, []);

  const addCaregiver = useCallback((caregiver: Omit<Caregiver, 'id'>) => {
    setCaregivers((current) => [...current, { ...caregiver, id: createId('cg') }]);
  }, []);

  const updateCaregiver = useCallback((id: string, patch: Partial<Omit<Caregiver, 'id'>>) => {
    setCaregivers((current) =>
      current.map((caregiver) => (caregiver.id === id ? { ...caregiver, ...patch } : caregiver)),
    );
  }, []);

  const setCaregiverPermission = useCallback(
    (id: string, key: keyof CaregiverPermissions, value: boolean) => {
      setCaregivers((current) =>
        current.map((caregiver) =>
          caregiver.id === id
            ? { ...caregiver, permissions: { ...caregiver.permissions, [key]: value } }
            : caregiver,
        ),
      );
    },
    [],
  );

  const removeCaregiver = useCallback((id: string) => {
    setCaregivers((current) => current.filter((caregiver) => caregiver.id !== id));
  }, []);

  const resetToSample = useCallback(() => {
    const initialCompletions = buildSeedCompletions();
    clearAll();
    clearInitialStateCache();
    setMemories(seedMemories);
    setRoutines(seedRoutines);
    setCompletions(initialCompletions);
    setReminders([]);
    setSettings({ ...seedSettings, onboarded: true });
    setCaregivers(seedCaregivers);
    writeKey(StorageKeys.seeded, true);
  }, []);

  const value = useMemo<AppDataValue>(
    () => ({
      memories,
      routines,
      completions,
      reminders,
      settings,
      caregivers,
      ready: true,
      actions: {
        addMemory,
        updateMemory,
        deleteMemory,
        addReminder,
        deleteReminder,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        toggleRoutine,
        updateSettings,
        completeOnboarding,
        addCaregiver,
        updateCaregiver,
        setCaregiverPermission,
        removeCaregiver,
        resetToSample,
      },
    }),
    [
      memories,
      routines,
      completions,
      reminders,
      settings,
      caregivers,
      addMemory,
      updateMemory,
      deleteMemory,
      addReminder,
      deleteReminder,
      addRoutine,
      updateRoutine,
      deleteRoutine,
      toggleRoutine,
      updateSettings,
      completeOnboarding,
      addCaregiver,
      updateCaregiver,
      setCaregiverPermission,
      removeCaregiver,
      resetToSample,
    ],
  );

  return <AppDataContext value={value}>{children}</AppDataContext>;
}
