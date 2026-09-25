import type { CompletionLog, ISODate, Memory, Routine, RoutineIcon } from '../types';
import { addDays, formatDate, formatTime, weekdayLong } from '../utils/date';
import { firstName, listToSentence } from '../utils/format';
import { filterMemories, sortByDate } from './memoryService';
import { occurrencesFor, progressFor } from './routineService';
import { buildInsights } from './insightsService';
import type { TranslateFn } from '../i18n/translate';
import type { Language } from '../i18n/languages';
import { formatRelativeTime } from '../i18n/relativeTime';

/**
 * The assistant is a provider behind an interface, so the mock below can be
 * replaced with a real model call without any screen changing. A provider only
 * ever receives the context it is given - it does not reach into storage.
 *
 * `language` travels with every request: a real provider passes it to the model
 * so the answer comes back in the person's language, and the mock uses it
 * through `t`.
 */

export interface AssistantContext {
  userName: string;
  date: ISODate;
  routines: Routine[];
  completions: CompletionLog;
  memories: Memory[];
  /** The language the answer should be written in. */
  language: Language;
  t: TranslateFn;
  /** Present so the assistant can answer "is my location being shared?". */
  location?: {
    sharingEnabled: boolean;
    lastUpdated?: number;
    sharedWith: string[];
  };
}

export interface AssistantListItem {
  id: string;
  label: string;
  meta?: string;
  icon?: RoutineIcon;
  image?: string;
  to?: string;
}

export interface AssistantReply {
  text: string;
  items?: AssistantListItem[];
  footer?: string;
  suggestions?: string[];
  /** An offer, never an automatic action. The person taps it or ignores it. */
  action?: { label: string; to: string };
}

export interface AssistantProvider {
  readonly id: string;
  reply(input: string, context: AssistantContext): Promise<AssistantReply>;
}

export function defaultSuggestions(t: TranslateFn): string[] {
  return [
    t('assistant.suggest.left'),
    t('assistant.suggest.memories'),
    t('assistant.suggest.yesterday'),
    t('assistant.suggest.week'),
  ];
}

type IntentId =
  | 'remaining'
  | 'completed'
  | 'schedule'
  | 'tomorrow'
  | 'yesterday'
  | 'week'
  | 'memories'
  | 'insights'
  | 'location'
  | 'addMemory'
  | 'addRoutine'
  | 'greeting'
  | 'thanks'
  | 'help';

/**
 * Keyword matching runs against the English phrasings and the translated
 * suggestion chips, so tapping a chip works in every language.
 */
const INTENT_KEYWORDS: Record<IntentId, string[]> = {
  remaining: ['left', 'remaining', 'still', 'pending', 'to do', 'todo', 'have to do', 'need to do'],
  completed: ['done', 'completed', 'finished', 'ticked', 'already'],
  schedule: ['today', 'schedule', 'plan', 'routine today', 'day look'],
  tomorrow: ['tomorrow'],
  yesterday: ['yesterday'],
  week: ['week', 'weekly', 'this week', 'seven days'],
  memories: ['memory', 'memories', 'photo', 'photos', 'remember', 'trip', 'holiday'],
  insights: ['insight', 'pattern', 'how am i', 'doing', 'progress', 'consistency', 'streak'],
  location: ['location', 'where am i', 'sharing my location', 'gps'],
  addMemory: ['add a memory', 'new memory', 'save a memory', 'record a memory'],
  addRoutine: ['add a routine', 'new routine', 'create a routine', 'set a reminder'],
  greeting: ['hello', 'hi ', 'hey', 'good morning', 'good evening', 'namaste'],
  thanks: ['thank', 'thanks', 'cheers'],
  help: ['help', 'what can you', 'who are you', 'what do you do'],
};

/** Suggestion chips are translated, so each one also maps straight to an intent. */
function intentFromSuggestion(input: string, t: TranslateFn): IntentId | null {
  const text = input.trim().toLowerCase();
  const chips: [IntentId, string][] = [
    ['remaining', t('assistant.suggest.left')],
    ['memories', t('assistant.suggest.memories')],
    ['yesterday', t('assistant.suggest.yesterday')],
    ['week', t('assistant.suggest.week')],
    ['insights', t('assistant.suggest.howAmIDoing')],
  ];
  for (const [intent, chip] of chips) {
    if (chip.trim().toLowerCase() === text) return intent;
  }
  return null;
}

function detectIntent(input: string, t: TranslateFn): IntentId | null {
  const fromChip = intentFromSuggestion(input, t);
  if (fromChip) return fromChip;

  const text = ` ${input.toLowerCase().trim()} `;
  let best: { intent: IntentId; score: number } | null = null;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [IntentId, string[]][]) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        // Longer keywords are more specific, so they win ties.
        const score = keyword.length;
        if (!best || score > best.score) best = { intent, score };
      }
    }
  }

  return best?.intent ?? null;
}

/** Pulls a search term out of phrasings like "show my memories about Goa". */
function extractMemoryQuery(input: string): string {
  const match = input.toLowerCase().match(/(?:about|of|from|with|related to)\s+(.+)$/);
  if (!match) return '';
  return match[1].replace(/[?.!]/g, '').trim();
}

function toItems(occurrences: ReturnType<typeof occurrencesFor>): AssistantListItem[] {
  return occurrences.map(({ routine }) => ({
    id: routine.id,
    label: routine.name,
    meta: formatTime(routine.time),
    icon: routine.icon,
    to: `/routines/${routine.id}`,
  }));
}

function memoriesToItems(memories: Memory[]): AssistantListItem[] {
  return memories.map((memory) => ({
    id: memory.id,
    label: memory.title,
    meta: formatDate(memory.date),
    image: memory.image,
    to: `/memories/${memory.id}`,
  }));
}

export class MockAssistantProvider implements AssistantProvider {
  readonly id = 'mock';

  async reply(input: string, context: AssistantContext): Promise<AssistantReply> {
    // A short pause reads as considered rather than instant and machine-like.
    await new Promise((resolve) => setTimeout(resolve, 420));
    return this.respond(input, context);
  }

  private respond(input: string, context: AssistantContext): AssistantReply {
    const { routines, completions, memories, date, t } = context;
    const intent = detectIntent(input, t);
    const name = firstName(context.userName);

    switch (intent) {
      case 'remaining':
        return this.remaining(context);

      case 'completed': {
        const done = occurrencesFor(routines, completions, date).filter((o) => o.completed);
        if (done.length === 0) {
          return {
            text: t('assistant.reply.noneCompleted'),
            suggestions: [t('assistant.suggest.left'), t('assistant.suggest.week')],
          };
        }
        return {
          text: t('assistant.reply.completed', { count: done.length }),
          items: toItems(done),
          suggestions: [t('assistant.suggest.left'), t('assistant.suggest.howAmIDoing')],
        };
      }

      case 'schedule': {
        const all = occurrencesFor(routines, completions, date);
        if (all.length === 0) {
          return {
            text: t('assistant.reply.nothingToday'),
            action: { label: t('assistant.reply.addRoutine'), to: '/routines/new' },
          };
        }
        const progress = progressFor(routines, completions, date);
        return {
          text: t('assistant.reply.wholeDay', { name }),
          items: all.map((occurrence) => ({
            ...toItems([occurrence])[0],
            meta: `${formatTime(occurrence.routine.time)}${
              occurrence.completed ? t('assistant.reply.doneSuffix') : ''
            }`,
          })),
          footer: t('assistant.reply.wholeDayFooter', {
            completed: progress.completed,
            total: progress.total,
          }),
          suggestions: [t('assistant.suggest.left'), t('assistant.suggest.yesterday')],
        };
      }

      case 'tomorrow': {
        const tomorrow = addDays(date, 1);
        const all = occurrencesFor(routines, completions, tomorrow);
        const day = weekdayLong(tomorrow);
        if (all.length === 0) {
          return { text: t('assistant.reply.tomorrowNothing', { day }) };
        }
        return {
          text: t('assistant.reply.tomorrow', { day }),
          items: toItems(all),
          suggestions: [t('assistant.suggest.left'), t('assistant.suggest.memories')],
        };
      }

      case 'yesterday': {
        const yesterday = addDays(date, -1);
        const all = occurrencesFor(routines, completions, yesterday);
        const done = all.filter((o) => o.completed);
        const missed = all.filter((o) => !o.completed);

        if (all.length === 0) return { text: t('assistant.reply.yesterdayNothing') };
        if (done.length === 0) {
          return { text: t('assistant.reply.yesterdayNone'), items: toItems(all) };
        }
        return {
          text: t('assistant.reply.yesterday', { done: done.length, total: all.length }),
          items: toItems(done),
          footer:
            missed.length > 0
              ? t('assistant.reply.yesterdayMissed', {
                  count: missed.length,
                  names: listToSentence(missed.map((o) => o.routine.name)),
                })
              : t('assistant.reply.yesterdayAll'),
          suggestions: [t('assistant.suggest.howAmIDoing'), t('assistant.suggest.left')],
        };
      }

      case 'week': {
        const insights = buildInsights(routines, completions, t, 'week', date);
        return {
          text: t('assistant.reply.week', {
            completed: insights.completed,
            total: insights.total,
            percent: insights.percent,
          }),
          footer:
            insights.mostMissed && insights.mostMissed.missed > 1
              ? t('assistant.reply.weekMissed', {
                  name: insights.mostMissed.routine.name,
                  count: insights.mostMissed.missed,
                })
              : undefined,
          action: { label: t('assistant.reply.openInsights'), to: '/insights' },
          suggestions: [t('assistant.suggest.left'), t('assistant.suggest.memories')],
        };
      }

      case 'memories': {
        const query = extractMemoryQuery(input);
        const found = filterMemories(memories, 'all', query).slice(0, 4);

        if (found.length === 0) {
          return {
            text: query
              ? t('assistant.reply.memoriesNotFound', { query })
              : t('assistant.reply.memoriesNone'),
            action: { label: t('assistant.reply.addMemory'), to: '/memories/new' },
          };
        }
        return {
          text: query
            ? t('assistant.reply.memoriesFound', { query })
            : t('assistant.reply.memoriesRecent'),
          items: memoriesToItems(found),
          action: { label: t('assistant.reply.seeAllMemories'), to: '/memories' },
          suggestions: [t('assistant.suggest.left'), t('assistant.suggest.yesterday')],
        };
      }

      case 'insights': {
        const insights = buildInsights(routines, completions, t, 'week', date);
        const observation = insights.observations[0];
        return {
          text: observation
            ? `${observation.title}. ${observation.body}`
            : t('assistant.reply.insightsFallback', { percent: insights.percent }),
          footer: t('assistant.reply.insightsFooter'),
          action: { label: t('assistant.reply.openInsights'), to: '/insights' },
        };
      }

      case 'location': {
        const location = context.location;
        if (!location || !location.sharingEnabled) {
          return {
            text: t('assistant.reply.locationOff'),
            action: { label: t('assistant.reply.openLocation'), to: '/profile/location' },
          };
        }
        return {
          text: t('assistant.reply.locationOn', {
            names: listToSentence(location.sharedWith),
            when: location.lastUpdated
              ? formatRelativeTime(location.lastUpdated, t)
              : t('location.never'),
          }),
          action: { label: t('assistant.reply.openLocation'), to: '/profile/location' },
        };
      }

      case 'addMemory':
        return {
          text: t('assistant.reply.addMemoryHelp'),
          action: { label: t('assistant.reply.addMemory'), to: '/memories/new' },
        };

      case 'addRoutine':
        return {
          text: t('assistant.reply.addRoutineHelp'),
          action: { label: t('assistant.reply.addRoutine'), to: '/routines/new' },
        };

      case 'greeting': {
        const progress = progressFor(routines, completions, date);
        return {
          text: t('assistant.reply.greetingBack', {
            name,
            completed: progress.completed,
            total: progress.total,
          }),
          suggestions: defaultSuggestions(t),
        };
      }

      case 'thanks':
        return { text: t('assistant.reply.thanks'), suggestions: defaultSuggestions(t) };

      case 'help':
        return { text: t('assistant.reply.help'), suggestions: defaultSuggestions(t) };

      default:
        return this.fallback(context);
    }
  }

  private remaining(context: AssistantContext): AssistantReply {
    const { routines, completions, date, t } = context;
    const all = occurrencesFor(routines, completions, date);
    const remaining = all.filter((o) => !o.completed);
    const done = all.length - remaining.length;

    if (all.length === 0) {
      return {
        text: t('assistant.reply.nothingToday'),
        action: { label: t('assistant.reply.addRoutine'), to: '/routines/new' },
      };
    }

    if (remaining.length === 0) {
      return {
        text: t('assistant.reply.allDone'),
        footer: t('assistant.reply.allDoneFooter', { total: all.length }),
        suggestions: [t('assistant.suggest.memories'), t('assistant.suggest.howAmIDoing')],
      };
    }

    return {
      text: t('assistant.reply.remaining'),
      items: toItems(remaining),
      footer:
        done > 0
          ? t('assistant.reply.remainingFooter', { done, total: all.length })
          : undefined,
      suggestions: [t('assistant.suggest.yesterday'), t('assistant.suggest.memories')],
    };
  }

  private fallback(context: AssistantContext): AssistantReply {
    const { t } = context;
    const recent = sortByDate(context.memories)[0];
    return {
      text: t('assistant.reply.fallback'),
      footer: recent ? t('assistant.reply.fallbackFooter', { title: recent.title }) : undefined,
      suggestions: defaultSuggestions(t),
    };
  }
}

export const assistant: AssistantProvider = new MockAssistantProvider();

export function greetingMessage(userName: string, t: TranslateFn): AssistantReply {
  return {
    text: t('assistant.greeting', { name: firstName(userName) }),
    suggestions: defaultSuggestions(t),
  };
}
