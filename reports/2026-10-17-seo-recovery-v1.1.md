# SEO-RECOVERY v1.1 — 2026-10-17

Run after v1. Five parts: 16 canon answer pages, one story on rate quoting, the AVA live call first, IndexNow, and the board.
Phone agents, Retell, GHL and the call workflows were read-only and were not touched.

## PART 0 · GATE (no writes)

| Check | Answer |
|---|---|
| (a) `scripts/brick.mjs` exists and `--all --dry` runs clean | yes · exit 0, 0 bricks in the inbox |
| (b) https://aichauffeur.ai/pricing/ | yes · 200 |
| (c) https://aivoiceagency.ai/pricing | yes · 200 |
| (d) n8n "SEO — IndexNow daily" published, `/indexnow-deploy` webhook exists | yes · `gdFqOxFFVe13CfvX` active, version `2738ef57`, POST `/webhook/indexnow-deploy` |
| (e) `curl -s https://aichauffeur.ai/ \| grep -ic "one call or a thousand"` | 0 |

## DONE

| Part | Files changed | Verified by | Live |
|---|---|---|---|
| 1 · 16 answer pages | `chauffeur/answers/` (10 pages + index), `answers/` (6 pages + index), `sitemap.xml`, `chauffeur/sitemap.xml`, `llms.txt`, `chauffeur/llms.txt`, `bricks/built/{aic,ava}/*.txt` (16) | curl of all 16 URLs → 16× `200`, H1 present, META present · both `/answers/` → `200` with 10 and 6 entries · sitemaps list 11 and 7 `/answers/` URLs · `## Answers` lines: 10 and 6 · `node scripts/llms-verify.mjs --live` → GREEN on both hosts (131/131, 120/120) · `tools/validate_jsonld.py` on the 18 served pages → 18/18 `0 errors` | yes |
| 2 · rate quoting | none | scan of every HTML file + llms.txt (whitespace-collapsed, all listed phrases): aichauffeur.ai 0 hits · aivoiceagency.ai 0 replaceable, 3 NEEDS WORDS · `grep -ric -e "higher tier" -e "capture only" -e "not on the base" chauffeur/ --include=*.html` → 0 · the same strings in both served llms.txt → 0 / 0 | yes, nothing to ship |
| 3 · AVA call first | `index.html` (2 lines: classes + DOM order), `reports/2026-10-17-ava-cta-flip/` | `cta.mjs` Playwright gate against https://aivoiceagency.ai/ after deploy: call button first, `cx-btn cx-btn--go`, bottom 409 of 844 at 390×844, contrast 11.16:1 (dark) / 4.88:1 (light), focus ring `2px solid #00D4FF` on both, `tel:+14142408930` click not default-prevented, sample click → `aria-pressed=true` + `/audio/samples/v3/limousine.m4a` requested, 0 console errors, 0 overflow | yes |
| 4 · IndexNow | none (n8n deploy hook) | n8n exec `14963` (01:24:59Z, after both PART 3 deploys): aivoiceagency.ai `200` (68 URLs) · aichauffeur.ai `200` (31 URLs). Exec `14962`: 200 / 200. Exec `14960`/`14961` covered the PART 1 deploys. | yes |
| 5 · board + report | `hq/board.json`, this file, `reports/2026-10-17-ava-cta-flip/after-*` | board items 84 → 87, log 153 → 154 | yes on push |

### Word count per brick (press dry run, all PASS)

| Site | Brick | Words |
|---|---|---|
| AIC | can-it-pick-the-right-vehicle-for-the-number-of-bags | 348 |
| AIC | does-it-answer-the-phone-at-3-am | 353 |
| AIC | does-it-quote-prices | 320 |
| AIC | does-it-work-with-my-booking-software | 325 |
| AIC | does-the-caller-know-theyre-talking-to-a-computer | 354 |
| AIC | how-fast-is-a-booking-call | 337 |
| AIC | what-does-dispatch-actually-get-after-a-call | 351 |
| AIC | what-happens-if-it-doesnt-understand-a-name-or-an-address | 369 |
| AIC | what-happens-when-a-caller-wants-to-change-or-cancel-a-trip | 364 |
| AIC | what-if-the-caller-has-a-question-it-cant-answer | 350 |
| AVA | can-it-book-appointments-on-my-calendar | 365 |
| AVA | does-it-answer-the-phone-at-3-am | 370 |
| AVA | does-it-work-with-my-scheduling-software | 353 |
| AVA | does-the-caller-get-a-text | 354 |
| AVA | what-does-the-owner-get-after-a-call | 361 |
| AVA | what-happens-when-a-caller-asks-for-a-price | 354 |

1.4: no brick path held an older page, so nothing went to `infra/backups/`.
The press was not changed.

## The 16 live URLs

aichauffeur.ai
- https://aichauffeur.ai/answers/does-it-answer-the-phone-at-3-am/
- https://aichauffeur.ai/answers/what-happens-when-a-caller-wants-to-change-or-cancel-a-trip/
- https://aichauffeur.ai/answers/does-it-work-with-my-booking-software/
- https://aichauffeur.ai/answers/what-does-dispatch-actually-get-after-a-call/
- https://aichauffeur.ai/answers/can-it-pick-the-right-vehicle-for-the-number-of-bags/
- https://aichauffeur.ai/answers/what-if-the-caller-has-a-question-it-cant-answer/
- https://aichauffeur.ai/answers/does-the-caller-know-theyre-talking-to-a-computer/
- https://aichauffeur.ai/answers/what-happens-if-it-doesnt-understand-a-name-or-an-address/
- https://aichauffeur.ai/answers/how-fast-is-a-booking-call/
- https://aichauffeur.ai/answers/does-it-quote-prices/
- index: https://aichauffeur.ai/answers/

aivoiceagency.ai
- https://aivoiceagency.ai/answers/does-it-answer-the-phone-at-3-am/
- https://aivoiceagency.ai/answers/can-it-book-appointments-on-my-calendar/
- https://aivoiceagency.ai/answers/what-happens-when-a-caller-asks-for-a-price/
- https://aivoiceagency.ai/answers/does-it-work-with-my-scheduling-software/
- https://aivoiceagency.ai/answers/what-does-the-owner-get-after-a-call/
- https://aivoiceagency.ai/answers/does-the-caller-get-a-text/
- index: https://aivoiceagency.ai/answers/

## PART 2 · every hit, before → after

aichauffeur.ai: **0 hits.** The only phrase matches are the demo line, which rule (d) keeps:
- `chauffeur/llms.txt:27` and `chauffeur/pricing/index.html:320`: "The demo does not quote a price." Kept.

aivoiceagency.ai: **0 sentences replaced.** The three sentences that call quoting "custom" or a tier each list it with other work (dispatch, payments, software, outbound), so the one-line replacement would read wrong. They stay as written and are listed under NEEDS WORDS.

Reviewed, not hits (they are about our own plan pricing, or they agree with the canon): "Custom Quoted" / "custom-quoted" plan prices on `/ground-transportation` and the two `legacy/` homepages; "Connected and custom work is priced after a fifteen-minute call." on `/pricing` (CRM/software scope, kept per 2.2); `home-services/index.html:116,334` "AVA never freelances on quotes" (consistent: AVA does not make a price up).

No JSON-LD string or llms.txt line quoted a replaced sentence, because none was replaced.

## PART 3 · the hero, before → after

| | Before (prod, 2026-10-17) | After (prod, f655925) |
|---|---|---|
| 1st in DOM and on screen | HEAR A SAMPLE CALL · `cx-btn cx-btn--go` · 234×52 | CALL AVA LIVE · `cx-btn cx-btn--go` · 157×52 |
| 2nd | CALL AVA LIVE · `cx-btn` · 157×52 | HEAR A SAMPLE CALL · `cx-btn` · 234×52 |
| Call button at 390×844 | y 419–471, above the fold | y 357–409, above the fold |
| Call label contrast | 16.33:1 (text on panel) | **11.16:1** dark (`#0A0A0F` on `#00D4FF`) · **4.88:1** light (`#F4F6FA` on `#00749C`) |
| Desktop 1440×900 | sample x140, call x384 | call x140, sample x307 |

- Labels, `data-event` names, the play icon and the micro row are unchanged. No CSS changed, so there was no `?v=` to bump.
- The AVA homepage has no QR dialog. The call button was and is a plain `tel:` link on every device, and no script intercepts it.
- 3.3: no other aivoiceagency.ai page carries the HEAR A SAMPLE CALL pair. `/watch` and `/staging/xray.html` pair CALL AVA LIVE with "▶ WATCH AVA BOOK IT", and `legacy/index-3am-2026-10-01.html` already puts the call first. None was changed.
- Screenshots: `reports/2026-10-17-ava-cta-flip/before-390.png`, `before-1440.png`, `after-390.png`, `after-1440.png`, plus `*-focus-*.png` for each button and `before.json` / `after.json` with every number above.

## NEEDS WORDS

1. `chatgpt-example/index.html:660` (noindex prototype) — "Transportation, dispatch, quoting, payment capture, and industry-software workflows are custom intake builds." Quoting sits in a list with dispatch, payments and software.
2. `legacy/index-funnel-v2-2026-07-14.html:460` (served at that `.html` URL) — "Cold outbound campaigns, payments, quoting, and dispatch are custom." Same.
3. `ground-transportation/index.html:371` — the second tier box lists "rate quoting" next to corporate accounts, CRM + dispatch writeback, SMS and dispatcher alerts, while the first tier lists only "quote capture". It reads as quoting being a higher tier. It is a feature list, not a sentence that can take the line.
4. `index.html:229` hero sub-line "Play a sample call. The job ticket fills in while AVA is still on the phone." and `index.html:234` micro row "Tap to play · About a minute · No form" still invite the sample button, which now sits second. Words unchanged per the paste.

## Waiting on Shane

- **Booked-Green on the call button.** The site's green button classes (`.btn-primary` in bridge.css, `.cta` in circulant.css, `.bf-book` in the footer) all have rounded corners and a shadow, which § 3 bans, and none matches the square hero pair. A green `.cx-btn` needs one new class. Say "make the call button green" to add it.
- **Equal width.** The call button is 157 px wide and the sample 234 px: same class size, longer label plus the play icon. Matching them needs one CSS rule. Say "make the hero buttons the same width" to add it.
- **`/watch` and `/staging/xray`.** Same weight problem with a different label (WATCH AVA BOOK IT first). Say "flip /watch too" to apply the same class and order swap.

## IDs and rollback

| Part | Commit | aivoiceagency deployment | aichauffeur deployment |
|---|---|---|---|
| before this run | `ac06f33` | `dpl_FPWJtiTHPr8TrLPMKyK1sTv4U2pP` | `dpl_22Fjxi9TakUiKJt69uz84AcKdSEB` |
| 1 · answers | `5816115` | `dpl_B1f7eBZor2JkQiHpPoC1oc9NdR7L` | `dpl_25M4bUdMFebcm25bZeHB49mZ8CRx` |
| 3 · CTA flip | `f655925` | `dpl_3bZgnon4p17Mt5pmDjz24ieCvTjy` | `dpl_B4biEvT1Ckqvs4vz3Lcsu5aacYNM` |

- Roll back the CTA flip only: `git revert f655925` and push, or promote `dpl_B1f7eBZor2JkQiHpPoC1oc9NdR7L` (aivoiceagency).
- Roll back everything: promote `dpl_FPWJtiTHPr8TrLPMKyK1sTv4U2pP` (aivoiceagency) and `dpl_22Fjxi9TakUiKJt69uz84AcKdSEB` (aichauffeur), then `git revert f655925 5816115` so the next push does not redeploy them.
- IndexNow: n8n `gdFqOxFFVe13CfvX`, executions `14960`–`14963`.

## SHANE READBACK (mirror)

```
===== SHANE READBACK — COPY ALL =====
WHAT HAPPENED, PLAIN ENGLISH
- 16 answer pages are live in your exact words: 10 on aichauffeur.ai, 6 on aivoiceagency.ai,
  each with its own "Answers" list page. Google, Bing and the AI engines can read them now.
- Rate quoting: no page on aichauffeur.ai says quoting is extra. On aivoiceagency.ai, 3 spots
  lump quoting in with other "custom" work. They need your words, so nothing was changed.
- AVA homepage: CALL AVA LIVE is now the big filled button and comes first. HEAR A SAMPLE CALL
  is the plain button under it. Same words, still works.
- Bing was pinged for both sites after the deploys: 200 and 200.

DONE
Part 1 answers ......... LIVE  5816115  16/16 URLs 200 + H1 + META, JSON-LD 0 errors, llms.txt GREEN
Part 2 rate quoting .... LIVE  no change  chauffeur grep 0, both llms.txt 0, 3 NEEDS WORDS on AVA
Part 3 call first ...... LIVE  f655925  call button above the fold at 390x844, contrast 11.16:1
Part 4 IndexNow ........ LIVE  n8n exec 14963  aivoiceagency.ai 200, aichauffeur.ai 200
Part 5 board + report .. LIVE  on push

ROLLBACK
CTA flip only: git revert f655925 (or promote dpl_B1f7eBZor2JkQiHpPoC1oc9NdR7L)
Whole run: promote dpl_FPWJtiTHPr8TrLPMKyK1sTv4U2pP (AVA) + dpl_22Fjxi9TakUiKJt69uz84AcKdSEB (AIC),
then git revert f655925 5816115

WAITING ON YOU
- Green call button? Needs one new button class. Say "make the call button green".
- Same-width hero buttons? Call is 157 px, sample is 234 px. Say "make the hero buttons the same width".
- /watch has the same problem (WATCH AVA BOOK IT first). Say "flip /watch too".
- NEEDS WORDS (report has the file:line for each):
  1. /chatgpt-example: "Transportation, dispatch, quoting, payment capture, and industry-software
     workflows are custom intake builds."
  2. /legacy/index-funnel-v2-2026-07-14.html: "Cold outbound campaigns, payments, quoting, and
     dispatch are custom."
  3. /ground-transportation tier box: "rate quoting" listed only in the second tier.
  4. Homepage sub-line "Play a sample call..." and "Tap to play · About a minute · No form"
     still point at the sample button.

GOTCHAS
- The AVA homepage never had a QR dialog. The call button is a plain tel: link everywhere.
- The pre-commit hook re-dates both sitemaps on every commit that touches a listed page.
- Port 4178 is held by another local server on the Dell; use another port to preview chauffeur/.
```
