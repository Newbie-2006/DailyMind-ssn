import type { ISODate, Memory, MemoryCategory } from '../types';
import { fromISODate, today } from '../utils/date';

export type MemoryFilter = 'all' | MemoryCategory;

export const memoryFilters: { id: MemoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'photo', label: 'Photos' },
  { id: 'people', label: 'People' },
  { id: 'event', label: 'Events' },
];

/** Newest memory first. */
export function sortByDate(memories: Memory[]): Memory[] {
  return [...memories].sort((a, b) => b.date.localeCompare(a.date));
}

export function filterMemories(
  memories: Memory[],
  filter: MemoryFilter,
  query: string,
): Memory[] {
  const needle = query.trim().toLowerCase();

  return sortByDate(memories).filter((memory) => {
    if (filter !== 'all' && memory.category !== filter) return false;
    if (!needle) return true;

    const haystack = [
      memory.title,
      memory.description,
      ...memory.tags,
      ...memory.people,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });
}

/**
 * A memory worth resurfacing on the home screen: the most recent one.
 */
export function mostRecent(memories: Memory[]): Memory | undefined {
  return sortByDate(memories)[0];
}

/**
 * Whether this memory has an anniversary coming up within `withinDays`.
 * This is the seed of the memory-to-action idea: DailyMind notices, the
 * person decides.
 */
export function anniversaryWithin(
  memory: Memory,
  withinDays = 45,
  reference: ISODate = today(),
): { date: ISODate; years: number } | null {
  const memoryDate = fromISODate(memory.date);
  const ref = fromISODate(reference);

  for (const yearOffset of [0, 1]) {
    const candidate = new Date(
      ref.getFullYear() + yearOffset,
      memoryDate.getMonth(),
      memoryDate.getDate(),
    );
    const diffDays = Math.round((candidate.getTime() - ref.getTime()) / 86_400_000);
    const years = candidate.getFullYear() - memoryDate.getFullYear();

    // The date has to be genuinely ahead, and at least a year on from the
    // memory itself - there is nothing to remind anyone about today.
    if (diffDays >= 1 && diffDays <= withinDays && years >= 1) {
      return {
        date: `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(
          candidate.getDate(),
        ).padStart(2, '0')}`,
        years,
      };
    }
  }

  return null;
}

/** Distinct people across all memories, most frequently mentioned first. */
export function knownPeople(memories: Memory[]): string[] {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    for (const person of memory.people) {
      counts.set(person, (counts.get(person) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

export function categoryLabel(category: MemoryCategory): string {
  switch (category) {
    case 'photo':
      return 'Photo';
    case 'people':
      return 'People';
    case 'event':
      return 'Event';
  }
}
