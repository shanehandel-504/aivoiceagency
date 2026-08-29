# WF-RATE RCv2.2 → RCv2.3 — direction fields

**Date:** 2026-08-29 (deployed 02:58 UTC / 2026-08-28 21:58 CDT)
**Workflow:** `2JlTkvQ1dGiwwjw9` — WF-RATE, AI Chauffeur Rate Engine
**Live version:** `aa76fa61-cadf-4fe9-a80e-923327bb8056`
**Rollback artifact:** `4d0ba009-0eaf-4e8e-b035-ff451c407e2d`
**PR:** [shanehandel-504/aivoiceagency#51](https://github.com/shanehandel-504/aivoiceagency/pull/51) (draft)

---

## The problem

Airport zone rows are **direction-agnostic**. One `(Kewaskum, MKE)` row prices both the MKE
arrival and the MKE departure. But the spoken phrase was built from the pricing key, so it always
read origin-to-airport.

That meant an **arrival was described backwards**. A caller standing at baggage claim at Mitchell,
waiting for a car to Kewaskum, heard:

> "Executive Sedan, **Kewaskum to Milwaukee Mitchell International**. All in, that's $197."

The price was right. The sentence was inside out.

## The change

Retell's `rate_lookup` now sends two optional fields — `trip_origin` and `trip_destination` —
carrying the true direction of travel. When both arrive non-empty on a non-hourly trip, the spoken
route phrase and `normalized_origin` / `normalized_destination` follow that direction.

`origin` stays the zone-lookup pricing key, untouched.

**Wording only.** Pricing, zone lookup, the ladder, rounding, breakdown and the response contract
shape are unchanged.

### Three decisions worth keeping

**1. The new fields are deliberately absent from the input-hash canonical.**
They are wording-only, so they must not move idempotency, supersede or `quote_id` behavior. Proved
rather than asserted: one `call_id`, three direction variants (arrival / none / departure), one
identical hash `ec1798049d86b609…`.

**2. Bare city names are deliberately NOT resolved to their airports.**
The obvious implementation indexes `Denver International` under `Denver` so short forms match. That
is a trap: a downtown-Denver pickup would then be spoken as the airport. Same for Miami, Tampa,
Orlando, San Antonio. The resolver matches IATA codes and canonical names only; anything else is
spoken exactly as the caller said it — never wrong, occasionally less canonical. 20 unit cases
cover it, including a collision guard per city above.

**3. Hourly is excluded.**
Its phrase is a duration — "3 hours of dedicated service" — not a route. Letting direction fields
overwrite it would drop the hours the caller is actually buying.

## Verification

Run against the **real data tables** on the live workflow. Executions are inspectable in n8n.

| # | Case | Execution | Result |
|---|---|---|---|
| 1 | **Arrival** — MKE → Kewaskum, sedan, 2 pax, meet-and-greet | `8519` | `QUOTED` · `all_in_total` **197** · "Executive Sedan, **Milwaukee Mitchell International to Kewaskum**. All in, that's $197, service fee included." · no cents · breakdown 135 + 27 + 35 reconciles to 197 |
| 2 | **Regression** — identical payload, new fields omitted | `8520` | Byte-identical to the RCv2.2 body on `message`, `spoken_trip`, `breakdown`, `all_in_total` and the response key set |
| 3 | **Departure** — Kewaskum → MKE | `8521` | "Executive Sedan, **Kewaskum to Milwaukee Mitchell International**. All in, that's $197, service fee included." |

Case 2 was additionally proved by running the **RCv2.2 and RCv2.3 node bodies side by side**
against identical inputs and diffing the outputs directly: `message` byte-identical, `breakdown`
identical, zero response keys added or removed. Only `rate_card_version`, `calculation_version`
and `reason` carry the intended version bump.

Also verified before publish:

- Both patched node bodies syntax-checked inside the n8n wrapper form.
- 20/20 resolver unit cases pass, including the city/airport collision guards.
- **Transcription guard:** after `update_workflow`, the stored `jsCode` for both nodes was
  re-fetched and byte-diffed against the locally tested files. Both identical — zero drift between
  what was tested and what shipped.

## What was NOT done

**The three live curl assertions were not run.** This container has no Doppler CLI, no
`DOPPLER_TOKEN` and no `RATE_SHARED_SECRET`; and independently, the egress policy denies `CONNECT`
to `circulant.app.n8n.cloud:443` (proxy returns 403). The endpoint is unreachable from here with
or without the secret — two independent blockers.

Verification went through `test_workflow` instead, which executes the Code and Data Table nodes
server-side inside n8n against the real rows. That covers the pricing and wording path end to end.
It does **not** cover the HTTP + auth edge — `Verify + Normalize` was pinned with output generated
by running the real patched node-01 code locally against the real payloads.

**To close this out:** re-run the three curls from an environment with Doppler access.

## Repo mirror re-synced

`automation/rate-engine/` calls itself the source of record, but the three `wf-rate.*.js` bodies
had drifted to **RCv1.0 while production ran RCv2.2** — two minor versions of pricing logic that
existed only inside n8n. All three are re-synced to live and now match byte-for-byte. The README
documents the new fields and warns that the sync is manual.

## Rollback

Restore workflow version `4d0ba009-0eaf-4e8e-b035-ff451c407e2d` on `2JlTkvQ1dGiwwjw9`, then
publish. Reverts both node bodies and the card version to RCv2.2.
