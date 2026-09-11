// chauffeur/api/web-call.js — aichauffeur.ai/try/
//
// Creates ONE Retell web call for the browser demo and hands the browser only
// what it needs to join it. Vercel Node function, no dependencies, native fetch.
//
// ORDER IS LOAD-BEARING. Cheap refusals first, then the checks that cost a round
// trip, then the one request that costs money:
//   1 POST only   2 same-site Origin   3 configured   4 per-IP attempts
//   5 Turnstile   6 phone-capacity reserve   7 POST /v3/create-web-call
//
// ENV (Vercel -> aichauffeur -> Settings -> Environment Variables, Production + Preview):
//   RETELL_API_KEY     from Doppler ava-prod/prd. Never logged, never returned.
//   TURNSTILE_SECRET   from Doppler ava-prod/prd.

const ORIGIN = 'https://aichauffeur.ai';
const HOSTNAME = 'aichauffeur.ai';
const RETELL = 'https://api.retellai.com';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const FAIL_MESSAGE = 'The call could not be started.';

// The agent the (414) 775-0019 line answers with. That number resolves
// "latest_published", so the browser does too. Plain "latest" means the newest
// version, which is the unpublished draft.
const AGENT_ID = 'agent_2d1d687eb85e6d5d0e720795c2';
const AGENT_VERSION = 'latest_published';

// Caps for THIS web call only, sent as agent_override. The phone line keeps its
// own settings. 8 minutes clears every completed phone booking on record
// (longest 6.7 minutes over the 60 days before launch).
const MAX_CALL_MS = 480000;
const SILENCE_MS = 60000;

// The account runs 20 calls at once, and web calls draw from the same pool as
// both phone lines. At 10 busy the demo steps aside so real callers get through.
const BUSY_AT = 10;

// Per-IP attempts, counted BEFORE verification so a failing bot is limited too.
// In-memory: a cold start forgets it. A courtesy, never the defence.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const attempts = new Map();

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(JSON.stringify(body));
}

function upstreamFail(res, what, detail) {
  console.log('[web-call] ' + what, detail === undefined ? '' : detail);
  return send(res, 502, { error: 'upstream', message: FAIL_MESSAGE });
}

function clientIp(req) {
  const h = req.headers || {};
  const real = String(h['x-real-ip'] || '').trim();
  if (real) return real;
  return String(h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

function overLimit(ip, now) {
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (!v.some((t) => now - t < WINDOW_MS)) attempts.delete(k);
  }
  return false;
}

async function readBody(req) {
  let b;
  try { b = req.body; } catch { return {}; }
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string') { try { return JSON.parse(b); } catch { return {}; } }
  let raw = '';
  try {
    for await (const chunk of req) { raw += chunk; if (raw.length > 8192) break; }
  } catch { return {}; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

async function turnstileOk(secret, token, ip) {
  const form = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') form.set('remoteip', ip);
  const r = await fetch(SITEVERIFY, { method: 'POST', body: form, signal: AbortSignal.timeout(6000) });
  const v = await r.json().catch(() => ({}));
  // Cloudflare's published TEST secrets answer for example.com and say so in
  // metadata. The production secret never does, so only then is the host waived.
  const testKey = !!(v.metadata && v.metadata.result_with_testing_key === true);
  const ok = v.success === true && (testKey || v.hostname === HOSTNAME);
  if (!ok) {
    console.log('[web-call] turnstile refused', JSON.stringify({ codes: v['error-codes'] || [], hostname: v.hostname || null }));
  }
  return ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if ((req.headers && req.headers.origin) !== ORIGIN) return send(res, 403, { error: 'origin' });

  const key = process.env.RETELL_API_KEY;
  const secret = process.env.TURNSTILE_SECRET;
  if (!key || !secret) {
    console.log('[web-call] not configured', JSON.stringify({ retell_key: !!key, turnstile_secret: !!secret }));
    return send(res, 503, { error: 'not_configured' });
  }

  const ip = clientIp(req);
  if (overLimit(ip, Date.now())) return send(res, 429, { error: 'rate_limited' });

  const body = await readBody(req);
  const token = typeof body.turnstile === 'string' ? body.turnstile : '';
  if (!token || token.length > 2048) return send(res, 403, { error: 'verification' });

  try {
    if (!(await turnstileOk(secret, token, ip))) return send(res, 403, { error: 'verification' });

    const auth = { Authorization: `Bearer ${key}` };

    const c = await fetch(`${RETELL}/get-concurrency`, { headers: auth, signal: AbortSignal.timeout(6000) });
    if (!c.ok) return upstreamFail(res, 'concurrency read failed', c.status);
    const busy = (await c.json().catch(() => ({}))).current_concurrency;
    if (typeof busy !== 'number') return upstreamFail(res, 'concurrency unreadable');
    if (busy >= BUSY_AT) {
      console.log('[web-call] capacity reserve held', busy);
      return send(res, 429, { error: 'busy' });
    }

    const r = await fetch(`${RETELL}/v3/create-web-call`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: AGENT_ID,
        agent_version: AGENT_VERSION,
        agent_override: { agent: { max_call_duration_ms: MAX_CALL_MS, end_call_after_silence_ms: SILENCE_MS } },
        metadata: { source: 'aichauffeur.ai/try' },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      const detail = (await r.text().catch(() => '')).slice(0, 300);
      return upstreamFail(res, 'create failed', `${r.status} ${detail}`);
    }
    const d = await r.json().catch(() => ({}));
    if (!d.call_id || !d.access_token) return upstreamFail(res, 'create returned no call');

    console.log('[web-call] created', d.call_id);
    return send(res, 200, {
      call_id: d.call_id,
      access_token: d.access_token,
      transport: d.transport,
      ice_servers: d.ice_servers,
      url: d.url,
    });
  } catch (e) {
    return upstreamFail(res, 'error', `${e && e.name} ${String((e && e.message) || '').slice(0, 200)}`);
  }
}
