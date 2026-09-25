import type {
  Caregiver,
  CompletionLog,
  LocationState,
  Memory,
  Routine,
  Settings,
} from '../types';
import { photos, thumbs, avatars } from './photos';
import { addDays, today, weekdayOf } from '../utils/date';

export const seedSettings: Settings = {
  name: 'Aaditya Raman',
  email: 'aaditya@example.com',
  avatar: avatars.aaditya,
  onboarded: false,
  sharingEnabled: true,
  notifications: {
    routineReminders: true,
    memoryPrompts: true,
    weeklySummary: false,
    dailySummary: true,
    summaryTime: '08:00',
    eveningCheck: false,
    eveningTime: '19:00',
  },
};

/** Sharing starts off. Nothing is collected until the person turns it on. */
export const seedLocation: LocationState = {
  sharingEnabled: false,
  lastFix: null,
  frequency: 'balanced',
};

export const seedMemories: Memory[] = [
  {
    id: 'mem_goa',
    title: 'Family trip to Goa',
    date: '2024-08-12',
    description:
      'A wonderful holiday with my family. We walked along the beach every evening, ate far too much fish curry, and Meera finally learned to swim. The light just before sunset was the best part of every day.',
    image: photos.beachFamily,
    thumbnail: thumbs.beachFamily,
    category: 'event',
    people: ['Meera', 'Priya', 'Rohan'],
    tags: ['Family', 'Travel', 'Happy'],
    createdAt: '2024-08-14T18:20:00.000Z',
  },
  {
    id: 'mem_birthday',
    title: 'My daughter’s birthday',
    date: '2024-10-15',
    description:
      'Priya turned thirty-four. We celebrated at home with the cake she always asks for, and the whole house smelled of vanilla all afternoon. She said it was the quietest birthday she had in years, and that she liked it that way.',
    image: photos.cake,
    thumbnail: thumbs.cake,
    category: 'people',
    people: ['Priya'],
    tags: ['Family', 'Celebration'],
    createdAt: '2024-10-15T20:05:00.000Z',
  },
  {
    id: 'mem_bruno',
    title: 'Our dog Bruno',
    date: '2024-05-03',
    description:
      'Bruno brought a tulip to the door this morning, entirely pleased with himself. He does this every spring and we have never once asked him to.',
    image: photos.dog,
    thumbnail: thumbs.dog,
    category: 'photo',
    people: [],
    tags: ['Home', 'Bruno', 'Everyday'],
    createdAt: '2024-05-03T09:40:00.000Z',
  },
  {
    id: 'mem_mahabaleshwar',
    title: 'Visit to Mahabaleshwar',
    date: '2024-03-18',
    description:
      'We drove up early and reached before the mist cleared. Beautiful views across the valley, strawberries from the roadside stall, and a long quiet walk that none of us wanted to end.',
    image: photos.mountains,
    thumbnail: thumbs.mountains,
    category: 'event',
    people: ['Priya', 'Rohan'],
    tags: ['Travel', 'Nature', 'Peaceful'],
    createdAt: '2024-03-19T07:15:00.000Z',
  },
  {
    id: 'mem_diwali',
    title: 'Diwali at home',
    date: '2024-11-01',
    description:
      'The whole family came over. We lit the diyas along the balcony the way we always have, and the children were allowed to help this year. The house had not been that full since last Diwali.',
    image: photos.festival,
    thumbnail: thumbs.festival,
    category: 'event',
    people: ['Priya', 'Rohan', 'Meera', 'Arjun'],
    tags: ['Family', 'Festival', 'Home'],
    createdAt: '2024-11-01T22:30:00.000Z',
  },
  {
    id: 'mem_grandchildren',
    title: 'An afternoon with the grandchildren',
    date: '2025-01-26',
    description:
      'Meera read to me from her school book and Arjun fell asleep halfway through. A very ordinary afternoon, and one I would like to keep.',
    image: photos.kids,
    thumbnail: thumbs.kids,
    category: 'people',
    people: ['Meera', 'Arjun'],
    tags: ['Family', 'Everyday', 'Happy'],
    createdAt: '2025-01-26T17:00:00.000Z',
  },
  {
    id: 'mem_garden',
    title: 'Repotting the balcony plants',
    date: '2025-04-07',
    description:
      'Finally moved the tulsi and the money plant into bigger pots. The soil was drier than it should have been. Worth checking on them every Sunday.',
    image: photos.garden,
    thumbnail: thumbs.garden,
    category: 'photo',
    people: [],
    tags: ['Home', 'Garden', 'Everyday'],
    createdAt: '2025-04-07T11:10:00.000Z',
  },
  {
    id: 'mem_cooking',
    title: 'Sunday cooking with Rohan',
    date: '2025-06-22',
    description:
      'Rohan wanted to learn the way his grandmother made the vegetable curry. We got most of it right. The trick with the mustard seeds is the part he keeps forgetting.',
    image: photos.cooking,
    thumbnail: thumbs.cooking,
    category: 'people',
    people: ['Rohan'],
    tags: ['Family', 'Food', 'Home'],
    createdAt: '2025-06-22T13:45:00.000Z',
  },
  {
    id: 'mem_lake',
    title: 'Evening at the lake',
    date: '2025-09-10',
    description:
      'A peaceful evening walk. The weather was perfect and it felt really calm. I stayed until the light went completely.',
    image: photos.lake,
    thumbnail: thumbs.lake,
    category: 'photo',
    people: [],
    tags: ['Nature', 'Walk', 'Peaceful'],
    createdAt: '2025-09-10T19:25:00.000Z',
  },
  {
    id: 'mem_reading',
    title: 'Started a new book',
    date: '2025-08-02',
    description:
      'Began the novel Priya left behind on her last visit. Two chapters in and I am already looking forward to the evenings.',
    image: photos.reading,
    thumbnail: thumbs.reading,
    category: 'photo',
    people: ['Priya'],
    tags: ['Reading', 'Everyday'],
    createdAt: '2025-08-02T21:00:00.000Z',
  },
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

export const seedRoutines: Routine[] = [
  {
    id: 'rt_walk',
    name: 'Morning walk',
    time: '07:00',
    icon: 'walk',
    repeat: 'daily',
    days: ALL_DAYS,
    note: 'Around the park, twice if the weather is good.',
    createdAt: '2025-01-02T06:00:00.000Z',
  },
  {
    id: 'rt_breakfast',
    name: 'Breakfast',
    time: '08:00',
    icon: 'food',
    repeat: 'daily',
    days: ALL_DAYS,
    createdAt: '2025-01-02T06:01:00.000Z',
  },
  {
    id: 'rt_medicine',
    name: 'Take medicine',
    time: '10:00',
    icon: 'pill',
    repeat: 'daily',
    days: ALL_DAYS,
    note: 'After breakfast, with a full glass of water.',
    createdAt: '2025-01-02T06:02:00.000Z',
  },
  {
    id: 'rt_family',
    name: 'Call family',
    time: '18:00',
    icon: 'phone',
    repeat: 'daily',
    days: ALL_DAYS,
    createdAt: '2025-01-02T06:03:00.000Z',
  },
  {
    id: 'rt_read',
    name: 'Read a book',
    time: '20:00',
    icon: 'book',
    repeat: 'daily',
    days: ALL_DAYS,
    createdAt: '2025-01-02T06:04:00.000Z',
  },
  {
    id: 'rt_stretch',
    name: 'Evening stretch',
    time: '17:30',
    icon: 'heart',
    repeat: 'weekdays',
    days: WEEKDAYS,
    note: 'Ten minutes is enough.',
    createdAt: '2025-02-11T06:05:00.000Z',
  },
];

/** Deterministic hash so the seeded history is stable across reloads. */
function hashCode(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100000;
  }
  return hash;
}

/**
 * Builds a plausible history so the first run has something honest to report.
 * Morning routines hold up well; the evening ones slip - which is exactly what
 * the insights page exists to notice.
 */
export function buildSeedCompletions(from: string = today()): CompletionLog {
  const log: CompletionLog = {};

  const reliability: Record<string, number> = {
    rt_walk: 0.85,
    rt_breakfast: 0.95,
    rt_medicine: 0.8,
    rt_family: 0.65,
    rt_read: 0.55,
    rt_stretch: 0.45,
  };

  for (let offset = 21; offset >= 1; offset -= 1) {
    const date = addDays(from, -offset);
    const weekday = weekdayOf(date);
    const done: string[] = [];

    for (const routine of seedRoutines) {
      if (!routine.days.includes(weekday)) continue;

      let chance = reliability[routine.id] ?? 0.6;
      // The most recent week runs weaker in the evenings, so the week-on-week
      // comparison has something real to describe.
      if (offset <= 7 && ['rt_read', 'rt_family', 'rt_stretch'].includes(routine.id)) {
        chance -= 0.25;
      }
      // Weekends run looser than weekdays.
      if (weekday === 0 || weekday === 6) chance -= 0.1;

      if ((hashCode(`${routine.id}:${date}`) % 100) / 100 < chance) {
        done.push(routine.id);
      }
    }

    log[date] = done;
  }

  // Today opens with the two morning routines already done.
  log[from] = ['rt_walk', 'rt_breakfast'];
  return log;
}

export const seedCaregivers: Caregiver[] = [
  {
    id: 'cg_priya',
    name: 'Priya',
    relation: 'Daughter',
    email: 'priya@example.com',
    avatar: avatars.priya,
    active: true,
    permissions: {
      routines: true,
      memories: true,
      insights: true,
      profile: true,
      location: true,
    },
  },
  {
    id: 'cg_rohan',
    name: 'Rohan',
    relation: 'Son',
    email: 'rohan@example.com',
    active: false,
    permissions: {
      routines: true,
      memories: false,
      insights: false,
      profile: true,
      location: false,
    },
  },
];

/** Offered on the Add Memory screen so tagging stays a tap, not typing. */
export const suggestedTags = [
  'Family',
  'Travel',
  'Home',
  'Nature',
  'Happy',
  'Peaceful',
  'Festival',
  'Food',
  'Everyday',
  'Walk',
  'Reading',
];
