import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Caregiver,
  CaregiverPermissions,
  CaregiverSession,
  CompletionLog,
  ISODate,
  LocationFix,
  LocationFrequency,
  LocationState,
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
  seedLocation,
  seedMemories,
  seedRoutines,
  seedSettings,
} from '../data/seed';
import { StorageKeys, clearAll, writeKey } from '../services/storage';
import { clearInitialStateCache, initialState } from '../services/bootstrap';
import { purgeRoutine, toggleCompletion } from '../services/routineService';
import { createId } from '../utils/format';
import { generateAccessCode } from '../services/caregiverAuth';
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
  const [location, setLocation] = useState<LocationState>(() => initialState().location);
  const [caregiverSession, setCaregiverSession] = useState<CaregiverSession | null>(
    () => initialState().caregiverSession,
  );

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

  useEffect(() => {
    writeKey(StorageKeys.location, location);
  }, [location]);

  useEffect(() => {
    writeKey(StorageKeys.caregiverSession, caregiverSession);
  }, [caregiverSession]);

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

  const setLocationSharing = useCallback((enabled: boolean) => {
    setLocation((current) => ({
      ...current,
      sharingEnabled: enabled,
      // Turning sharing off drops the stored position rather than leaving a
      // stale one behind for the next time it is switched on.
      lastFix: enabled ? current.lastFix : null,
      lastError: undefined,
    }));
  }, []);

  const setLocationFrequency = useCallback((frequency: LocationFrequency) => {
    setLocation((current) => ({ ...current, frequency }));
  }, []);

  const recordLocationFix = useCallback((fix: LocationFix) => {
    setLocation((current) => ({ ...current, lastFix: fix, lastError: undefined }));
  }, []);

  const setLocationError = useCallback((code: LocationState['lastError']) => {
    setLocation((current) => ({ ...current, lastError: code }));
  }, []);

  const removeCaregiver = useCallback((id: string) => {
    setCaregivers((current) => current.filter((caregiver) => caregiver.id !== id));
    setCaregiverSession((current) => (current?.caregiverId === id ? null : current));
  }, []);

  const issueAccessCode = useCallback((id: string): string => {
    const code = generateAccessCode();
    setCaregivers((current) =>
      current.map((caregiver) =>
        caregiver.id === id ? { ...caregiver, accessCode: code } : caregiver,
      ),
    );
    return code;
  }, []);

  const revokeAccessCode = useCallback((id: string) => {
    setCaregivers((current) =>
      current.map((caregiver) =>
        caregiver.id === id ? { ...caregiver, accessCode: undefined } : caregiver,
      ),
    );
    // Revoking the code ends any session that was using it.
    setCaregiverSession((current) => (current?.caregiverId === id ? null : current));
  }, []);

  const signInCaregiver = useCallback((session: CaregiverSession) => {
    setCaregiverSession(session);
  }, []);

  const signOutCaregiver = useCallback(() => {
    setCaregiverSession(null);
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
    setLocation(seedLocation);
    setCaregiverSession(null);
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
      location,
      caregiverSession,
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
        setLocationSharing,
        setLocationFrequency,
        recordLocationFix,
        setLocationError,
        addCaregiver,
        updateCaregiver,
        setCaregiverPermission,
        removeCaregiver,
        issueAccessCode,
        revokeAccessCode,
        signInCaregiver,
        signOutCaregiver,
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
      location,
      caregiverSession,
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
      setLocationSharing,
      setLocationFrequency,
      recordLocationFix,
      setLocationError,
      addCaregiver,
      updateCaregiver,
      setCaregiverPermission,
      removeCaregiver,
      issueAccessCode,
      revokeAccessCode,
      signInCaregiver,
      signOutCaregiver,
      resetToSample,
    ],
  );

  return <AppDataContext value={value}>{children}</AppDataContext>;
}
