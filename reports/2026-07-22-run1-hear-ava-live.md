# RUN 1 · HEAR AVA LIVE — run report

**Date:** 2026-07-22 · **Repo:** `shanehandel-504/aivoiceagency` · **Branch:** `main`

---

## RUN INCOMPLETE — WHAT / WHY / NEXT STEP

**WHAT:** The `/live` page, the demo agents, and the 5-number pool are LIVE. The n8n
`LIVE INTAKE v1` workflow is deployed and activated but **CANNOT EXECUTE**, so the
form → SMS → call loop does not fire yet.

**WHY:** `circulant.app.n8n.cloud` has been **over its plan execution limit since
2026-07-18T04:30:48**. Every execution since — 1,408 of them across ~4 days 21 hours —
dies at the trigger node with *"Execution limit reached. Consider upgrading your plan."*
This is an **account-wide quota problem, not a workflow bug**: a brand-new workflow fails
identically on its first request.

**NEXT STEP (Shane):** Upgrade the n8n plan or wait for the quota to reset. That single
action also un-blocks the 7-day drip, booking receipts, and — most importantly — the AVA
realtime call functions.

---

## ⚠ TWO FINDINGS THAT OUTRANK THIS RUN

### 1 · The whole n8n automation layer has been dead for ~5 days

Last successful execution anywhere: **2026-07-18T04:30:48**. Since then:

| Workflow | Failed runs in window | Effect |
|---|---|---|
| AVA Drip Engine v1 | 702 | No drip has gone out since Jul 18 |
| AVA Booking Receipt | 702 | No booking receipts since Jul 18 |
| AVA · book_appointment / write_to_crm / send_link / alert_owner | fails on next trigger | **Live calls on 414-240-8930 may not be booking or logging** |

The realtime functions show few failures only because they are webhook-triggered and
few calls came in — they will fail the same way on the next real call. **Anything AVA
promises a caller on the phone that depends on n8n is currently at risk.**

### 2 · `retell-backups/` was publicly served (FIXED in this push)

`https://aivoiceagency.ai/retell-backups/llm-v33-PUBLISHED-2026-07-09.json` returned
**HTTP 200** with the **complete 5,695-character live AVA SALES system prompt** — the
whole sales playbook — plus `agent_id`, `llm_id`, and `knowledge_base_id`.
`README.md` additionally exposed the rollback runbook.

`.vercelignore` now excludes `retell-backups` and `automation`. This deploy closes it.
Files stay in the repo; they are simply no longer uploaded to Vercel.

---

## DONE TABLE

| # | Item | Status | Proof |
|---|---|---|---|
| 1 | `/live` page | ✅ LIVE | `live/index.html` · fold-verified 390×844 + 1280×800 + WebKit-390 |
| 2 | Nav link "Hear AVA Live" → `/live` | ✅ LIVE | `tools/stamp.py` NAV block · 55/55 pages re-stamped |
| 3 | Cache armor + sitemap | ✅ | `VERSION_ONLY` += `live/index.html` · sitemap 57 → 58 URLs |
| 4 | Tracking spine `/live` block | ✅ | `js/tracking.js` — `run_test_click_hero`, `live_test_submit`, `tel_tap_live_*`, `book_click_live_*` |
| 5 | Form → SMS loop | ⚠ **BUILT, CANNOT RUN** | Workflow `V6wAFgJ803xmLM0K` active; blocked by n8n quota |
| 6 | Quick-scrape + Grok extract | ⚠ BUILT, CANNOT RUN | 5s HTTP GET → `grok-4.20-0309-non-reasoning`, injection-sanitized |
| 7 | Demo agent (brand voice) | ✅ CREATED | `agent_67381fcfabf6731dad4f40c590` / `llm_b0300ecfb0c94997cd3a8156b59f` · published v0 |
| 8 | Cartesia bake-off twin | ✅ CREATED | `agent_c705538081e1693ce3c358fc68` · `cartesia-Evie` · **not on any public path** |
| 9 | Demo number pool | ✅ PURCHASED + WIRED | 5 numbers, inbound → AVA SALES (snowshoe fix) |
| 10 | Texts 1 / 2 / 3 | ⚠ WIRED, CANNOT SEND | GHL nodes on the 350 A2P lane (`+13502205305`) |
| 11 | Board flip + ISO log | ✅ | `hq/board.json` — L1/L2 live, **drip → blocked**, log entry added |
| 12 | Security: vercelignore | ✅ FIXED | `automation` + `retell-backups` excluded |

---

## THE DEMO POOL (internal — never on a public page)

| Label | Number | Outbound | Inbound |
|---|---|---|---|
| DEMO-POOL-01 | +1 414 250 8042 | HEAR-IT-LIVE v1 | AVA SALES |
| DEMO-POOL-02 | +1 414 300 6409 | HEAR-IT-LIVE v1 | AVA SALES |
| DEMO-POOL-03 | +1 414 946 6486 | HEAR-IT-LIVE v1 | AVA SALES |
| DEMO-POOL-04 | +1 414 206 1886 | HEAR-IT-LIVE v1 | AVA SALES |
| DEMO-POOL-05 | +1 414 246 8976 | HEAR-IT-LIVE v1 | AVA SALES |

Recorded in `automation/number-pool.json`. Every number answers inbound, so none reads
as a snowshoe-spam outbound-only line. The only public voice line remains **414-240-8930**.

---

## PAGE VERIFICATION (measured, not eyeballed)

| Check | 390×844 | 1280×800 |
|---|---|---|
| Horizontal overflow | none (`scrollWidth 390 = clientWidth`) | none (`1265 = 1265`) |
| Console errors | none | none |
| Hero in fold | kicker/H1/sub/CTA/trust all ≤ 460px | all ≤ 522px |
| Section rhythm | 48px | 96px |
| `border-radius` ≠ 0 | none | none |
| `box-shadow` | none | none |

**Contrast (all pass AA):** body 5.21:1 · muted sub 5.21:1 · kicker 5.21:1 · form help
4.92:1 · consent 4.92:1 · step copy 5.21:1 · footer legal 5.21:1 · label 16.33:1 —
matching the measured CIRCULANT-X values in CLAUDE.md § 2 exactly.

**Behavior tested in-browser:** no-website toggle (disables URL, reveals + requires
services, reverts cleanly) · empty submit (4 field-level errors, no network) · bad phone
rejected · success path (`(414) 555-0134` → `+14145550134`, `www.acmeplumbing.com/services?x=1`
→ normalized, scan target `acmeplumbing.com`, 3-row theater → READY card) · network
failure → retry card that always offers 414-240-8930 · **honeypot → silent success with
zero network call**.

Screenshots: `audits/run1-live-{mobile,desktop,webkit-390-dark,webkit-390-light}.png`.

---

## DELIBERATE DIVERGENCES FROM THE BRIEF (all flagged, none silent)

1. **The "v2 script verbatim from /docs" does not exist.** `/docs` held exactly one file
   (`16-agent-spec.md`); a full-repo search found no demo script. Rather than stall or
   fabricate Shane's words, `docs/demo-agent-prompt.md` was authored to the specified
   structure (ROLE / CONSTRAINTS / 5 STAGES / GUARDRAILS / FEW-SHOT) and carries a
   **provenance flag** at the top saying exactly this. Swap in the real script and re-run
   `tools/retell-demo-agent.mjs --update`.

2. **Voice ID translated.** `gJx1vCzNCD1EQHT212Ls` is the raw ElevenLabs id and is **not**
   a valid Retell `voice_id` (verified against all 298 voices). The same Ava brand voice as
   Retell exposes it is `custom_voice_705a2cb49b0413f7fc1c456d02` — already what AVA SALES
   ships.

3. **Interim TEXT 2 changed on two points.** The brief's *"Lock it in:"* uses a phrase
   CLAUDE.md bans outright; and *"Your reserved line is holding for 48 hours"* promises a
   line reservation that this run does not build. Both were replaced with the 48-hour demo
   retention that **is** implemented (`expires_at` on the intake row) — which is also the
   brief's own rule that interim texts "promise nothing that doesn't exist yet."
   TEXT 1 is untouched, exactly as approved.

4. **Turnstile ships as honeypot.** No `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` exists in
   Doppler. The page renders a honeypot (verified: trips silently, sends nothing) and the
   n8n verify node sits **disabled** on the canvas. Setting the two keys is a one-line +
   one-toggle change.

---

## KEYS / ACCESS — EXACT NEXT STEPS FOR SHANE

| What | Doppler name | Status | Action |
|---|---|---|---|
| n8n plan quota | — | ❌ **OVER LIMIT** | Upgrade at app.n8n.cloud → change-plan, or wait for reset. **Everything n8n is down until this is done.** |
| GHL inbound-SMS webhook | — | ❌ not wired | In the GHL UI, point inbound SMS at `https://circulant.app.n8n.cloud/webhook/live-ready` |
| Turnstile | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | ❌ absent | Create both; put the site key in `js/config.js`, the secret in the n8n verify node, enable that node |
| Retell | `RETELL_API_KEY` | ✅ working | — |
| n8n API | `N8N_API_KEY` | ✅ working | — |
| xAI Grok | `XAI_API_KEY` | ✅ working | — |
| GHL | `GHL_PIT` / `GHL_LOCATION_ID` | ✅ working | — |

New n8n credentials created this run: `AVA Retell Bearer` (`Taqv751Rkwb1tuPw`),
`AVA xAI Grok Bearer` (`LVCvpxgggQOp1N3T`). Data table `demos` = `YHPp9axpG6ncoqLB`.

---

## ROLLBACK

| Checkpoint | Rollback |
|---|---|
| Site (page + nav + sitemap + vercelignore) | `git revert <commit>` on `main` — Vercel redeploys |
| n8n workflow | Deactivate/delete `V6wAFgJ803xmLM0K` in the n8n UI |
| Demo agents | Delete `agent_67381fcfabf6731dad4f40c590` + `agent_c705538081e1693ce3c358fc68`. Nothing else references them. |
| Number pool | Release the 5 `DEMO-POOL-*` numbers in the Retell dashboard (recurring charge) |

Nothing in this run touched `index.html`, `/lsa`, `assets/funnel.*`, or any protected
anchor. POLISH FREEZE respected — the only change to existing pages is the stamp.py-owned
nav block.
