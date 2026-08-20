# AIC RESERVATION SURFACES — /reserve + /rates

**Date:** 2026-08-20 · **Commit:** `9f00bb8` · **Host:** aichauffeur.ai (separate Vercel project, root `/chauffeur/`)
**Skills loaded:** `chauffeur-design` · `frontend-design` · `taste` (CLAUDE.md § SKILL ROUTER, chauffeur row)

---

## What shipped

| Page | Live URL | Status |
|---|---|---|
| Secure Reservation Hold | https://aichauffeur.ai/reserve/ | **200 · LIVE** |
| Rate card RCv1.0 | https://aichauffeur.ai/rates/ | **200 · LIVE** |

Both are in `chauffeur/sitemap.xml` (18 `<loc>` entries, **all 18 verified 200** after the deploy),
allowed by `robots.txt`, canonical to the apex, and `www` → apex returns **308**.

---

## /reserve/ — the hold request

Four fields (full name, mobile, email, trip summary) and a required TCPA tick, posting to the
**existing** AVA Client Intake spine.

**The endpoint was resolved against the live workflow before a line was written**, not read out of a
config snapshot:

| | |
|---|---|
| Workflow | `9FoLm4slBmM5nIus` — "AVA Client Intake" |
| Webhook | `POST https://circulant.app.n8n.cloud/webhook/ava-intake` |
| Active | `true` |
| Draft drift | **none** — `versionId === activeVersionId` = `33184ac3-06c4-467e-abff-6006f90ed50c` |
| Error workflow | `SlnAeMrVRORsF0w7` (OPS — Error Sentry) attached |
| Tag | `source: aichauffeur_reserve` |

### The card block collects nothing, and it is built so that it cannot

Four independent signals, because any one alone can be missed:

1. `--neutral`, not `--amber`. `chauffeur-design` gives amber to *ringing · pending · the cost of
   the miss*. Nothing here is pending — the block is **inactive**, and `--neutral` is the token
   whose meaning is literally *inactive · not-yet · n/a*. Amber would say a payment is in flight.
2. `fieldset[disabled]` and `disabled` on every control: no keystroke, no paste, no focus, no tab stop.
3. The label is printed twice — once as the `<legend>` a screen reader reaches first, once as the
   strip an eye scans.
4. The values are the literal words `DEMO — NO CHARGE` and `DEMO`, never a masked number.

**Proved, not asserted.** In the rendered production page, `new FormData(form)` returns exactly:

```
["full_name", "mobile", "email", "trip_summary"]
```

Zero card keys. The browser cannot transmit a digit that was never collectable.

### The attribute that would have broken it silently

The form is tagged `data-hold-form`, **not** `data-cb-form`. `assets/aic.js` owns `[data-cb-form]`
and posts a two-field payload to the `/ava-call` callback rail. Using the shared attribute here
would have handed a four-field reservation to the wrong endpoint with half its fields dropped, on
every submit, with no error anywhere.

---

## /rates/ — rate card RCv1.0

15 vehicle classes in 5 semantic `<tbody>` groups, mono tabular figures.
**Read back off the rendered production DOM** — this is what the page actually serves:

| Vehicle | Weekday | Weekend | Hourly minimum |
|---|---|---|---|
| **Sedans and SUVs** | | | |
| Executive Sedan | $75 | $85 | 2 hours |
| Luxury Sedan | $115 | $135 | 2 hours |
| Executive SUV | $95 | $115 | 2 hours |
| Premium SUV | $125 | $150 | 2 hours |
| **Vans and Sprinters** | | | |
| Executive Van | $110 | $130 | 3 hours |
| Executive Sprinter | $135 | $155 | 3 hours |
| Luxury Sprinter | $150 | $175 | 3 to 4 hours |
| **Limousines** | | | |
| Stretch Limo | $135 | $165 | Set on the call |
| Super Stretch | $165 | $195 | Set on the call |
| Hummer Limo | $185 | $225 | Set on the call |
| **Party buses** | | | |
| Party Bus 20 | $175 | $215 | Set on the call |
| Party Bus 30 | $225 | $275 | Set on the call |
| Party Bus 40 | $275 | $325 | Set on the call |
| **Coaches** | | | |
| Mini Coach | $165 | $195 | Set on the call |
| Motorcoach | $195 | $225 | Set on the call |

Note and footer line ship verbatim as briefed. Copy signed **AVA Team**; Shane's name appears
nowhere on either page (`grep -ci shane` = 0 on both).

---

## FOUR THINGS THE GATE FOUND THAT READING THE CODE WOULD NOT HAVE

### 1. The disclosure was the least legible text on the page

`opacity:.62` on the demo card composited `--neutral` from **6.38:1 down to 3.07:1** — eight WCAG
failures, and every one of them landed on the words whose only job is to tell a reader that nothing
is being collected. The *token* passes. The *rendered pixels* did not.

Opacity removed. `--neutral` already means inactive; the dashed border and the disabled controls
already said so. The dimming was a fourth signal that cost the first three their legibility.

Re-measured after the fix: **0 failures across 68 text nodes on /reserve/ and 107–112 on /rates/.**

### 2. The mobile table threshold was guessed wrong by four pixels

The shared `.tbl` carries `min-width:620px` and scrolls. On a page where the table *is* the content,
that is wrong. Measured breakdown at 390 (wrap = 340):

```
vehicle column   110.0   "Motorcoach", the one name that will not wrap
weekday           78.2   set by the HEADER word, not by "$115"
weekend           78.2
hourly minimum    78.2
                 -----
                 344.6   into 340
```

Three of four columns were sized by their own header, so padding bought the fit: 8px → 6.4px returns
12.8px and lands the table at **340/340 at 390, no scroll**.

Below that it still scrolls, and that is honest — shaving further means `Wknd` over a price column.
But the first cut scoped `.tbl-hint` to `<376`, and the real threshold is **380**: min-content is
332 and the wrap is always viewport minus 48px of `.wrap` padding, so 332 + 48 = 380. Three viewport
widths would have dragged sideways while the page said nothing. Verified at both sides of the
boundary: **379 → scrolls, hint shown. 390 → fits, hint hidden.**

The shared rule alone would have printed "scroll for more" at 390 where nothing scrolls.

### 3. `stamp.py` re-injected the `/backstage` BreadcrumbList that RUN A deleted

Running `tools/stamp.py` at all re-armed a `BreadcrumbList` for a trail `/backstage` never renders —
**the exact defect the RUN A "INVISIBLE TRUTH LAYER" pass removed** — across 60 AVA parent pages.

Those 60 were reverted and are **not** in this commit. Only the 16 chauffeur pages plus the 2 new
ones ship, which is also what keeps the chauffeur host on **one** asset version (`?v=d08196a`)
rather than two cache entries for one file.

Both new pages are registered in `stamp.py` `VERSION_ONLY` **at creation** rather than after the
fact — that is the lesson of the four pages listed directly above them in that list, which shipped
with hand-written `?v=` tokens and had no way to expire.

**This is a live landmine for the next run that touches either host.**

### 4. The `/rates/` footer claim is not true yet, and it shipped as written

> "This is the live rate card the AI quotes from — call 414-775-0019 and try it."

The AI does not quote from it. Resolved against **what actually answers the phone**, not the draft
(`get-agent` returns the draft; numbers serve `latest_published`):

| | |
|---|---|
| Agent | `agent_8e9e7d477949c6babcbdcc756d` "AI CHAUFFEUR" |
| Draft | v20 |
| **latest_published** | **v19** |
| Tools on v19 | `end_call`, `write_reservation` — **that is all** |
| `rate_lookup` | **absent** |
| Mentions of `RCv1.0`, "rate card", "quote", or any figure from the card | **none** |

Shipped verbatim under CLAUDE.md § 0 PRECEDENCE 1 (Shane's direct instruction beats the file) and
flagged here rather than silently rewritten. Wiring `rate_lookup` is the next move.

---

## What was proved on the wire, and what was not

**Proved:**

- CORS preflight → **204**, `Access-Control-Allow-Origin: https://aichauffeur.ai`,
  `access-control-allow-methods: OPTIONS, POST`.
- The page's **exact payload** with `tcpa_consent` flipped to `false` → **clean 400**
  `{"ok":false,"error":"Missing required fields or TCPA consent."}`. A 400 from the IF node rather
  than a 500 is what proves `Build Payload` consumed the real object shape without throwing. Writes
  nothing.

**Not fired:** the happy path. A successful submit mints a real GHL contact and an owner SMS, and
neither was asked for. To fire it yourself:

```bash
curl -s -X POST https://circulant.app.n8n.cloud/webhook/ava-intake -H 'Content-Type: application/json' -d '{"business_name":"RESERVATION HOLD - Test Rider","owner_name":"Test Rider","vertical":"Chauffeur / black car","tier":"Reservation hold","ava_number":"+14145550182","billing_email":"test@example.com","services":"Sat 7:30pm Pfister to General Mitchell, 4 pax, Executive SUV","tcpa_consent":true,"source":"aichauffeur_reserve"}'
```

---

## Gate results — rendered, at 390x844 and 1280x860, local and again on production

| Check | /reserve/ | /rates/ |
|---|---|---|
| Horizontal overflow at 390 | none | none |
| Console errors | none | none |
| Contrast failures (WCAG AA, measured on rendered pixels incl. inherited opacity) | **0 / 68 nodes** | **0 / 107 at 390, 0 / 112 at 1280** |
| Text under the 12px floor | 0 | 0 |
| Sub-44px targets | 2, both genuinely inline-in-sentence (consent checkbox inside its label, privacy link) | 0 |
| Nav rows at desktop / height | 1 / 73px | 1 / 73px |
| Section rhythm | 96 desktop / 56 mobile (chauffeur value, not the AVA homepage's 64) | same |
| `<h1>` count | 1 | 1 |
| `414-775-0019` | 11 | 11 |
| `414-240-8930` (parent leak) | **0** | **0** |
| Fonts | Space Grotesk + JetBrains Mono `loaded`, fallbacks `unloaded`, self-hosted, no CDN request | same |
| Every network request | 200 | 200 |

---

## Rollback

One command each:

```bash
git revert 9f00bb8
```

Or drop just the two pages and leave the version bump:

```bash
git rm -r chauffeur/reserve chauffeur/rates && git commit -m "revert reservation surfaces"
```

---

## Open

- `rate_lookup` is not wired into published agent v19. Until it is, the `/rates/` footer line is
  aspirational. See finding 4.
- `/reserve/` and `/rates/` are linked from each other, from both new pages' footer and drawer, and
  from the mobile rail. They are **not** in the shared top nav on the other 16 chauffeur pages —
  adding them means editing 16 files and was outside this mission's scope.
- `tools/stamp.py` will re-inject the `/backstage` BreadcrumbList on the next run against the AVA
  parent. See finding 3.
