# AIC SITE RUN 1 — "OPERATOR CUT"

**2026-08-01 · aichauffeur.ai · PUBLISHED**

aichauffeur.ai now has a phone number on it, a way to be called back, five new pages, and its own
search identity. It also had three production defects nobody had reported, all of which came from
one misunderstanding about how the site is deployed. Those are fixed too.

---

## The finding that made this run bigger than its brief

**aichauffeur.ai is a SEPARATE Vercel project. Its Root Directory is `chauffeur/`.**

| | |
|---|---|
| Project | `aichauffeur` · `prj_EJPRBO2jy7r9MDOhXkd92mL02JZM` |
| Git source | `shanehandel-504/aivoiceagency` @ `main` — the same repo |
| Root Directory | `chauffeur/` |

One push to `main` deploys both sites. **The repo-root `vercel.json` is never read by the
aichauffeur project**, so the host-conditional `aichauffeur.ai` rewrites sitting in it are dead
config — they look authoritative and do nothing.

Proof, measured on production *before* this run:

```
aichauffeur.ai/nonsense         404   <- the "catch-all" rewrite never fired
aichauffeur.ai/demo/index.html  200   <- only possible if the root IS chauffeur/
aichauffeur.ai/llms.txt         404   <- every repo-root path is unreachable
aichauffeur.ai/robots.txt       404
```

### What that had broken, live

1. **Every card on the homepage was rendering transparent and border-less.**
   The page links `/assets/circulant.css`, which 404s on this host. That file defines
   `--gx-fill`, `--gx-line`, `--gx-edge` and `--green`. Undefined, every
   `background: var(--gx-fill)` and `border: 1px solid var(--gx-line)` became *invalid at
   computed-value time* — so the declarations were dropped entirely.
2. **Every audio button was wired to a 404.** The homepage's "tap to retry" label was never a UX
   decision; it was `audio.play()` rejecting on a missing file. All 22 demo clips were dead — and
   11 of them pointed at files that exist **nowhere in the repo**, with zero consumers in
   `scenarioAudioMap` or `transcriptAudioMap`.
3. **`/privacy` and `/terms.html` 404'd** — dead footer links on a page about to start collecting
   TCPA consent.

**Fix:** assets duplicated under the chauffeur root (`chauffeur/assets/`, `chauffeur/audio/`,
`chauffeur/fonts/` — 5.6MB). Task D was rebuilt against the real topology. Written up permanently
in `docs/aichauffeur-host.md` so it is never rediscovered.

---

## DONE

| Artifact | Live URL | Status |
|---|---|---|
| Homepage — CTA stack, founder section, footer NAP | https://aichauffeur.ai/ | LIVE |
| Limo answering service | https://aichauffeur.ai/limo-answering-service/ | LIVE |
| After-hours dispatch | https://aichauffeur.ai/after-hours-limo-dispatch/ | LIVE |
| Milwaukee limo answering | https://aichauffeur.ai/milwaukee-limo-answering-service/ | LIVE |
| Privacy policy | https://aichauffeur.ai/privacy/ | LIVE |
| Terms of service | https://aichauffeur.ai/terms/ | LIVE |
| Demo — resting ticket, working audio | https://aichauffeur.ai/demo/ | LIVE |
| Chauffeur sitemap | https://aichauffeur.ai/sitemap.xml | LIVE (was 404) |
| Chauffeur robots | https://aichauffeur.ai/robots.txt | LIVE (was 404) |

**⚠ COPY SAYS 20 MIN — VERIFY CALENDAR MATCHES.** Every chauffeur page reads "Schedules a 20-min
intro call." The GHL calendar `UaxV0ENx2cEUYs6qeWZ7` is being set to 20 minutes in parallel. If it
is not 20, the page makes a promise the booking screen breaks.

---

## TASK A — phone + callback

- `414-775-0019` is live sitewide: nav (persistent on mobile — `.nav-links` is hidden under 880px,
  so a booking widget there was a dead end for someone holding a phone), hero, footer NAP, FAQ, and
  every new page. **The site previously had no phone number and no `tel:` link at all.**
- **"AVA calls you"** posts to the existing n8n `ava-call` webhook with
  `source/brand/tag = aichauffeur` so GHL routes chauffeur leads separately. TCPA consent
  **fails closed** — no tick, no POST. Verified both guard paths in the browser without touching
  the production webhook.
- The endpoint lives in exactly one file, `chauffeur/assets/aic.js`. The homepage's inline copy was
  removed rather than left to drift (CLAUDE.md § 7's principle: one swap at the token).
- Tertiary CTA → the existing GHL booking link.

## TASK B — defects

1. Inline SVG play icons everywhere; `▶` and `❚❚` gone. Default label **"Play the call"**;
   autoplay-blocked label is **"Tap to play"**. `TAP TO RETRY` appears nowhere.
2. **Dead zone killed.** `/demo/` used to render seven labelled boxes all reading *awaiting*. It now
   rests on a finished 5:45 AM airport ticket, written into the HTML so it survives with JS off.
   Replay via the affordance under it, or by scrolling to it **and stopping** — a `hasScrolled`
   guard plus a 900ms dwell, because running the scenario necessarily blanks the fields, and
   auto-running on arrival would have recreated the exact dead zone the section exists to remove.
3. `font-variant-numeric: tabular-nums` on every ticket, quote, time and phone field.
4. **Integrations reworded off a false claim.** The page said AVA "writes into the dispatch you
   already run" and "passes the trip to your affiliate network automatically." Now compatibility
   framing only: the call comes back as a clean trip ticket the dispatcher confirms.
5. **Founder section built** above the FAQ. The brief said "move" it — there was nothing to move;
   the only founder material was one sentence in the footer tagline.
6. THE CRUSH carries the visitor's own device clock, mapped to the dispatch window that hour belongs
   to. The time and day are mechanical fact; the window phrase characterises, it does not claim.
   Hidden entirely with JS off.
7. Footer rebuilt: NAP block in, the large cyan cross-link row to aivoiceagency.ai and ai100x.ai out.
8. Pricing posture line added. No dollar figure appears on any chauffeur page.

**Two self-contradictions cured.** The homepage said *"Schedules a 20-min intro call"* and, three
sections later, *"The AVA strategy call is 15 minutes."* And `/demo/` was `noindex` while this run's
own spec listed it in the sitemap — Search Console reports that as an error, so the noindex went.

## TASK C — five new pages

Three SEO pages plus privacy and terms, all on a shared shell. Written in parallel, then each
independently audited against brand law by a second agent. **The audits caught two real violations
I would have shipped:**

- `/limo-answering-service/` carried an unsourced billing promise ("a flat monthly build... a heavy
  Friday night does not change the bill"). No dollar figure, so it passed the letter of the price
  rule, but it is a commercial commitment we have not made. Rewritten to scoping posture.
- `/after-hours-limo-dispatch/` FAQ 4 implied write-integration ("the ticket **lands**... in the
  software you already run"). Now states plainly that AVA does not write into dispatch software.

Privacy covers automated calls and texts, what consent covers, **STOP and HELP**, message frequency
(no invented number), and that data is never sold. The consent checkbox links straight to it.

## TASK D — host split

- `chauffeur/robots.txt` + `chauffeur/sitemap.xml` as **real files** (both previously 404). Seven
  URLs, correct namespace.
- `chauffeur/vercel.json` — the only config this host reads — for `www` → apex and cache headers.
  No `_comment` key: Vercel rejects unknown top-level properties and it would have failed the build.
- Canonicals on all seven pages. No page on either host canonicals to the other (verified both
  directions).
- The AVA sitemap already contained zero `/chauffeur/` URLs — nothing to remove, verified.
- `Organization` + `LocalBusiness` + `Service` on the homepage; `LocalBusiness` on Milwaukee.
  **No street address, postal code or geo is emitted anywhere** — there is no storefront, and
  inventing one is the false-LocalBusiness pattern RUN 9 had to strip from the AVA site.

---

## Verification

| Check | Result |
|---|---|
| Banned phone numbers | none |
| AVA as "she"/"her" | none |
| "locked" / "locked in" | none |
| Emoji as icon | none (one `✓` dingbat in CSS `content`, no emoji presentation — kept) |
| Invented stats / prices for our service | none; all `$` figures are labelled sample tickets |
| Leftover `{{SLOT}}` | none |
| Repo-root paths that 404 on this host | none |
| JSON-LD valid | 9/9 blocks |
| Inline JS syntax | valid, all pages |
| HTML doctype / tag balance | 7/7 sound |
| Horizontal scroll at 390px | zero, all pages |
| Touch targets < 44px | only WCAG 2.5.5 exceptions (focus-only skip link, label-wrapped checkbox, inline prose links) |
| Console errors | none |

Rendered and inspected at **390×844 and 1440×900**. Desktop hero is now two-column from 1020px —
the CTA stack caps at 520px, so one column left the right half of the fold empty and pushed the
dispatch console below it.

---

## Gotchas

- **`stamp.py` was NOT run.** The repo is stamped at `f76cc32` while HEAD was `4853d13`, so a full
  run would have rewritten **374 asset URLs across the whole AVA site** — unrelated changes swept
  into a chauffeur push. All seven chauffeur pages are registered in `VERSION_ONLY`, so the next
  stamp run armors them. The new assets are new files with no stale cache to bust today.
- **The dead aichauffeur rewrites in the repo-root `vercel.json` were left in place**, deliberately.
  Removing them touches the AVA host's live routing for zero functional gain. They are documented as
  dead in `docs/aichauffeur-host.md`, not fixed.
- **`/terms/` keeps `shane@aivoiceagency.ai`** as the contact address, carried from the source AVA
  terms. Inventing an `@aichauffeur.ai` address was not an option, and the cancellation clause needs
  a written-notice target.
- **No `og:image` exists for the AI Chauffeur brand.** All seven pages therefore declare
  `twitter:card=summary`, not `summary_large_image` — a large card with no image renders broken.
  Upgrade the day real OG art ships.
- **Serving `chauffeur/` as the web root is the only honest local preview.** Serving the repo root
  hides every host bug in this report. `.claude/launch.json` has it as `aichauffeur-static`.
