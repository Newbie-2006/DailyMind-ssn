import type {
  CompletionLog,
  ISODate,
  Memory,
  Routine,
  RoutineIcon,
} from '../types';
import { addDays, formatDate, formatTime, weekdayLong } from '../utils/date';
import { firstName, listToSentence, pluralize } from '../utils/format';
import { filterMemories, sortByDate } from './memoryService';
import { occurrencesFor, progressFor } from './routineService';
import { buildInsights } from './insightsService';

/**
 * The assistant is a provider behind an interface, so the mock below can be
 * replaced with a real model call without any screen changing. A provider only
 * ever receives the context it is given - it does not reach into storage.
 */

export interface AssistantContext {
  userName: string;
  date: ISODate;
  routines: Routine[];
  completions: CompletionLog;
  memories: Memory[];
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

export const defaultSuggestions = [
  'What is left today?',
  'Show my memories',
  'What did I do yesterday?',
  'What is my routine like this week?',
];

type IntentId =
  | 'remaining'
  | 'completed'
  | 'schedule'
  | 'tomorrow'
  | 'yesterday'
  | 'week'
  | 'memories'
  | 'insights'
  | 'addMemory'
  | 'addRoutine'
  | 'greeting'
  | 'thanks'
  | 'help';

const INTENT_KEYWORDS: Record<IntentId, string[]> = {
  remaining: ['left', 'remaining', 'still', 'pending', 'to do', 'todo', 'have to do', 'need to do'],
  completed: ['done', 'completed', 'finished', 'ticked', 'already'],
  schedule: ['today', 'schedule', 'plan', 'routine today', 'day look'],
  tomorrow: ['tomorrow'],
  yesterday: ['yesterday'],
  week: ['week', 'weekly', 'this week', 'seven days'],
  memories: ['memory', 'memories', 'photo', 'photos', 'remember', 'trip', 'holiday'],
  insights: ['insight', 'pattern', 'how am i', 'doing', 'progress', 'consistency', 'streak'],
  addMemory: ['add a memory', 'new memory', 'save a memory', 'record a memory'],
  addRoutine: ['add a routine', 'new routine', 'create a routine', 'set a reminder'],
  greeting: ['hello', 'hi ', 'hey', 'good morning', 'good evening', 'namaste'],
  thanks: ['thank', 'thanks', 'cheers'],
  help: ['help', 'what can you', 'who are you', 'what do you do'],
};

function detectIntent(input: string): IntentId | null {
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

function toItems(
  occurrences: ReturnType<typeof occurrencesFor>,
): AssistantListItem[] {
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
    const intent = detectIntent(input);
    const { routines, completions, memories, date } = context;
    const name = firstName(context.userName);

    switch (intent) {
      case 'remaining':
        return this.remaining(context);

      case 'completed': {
        const done = occurrencesFor(routines, completions, date).filter((o) => o.completed);
        if (done.length === 0) {
          return {
            text: 'Nothing is marked complete yet today. There is still plenty of day left.',
            suggestions: ['What is left today?', 'What is my routine like this week?'],
          };
        }
        return {
          text: `You have completed ${done.length} of your routines today:`,
          items: toItems(done),
          suggestions: ['What is left today?', 'How am I doing this week?'],
        };
      }

      case 'schedule': {
        const all = occurrencesFor(routines, completions, date);
        if (all.length === 0) {
          return {
            text: 'You have no routines scheduled for today.',
            action: { label: 'Add a routine', to: '/routines/new' },
          };
        }
        const progress = progressFor(routines, completions, date);
        return {
          text: `Here is your whole day, ${name}:`,
          items: all.map((occurrence) => ({
            ...toItems([occurrence])[0],
            meta: `${formatTime(occurrence.routine.time)}${occurrence.completed ? ' - done' : ''}`,
          })),
          footer: `${progress.completed} of ${progress.total} completed so far.`,
          suggestions: ['What is left today?', 'What did I do yesterday?'],
        };
      }

      case 'tomorrow': {
        const tomorrow = addDays(date, 1);
        const all = occurrencesFor(routines, completions, tomorrow);
        if (all.length === 0) {
          return { text: `Nothing is scheduled for ${weekdayLong(tomorrow)}.` };
        }
        return {
          text: `${weekdayLong(tomorrow)} looks like this:`,
          items: toItems(all),
          suggestions: ['What is left today?', 'Show my memories'],
        };
      }

      case 'yesterday': {
        const yesterday = addDays(date, -1);
        const all = occurrencesFor(routines, completions, yesterday);
        const done = all.filter((o) => o.completed);
        const missed = all.filter((o) => !o.completed);

        if (all.length === 0) {
          return { text: 'There was nothing scheduled yesterday.' };
        }
        if (done.length === 0) {
          return {
            text: 'Nothing was marked complete yesterday. It may simply not have been recorded.',
            items: toItems(all),
          };
        }
        return {
          text: `Yesterday you completed ${done.length} of ${all.length} routines:`,
          items: toItems(done),
          footer:
            missed.length > 0
              ? `${listToSentence(missed.map((o) => o.routine.name))} ${
                  missed.length === 1 ? 'was' : 'were'
                } not marked complete.`
              : 'Everything scheduled was completed.',
          suggestions: ['How am I doing this week?', 'What is left today?'],
        };
      }

      case 'week': {
        const insights = buildInsights(routines, completions, 'week', date);
        return {
          text: `Across this week you have completed ${insights.completed} of ${insights.total} scheduled routines, which is ${insights.percent}%.`,
          footer:
            insights.mostMissed && insights.mostMissed.missed > 1
              ? `${insights.mostMissed.routine.name} was the one missed most often, on ${insights.mostMissed.missed} ${pluralize(insights.mostMissed.missed, 'day')}.`
              : undefined,
          action: { label: 'Open insights', to: '/insights' },
          suggestions: ['What is left today?', 'Show my memories'],
        };
      }

      case 'memories': {
        const query = extractMemoryQuery(input);
        const found = filterMemories(memories, 'all', query).slice(0, 4);

        if (found.length === 0) {
          return {
            text: query
              ? `I could not find a memory about "${query}".`
              : 'There are no memories saved yet.',
            action: { label: 'Add a memory', to: '/memories/new' },
          };
        }
        return {
          text: query
            ? `Here is what I found about "${query}":`
            : 'Here are some of your most recent memories:',
          items: memoriesToItems(found),
          action: { label: 'See all memories', to: '/memories' },
          suggestions: ['What is left today?', 'What did I do yesterday?'],
        };
      }

      case 'insights': {
        const insights = buildInsights(routines, completions, 'week', date);
        const observation = insights.observations[0];
        return {
          text: observation
            ? `${observation.title}. ${observation.body}`
            : `You have completed ${insights.percent}% of your scheduled routines this week.`,
          footer: 'These are observations from your own log, nothing more.',
          action: { label: 'Open insights', to: '/insights' },
        };
      }

      case 'addMemory':
        return {
          text: 'Of course. Tell it however you like - a title and a few lines is plenty, and you can add a photo if you have one.',
          action: { label: 'Add a memory', to: '/memories/new' },
        };

      case 'addRoutine':
        return {
          text: 'Happy to help. Give it a name and a time, and choose how often it should repeat.',
          action: { label: 'Add a routine', to: '/routines/new' },
        };

      case 'greeting': {
        const progress = progressFor(routines, completions, date);
        return {
          text: `Hello ${name}. You have completed ${progress.completed} of ${progress.total} routines today.`,
          suggestions: defaultSuggestions,
        };
      }

      case 'thanks':
        return {
          text: 'Any time. I am here whenever you need me.',
          suggestions: defaultSuggestions,
        };

      case 'help':
        return {
          text: 'I can look after the everyday things with you: what is still on today, what you did yesterday, how the week has gone, and the memories you have saved. I will never change anything without asking you first.',
          suggestions: defaultSuggestions,
        };

      default:
        return this.fallback(context);
    }
  }

  private remaining(context: AssistantContext): AssistantReply {
    const { routines, completions, date } = context;
    const all = occurrencesFor(routines, completions, date);
    const remaining = all.filter((o) => !o.completed);
    const done = all.length - remaining.length;

    if (all.length === 0) {
      return {
        text: 'You have nothing scheduled today.',
        action: { label: 'Add a routine', to: '/routines/new' },
      };
    }

    if (remaining.length === 0) {
      return {
        text: 'Everything on today is done. That is the whole list.',
        footer: `All ${all.length} routines completed.`,
        suggestions: ['Show my memories', 'How am I doing this week?'],
      };
    }

    return {
      text: 'Here are your remaining tasks today:',
      items: toItems(remaining),
      footer:
        done > 0
          ? `You have already completed ${done} of your ${all.length} routines.`
          : undefined,
      suggestions: ['What did I do yesterday?', 'Show my memories'],
    };
  }

  private fallback(context: AssistantContext): AssistantReply {
    const recent = sortByDate(context.memories)[0];
    return {
      text: 'I am not sure about that one yet. I can help with your routines for today, what you did on an earlier day, how your week has gone, and anything you have saved as a memory.',
      footer: recent ? `Your most recent memory is "${recent.title}".` : undefined,
      suggestions: defaultSuggestions,
    };
  }
}

export const assistant: AssistantProvider = new MockAssistantProvider();

export function greetingMessage(userName: string): AssistantReply {
  return {
    text: `Hello ${firstName(userName)}. I am your DailyMind assistant. I can help you with your routines, memories and daily plans. What would you like to know?`,
    suggestions: defaultSuggestions,
  };
}
