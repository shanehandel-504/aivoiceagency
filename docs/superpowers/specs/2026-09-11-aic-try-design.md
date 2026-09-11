# aichauffeur.ai/try — design (v3, approved 2026-09-11)

Approved spec for the browser demo of the AI Chauffeur line. v1 was fact-checked
into v2 (Vercel function); v2 shipped and stopped at a wall: the `aichauffeur`
Vercel project has no `RETELL_API_KEY` and only a dashboard login can add one.
**v3 moves the secret and the gates into n8n.** Vercel serves static HTML only.

## Job

One screen, one control. A prospect taps "Try AI Chauffeur" and talks, in the
browser, to the same agent version that answers (414) 775-0019. No Retell branding
anywhere a person can see. The link is sent (LinkedIn / Instagram DMs), not ranked.

## Architecture

| Piece | Where | Does |
|---|---|---|
| Page | `chauffeur/try/index.html` | Mic check → proof of work → POST to the n8n webhook → joins with `RetellWebClient.startCall()` (retell-client-js-sdk 3.0.1, pinned, jsDelivr ESM, loaded on idle) |
| Workflow | n8n `WF-TRY-WEBCALL` (`9nKn8i2dRuALikuv`) | POST webhook on a 32-hex path → origin gate → daily cap → per-IP limit → proof of work → capacity ceiling → `POST /v3/create-web-call` → returns only the browser's fields |
| Credential | n8n `Retell API` (`kGVhqVmqLgPUAxpM`) | Header `Authorization: Bearer …`, restricted to `api.retellai.com`. The page and the repo hold no secret. |
| Link in | `chauffeur/demo/index.html` | One line under the hero note: "No phone handy? Try it in your browser." |

The create request is pinned:

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

## Why proof of work instead of Turnstile

Turnstile needs `aichauffeur.ai` added to the widget's hostname list (it answers
`110200` today), and no Cloudflare API token exists in Doppler, so nothing here
could add it without Shane. The page instead solves a one-time server puzzle:
SHA-256("nonce:counter") with 20 leading zero bits, about a million hashes, 0.2 s
on a desktop and a few seconds on a phone, in a worker so the page keeps painting.

It costs a script the same, which is the point, but it is a speed bump, not a wall.
**The real defence is the budget:** 3 attempts per IP per hour, 40 created calls per
UTC day, and a refusal whenever 10 of the account's 20 call slots are already busy,
which is what keeps both phone lines answering.

The webhook URL is public by nature — it sits in the page. Nothing else does.

## The client IP is not forgeable here

Measured on the live webhook: a request carrying `X-Forwarded-For: 203.0.113.99`
arrived as `x-forwarded-for: <real client>, <cloudflare edge>` with
`cf-connecting-ip: <real client>`. Cloudflare replaces the header rather than
appending to it. The limiter prefers `cf-connecting-ip` and falls back to the first
`x-forwarded-for` entry.

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
- 403 / 429 / 502 from the webhook, or the SDK failing to load → "The call didn't
  start. Call the line instead: (414) 775-0019".

## Verification

`tools/aic-try/`: `render.mjs` (widths, contrast, failure paths; stubs the webhook so
it creates no calls), `probe-fn.mjs` (the live webhook's origin gate, refused proof and
per-IP limit), `call.mjs` (one real call through the page; `--expect-cap` proves the
per-call duration override by letting Retell end the call).
The Code-node bodies and the SHA-256 are unit-tested outside n8n before they ship.

## Out of scope, reported

The agent speaks no recording disclosure while /privacy says callers are told at the
start of the call. That is a flow change for the tuning chat (Prompt Authority Lock).
