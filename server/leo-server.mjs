import http from 'node:http';
import crypto from 'node:crypto';

// ============================================================================
// DailyMind Hardware Event Server
// ============================================================================
// A lightweight server for:
//   1. Hardware event ingestion (ESP32 IMU + SOS button)
//   2. WebRTC signaling for the camera app
//
// Gary's AI runs client-side (Claude API) so this server has no AI code.
// ============================================================================

const port = Number(process.env.PORT ?? 8787);
const hardwareDeviceKey = process.env.HARDWARE_DEVICE_KEY ?? '';

// ---- In-memory event store (lost on restart) ----
const hardwareEvents = [];
const MAX_EVENTS = 500;
const deviceStatuses = new Map();
const DEVICE_ONLINE_THRESHOLD_MS = 120_000;
const deviceLastEvent = new Map();
const RATE_LIMIT_MS = 3000;
const deviceLastSequence = new Map();

// ---- CORS ----
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Device-Key',
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() });
  res.end(JSON.stringify(body));
}

// ---- Body reader ----
function readBody(req, max = 200_000) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { raw += c; if (raw.length > max) { req.destroy(); reject(new Error('Too large')); } });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

// ---- Event validation ----
const ALLOWED_TYPES = ['sos_button', 'suspected_fall', 'sensor_fault', 'device_status'];
function validateEvent(b) {
  if (!b || typeof b !== 'object') return 'Body must be JSON object.';
  if (typeof b.deviceId !== 'string' || !b.deviceId.trim()) return 'deviceId required.';
  if (!ALLOWED_TYPES.includes(b.eventType)) return `eventType must be: ${ALLOWED_TYPES.join(', ')}`;
  return null;
}

// ---- WebRTC signaling ----
let sigClients = { camera: null, viewers: [] };

function toViewers(msg) {
  const d = typeof msg === 'string' ? msg : JSON.stringify(msg);
  for (const v of sigClients.viewers) if (v.readyState === 1) v.send(d);
}
function toCamera(msg) {
  const c = sigClients.camera;
  if (c && c.readyState === 1) c.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
}

function handleWsUpgrade(req, socket, _head) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-5AB4DC65B5E7').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');

  function sendWs(data) {
    const p = Buffer.from(data, 'utf8');
    let h;
    if (p.length < 126) { h = Buffer.alloc(2); h[0] = 0x81; h[1] = p.length; }
    else { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(p.length, 2); }
    socket.write(Buffer.concat([h, p]));
  }

  let buf = Buffer.alloc(0), role = null;
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const op = buf[0] & 0x0f, masked = (buf[1] & 0x80) !== 0;
      let pLen = buf[1] & 0x7f, off = 2;
      if (pLen === 126) { if (buf.length < 4) return; pLen = buf.readUInt16BE(2); off = 4; }
      else if (pLen === 127) { socket.destroy(); return; }
      const total = off + (masked ? 4 : 0) + pLen;
      if (buf.length < total) return;
      let payload = buf.subarray(off + (masked ? 4 : 0), total);
      if (masked) { const m = buf.subarray(off, off + 4); payload = Buffer.from(payload); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i % 4]; }
      buf = buf.subarray(total);
      if (op === 0x08) { socket.end(); return; }
      if (op === 0x09) { const pong = Buffer.alloc(2); pong[0] = 0x8a; pong[1] = 0; socket.write(pong); continue; }
      if (op !== 0x01) continue;
      let msg; try { msg = JSON.parse(payload.toString('utf8')); } catch { continue; }

      if (msg.type === 'join') {
        role = msg.role;
        if (role === 'camera') { sigClients.camera = { send: sendWs, readyState: 1 }; toViewers({ type: 'camera-online' }); }
        else if (role === 'viewer') { sigClients.viewers.push({ send: sendWs, readyState: 1 }); if (sigClients.camera) toCamera({ type: 'viewer-joined' }); }
      } else if (msg.type === 'offer' && role === 'camera') { toViewers({ type: 'offer', sdp: msg.sdp }); }
      else if (msg.type === 'answer' && role === 'viewer') { toCamera({ type: 'answer', sdp: msg.sdp }); }
      else if (msg.type === 'ice-candidate') { if (role === 'camera') toViewers({ type: 'ice-candidate', candidate: msg.candidate }); else toCamera({ type: 'ice-candidate', candidate: msg.candidate }); }
    }
  });
  socket.on('close', () => {
    if (role === 'camera') { sigClients.camera = null; toViewers({ type: 'camera-offline' }); }
    else if (role === 'viewer') sigClients.viewers = sigClients.viewers.filter(v => v.send !== sendWs);
  });
  socket.on('error', () => socket.destroy());
}

// ---- HTTP server ----
const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/health') return sendJson(res, 200, { status: 'ok' });
  if (method === 'OPTIONS') return sendJson(res, 204, {});

  // POST /api/hardware/events
  if (method === 'POST' && url === '/api/hardware/events') {
    if (!hardwareDeviceKey || req.headers['x-device-key'] !== hardwareDeviceKey) return sendJson(res, 401, { error: 'Unauthorized device.' });
    try {
      const body = JSON.parse(await readBody(req));
      const err = validateEvent(body);
      if (err) return sendJson(res, 400, { error: err });
      const now = Date.now();
      if (now - (deviceLastEvent.get(body.deviceId) ?? 0) < RATE_LIMIT_MS) return sendJson(res, 429, { error: 'Too many events.' });
      if (typeof body.sequence === 'number') {
        if (body.sequence <= (deviceLastSequence.get(body.deviceId) ?? -1)) return sendJson(res, 200, { ok: true, duplicate: true });
        deviceLastSequence.set(body.deviceId, body.sequence);
      }
      const event = { id: crypto.randomUUID(), deviceId: body.deviceId, eventType: body.eventType, timestamp: body.timestamp ?? new Date().toISOString(), sequence: body.sequence ?? 0, data: { accelerationMagnitude: body.data?.accelerationMagnitude ?? null, angularVelocityMagnitude: body.data?.angularVelocityMagnitude ?? null }, receivedAt: new Date().toISOString(), acknowledged: false };
      hardwareEvents.unshift(event);
      if (hardwareEvents.length > MAX_EVENTS) hardwareEvents.length = MAX_EVENTS;
      deviceStatuses.set(body.deviceId, { deviceId: body.deviceId, lastSeen: event.receivedAt, lastEventType: body.eventType });
      deviceLastEvent.set(body.deviceId, now);
      console.log(`[HW] ${body.eventType} from ${body.deviceId}`);
      return sendJson(res, 201, { ok: true, eventId: event.id });
    } catch { return sendJson(res, 400, { error: 'Malformed request.' }); }
  }

  // POST /api/hardware/events/:id/acknowledge
  if (method === 'POST' && url?.match(/^\/api\/hardware\/events\/[^/]+\/acknowledge$/)) {
    const id = url.split('/')[4];
    const ev = hardwareEvents.find(e => e.id === id);
    if (!ev) return sendJson(res, 404, { error: 'Not found.' });
    ev.acknowledged = true;
    return sendJson(res, 200, { ok: true });
  }

  // GET /api/hardware/events
  if (method === 'GET' && url?.startsWith('/api/hardware/events')) {
    const limit = Math.min(Number(new URL(url, `http://${req.headers.host}`).searchParams.get('limit') ?? 50), 200);
    return sendJson(res, 200, hardwareEvents.slice(0, limit));
  }

  // GET /api/hardware/device-status
  if (method === 'GET' && url === '/api/hardware/device-status') {
    const now = Date.now();
    return sendJson(res, 200, Array.from(deviceStatuses.values()).map(s => ({ ...s, online: s.lastSeen ? now - new Date(s.lastSeen).getTime() < DEVICE_ONLINE_THRESHOLD_MS : false })));
  }

  return sendJson(res, 404, { error: 'Not found.' });
});

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws/signaling') handleWsUpgrade(req, socket, head);
  else socket.destroy();
});

server.listen(port, '0.0.0.0', () => console.log(`DailyMind hardware server on port ${port}.`));
