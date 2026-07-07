// api/web-call.js — Vercel serverless. Mints a Retell web-call access token for the
// browser demo (agent AVA_WEB). Reads RETELL_API_KEY + RETELL_AVA_WEB_AGENT_ID from env.
//
// REQUIRED ENV (set in Vercel → Project → Settings → Environment Variables, prod + preview):
//   RETELL_API_KEY            (from Doppler ava-prod/prd)
//   RETELL_AVA_WEB_AGENT_ID   (the cloned web agent id, e.g. agent_xxx)
//
// Until those are set, /new keeps the browser-call button hidden (data-webcall="off").

const WINDOW_MS = 60 * 60 * 1000;      // 1 hour
const MAX_PER_WINDOW = 5;              // 5 calls / IP / hour (best-effort, warm-instance only)
const hits = new Map();                // ip -> [timestamps]  (stateless across cold starts)

const ALLOWED = ['https://aivoiceagency.ai', 'https://www.aivoiceagency.ai'];

function cors(res, origin) {
  const o = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr); return false;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  cors(res, origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AVA_WEB_AGENT_ID;
  if (!key || !agentId) {
    return res.status(503).json({ error: 'web-call not configured', detail: 'Missing RETELL_API_KEY or RETELL_AVA_WEB_AGENT_ID env var.' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Rate limit — try again in a bit.' });

  try {
    const r = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId })
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(r.status).json({ error: 'Retell API error', detail });
    }
    const data = await r.json();
    return res.status(200).json({ access_token: data.access_token, call_id: data.call_id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
