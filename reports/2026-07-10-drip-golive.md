# DRIP ENGINE — GO-LIVE Report (2026-07-09)

**STATUS: LIVE.** Both workflows are `active=true`, TEST_MODE=false. End-to-end proven with real message/execution ids. One 🟡: the legacy GHL drip must be paused by hand (GHL API can't do it).

## DONE

| # | Step | Result |
|---|---|---|
| 1 | Recon | Both were inactive; owner/480 contact `YrynHxqMzKp71C8zojNp` still carries `do-not-drip`+`internal-identity` (no restore needed). |
| 2 | Backlog fence | `demo-no-book` count = **0** (search validated: `ava demo call`→1, unfiltered→60). Added `drip-skip-backlog` (+`internal-identity`,`do-not-drip`) as guard-exit in the enroll guard **and** the poller filter. Dry-poll proof: 0 backlog contacts → 0 would enroll. |
| 3 | CAN-SPAM | `[BUSINESS_ADDRESS]` → **1787 Edgewood Road, Kewaskum, WI 53040** in every email footer (both workflows). STOP lines + "AVA is an AI assistant" footer verified intact on all sends. |
| 4 | TEST_MODE proof | Enrolled test contact → **D0 SMS `eEKAspsgJ6HT5Et97Ha4`** + **D0 email `NlJG4vMAgnAFtxnjIm81`** delivered (60s waits confirmed = TEST_MODE). Created appt `eNqI4RhsT4Oa90q8dJAG` → Booking Receipt: `booked` tag ON, `demo-no-book` OFF, **receipt SMS `PxJ3ZIOMZnu0QrkAFoOy`** + **receipt email `wFfPSinOETPgm9IazdSG`** (NO booking link), owner alert fired. Drip then exited on `booked` (`drip-complete` added). Drip exec `261`, receipt exec `262`. |
| 5 | Owner conversion | Contact `8zyowOdgNehLoYLpmVBm` (305) renamed → **"Shane Handel — Owner"**, all drip/demo tags stripped, tags now `internal-identity`+`do-not-drip`+`owner-alerts`. Not deleted. Phone (305) untouched. |
| 6 | Owner alerts ×2 | (a) **BOOKED** owner SMS `y0QLqByWTKrSpAfjRvDw` — "✅ BOOKED: TestBob SafeToDelete · Wednesday, Jul 15 at 2:00 PM CDT" (node enabled). (b) **NEW LEAD** owner SMS `esOcmpAk6sXle89yYdUl` — fires on every enrollment; guarded off for internal-identity contacts. Both proven. |
| 7 | Go live | TEST_MODE=false; per-send guard hardened (`internal-identity`/`do-not-drip`); **both published + `active=true`** (Drip Engine `421f186c`, Booking Receipt `247ff16f`). |
| 8 | Cleanup | Test appointment `eNqI4RhsT4Oa90q8dJAG` deleted. Owner contact retained. 480 protection re-verified. |
| 9 | One-engine law | 🟡 GHL API can't toggle workflow status (PUT/POST → 404). **Manual pause required** — see below. |

## Live workflow ids
- AVA Drip Engine v1 — `Pu661B1J1ZgezJT7` — active version `421f186c` — https://circulant.app.n8n.cloud/workflow/Pu661B1J1ZgezJT7
- AVA Booking Receipt — `NMSWFtcyEQhSypSx` — active version `247ff16f` — https://circulant.app.n8n.cloud/workflow/NMSWFtcyEQhSypSx
- Owner contact — `8zyowOdgNehLoYLpmVBm` (305) — "Shane Handel — Owner"

## 🟡 MANUAL: pause the legacy GHL drip
GHL Automation → **Workflows** → open **`03_AVA_7_Day_Follow_Up_Drip`** (`8590663f-ad9b-4bb4-9786-162651ccc5b1`) → top-right toggle from **Publish → Draft** → confirm. This stops it enrolling/sending. n8n is now the single drip engine.

## FLAGS / gotchas
- **Enrollment source not yet wired.** The engine is live but currently receives **no leads** — nothing tags `demo-no-book` or POSTs `/ava-drip-enroll` yet. Wire the demo/no-book tagging (or chain the ava-call form) so leads actually enter. Until then the drip is live-but-idle.
- **`02_AVA_New_Lead_Internal_Notification`** (GHL, published) may now double with the new n8n NEW LEAD alert — review/pause if you want a single new-lead alert.
- **Owner email deviation.** The owner contact's email is `shanehandel+avatest@gmail.com`, not `shane@aivoiceagency.ai` — that address is uniquely held by a separate 414 contact (`P9Zr…`) and GHL enforces email-uniqueness. Owner alerts are SMS to the 305, so this doesn't affect alerting. Reassign the email later if desired.
- **Collateral I repaired:** my first test upsert (email `shane@aivoiceagency.ai`) accidentally matched + overwrote the existing 414 contact `P9Zr…`. Repaired: firstName→"Shane", removed the test tag. Its original first name was unknown before my edit — correct it if "Shane" is wrong.
- **One extra D1 email** (`4Lcd1HdMdAtNrTq8ngIi`) sent during the test — the receipt tagged `booked` ~15s after the D1 guard. Harmless on the test inbox; in production the exit window is minutes wide.
- **GHL `/contacts/upsert` REPLACES the tag set** — always tag via the add/remove-tag endpoints, never upsert.

## Rollback (one line)
Deactivate both in n8n (unpublish), or via API set each workflow inactive — Drip Engine `Pu661B1J1ZgezJT7` + Booking Receipt `NMSWFtcyEQhSypSx`. No sends fire while inactive.
