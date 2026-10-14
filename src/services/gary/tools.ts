import type { CompletionLog, FamilyMember, ISODate, Memory, Routine } from '../../types';
import { formatDateLong, formatTime, timeToMinutes, weekdayLong } from '../../utils/date';
import { truncate } from '../../utils/format';
import { filterMemories, sortByDate } from '../memoryService';
import { occurrencesFor } from '../routineService';

/**
 * Gary's tools: the only way the model can learn anything about this person or
 * change anything on screen.
 *
 * The model never sees storage. Each tool reads the app's real data, returns a
 * small factual JSON result, and may ask the screen to show a card. Nothing
 * here changes saved data: marking a routine done only ever *proposes* it,
 * and the person confirms on a Yes/No card that the app, not the model,
 * acts on.
 */

export interface GaryDataContext {
  date: ISODate;
  now: Date;
  routines: Routine[];
  completions: CompletionLog;
  memories: Memory[];
  family: FamilyMember[];
}

/** What a tool asks the screen to show. Cards re-read live data by id. */
export type GaryEffect =
  | { kind: 'schedule'; date: ISODate }
  | { kind: 'routine'; routineId: string }
  | { kind: 'memory'; memoryId: string }
  | { kind: 'person'; memberId: string }
  | { kind: 'confirmDone'; routineId: string };

export interface ToolOutcome {
  /** Sent back to the model as the tool result. */
  content: string;
  isError?: boolean;
  effect?: GaryEffect;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export const garyTools: ToolDefinition[] = [
  {
    name: 'get_today_schedule',
    description:
      "Gets today's routines in time order with their status, and shows today's schedule on the person's screen. Use whenever they ask what they have to do today.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'show_next_routine',
    description:
      'Finds the next routine that is not done yet and shows it on screen as a large card. Use when they ask what to do next or now.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'search_memories',
    description:
      'Searches the saved memories (photos and moments the family wrote down). Returns up to 5 matches with their notes. Use an English keyword such as a place, person, event or festival; leave query empty for the most recent ones. Does not show anything on screen.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'One or two English keywords, e.g. "Goa", "birthday", "Priya". Empty for recent memories.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'open_memory',
    description:
      "Opens one memory on the person's screen with its photo, and returns its full saved notes. Call this before describing a memory or photo.",
    input_schema: {
      type: 'object',
      properties: {
        memory_id: { type: 'string', description: 'The id from search_memories.' },
      },
      required: ['memory_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'lookup_family',
    description:
      'Looks up the family details saved by the family: names, relations and notes. Pass the relation in English (daughter, son, granddaughter, wife...) or a name. Leave empty to list everyone. When exactly one person matches, they are shown on screen.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'A relation in English, or a name. Empty lists everyone.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'propose_mark_done',
    description:
      'Shows Yes/No buttons asking the person to confirm that a routine of today is done. This does NOT mark anything; the app marks it only if the person confirms. Use when they say they finished something.',
    input_schema: {
      type: 'object',
      properties: {
        routine_id: { type: 'string', description: 'The id from get_today_schedule.' },
      },
      required: ['routine_id'],
      additionalProperties: false,
    },
  },
];

type RoutineStatus = 'done' | 'not_done_yet' | 'later_today';

function statusOf(completed: boolean, time: string, now: Date): RoutineStatus {
  if (completed) return 'done';
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return timeToMinutes(time) <= nowMinutes ? 'not_done_yet' : 'later_today';
}

function describeRoutine(routine: Routine, completed: boolean, now: Date) {
  return {
    id: routine.id,
    name: routine.name,
    time: formatTime(routine.time),
    status: statusOf(completed, routine.time, now),
    ...(routine.note ? { note: routine.note } : {}),
    ...(routine.icon === 'pill'
      ? { medicine: 'Say only the name, time and note exactly as saved. Add no dose or advice.' }
      : {}),
  };
}

/** The first routine still to do: the next one coming up, else the earliest missed one. */
export function nextRoutine(context: GaryDataContext): Routine | undefined {
  const pending = occurrencesFor(context.routines, context.completions, context.date).filter(
    (occurrence) => !occurrence.completed,
  );
  const nowMinutes = context.now.getHours() * 60 + context.now.getMinutes();
  const upcoming = pending.find((o) => timeToMinutes(o.routine.time) >= nowMinutes);
  return (upcoming ?? pending[0])?.routine;
}

function describeMemory(memory: Memory, full: boolean) {
  return {
    id: memory.id,
    title: memory.title,
    date: formatDateLong(memory.date),
    people: memory.people,
    tags: memory.tags,
    has_photo: Boolean(memory.image),
    notes: full ? memory.description : truncate(memory.description, 220),
  };
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function failure(message: string): ToolOutcome {
  return { content: json({ error: message }), isError: true };
}

/** Model input is untrusted: only short strings get through. */
function readString(input: unknown, key: string): string {
  if (!input || typeof input !== 'object') return '';
  const value = (input as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

const RELATION_WORDS: Record<string, string[]> = {
  daughter: ['daughter', 'ponnu', 'magal'],
  son: ['son', 'paiyan', 'magan'],
  wife: ['wife', 'manaivi', 'pondatti'],
  husband: ['husband', 'kanavar', 'purushan'],
  granddaughter: ['granddaughter', 'pethi'],
  grandson: ['grandson', 'peran'],
  sister: ['sister', 'akka', 'thangai', 'thangachi'],
  brother: ['brother', 'anna', 'thambi'],
};

function matchesFamily(member: FamilyMember, query: string): boolean {
  const needle = query.toLowerCase();
  const relation = member.relation.toLowerCase();
  if (member.name.toLowerCase().includes(needle)) return true;
  if (relation === needle) return true;
  // "daughter" should not also match "granddaughter", but a synonym should.
  const synonyms = Object.entries(RELATION_WORDS).find(([, words]) => words.includes(needle));
  return synonyms ? relation === synonyms[0] : false;
}

export function runTool(name: string, input: unknown, context: GaryDataContext): ToolOutcome {
  switch (name) {
    case 'get_today_schedule': {
      const items = occurrencesFor(context.routines, context.completions, context.date).map((o) =>
        describeRoutine(o.routine, o.completed, context.now),
      );
      return {
        content: json({
          today: `${weekdayLong(context.date)}, ${formatDateLong(context.date)}`,
          time_now: formatTime(
            `${context.now.getHours()}:${String(context.now.getMinutes()).padStart(2, '0')}`,
          ),
          routines: items,
          shown_on_screen: true,
        }),
        effect: { kind: 'schedule', date: context.date },
      };
    }

    case 'show_next_routine': {
      const routine = nextRoutine(context);
      if (!routine) {
        return { content: json({ next: null, message: 'Everything for today is done, or nothing is planned.' }) };
      }
      return {
        content: json({ next: describeRoutine(routine, false, context.now), shown_on_screen: true }),
        effect: { kind: 'routine', routineId: routine.id },
      };
    }

    case 'search_memories': {
      const query = readString(input, 'query');
      let found = filterMemories(context.memories, 'all', query);
      // A multi-word query that matches nothing as a phrase may still match word by word.
      if (found.length === 0 && query.includes(' ')) {
        const words = query.split(/\s+/).filter((word) => word.length > 2);
        found = sortByDate(context.memories).filter((memory) =>
          words.some((word) => filterMemories([memory], 'all', word).length > 0),
        );
      }
      return {
        content: json({
          query,
          matches: found.slice(0, 5).map((memory) => describeMemory(memory, false)),
          total_saved_memories: context.memories.length,
        }),
      };
    }

    case 'open_memory': {
      const id = readString(input, 'memory_id');
      const memory = context.memories.find((m) => m.id === id);
      if (!memory) return failure('No memory has that id. Use search_memories first.');
      return {
        content: json({ memory: describeMemory(memory, true), shown_on_screen: true }),
        effect: { kind: 'memory', memoryId: memory.id },
      };
    }

    case 'lookup_family': {
      const query = readString(input, 'query');
      const matches = query
        ? context.family.filter((member) => matchesFamily(member, query))
        : context.family;
      const people = matches.map((member) => ({
        name: member.name,
        relation: member.relation,
        ...(member.notes ? { notes: member.notes } : {}),
      }));
      return {
        content: json({
          query,
          found: matches.length > 0,
          people,
          ...(matches.length === 0
            ? { message: 'Nothing saved for this. Do not guess a name.' }
            : {}),
          shown_on_screen: matches.length === 1,
        }),
        effect: matches.length === 1 ? { kind: 'person', memberId: matches[0].id } : undefined,
      };
    }

    case 'propose_mark_done': {
      const id = readString(input, 'routine_id');
      const occurrence = occurrencesFor(context.routines, context.completions, context.date).find(
        (o) => o.routine.id === id,
      );
      if (!occurrence) return failure('That routine is not on today’s schedule. Call get_today_schedule.');
      if (occurrence.completed) {
        return { content: json({ already_done: true, name: occurrence.routine.name }) };
      }
      return {
        content: json({
          confirmation_shown: true,
          name: occurrence.routine.name,
          marked_done: false,
          instruction: 'Ask the person to tap Yes or say yes. Do not say it is done.',
        }),
        effect: { kind: 'confirmDone', routineId: id },
      };
    }

    default:
      return failure(`Unknown tool: ${name}`);
  }
}
