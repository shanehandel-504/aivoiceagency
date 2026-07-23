/* ============================================================================
   AVA · PUBLIC CLIENT CONFIG  ·  RUN 1 (HEAR AVA LIVE)
   ----------------------------------------------------------------------------
   Shared, non-secret front-end constants. Loaded by conversion surfaces that
   post to an automation endpoint.

   HARD RULE — this file ships to every visitor's browser. It may ONLY ever hold
   values that are safe in public view: endpoint URLs and public site keys.
   NEVER put an API key, token, secret, PIT, or credential in here. Server-side
   secrets live in Doppler (project ava-prod / config prd) and are read by n8n,
   never by the page.
   ========================================================================== */
(function (w) {
  'use strict';

  w.AVA_CONFIG = {
    /* n8n LIVE INTAKE v1 — production webhook. The /live form posts JSON here.
       Test URL (n8n editor "Listen for test event") swaps /webhook/ for
       /webhook-test/ — never ship the test path. */
    N8N_INTAKE_URL: 'https://circulant.app.n8n.cloud/webhook/live-intake',

    /* Cloudflare Turnstile PUBLIC site key. Safe to expose by design — the
       matching TURNSTILE_SECRET stays server-side in n8n.
       EMPTY = not yet issued. While empty, /live renders its honeypot fallback
       instead of the widget. Set this string and the widget mounts itself with
       no other page edit. */
    TURNSTILE_SITE_KEY: '',

    /* The one public voice line (CLAUDE.md · PHONE). */
    AVA_TEL: '+14142408930',
    AVA_TEL_DISPLAY: '414-240-8930'
  };
})(window);
