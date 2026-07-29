# RUN 9.5 — PRIVACY PAGE + LAW TRUE-UP + SITEMAP PROOF

**Date:** 2026-07-29 · **Surfaces:** `/privacy` (new) · `CLAUDE.md` · `sitemap.xml` · `vercel.json` · `tools/stamp.py` + 70 pages
**Result: LIVE.**

---

## WHAT SHIPPED, IN PLAIN ENGLISH

**You now have a privacy page a text-message reviewer will actually accept.** The carriers
(through TCR, the registry that approves business texting) look for four things on a privacy
page before they let a number send: what you collect, what you do with it, exactly what your
texts are, and how someone stops them. The old page had the first two and nothing on texting at
all. The new one carries the required sentence word for word, in a box, above the fold of that
section — *"Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP
for help. We never sell your data."*

**The page moved.** It was `aivoiceagency.ai/privacy.html`. It is now `aivoiceagency.ai/privacy`
— a cleaner address, and the one people type. The old address still works: it sends you to the
new one permanently, so Google moves your ranking over instead of starting from zero. Every link
on the site that pointed at the old address was updated — 70 pages.

**The rulebook was lying about four things.** CLAUDE.md's list of protected headlines said the
homepage headline was "AVA answers calls and books jobs." It hasn't been for a while — the
homepage headline is "3AM. GOOGLE WAS LISTENING." It said a second line was "not present in the
repo"; it's been live on the homepage. It put "One call. Sixteen agents." on the homepage; that
moved off the homepage in an earlier run. All four rows are now checked against the live site,
dated, and marked with where they actually live.

**"How could this prompt be better" is dead.** It's banned everywhere now — runs, reports,
receipts, chat. This report is the first one without it.

---

## 1 · `/privacy` — NEW PAGE

**Live:** https://aivoiceagency.ai/privacy

### The one string a reviewer greps for

Rendered verbatim, confirmed by extracting the page's own text (not by reading the source):

> Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. We never sell your data.

It sits in the only accent-bordered block on the page. Nothing else on the page competes with it.

### Sections, in order

| # | Section | Covers |
|---|---|---|
| 1 | What we collect | Contact details · call recordings + transcripts · texts · site usage · billing |
| 2 | How we use it | Six uses, then the explicit "we do not sell / rent / trade" line |
| 3 | **Text messages (SMS)** | Program description · the verbatim block · **what we send** (appointment confirmations, reminders, follow-ups) · **how you opt in** |
| 4 | **How to opt out** | STOP / HELP / START for texts · unsubscribe for email · email us for everything else |
| 5 | Who we share it with | Providers, legal, business transfer — "We never sell your data" repeated in bold |
| 6 | Call recording | Disclosure at call start; stops on request |
| 7 | Cookies | — |
| 8 | How long we keep it | 90-day default on recordings |
| 9 | Your rights | Access · correct · delete · stop marketing |
| 10 | Security | Honest — "no system is perfectly safe, and we will not pretend otherwise" |
| 11 | Children | — |
| 12 | Changes | — |
| 13 | Contact | shane@aivoiceagency.ai · 414-240-8930 · aivoiceagency.ai |

**Opt-in surface named explicitly:** `aivoiceagency.ai/book` is cited twice — once in §1 (where
the number is collected) and once in §3 under "how you opt in," alongside site forms and
replying to an inbound text. The §3 wording states the texts go **only to contacts who opted
in**, and that consent is never a condition of purchase.

**Footer link:** the Company column of the shared stamp.py footer now reads `/privacy`. Because
that footer is stamp.py-owned, the change was made in `tools/stamp.py` and re-stamped — not
edited inline on 56 pages, which the next stamp run would have reverted.

### Design — CIRCULANT-X, verified not asserted

New surface, so CIRCULANT-X tokens, not the legacy ledger.

| Gate | Result |
|---|---|
| Palette | `#0A0A0F` void · `#12121A` panel · `#23232E` hairline · `#EEF0F4` ink · `#7E8299` muted · `#00D4FF` accent. Zero gold, zero violet, zero gradient. |
| Type | **Space Grotesk only** — computed `font-family` on `<body>` confirmed in-browser at both breakpoints. |
| Corners | Computed `border-radius` across every element in `<main>`: the set is exactly `{0px}`. |
| Elevation | No shadows, no glass. The `--line` hairline is the only panel/void separator. |
| Rhythm | 96px desktop / 48px mobile section gap. Spacing on the 4px scale throughout. |
| Measure | Body copy capped at 70ch, lede at 62ch, wrap at 74ch. |
| Light mode | Body links on Paper are **Ink + underline**, not Deep Cyan — `#0090C8` is 3.39:1 and is large-text/UI only. Muted re-set to `#565C6B` (6.72:1 on Paper). |
| H1 | Exactly one. |

### Render gate — actually rendered, actually inspected

Playwright browsers were missing on this box; installed Chromium + WebKit, then ran the repo's
own `tools/render-audit.mjs` against a local server plus a second pass for the SMS block.

| Check | 390×844 | 1440×900 |
|---|---|---|
| Horizontal overflow | **0px** | **0px** |
| Console errors | **0** | **0** |
| `<h1>` count | 1 | 1 |
| Inline links under 24px tall | 0 | 0 |
| Page height | 8011px | 5803px |

WebKit-390 rendered in **both dark and light** — iOS Safari is a permanent gate. Shots committed:
`audits/R95-privacy-{mobile,desktop,sms-mobile,sms-desktop,webkit-390-dark,webkit-390-light}.png`.

### The URL move

| | |
|---|---|
| Was | `https://aivoiceagency.ai/privacy.html` — indexed, in the sitemap, linked from 70 pages |
| Now | `https://aivoiceagency.ai/privacy` |
| Old URL | **308 Permanent Redirect** → `/privacy`, both hosts, in `vercel.json`. Vercel emits 308 for `"permanent": true`, not 301 — same permanence, same ranking transfer, method preserved. |
| Link sweep | 56 pages via stamp.py footer · 11 hand-authored files swept directly (`book`, `booked`, `chauffeur`, `intake`, `live` ×2, `sms-policy`, `staging/xray`, `templates/city`, `templates/vertical`, `watch`, `sitemap.xml`) |
| `privacy.html` | **Deleted.** Shipping both would have put two indexable copies of the same policy on the site. |

`tools/stamp.py` PAGES carries a comment recording this so the old entry is not re-added.

**This was a judgment call beyond the literal brief.** The brief assumed no privacy page existed;
one did, at `/privacy.html`, live and indexed. Creating `/privacy/index.html` alongside it would
have shipped duplicate content and split the canonical. Migrating with a 308 was the only version
of "build `/privacy/index.html`" that doesn't damage the site.

---

## 2 · CLAUDE.md TRUE-UP (CEO-ordered)

### a) § 5 PROTECTED ANCHORS — rewritten against production

Every row below was confirmed by fetching the live page on 2026-07-29, not by reading the repo.

| # | Anchor | Was recorded as | **Verified truth** |
|---|---|---|---|
| **A1** | `3AM. GOOGLE WAS LISTENING.` | `/lsa` title + OG/meta only | **Homepage `<h1>`** (`index.html:148`) **plus** `/lsa` title/meta. **Frozen through Aug 27 2026.** |
| **A2** | `Every missed call hands the job to the next name on the map →` | ⚠ "RESERVED — NOT PRESENT IN REPO" | **LIVE** — homepage hero sub, `index.html:149` (`.bs-sub`). The slot is built. Frozen with A1. |
| **A3** | `One call. Sixteen agents.` | `index.html:148` + `/watch` + `/staging/xray` | **Not on the homepage.** Live at `/backstage`, `/watch`, `/staging/xray`. Theater moved off the homepage in RUN 4. |
| **A4** | `AVA answers calls and books jobs.` | homepage `<h1>` at `index.html:115` | **Homepage metadata only** — `meta[description]`, `og:title`, `twitter:title` (`index.html:7,15,21`). Not the `<title>`, not the H1. The H1 form survives only at `/staging/xray.html:116`. |

**Correction to the brief:** it specified A4 as "homepage title/meta only." Meta — yes. Title —
no. The homepage `<title>` is *"AI Receptionist That Books Appointments 24/7 | AI Voice Agency"*.
The section records what is actually on the wire.

**Correction to the brief:** it specified A3 as "`/watch` + `/staging/xray` only." `/backstage`
carries it too (`backstage/index.html:93`) — that is where the 16-agent theater lives now. All
three are recorded.

**Beyond the brief:** A2 was also wrong and was fixed. The brief did not mention it; leaving a
row that says a live homepage line is "not present in the repo" would have defeated the purpose.

The section now carries a standing instruction: re-verify against prod before citing a row, and
stamp the date. Anchor drift is a real failure mode — this table was wrong for a week.

### b) PROMPT-FOOTER KILL — new law

Appended as its own top-level section:

> **Never end any run, report, receipt, or prompt with "how could this prompt be better" or any
> prompt-critique section. Banned on all surfaces.**

Scope is total — the readback block, `/reports/*.md`, Notion receipts, commit bodies, chat. It
covers rewordings too: "prompt feedback," "to get a better result next time," "what would have
helped," a "meta" note grading the brief.

**Removed from the receipt template**, which is where it was mandated from:
- `OUTPUT FORMAT` line — was *"Every response ends with: how could this prompt be better?"*
- `SHANE READBACK LAW` contents line — the trailing bullet is gone; the block now ends on the
  last gotcha.

Reports before today keep the section as authored. They are the historical record and were not
retro-edited. **This report is the first clean one.**

---

## 3 · SITEMAP PROOF

| Check | Result |
|---|---|
| `sitemap.xml` exists | **Yes** — repo root |
| XML well-formed | **Yes** — parsed, not eyeballed |
| Referenced in `robots.txt` | **Yes** — `Sitemap: https://aivoiceagency.ai/sitemap.xml`, line 5, above the per-crawler blocks |
| Includes `/privacy` | **Yes** — `lastmod 2026-07-29`, `changefreq yearly`, `priority 0.3` |
| Stale `/privacy.html` entry | **Removed** |
| Entry count | 59 → **60** |

### Completeness audit

Walked the repo for every `.html` page, excluded `noindex` and non-public trees, and diffed
against the sitemap. **One genuine gap:** `/deck` — live, indexable, canonical `/deck`, and
absent from the sitemap. **Added** (`lastmod 2026-07-29`, priority 0.6).

`/backstage/` and `/lsa/` carry trailing slashes in the sitemap; both pages declare that exact
form as their canonical, so they match and were left alone. `/overview` matches `overview.html`
through a rewrite and its own canonical. `/intake` and `/pitch` are `noindex` by design and
correctly absent.

### Full URL list for Search Console

Sitemap: **https://aivoiceagency.ai/sitemap.xml** — 60 URLs.

```
https://aivoiceagency.ai/
https://aivoiceagency.ai/live
https://aivoiceagency.ai/backstage/
https://aivoiceagency.ai/ground-transportation
https://aivoiceagency.ai/professional-services
https://aivoiceagency.ai/home-services
https://aivoiceagency.ai/medical-practices
https://aivoiceagency.ai/hospitality
https://aivoiceagency.ai/milwaukee
https://aivoiceagency.ai/madison
https://aivoiceagency.ai/green-bay
https://aivoiceagency.ai/wisconsin-limo
https://aivoiceagency.ai/watch
https://aivoiceagency.ai/lsa/
https://aivoiceagency.ai/overview
https://aivoiceagency.ai/book
https://aivoiceagency.ai/roi
https://aivoiceagency.ai/deck
https://aivoiceagency.ai/milwaukee-hvac
https://aivoiceagency.ai/milwaukee-plumbing
https://aivoiceagency.ai/milwaukee-electrical
https://aivoiceagency.ai/milwaukee-dental
https://aivoiceagency.ai/milwaukee-roofing
https://aivoiceagency.ai/madison-hvac
https://aivoiceagency.ai/madison-plumbing
https://aivoiceagency.ai/madison-electrical
https://aivoiceagency.ai/madison-dental
https://aivoiceagency.ai/madison-roofing
https://aivoiceagency.ai/west-bend-hvac
https://aivoiceagency.ai/west-bend-plumbing
https://aivoiceagency.ai/west-bend-electrical
https://aivoiceagency.ai/west-bend-dental
https://aivoiceagency.ai/west-bend-roofing
https://aivoiceagency.ai/blog
https://aivoiceagency.ai/methodology.html
https://aivoiceagency.ai/blog/wisconsin-limo-crush
https://aivoiceagency.ai/blog/home-services-30-percent-missed
https://aivoiceagency.ai/guides/furnace-short-cycling.html
https://aivoiceagency.ai/guides/ac-running-but-not-cooling.html
https://aivoiceagency.ai/blog/what-happens-when-you-call-ava
https://aivoiceagency.ai/videos
https://aivoiceagency.ai/privacy
https://aivoiceagency.ai/terms.html
https://aivoiceagency.ai/sms-policy.html
https://aivoiceagency.ai/west-bend
https://aivoiceagency.ai/waukesha
https://aivoiceagency.ai/green-bay-hvac
https://aivoiceagency.ai/green-bay-plumbing
https://aivoiceagency.ai/green-bay-electrical
https://aivoiceagency.ai/green-bay-dental
https://aivoiceagency.ai/green-bay-roofing
https://aivoiceagency.ai/waukesha-hvac
https://aivoiceagency.ai/waukesha-plumbing
https://aivoiceagency.ai/waukesha-electrical
https://aivoiceagency.ai/waukesha-dental
https://aivoiceagency.ai/waukesha-roofing
https://aivoiceagency.ai/plumber-answering-service
https://aivoiceagency.ai/hvac-answering-service
https://aivoiceagency.ai/electrician-answering-service
https://aivoiceagency.ai/24-hour-answering-service
```

---

## 4 · GOTCHAS

- **A privacy page already existed.** The brief assumed a blank slate. Always check before
  authoring a "new" page at a path the site may already serve under a different extension.
- **Playwright browsers were not installed on this box.** `tools/render-audit.mjs` failed with
  `Executable doesn't exist`. Fixed by `npx playwright install chromium webkit` from
  `AVA-factory/adstage`. Chrome DevTools MCP was also unusable — its profile was already locked
  by a running browser. The render gate is not optional, so the fix was to install, not skip.
- **Bash heredocs mangle backslashes** — a `.replace('\\', '/')` inside a `<<'PY'` heredoc
  arrived as a syntax error. Known trap; write the script to a file and run it by path.
- **The footer is stamp.py-owned.** The `/privacy` link had to change in `tools/stamp.py`
  followed by a re-stamp. An inline edit on 56 pages would have been reverted.
- **CLAUDE.md § 5 was stale in four of four rows.** A rulebook that describes the site can drift
  from the site. RUN 9 spotted the drift and deliberately did not touch it; it survived a week.

---

## 5 · WHAT'S NEXT

- Submit the sitemap in Search Console and request indexing for `/privacy` and `/deck`.
- Point the TCR / carrier campaign registration at `https://aivoiceagency.ai/privacy`.
- Watch for `/privacy.html` 404s in Search Console — there should be none; the 308 covers it.
- Homepage stays frozen through **Aug 27 2026**. Changes come from the four conversion events.
