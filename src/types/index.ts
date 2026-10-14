/** Calendar day in `YYYY-MM-DD` form. */
export type ISODate = string;

/** Wall-clock time of day in 24h `HH:mm` form. */
export type TimeOfDay = string;

export type MemoryCategory = 'photo' | 'people' | 'event';

export interface Memory {
  id: string;
  title: string;
  /** The day the memory happened, not the day it was written down. */
  date: ISODate;
  description: string;
  /** Bundled asset URL, or a data URL for a photo the user picked. */
  image?: string;
  /** Small square crop for grids and list rows. Falls back to `image`. */
  thumbnail?: string;
  category: MemoryCategory;
  people: string[];
  tags: string[];
  createdAt: string;
}

export type MemoryDraft = Omit<Memory, 'id' | 'createdAt'>;

export type RoutineIcon =
  | 'walk'
  | 'food'
  | 'pill'
  | 'phone'
  | 'book'
  | 'heart'
  | 'water'
  | 'sun'
  | 'moon'
  | 'music';

export type RepeatRule = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Routine {
  id: string;
  name: string;
  time: TimeOfDay;
  icon: RoutineIcon;
  repeat: RepeatRule;
  /** Weekday numbers (0 = Sunday). Authoritative for `custom`, derived otherwise. */
  days: number[];
  note?: string;
  createdAt: string;
}

export type RoutineDraft = Omit<Routine, 'id' | 'createdAt'>;

/** Completion log: routine ids checked off, keyed by day. */
export type CompletionLog = Record<ISODate, string[]>;

/**
 * A one-off date the person asked DailyMind to remember, always created from an
 * explicit confirmation - never automatically.
 */
export interface Reminder {
  id: string;
  title: string;
  date: ISODate;
  /** The memory this was suggested from, when it came from one. */
  memoryId?: string;
  createdAt: string;
}

export type ReminderDraft = Omit<Reminder, 'id' | 'createdAt'>;

export interface CaregiverPermissions {
  routines: boolean;
  memories: boolean;
  insights: boolean;
  profile: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  relation: string;
  email: string;
  avatar?: string;
  active: boolean;
  permissions: CaregiverPermissions;
}

/**
 * A person the family has saved so Gary can answer "what is my daughter's
 * name?" from a real record instead of guessing.
 */
export interface FamilyMember {
  id: string;
  name: string;
  /** In English, as the family would say it: Daughter, Son, Grandson... */
  relation: string;
  photo?: string;
  notes?: string;
  createdAt: string;
}

export type FamilyMemberDraft = Omit<FamilyMember, 'id' | 'createdAt'>;

export type GaryLanguage = 'en' | 'ta';

/** Set up by a caregiver. Kept apart from `Settings` so a reset never wipes the key. */
export interface GarySettings {
  /** The caregiver's own Anthropic API key. Stays on this device. */
  apiKey: string;
  language: GaryLanguage;
  /** How Gary addresses the person: Paati, Thaatha, Amma, or a first name. */
  addressAs: string;
  model: string;
}

export interface NotificationSettings {
  routineReminders: boolean;
  memoryPrompts: boolean;
  weeklySummary: boolean;
}

export interface Settings {
  name: string;
  email: string;
  avatar?: string;
  onboarded: boolean;
  notifications: NotificationSettings;
  /** Applies to the caregiver view as a whole; per-person switches live on the caregiver. */
  sharingEnabled: boolean;
}

/** A single routine as it stands on a particular day. */
export interface RoutineOccurrence {
  routine: Routine;
  date: ISODate;
  completed: boolean;
}

export interface DayProgress {
  date: ISODate;
  total: number;
  completed: number;
  /** 0-100, rounded. */
  percent: number;
}

export interface WeeklyInsights {
  range: { start: ISODate; end: ISODate };
  days: DayProgress[];
  total: number;
  completed: number;
  percent: number;
  /** Same figure for the seven days before `range`, for a neutral comparison. */
  previousPercent: number;
  morningPercent: number;
  bestDay?: DayProgress;
  mostMissed?: { routine: Routine; missed: number };
  /** Plain, factual observations. Never diagnostic. */
  observations: Observation[];
}

export type ObservationTone = 'positive' | 'neutral' | 'attention';

export interface Observation {
  id: string;
  tone: ObservationTone;
  title: string;
  body: string;
}

export type InsightRange = 'week' | 'month';
