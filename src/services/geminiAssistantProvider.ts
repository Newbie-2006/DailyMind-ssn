import type { AssistantContext, AssistantProvider, AssistantReply } from './assistantService';

/**
 * Gemini lives behind the same provider seam as the offline assistant. The
 * Android app sends requests to our server, never a Gemini API key.
 */
export class GeminiAssistantProvider implements AssistantProvider {
  readonly id = 'gemini';
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async reply(input: string, context: AssistantContext): Promise<AssistantReply> {
    const response = await fetch(`${this.endpoint}/gary/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        // Send only the data Gary needs to discuss the person's day. Images,
        // email addresses and caregiver contact details deliberately stay local.
        context: {
          userName: context.userName,
          date: context.date,
          routines: context.routines.map(({ name, time, repeat, note }) => ({ name, time, repeat, note })),
          completions: context.completions,
          memories: context.memories.map(({ title, date, description, category, people, tags }) => ({
            title,
            date,
            description,
            category,
            people,
            tags,
          })),
        },
      }),
    });

    if (!response.ok) throw new Error('Gary could not reach the AI service.');
    const result = (await response.json()) as { text?: unknown; suggestions?: unknown };
    if (typeof result.text !== 'string' || !result.text.trim()) {
      throw new Error('Gary received an empty AI response.');
    }

    return {
      text: result.text.trim(),
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions.filter((item): item is string => typeof item === 'string').slice(0, 3)
        : undefined,
    };
  }
}
