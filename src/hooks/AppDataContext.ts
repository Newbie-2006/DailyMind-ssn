import { createContext } from 'react';
import type {
  Caregiver,
  CaregiverPermissions,
  CompletionLog,
  FamilyMember,
  FamilyMemberDraft,
  GarySettings,
  ISODate,
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
  completeOnboarding(): void;

  addCaregiver(caregiver: Omit<Caregiver, 'id'>): void;
  updateCaregiver(id: string, patch: Partial<Omit<Caregiver, 'id'>>): void;
  setCaregiverPermission(id: string, key: keyof CaregiverPermissions, value: boolean): void;
  removeCaregiver(id: string): void;

  addFamilyMember(draft: FamilyMemberDraft): FamilyMember;
  updateFamilyMember(id: string, patch: Partial<FamilyMemberDraft>): void;
  removeFamilyMember(id: string): void;

  updateGarySettings(patch: Partial<GarySettings>): void;

  /** Restores the sample content. Used from Profile. Gary's setup is kept. */
  resetToSample(): void;
}

export interface AppDataValue {
  memories: Memory[];
  routines: Routine[];
  completions: CompletionLog;
  reminders: Reminder[];
  settings: Settings;
  caregivers: Caregiver[];
  family: FamilyMember[];
  gary: GarySettings;
  /** False until the first read from storage has completed. */
  ready: boolean;
  actions: AppDataActions;
}

export const AppDataContext = createContext<AppDataValue | null>(null);
