import http from 'node:http';
import { GoogleGenAI } from '@google/genai';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Set GEMINI_API_KEY before starting Gary’s server.');
}

const ai = new GoogleGenAI({ apiKey });
const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';

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

function parseJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const value = JSON.parse(cleaned);
  if (!value || typeof value.text !== 'string') throw new Error('Invalid Gemini response shape.');
  return {
    text: value.text,
    suggestions: Array.isArray(value.suggestions)
      ? value.suggestions.filter((item) => typeof item === 'string').slice(0, 3)
      : [],
  };
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

        const result = await ai.models.generateContent({
          model,
          contents: `Patient context:\n${JSON.stringify(context)}\n\nPatient says: ${input}`,
          config: { systemInstruction: instructions, temperature: 0.35, maxOutputTokens: 320 },
        });
        return sendJson(response, 200, parseJson(result.text ?? ''));
      } catch (error) {
        console.error('Gary reply failed:', error);
        return sendJson(response, 502, { error: 'Gary could not prepare a reply.' });
      }
    });
  })
  .listen(port, '0.0.0.0', () => console.log(`Gary Gemini service listening on port ${port}.`));
