// ════════════════════════════════════════════
// CLOUDFLARE WORKER: retell-token
// Job: Issue Retell access token to frontend
// Deploy: Cloudflare Dashboard → Workers → New
// Env vars needed: RETELL_API_KEY
//
// 2026-10-07 — Not deployed (see KNOWN_ISSUES.md); kept as source. Endpoint moved to v3 on 2026-10-07.
// Checked 2026-10-07: no "retell-token" Worker answers on the account (workers.dev returns 404, error 1042).
// KNOWN_ISSUES.md is about the account's one deployed Worker, aichauffeur-token, which serves a web page, not this code.
// ════════════════════════════════════════════

export default {
  async fetch(request, env) {

    // CORS — allow aivoiceagency.ai only
    const allowedOrigins = [
      'https://www.aivoiceagency.ai',
      'https://aivoiceagency.ai',
      'http://localhost:3000', // local dev
    ];
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin':  corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Preflight
    if(request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: corsHeaders });

    // Only accept POST
    if(request.method !== 'POST')
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });

    try {
      const body = await request.json();
      const agentId = body.agent_id || env.RETELL_AGENT_ID;

      if(!agentId)
        return new Response(
          JSON.stringify({ error: 'agent_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );

      // Request token from Retell
      const retellRes = await fetch('https://api.retellai.com/v3/create-web-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RETELL_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ agent_id: agentId }),
      });

      if(!retellRes.ok) {
        const err = await retellRes.text();
        return new Response(
          JSON.stringify({ error: 'Retell API error', detail: err }),
          { status: retellRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      const data = await retellRes.json();
      // data.access_token is what the frontend needs

      return new Response(
        JSON.stringify({ access_token: data.access_token }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );

    } catch(e) {
      return new Response(
        JSON.stringify({ error: e.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }
  }
};
