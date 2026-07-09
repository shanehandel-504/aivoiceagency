# SALES INFRASTRUCTURE — /intake + /pitch + PRICING SWEEP

**Date:** 2026-07-10 · **Code commit:** `5ed9355` · **Canon:** SALES KIT v1 (Notion L5 `398581219cb2817abbe7e963f3e43866`)

## Plain English

Three things shipped so you can start selling and onboarding without touching code.

1. **A new intake receiver.** When someone finishes the intake form, a robot (n8n) instantly creates them in your CRM (GHL), tags them `client-intake`, drops a tidy note with every answer, and texts you "📋 INTAKE COMPLETE: {business} · {vertical} · {tier}." I ran a real test end-to-end, watched the contact + note + your text all land, then deleted the test contact so nothing's polluted.
2. **A new page, `/intake`** — your onboarding front door. Seven short sections with a progress bar. It won't let anyone submit without checking the TCPA consent box (legally required). If the business is big or complex (>2,000 calls/mo, wants CRM field-mapping, or live warm-transfer routing), it auto-flags the build "custom" with a banner. When they finish, they see a receipt ("Your build starts now — Shane will confirm your go-live window") — never another booking link.
3. **A new page, `/pitch`** — your 8-slide sales deck you pull up on a call ("pull up aivoiceagency.ai/pitch while we talk"). Arrow keys, tap, or swipe to move; prints to a clean PDF as your leave-behind. Hidden from Google.
4. **Pricing cleanup.** Every stale price on the site is now synced to the v3 sheet (Starter $497/mo + $497 setup · Growth $997/mo + $1,500 setup · Operations from $1,997/mo). Old "Pro / Enterprise / Tier 1-2-3" names are now "Growth / Operations / Starter."

## DONE table

| # | What shipped | Live | Proof |
|---|---|---|---|
| 1 | n8n **AVA Client Intake** — webhook `/ava-intake` → GHL upsert → additive `client-intake` tag → full formatted NOTE → owner SMS alert → 200 `{ok,contact_id}` | ✅ active | wf `9FoLm4slBmM5nIus`; exec **274 = success**; contact `ckyxyPLs4TKF9yL51hKT`; note `64aBenCOC5wWgh5cpIoS`; owner SMS msgId `CeqesnQcgL6w3ZIff0DA` (conv `9fvDOE598jzJmSGjYSPP`); test contact deleted (exec 277, `{"succeeded":true}`) |
| 2 | **/intake** page — 7 sections, progress bar, required validation, TCPA fail-closed, CUSTOM auto-flag, receipt success | ✅ (5ed9355) | preview-verified: 3-error gate on empty step, clean 1→7 advance, greeting auto-prefill, banner fires on >2k calls + Operations, submit disabled until consent; posts to `/ava-intake` |
| 3 | **/pitch** 8-slide deck — arrow/tap/swipe nav, print-to-PDF, noindex, 414-only | ✅ (5ed9355) | preview-verified: 8 slides, keyboard nav 1→8, End disables Next, mobile stack (no overflow at 390×844), `robots=noindex,nofollow`, only `tel:+14142408930` |
| 4 | **Pricing sweep → v3** on overview, deck, 2 blogs, west-bend-electrical, CLAUDE.md | ✅ (5ed9355) | grep-clean: only residual `$500/$2,997/Pro/Enterprise` are chatgpt-example (intentional prototype) + `/transportation` (dead 308 redirect). New v3 figures verified in DOM |
| 5 | **Sitemap** +/intake; **vercel.json** /intake + /pitch rewrites | ✅ (5ed9355) | sitemap valid XML (/intake in, /pitch out); vercel.json valid JSON |

## IDs / one-line rollback

- **n8n intake workflow:** `9FoLm4slBmM5nIus` ("AVA Client Intake"). Rollback = `unpublish_workflow` or archive in n8n UI. Uses GHL Header Auth cred `wOmBNtlzVgn2fVAc`, location `sdShCZCaxce8DHKbYcIl`, owner-SMS contact `8zyowOdgNehLoYLpmVBm` from `+13502205305`.
- **Temp cleanup workflow** `f5TPXptjrpxrAVrG` — archived after use.
- **Site (pages, sweep, sitemap, vercel):** `git revert 5ed9355 && git push` (Vercel redeploys).

## Payload contract (page → `/ava-intake`)

`business_name, owner_name, vertical, service_area, website, years_in_business, ava_number, who_answers_today, ok_to_forward, business_hours, after_hours, calls_per_month, pct_missed, services, top_questions, prices_quote, emergency_protocol, never_do, calendar_system, job_length, crm_name, summaries_to, transfer_number, vip_callers, trigger_words, message_vs_transfer, greeting, ok_recording, ok_text_callers, tier, go_live_date, billing_email, tcpa_consent, tcpa_consent_at, custom_flag, custom_reasons, source`

## What's next / open items

- **`/pitch` is a kit-derived stand-in.** The designed `ava-pitch.html` artifact was never dropped into this session (searched repo, Desktop, Downloads, Documents — absent). This deck is a faithful render of *your* SALES KIT v1 8-slide arc so `/pitch` isn't a 404 for calls. **To swap in your real artifact:** overwrite `pitch/index.html` and redeploy (same URL).
- **`/intake` is `noindex` AND in the sitemap** (both were explicit asks — they conflict). Google Search Console will likely flag "Submitted URL marked noindex." Decide: keep noindex (then pull it from sitemap) OR make it indexable (remove the robots meta). Say the word.
- **Dead-file carve-outs (not swept, by design):** `chatgpt-example/` (intentional divergent noindex prototype per canon) and `transportation/` (permanent 308 → `/ground-transportation`, never served) still contain old `$500/$2,500/$2,997/Pro/Enterprise`. Fixable on request, but they never render.
- Owner SMS fired once during the test — that ping was the QA proof, not a real lead.

## Gotchas learned

- **GHL upsert REPLACES tags** — so intake upserts *without* tags, then adds `client-intake` via the additive `/contacts/{id}/tags` endpoint (preserves any existing demo/drip tags).
- **n8n SDK `newCredential('name','id')` does NOT bind an existing credential on create** (auto-assign skips when two `httpHeaderAuth` creds exist). Fix: `update_workflow` op `setNodeCredential` with the explicit `credentialId`.
- **Code node `runOnceForEachItem` must return `{json:{}}`, not `[{json:{}}]`** — array shape is only for `runOnceForAllItems`. First test errored on this; fixed.
- **Browser→n8n CORS:** webhook needs `options.allowedOrigins:"*"` (mirrors the proven `ava-call` webhook) or the cross-origin fetch fails preflight.
