import type { GaryErrorCode } from './text';
import { garyTools, runTool, type GaryDataContext, type GaryEffect } from './tools';

/**
 * Talks to the Claude Messages API straight from the browser with the
 * caregiver's own key.
 *
 * This is deliberate for a personal, on-device app: the key never leaves this
 * device except to go to Anthropic. It is not safe for a published app, where
 * anyone could read the key out of the browser. That version needs a small
 * server that holds the key and applies per-person rate limits.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 30_000;
/** Enough room for a short spoken reply, plus any thinking the model does first. */
const MAX_TOKENS = 1024;
/** A single question should never need more than a few rounds of tool use. */
const MAX_TOOL_ROUNDS = 5;
/** Older turns are dropped so a long chat stays fast and cheap. */
const KEEP_TEXT_TURNS = 8;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/** Thinking and any newer block types are kept and sent back untouched. */
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | { type: string };

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

interface ApiResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

export class GaryError extends Error {
  code: GaryErrorCode;

  constructor(code: GaryErrorCode, detail?: string) {
    super(detail ?? code);
    this.name = 'GaryError';
    this.code = code;
  }
}

/* ------------------------------------------------------------------
   A local brake, so a stuck microphone loop can never run up a bill.
------------------------------------------------------------------- */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const recentRequests: number[] = [];

function takeRateSlot(): void {
  const now = Date.now();
  while (recentRequests.length && now - recentRequests[0] > RATE_WINDOW_MS) recentRequests.shift();
  if (recentRequests.length >= RATE_MAX_REQUESTS) throw new GaryError('rate_limited', 'local limit');
  recentRequests.push(now);
}

function errorForStatus(status: number): GaryError {
  if (status === 401 || status === 403) return new GaryError('invalid_key', `HTTP ${status}`);
  if (status === 429) return new GaryError('rate_limited', `HTTP ${status}`);
  if (status === 529 || status >= 500) return new GaryError('overloaded', `HTTP ${status}`);
  return new GaryError('unknown', `HTTP ${status}`);
}

interface CallOptions {
  apiKey: string;
  model: string;
  system: string;
  messages: ApiMessage[];
  maxTokens?: number;
  withTools?: boolean;
  signal?: AbortSignal;
}

async function callApi(options: CallOptions): Promise<ApiResponse> {
  if (!options.apiKey.trim()) throw new GaryError('no_key');
  takeRateSlot();

  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => timeout.abort();
  options.signal?.addEventListener('abort', onOuterAbort);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      signal: timeout.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': options.apiKey.trim(),
        'anthropic-version': API_VERSION,
        // Required by the API for calls made from a browser page.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens ?? MAX_TOKENS,
        system: options.system,
        messages: options.messages,
        ...(options.withTools === false ? {} : { tools: garyTools }),
      }),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (timeout.signal.aborted) throw new GaryError('timeout');
    throw new GaryError('network', error instanceof Error ? error.message : undefined);
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener('abort', onOuterAbort);
  }

  if (!response.ok) throw errorForStatus(response.status);

  try {
    return (await response.json()) as ApiResponse;
  } catch {
    throw new GaryError('unknown', 'Unreadable response');
  }
}

function isTextTurn(message: ApiMessage): boolean {
  return message.role === 'user' && typeof message.content === 'string';
}

/**
 * Keeps the last few spoken exchanges. It only ever cuts at a plain user turn,
 * so a tool call is never separated from its result.
 */
export function trimHistory(messages: ApiMessage[]): ApiMessage[] {
  const starts = messages.flatMap((message, index) => (isTextTurn(message) ? [index] : []));
  if (starts.length <= KEEP_TEXT_TURNS) return messages;
  return messages.slice(starts[starts.length - KEEP_TEXT_TURNS]);
}

export interface GaryTurnResult {
  text: string;
  effects: GaryEffect[];
  /** The full exchange, including tool calls, to carry into the next turn. */
  messages: ApiMessage[];
}

export interface RunOptions {
  apiKey: string;
  model: string;
  system: string;
  history: ApiMessage[];
  utterance: string;
  /** Read fresh for every tool call, so results reflect what is on screen now. */
  getContext(): GaryDataContext;
  signal?: AbortSignal;
}

/** One spoken question in, one spoken answer out, with as many tool calls as it takes. */
export async function runGaryTurn(options: RunOptions): Promise<GaryTurnResult> {
  const messages: ApiMessage[] = [
    ...trimHistory(options.history),
    { role: 'user', content: options.utterance },
  ];
  const effects: GaryEffect[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await callApi({
      apiKey: options.apiKey,
      model: options.model,
      system: options.system,
      messages,
      signal: options.signal,
    });

    messages.push({ role: 'assistant', content: response.content });

    const toolUses = response.content.filter(
      (block): block is ToolUseBlock => block.type === 'tool_use',
    );

    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      const text = response.content
        .filter((block): block is TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join(' ')
        .trim();
      return { text, effects, messages };
    }

    const results: ToolResultBlock[] = toolUses.map((use) => {
      const outcome = runTool(use.name, use.input, options.getContext());
      if (outcome.effect) effects.push(outcome.effect);
      return {
        type: 'tool_result',
        tool_use_id: use.id,
        content: outcome.content,
        ...(outcome.isError ? { is_error: true } : {}),
      };
    });

    messages.push({ role: 'user', content: results });
  }

  // Ran out of rounds mid-tool-use: the history must not end on unanswered tool
  // results, so this turn is dropped and the caller shows a gentle fallback.
  return { text: '', effects, messages: [...trimHistory(options.history)] };
}

/** A one-token request, used by the setup screen to check a key works. */
export async function testApiKey(apiKey: string, model: string): Promise<void> {
  await callApi({
    apiKey,
    model,
    system: 'Reply with OK.',
    messages: [{ role: 'user', content: 'Hi' }],
    maxTokens: 16,
    withTools: false,
  });
}
