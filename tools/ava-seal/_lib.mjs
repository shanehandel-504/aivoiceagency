/* ============================================================================
   tools/ava-seal/_lib.mjs · AVA SEAL WINDOW · shared transport
   ----------------------------------------------------------------------------
   This run WRITES. codex-read/_http.mjs is a read-only guard by design and must
   stay that way, so the seal tools carry their own transport.

   SECRET LAW (inherited): nothing here ever prints a header, a token, or a query
   string that could carry one. Errors surface status + a trimmed body only.
   ========================================================================== */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export const N8N_HOST  = 'https://circulant.app.n8n.cloud';
export const N8N_API   = `${N8N_HOST}/api/v1`;
export const RETELL    = 'https://api.retellai.com';
export const GHL_API   = 'https://services.leadconnectorhq.com';

export const NUMBER    = '+14142408930';
export const AGENT_ID  = 'agent_d5ada9f774fe3ae7f034d2c677';
export const WF_BOOK   = 'c5GPBkma1HyvonEa';

export const ISO = () => new Date().toISOString();

export function need(names) {
  const missing = names.filter(n => !process.env[n]);
  if (missing.length) {
    console.error(`RUN INCOMPLETE — MISSING FROM ENV: ${missing.join(', ')}`);
    process.exit(2);
  }
}

export const nH = () => ({ 'X-N8N-API-KEY': process.env.N8N_API_KEY, accept: 'application/json' });
export const rH = () => ({ authorization: `Bearer ${process.env.RETELL_API_KEY}`, accept: 'application/json' });
export const gH = () => ({
  Authorization: `Bearer ${process.env.GHL_PIT}`,
  Version: '2021-07-28',
  accept: 'application/json',
});

/* One request path. Never echoes the URL on a network failure — a URL can carry
   a locationId or a token in a query string. */
export async function req(method, url, headers = {}, body, { label = 'request', timeoutMs = 30000 } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  init.signal = ac.signal;

  const t0 = Date.now();
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, ms: Date.now() - t0, body: null,
             err: `network failure (${e.code || e.name || 'unknown'})` };
  }
  clearTimeout(t);
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { _raw: text.slice(0, 600) }; }

  /* GHL trap (§ memory: run6-callback-line-traps): errors arrive inside HTTP 200.
     Status alone is never a verdict. */
  const soft = parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
    (parsed.error || parsed.error_message || parsed.msg === 'Unauthorized' || Number(parsed.statusCode) >= 400);

  return { ok: res.ok && !soft, status: res.status, ms: Date.now() - t0, body: parsed, soft: !!soft };
}

export function saveJSON(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  return path;
}
export function loadJSON(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}
export const trim = (o, n = 900) => {
  const s = typeof o === 'string' ? o : JSON.stringify(o, null, 2);
  return !s ? String(o) : s.length > n ? s.slice(0, n) + `\n… [truncated ${s.length - n}]` : s;
};
