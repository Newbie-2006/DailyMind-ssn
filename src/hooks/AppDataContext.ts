import { createContext } from 'react';
import type {
  Caregiver,
  CaregiverPermissions,
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

export interface AppDataActions {
  addMemory(draft: MemoryDraft): Memory;
  updateMemory(id: string, patch: Partial<MemoryDraft>): void;
  deleteMemory(id: string): void;

  addReminder(draft: ReminderDraft): Reminder;
  deleteReminder(id: string): void;

  addRoutine(draft: RoutineDraft): Routine;
  updateRoutine(id: string, patch: Partial<RoutineDraft>): void;
  deleteRoutine(id: string): void;
  toggleRoutine(routineId: string, date: ISODate): void;

  updateSettings(patch: Partial<Settings>): void;

  setLocationSharing(enabled: boolean): void;
  setLocationFrequency(frequency: LocationFrequency): void;
  /** Stores a newly collected position. The transmission policy runs first. */
  recordLocationFix(fix: LocationFix): void;
  setLocationError(code: LocationState['lastError']): void;
  completeOnboarding(): void;

  addCaregiver(caregiver: Omit<Caregiver, 'id'>): void;
  updateCaregiver(id: string, patch: Partial<Omit<Caregiver, 'id'>>): void;
  setCaregiverPermission(id: string, key: keyof CaregiverPermissions, value: boolean): void;
  removeCaregiver(id: string): void;

  /** Restores the sample content. Used from Profile. */
  resetToSample(): void;
}

export interface AppDataValue {
  memories: Memory[];
  routines: Routine[];
  completions: CompletionLog;
  reminders: Reminder[];
  settings: Settings;
  caregivers: Caregiver[];
  location: LocationState;
  /** False until the first read from storage has completed. */
  ready: boolean;
  actions: AppDataActions;
}

export const AppDataContext = createContext<AppDataValue | null>(null);
