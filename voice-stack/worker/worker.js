// ════════════════════════════════════════════
// CLOUDFLARE WORKER: aichauffeur-token
// Issues short-lived Retell web-call access tokens to browser clients
// for both aivoiceagency.ai (AVA) and aichauffeur.ai (AI Chauffeur).
//
// Env var (set via `wrangler secret put RETELL_API_KEY`):
//   RETELL_API_KEY  — Retell secret API key. Server-side ONLY; never in repo.
// Optional: RETELL_AGENT_ID — default agent used when client omits agent_id.
// ════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://aichauffeur.ai',
  'https://www.aichauffeur.ai',
  'https://aivoiceagency.ai',
  'https://www.aivoiceagency.ai',
  'http://localhost:3000',
  'http://localhost:8000',
];

// Only these agents may be dialed from the browser — keeps this public
// token endpoint from being used to start calls on arbitrary agents.
const ALLOWED_AGENTS = new Set([
  'agent_d5ada9f774fe3ae7f034d2c677', // AVA general  (aivoiceagency.ai)
  'agent_8e9e7d477949c6babcbdcc756d', // AI Chauffeur (aichauffeur.ai)
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Vercel preview deploys, e.g. https://aivoiceagency-git-<branch>.vercel.app
  try {
    return new URL(origin).hostname.endsWith('.vercel.app');
  } catch (e) {
    return false;
  }
}

function corsHeaders(origin) {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'aichauffeur-token',
          provider: 'retell',
          configured: Boolean(env.RETELL_API_KEY),
          time: new Date().toISOString(),
        }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    const json = (obj, status) =>
      new Response(JSON.stringify(obj), {
        status: status || 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });

    try {
      if (!env.RETELL_API_KEY) {
        return json({ error: 'Worker not configured. Missing RETELL_API_KEY secret.' }, 500);
      }

      let body = {};
      try { body = await request.json(); } catch (e) { /* empty body ok */ }

      const agentId = body.agent_id || env.RETELL_AGENT_ID;
      if (!agentId) return json({ error: 'agent_id required' }, 400);
      if (!ALLOWED_AGENTS.has(agentId)) return json({ error: 'agent_id not allowed' }, 403);

      // Mint a Retell web-call access token (secret key stays server-side).
      const retellRes = await fetch('https://api.retellai.com/v2/create-web-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent_id: agentId }),
      });

      if (!retellRes.ok) {
        const detail = await retellRes.text();
        return json({ error: 'Retell API error', detail }, retellRes.status);
      }

      const data = await retellRes.json();
      return json({
        access_token: data.access_token,
        call_id: data.call_id,
        agent_id: agentId,
      });
    } catch (e) {
      return json({ error: e.message || 'Unknown error' }, 500);
    }
  },
};
