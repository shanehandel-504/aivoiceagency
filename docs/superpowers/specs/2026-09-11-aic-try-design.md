# aichauffeur.ai/try — design (approved 2026-09-11)

Approved spec for the browser demo of the AI Chauffeur line. Shane pasted the v2
prompt back as the run order, which is the approval; the v2 prompt was written
after a fact-check of v1 against the live site, the live agent and Retell's docs.

## Job

One screen, one control. A prospect taps "Try AI Chauffeur" and talks, in the
browser, to the same agent version that answers (414) 775-0019. No Retell branding
anywhere a person can see. The link is sent (LinkedIn / Instagram DMs), not ranked.

## Architecture

| Piece | Path | Does |
|---|---|---|
| Page | `chauffeur/try/index.html` | Mic check → Turnstile token → `POST /api/web-call` → joins with `RetellWebClient.startCall()` (retell-client-js-sdk 3.0.1, pinned, jsDelivr ESM, loaded on idle) |
| Function | `chauffeur/api/web-call.js` | POST only → same-site Origin → configured → 3 attempts / IP / hour → Turnstile siteverify (hostname must be aichauffeur.ai) → hold 10 of 20 account call slots for the phone lines (`GET /get-concurrency`) → `POST /v3/create-web-call` |
| Link in | `chauffeur/demo/index.html` | One line under the hero note: "No phone handy? Try it in your browser." |

The create request is pinned exactly:

```json
{
  "agent_id": "agent_2d1d687eb85e6d5d0e720795c2",
  "agent_version": "latest_published",
  "agent_override": { "agent": { "max_call_duration_ms": 480000, "end_call_after_silence_ms": 60000 } },
  "metadata": { "source": "aichauffeur.ai/try" }
}
```

- `latest_published` because that is what the number resolves; plain `latest` is the draft.
- The caps ride on this web call only. The phone line keeps its own settings.
- No dynamic variables: anything that changes what AVA says belongs to the tuning chat.
- The browser gets `call_id`, `access_token`, `transport`, `ice_servers` (+ `url` when sent). Nothing else.

## Decisions (Shane's, recommended defaults kept)

- No site chrome: wordmark only. noindex,follow; not in sitemap.xml.
- /demo is NOT redirected. It stays the indexed, phone-first demo and links here.
- No text or email promise on the page. AVA says that on the call, only when true.

## States (STATE LAW: word + colour in one frame, no colour transition, no green)

READY (--neutral) → CONNECTING (--amber) → LIVE (--signal-blue) → ENDED (--neutral),
or NOT CONNECTED (--miss-red) on any failure, with the phone line in the note.

## Failure paths

- In-app browser (feature check, then UA) → banner above the button + Copy link.
- Mic denied → "We couldn't reach your mic. Call the line instead: (414) 775-0019".
- 403 / 429 / 502 / SDK or Turnstile load failure → "The call didn't start. Call the line instead: (414) 775-0019".

## Verification

`tools/aic-try/`: `unit.mjs` (function, stubbed fetch), `render.mjs` (widths, contrast,
failure paths, no calls), `call.mjs` (one real call; local mode proves the cap by
letting Retell end the call itself).

## Out of scope, reported

The agent speaks no recording disclosure while /privacy says callers are told at the
start of the call. That is a flow change for the tuning chat (Prompt Authority Lock).
