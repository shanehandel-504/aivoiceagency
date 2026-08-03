# RUN 2 — COMMIT SPINE + ANI + WORKER RETIREMENT

**2026-08-03 · commit `021419c` (+ § 9 follow-up) · one session**

---

## What shipped

Two new signed voice endpoints, both live and battery-green, plus a call-first rebuild of
`/chauffeur/demo` and a corrected record of the Cloudflare build failure.

| # | Thing | ID | State |
|---|---|---|---|
| 1 | WF-ANI · `POST /webhook/tools/ani-lookup` | `XLSd3vt41vhsXIA9` | live · **27/27** |
| 2 | WF-COMMIT · `POST /webhook/tools/commit-reservation` | `O1fX0FpbT0qqMnqJ` | live · **40/40** |
| 3 | GHL Reservation custom object | `6a70df48cf83fcd4097d738a` | created · 27 properties |
| 4 | contact ↔ reservation association | `6a70e026747242cebef44955` | created |
| 5 | commit ledger Data Table `reservation_commits` | `DCNqBPRtXLaLFSEh` | created |
| 6 | `/chauffeur/demo` call-first page | — | **live** at https://aichauffeur.ai/demo/ |
| 7 | KNOWN_ISSUES.md CF attribution | — | corrected against the check-runs API |
| 8 | `docs/AIC-VOICE-STATE.md` | — | V13-live/V14-unpublished + port plan |

---

## PHASE 1 — WF-ANI

One GHL round trip. `/contacts/search/duplicate` carries identity, `companyName`, tags **and
`customFields`**, so `last_trip` and `rate_plan` need no second fetch — which is what makes the
budget possible at all.

**Measured latency inside n8n**, 20 consecutive lookups with the timeout lifted:

| p50 | p75 | p90 | tail |
|---|---|---|---|
| 243 ms | 287 ms | 366 ms | 741 ms · 2247 ms |

CRM node timeout set to **360 ms** — the most the ratified hard 400 ms endpoint budget allows once
code time is counted. The slowest ~10% therefore return a **fast-miss** rather than a late answer.

> **Decision for Shane:** raising the budget to ~800 ms recovers that last ~10% of caller
> recognitions. 400 ms is honored as ratified; the table above is what it costs.

Wall-clock from a laptop is **not** the budget — the transport baseline to n8n cloud measured
341–648 ms on its own. The endpoint's own `lookup_ms` is the number that matters.

## PHASE 2 — WF-COMMIT

Upsert → **Reservation record** (a real custom-object record, not a snapshot flattened onto the
contact) → association → trip note → **read-after-write hash compare** → `crm_write_status` →
ledger row → response → owner ticket SMS + email.

- Trip id `AC-YYMMDD-XXXX`, suffix from the payload hash, so a retry cannot mint a second trip.
- Duplicate `retell_call_id` **replays the original verbatim** — proven across three attempts with
  the record id unchanged.
- demo tenant may say `CONFIRMED` only on `CRM_VERIFIED`; every other tenant hard-capped at
  `REQUEST_RECEIVED`. `WRITE_FAILED` → `FAILED`.
- `provider_reservation_id` null (Phase 2). Absent fields print `— NOT PROVIDED`, never invented.

## PHASE 3 — worker retirement + demo

`/chauffeur/demo` rebuilt call-first (414-775-0019 + book link). Rendered and verified at
**390×844 and 1280×800**: zero horizontal overflow, one H1, both CTAs above the fold, every touch
target ≥44px, AA contrast throughout, no console output.

The page it replaced was a **working scripted scenario demo with real recorded audio — not a dead
LiveKit surface**. Preserved verbatim at `infra/backups/chauffeur-demo-20260803.html`; the audio
assets are untouched.

## PHASE 4 — docs + canon

CF attribution corrected by querying the GitHub check-runs API across every commit May 16 → Aug 3,
rather than trusting the existing note. Retell line confirmed **V13 live / V14 unpublished**.
Missed-call port plan documented with its trigger gap.

---

## Defects found and cured during the build

Four, all real, all caught by testing rather than by reading the code back:

1. **`nodeCredentialType` is silently ignored** — `n8n-nodes-base.httpRequest` wants
   **`genericAuthType`**. The credential showed as bound in the workflow JSON while GHL answered
   `401 No Authorization header found`.
2. **A node timeout THROWS past `neverError`** — `neverError` suppresses HTTP error *statuses*, not
   socket timeouts. The run died at the CRM node and the webhook returned **HTTP 200 with an empty
   body on 15–25% of calls**. The agent got nothing at all.
3. **A failed lookup was reported as a verified miss** — the first ANI build returned
   `data_verified: true` on a `401`. A failed CRM call would have been spoken to a caller as a
   verified "not a customer".
4. **§ 9 computed but not enforced** — WF-COMMIT calculated `is_our_number` and never used it, so a
   call from one of our own lines would still have upserted a real lead. Caught by running the § 9
   assertion the law requires at the end of every GHL-touching run. Now gated by `Our Number?` →
   `Resolve Contact`, and every downstream node reads the contact id from that one node so the
   guard cannot be edited out by accident.

Also closed: `rate_secret.txt` was untracked **but not gitignored** — one `git add` from landing
the shared secret in history. Now covered.

---

## § 9 OWNER RAIL assertions — live, this run

| Assertion | Result |
|---|---|
| OPS — Error Sentry `SlnAeMrVRORsF0w7` ACTIVE | **true** |
| errorWorkflow attached to WF-ANI and WF-COMMIT | both `SlnAeMrVRORsF0w7` |
| draft == published on both | **true** on both |
| owner-alert contact `pWm6s2wCWu8rMlDxmhcW` | tagged `owner-alerts`/`zz-internal`/`do-not-drip` |
| owner contact distinct from zz-test sink | **true** |
| `OWNER_ALERT_CONTACT_ID` used only as a send-to | **true** — never an upsert target |
| our own number → zz-test, no lead created | **verified** (test 7.1–7.4) |

---

## Traps worth carrying forward

- **GHL record search returns 0 rows immediately after a successful 201.** The index lags. Search
  cannot back idempotency — that is why the commit ledger is an n8n Data Table.
- **`duplicate` DOES return `customFields`.** An early probe suggested otherwise; the contact under
  test simply had none set. Probe with a contact you control and know the answer for.
- **A zero-row Data Table lookup halts the branch.** `alwaysOutputData: true` on `Load Prior Commit`
  is load-bearing — without it every *first-time* commit would die.
- **An n8n API write only touches the draft.** Activate, then assert
  `versionId === activeVersionId`, or production keeps serving old code while verification passes.
- **GHL blocks the default Python UA** (Cloudflare 1010). An honest identifying client UA works;
  impersonating a browser is the wrong fix.

---

## RUN INCOMPLETE — one item

**WHAT:** the GitHub → Cloudflare Workers Builds disconnect for `aichauffeur-token`.
**WHY:** the Cloudflare MCP connection exposes read-only Worker tools and Doppler holds no
Cloudflare API token, so there is no programmatic route.
**NEXT:** four clicks, recorded in `KNOWN_ISSUES.md` —
dashboard → `aichauffeur-token` → Settings → Build → Git repository → **Disconnect**.
Optionally Manage Worker → **Delete**, since the service is dead either way.

The page conversion shipped regardless, as instructed. Nothing depends on the Worker.
