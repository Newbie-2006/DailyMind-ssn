import http from 'node:http';
import { GoogleGenAI } from '@google/genai';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Set GEMINI_API_KEY before starting Gary’s server.');
}

const ai = new GoogleGenAI({ apiKey });
const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';
const groqApiKey = process.env.GROQ_API_KEY;
const groqModel = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

const instructions = `You are Gary, a kind, concise voice assistant for an older adult using DailyMind.
Use only the supplied personal context when discussing routines and memories. Speak in short, plain sentences that are easy to hear. Never diagnose illness, prescribe treatment, claim to contact emergency services, or present yourself as a doctor. If someone describes an immediate emergency, tell them to use the in-app SOS button or local emergency services and contact a caregiver. Do not invent appointments, medications, caregiver actions, or facts.
Return only a JSON object with this exact shape: {"text":"short helpful answer","suggestions":["optional short follow-up","optional short follow-up"]}.`;

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.GARY_ALLOWED_ORIGIN ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(body));
}

class InvalidGeminiResponseError extends Error {}

function parseJson(text) {
  let value;
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    value = JSON.parse(cleaned);
  } catch {
    throw new InvalidGeminiResponseError('Gemini returned malformed JSON.');
  }
  if (!value || typeof value.text !== 'string') {
    throw new InvalidGeminiResponseError('Gemini returned an invalid response shape.');
  }
  return {
    text: value.text,
    suggestions: Array.isArray(value.suggestions)
      ? value.suggestions.filter((item) => typeof item === 'string').slice(0, 3)
      : [],
  };
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isTransientGeminiError(error) {
  const status = Number(error?.status ?? error?.error?.code);
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function isRetryableGaryError(error) {
  return isTransientGeminiError(error) || error instanceof InvalidGeminiResponseError;
}

async function generateGaryReply(contents) {
  // Gemini can briefly return 503 or malformed structured output. Retry only
  // those transient failures, using a short exponential backoff with jitter.
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: instructions,
          temperature: 0.35,
          maxOutputTokens: 320,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              suggestions: { type: 'array', items: { type: 'string' }, maxItems: 3 },
            },
            required: ['text', 'suggestions'],
            additionalProperties: false,
          },
        },
      });
      return parseJson(result.text ?? '');
    } catch (error) {
      if (!isRetryableGaryError(error) || attempt === maxAttempts - 1) throw error;

      const delay = 500 * 2 ** attempt + Math.floor(Math.random() * 250);
      console.warn(`Gary reply could not be completed; retrying in ${delay}ms.`);
      await sleep(delay);
    }
  }
}

async function generateGroqReply(contents) {
  if (!groqApiKey) throw new Error('Groq fallback is not configured.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: groqModel,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: contents },
      ],
      temperature: 0.35,
      max_completion_tokens: 320,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq fallback failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new InvalidGeminiResponseError('Groq returned an empty reply.');
  return parseJson(text);
}

http
  .createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      return sendJson(response, 200, { status: 'ok' });
    }
    if (request.method === 'OPTIONS') return sendJson(response, 204, {});
    if (request.method !== 'POST' || request.url !== '/gary/reply') {
      return sendJson(response, 404, { error: 'Not found.' });
    }

    let raw = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 200_000) request.destroy();
    });
    request.on('end', async () => {
      try {
        const { input, context } = JSON.parse(raw);
        if (typeof input !== 'string' || !input.trim() || !context || typeof context !== 'object') {
          return sendJson(response, 400, { error: 'A message and context are required.' });
        }

        const contents = `Patient context:\n${JSON.stringify(context)}\n\nPatient says: ${input}`;
        let reply;
        try {
          reply = await generateGaryReply(contents);
        } catch (geminiError) {
          if (!groqApiKey || !isRetryableGaryError(geminiError)) throw geminiError;

          console.warn('Gemini is unavailable; trying the Groq fallback.');
          reply = await generateGroqReply(contents);
        }
        return sendJson(response, 200, reply);
      } catch (error) {
        console.error('Gary reply failed:', error);
        if (isTransientGeminiError(error)) {
          return sendJson(response, 503, {
            error: 'Gary is temporarily busy. Please try again in a moment.',
          });
        }
        return sendJson(response, 502, { error: 'Gary could not prepare a reply.' });
      }
    });
  })
  .listen(port, '0.0.0.0', () => console.log(`Gary Gemini service listening on port ${port}.`));
