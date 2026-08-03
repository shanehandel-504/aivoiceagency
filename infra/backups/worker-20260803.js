/*
 * ============================================================================
 * BACKUP  aichauffeur-token  captured 2026-08-03  (RATE-ENGINE-V1 run, Phase 0b)
 * ============================================================================
 *
 * READ THIS BEFORE RESTORING.
 *
 * The body of this file is the REPO source, voice-stack/worker/worker.js @ HEAD.
 * It is NOT a dump of the running script. The live script source could not be
 * retrieved: the Cloudflare MCP tool workers_get_worker_code returns a null
 * content payload and fails schema validation. Reproduced twice, and once more
 * independently. That is a transport bug, not a permissions or not-found error.
 * Doppler ava-prod/prd holds no Cloudflare API token, so there is no fallback route.
 *
 * WHAT IS ACTUALLY DEPLOYED IS NOT THIS WORKER.  Measured 2026-08-03:
 *
 *   GET https://aichauffeur-token.shanehandel.workers.dev/
 *     -> HTTP 200, content-type text/html, 49,475 bytes
 *     -> <title>AI Receptionist for Local Service Businesses | AVA - AI Voice Agency</title>
 *     -> byte-identical to git show 938cc52:index.html
 *   GET https://aichauffeur-token.shanehandel.workers.dev/health
 *     -> HTTP 404, 0 bytes
 *
 * The 404 is dispositive. The worker below is path-agnostic: its GET branch
 * returns 200 JSON for ANY path. A 404 on an arbitrary path proves the running
 * script is not this file. The endpoint is serving a static snapshot of the AVA
 * marketing homepage frozen at commit 938cc52 (2026-07-09).
 *
 * CONSEQUENCE: the LiveKit token endpoint is dead. A browser POSTing here for a
 * JWT gets static-asset behaviour, not a token. aichauffeur.ai/demo cannot mint
 * a LiveKit session.
 *
 * ROOT CAUSE (evidence, not proof): Workers Builds has failed on every commit
 * since 68bf225 (2026-07-09T09:10:47Z). The last green build was 938cc52 at
 * 2026-07-09T08:59:18Z, and the worker modified_on is 08:59:50Z -- 32s later.
 * That build produced what is live now. There is no wrangler.toml at the repo
 * root; the only one is voice-stack/worker/wrangler.toml. A build root pointed
 * at the repo root with no wrangler config there would fall back to deploying
 * the directory as static assets -- exactly what is being served.
 * NOTE: KNOWN_ISSUES.md blames PR #33 on 2026-05-25. That is wrong; builds were
 * green on 2026-07-08/09.
 *
 * git diff --stat 938cc52 HEAD -- voice-stack/worker/  is EMPTY, so repo drift
 * is NOT the cause. The fix is Cloudflare build configuration, not this code.
 *
 * NO CHANGES WERE MADE TO CLOUDFLARE IN THIS RUN (the brief said: report only).
 *
 * Worker name    aichauffeur-token
 * Worker id tag  6f6322b0f594433a90f63ec5e6f9cfe1
 * CF account     da54e14a36673e88bd413ad6e65239d7
 * Failing build  ac4c1a15-b45e-4f9e-9c11-329361adc7d7 (HEAD 0e49f51)
 * ============================================================================
 */

// ════════════════════════════════════════════
// CLOUDFLARE WORKER: aichauffeur-token
// Issues short-lived LiveKit JWT tokens for browser clients
// Env vars (set via wrangler secret):
//   LIVEKIT_API_KEY
//   LIVEKIT_API_SECRET
//   LIVEKIT_URL  (e.g. wss://aichauffeur-peohpvww.livekit.cloud)
// ════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://aichauffeur.ai',
  'https://www.aichauffeur.ai',
  'https://aivoiceagency.ai',
  'https://www.aivoiceagency.ai',
  'http://localhost:3000',
  'http://localhost:8000',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function b64url(buf) {
  let s = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlString(str) {
  return b64url(new TextEncoder().encode(str));
}

async function signLiveKitToken({ apiKey, apiSecret, identity, room, ttlSeconds = 1800 }) {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'HS256', typ: 'JWT' };

  const payload = {
    iss: apiKey,
    sub: identity,
    name: identity,
    iat: now,
    nbf: now,
    exp: now + ttlSeconds,
    video: {
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
    roomConfig: {
      agents: [
        {
          agentName: 'aichauffeur-dispatcher',
        },
      ],
    },
  };

  const headerB64 = b64urlString(JSON.stringify(header));
  const payloadB64 = b64urlString(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const sigB64 = b64url(sig);

  return `${signingInput}.${sigB64}`;
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
          livekit_url: env.LIVEKIT_URL || 'not configured',
          time: new Date().toISOString(),
        }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    try {
      if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET || !env.LIVEKIT_URL) {
        return new Response(
          JSON.stringify({ error: 'Worker not configured. Missing LiveKit env vars.' }),
          { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      let body = {};
      try { body = await request.json(); } catch (e) { /* empty body ok */ }

      const identity = body.identity || `caller-${crypto.randomUUID().slice(0, 8)}`;
      const room = body.room || `dispatch-${crypto.randomUUID().slice(0, 12)}`;

      const token = await signLiveKitToken({
        apiKey: env.LIVEKIT_API_KEY,
        apiSecret: env.LIVEKIT_API_SECRET,
        identity,
        room,
        ttlSeconds: 1800,
      });

      return new Response(
        JSON.stringify({
          token,
          url: env.LIVEKIT_URL,
          identity,
          room,
        }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message || 'Unknown error' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
  },
};
