import type {
  Caregiver,
  CompletionLog,
  FamilyMember,
  GarySettings,
  Memory,
  Reminder,
  Routine,
  Settings,
} from '../types';
import {
  buildSeedCompletions,
  defaultGarySettings,
  seedCaregivers,
  seedFamily,
  seedMemories,
  seedRoutines,
  seedSettings,
} from '../data/seed';
import { StorageKeys, readKey, writeKey } from './storage';

export interface InitialState {
  memories: Memory[];
  routines: Routine[];
  completions: CompletionLog;
  reminders: Reminder[];
  settings: Settings;
  caregivers: Caregiver[];
  family: FamilyMember[];
  gary: GarySettings;
}

/** Older installs have no Gary entry, and a partial one fills in from the defaults. */
function readGary(): GarySettings {
  return { ...defaultGarySettings, ...readKey<Partial<GarySettings>>(StorageKeys.gary, {}) };
}

/**
 * Reads the stored state, or lays down the sample content on a first run.
 *
 * Local storage is synchronous, so this runs before the first paint and there
 * is no empty flash. When this is replaced by a network call it becomes async,
 * which is why the provider still exposes a `ready` flag.
 */
function load(): InitialState {
  if (readKey<boolean>(StorageKeys.seeded, false)) {
    return {
      memories: readKey<Memory[]>(StorageKeys.memories, seedMemories),
      routines: readKey<Routine[]>(StorageKeys.routines, seedRoutines),
      completions: readKey<CompletionLog>(StorageKeys.completions, {}),
      reminders: readKey<Reminder[]>(StorageKeys.reminders, []),
      settings: readKey<Settings>(StorageKeys.settings, seedSettings),
      caregivers: readKey<Caregiver[]>(StorageKeys.caregivers, seedCaregivers),
      // Installs from before Family existed get the sample family once.
      family: readKey<FamilyMember[]>(StorageKeys.family, seedFamily),
      gary: readGary(),
    };
  }

  const initial: InitialState = {
    memories: seedMemories,
    routines: seedRoutines,
    completions: buildSeedCompletions(),
    reminders: [],
    settings: seedSettings,
    caregivers: seedCaregivers,
    family: seedFamily,
    gary: readGary(),
  };

  writeKey(StorageKeys.memories, initial.memories);
  writeKey(StorageKeys.routines, initial.routines);
  writeKey(StorageKeys.completions, initial.completions);
  writeKey(StorageKeys.reminders, initial.reminders);
  writeKey(StorageKeys.settings, initial.settings);
  writeKey(StorageKeys.caregivers, initial.caregivers);
  writeKey(StorageKeys.family, initial.family);
  writeKey(StorageKeys.seeded, true);

  return initial;
}

let cached: InitialState | null = null;

/** Loads once per page load, however many state hooks ask for it. */
export function initialState(): InitialState {
  cached ??= load();
  return cached;
}

/** Called after a reset so the next read does not hand back the old snapshot. */
export function clearInitialStateCache(): void {
  cached = null;
}
