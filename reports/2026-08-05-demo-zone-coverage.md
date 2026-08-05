# DEMO ZONE COVERAGE — Shane's test area · 2026-08-05

Mirror of the SHANE READBACK block for this micro-run.

---

## Plain English

WF-RATE — the chauffeur rate engine — could already price a West Bend run to Milwaukee, but it had
no rate at all for Kewaskum, and nothing at all going to O'Hare from either town. Ask it for one of
those and it correctly said "I don't have a set rate for that route" instead of guessing. Three
rows were added to the rate card so those runs now price themselves, and the engine was then called
for real, over the signed live endpoint, to prove a dollar amount comes back.

Before writing anything, the existing West Bend rate was read **off the live endpoint**, not
assumed from a document — that is how the exact stored spelling (`WestBend`, no space) and the
125/165 ladder were confirmed, and how it was proven the three new routes did not already exist.

## DONE

| # | What | Where | Proof |
|---|---|---|---|
| 1 | Read the existing ladder before writing | live signed `POST /webhook/tools/rate-lookup` | probe returned `zone_origin` `WestBend`, `sedan_base` 125, `suv_base` 165, `review_status` `DEMO_SEED` |
| 2 | Confirmed no duplicates | same endpoint | `Kewaskum/MKE`, `Kewaskum/ORD`, `WestBend/ORD` all returned `NO_ROUTE_FOUND` beforehand |
| 3 | 3 rows appended | n8n data table `airport_zones` `ffdnELJPWfa3yLsj`, project `1XuT7aKjecjLpe2J` | `insertedCount: 3`; table 32 → 35 |
| 4 | Primary verification | signed HMAC `rate_lookup` | HTTP 200 · `QUOTED` · **`all_in_total` $162** |
| 5 | Coverage sweep, both bases × 3 rows | same | 6/6 PASS — $162 / $216 / $318 / $402 / $306 / $384 |
| 6 | Regression | `python automation/rate-engine/battery.py` | **47/47 PASS** after the write |
| 7 | Source of record updated | `automation/rate-engine/README.md` | row count 32 → 35 + the new-rows table |
| 8 | Ledger | `hq/board.json` | log entry prepended, `updated` bumped |

### The three rows

| origin | airport | sedan_base | suv_base | tenant_id | rate_card_version | review_status | effective_from |
|---|---|---|---|---|---|---|---|
| `Kewaskum` | `MKE` | 135 | 180 | `demo` | `RCv1.0` | `DEMO_SEED` | 2026-08-03 |
| `Kewaskum` | `ORD` | 265 | 335 | `demo` | `RCv1.0` | `DEMO_SEED` | 2026-08-03 |
| `WestBend` | `ORD` | 255 | 320 | `demo` | `RCv1.0` | `DEMO_SEED` | 2026-08-03 |

`effective_from` is 2026-08-03 — the RCv1.0 card's own effective date, not today — so the card stays
one coherent version. The engine never reads the field; this is bookkeeping, not behavior.

### Primary verification — MKE arrival, drop-off Kewaskum

Signed HMAC-SHA256 over the exact body, `sedan_exec`, pickup Wed 2026-08-05 14:00 America/Chicago.

```json
{
  "status": "QUOTED",
  "all_in_total": 162,
  "currency": "USD",
  "gratuity_included": true,
  "breakdown": [
    { "label": "Executive Sedan - airport transfer", "amount": 135,
      "detail": "Kewaskum to MKE, sedan base $135",
      "zone_origin": "Kewaskum", "zone_airport": "MKE",
      "basis": "sedan", "basis_base": 135, "multiplier": 1,
      "zone_review_status": "DEMO_SEED", "day_type": "weekday" },
    { "label": "chauffeur gratuity & service", "amount": 27,
      "detail": "20% of $135, included in the total" }
  ],
  "rate_source": "airport",
  "rate_card_version": "RCv1.0",
  "message": "Executive Sedan, Kewaskum to MKE, sedan base $135. Gratuity and service are included. All in, that is $162.",
  "quote_id": "q_fba1f8df-92cf-4b1e-a808-ff236ff2a5f7"
}
```

Line items sum to $162 exactly. `call_id` `dz_mke_arrival_kewaskum`.

## Rollback

| Checkpoint | Undo |
|---|---|
| The 3 data-table rows | n8n → project `1XuT7aKjecjLpe2J` → `airport_zones` → delete the three rows where `origin` is `Kewaskum` (both) and `origin` `WestBend` + `airport` `ORD`. The engine reverts to `NO_ROUTE_FOUND` on those routes — no code change needed, the rows are the only source. |
| README + board.json | `git revert <commit>` |

Nothing was deployed to Vercel — `automation/` is in `.vercelignore`. No site surface changed.

## What's next

- These rows are `DEMO_SEED`, not `SEED_APPROVED`. Only 5 of the now-35 zones are approved rates.
  Shane's sign-off is what promotes them.
- The agent still cannot speak any of this. `schema/aic-reservation-v1.json` pins `pricing.mode` to
  the constant `CAPTURE_ONLY` and no Retell agent carries a pricing tool. Wiring one is a schema +
  prompt decision, not a wiring task.

## Gotchas

- **`ESTIMATE_RETURNED` does not exist.** The literal returns zero hits across the repo, the engine
  code, and the RCv1.0 contract. A priced route returns **`QUOTED`** — that is the engine's success
  status and what the verification call returned. Nothing was renamed to make the run pass.
- **The stored origin is `WestBend`, no space.** Lookup is slug-matched (case- and
  punctuation-insensitive) so `West Bend` still resolves, but a row written with a space would have
  read as inconsistent in the table. It was read off the live endpoint before writing.
- **Zone rows are direction-agnostic.** One `(origin, airport)` row prices both the MKE arrival
  dropping in Kewaskum and the Kewaskum pickup departing MKE. There is no separate inbound row, and
  adding one would create a silent duplicate.
- **`airport_zones` has no read-rows API on the n8n MCP surface** — only insert/column tools. The
  live signed endpoint is the read path: a `QUOTED` breakdown carries `zone_origin`, `zone_airport`,
  `basis_base` and `zone_review_status` straight off the matched row.
- **Verification calls write real `quote_audit` rows.** Every `QUOTED` response sets
  `write_audit: true`. The probe and verify calls used traceable `zp_*` / `dz_*` call ids so those
  rows are identifiable and are not mistakable for customer traffic.
