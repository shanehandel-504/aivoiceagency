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
