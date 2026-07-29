# RUN 7-CODE — MESSAGE FORMAT LAW + ACRONYM SWEEP

**Date:** 2026-07-28 · **Surfaces:** `CLAUDE.md` + repo (65 files) + n8n + GHL calendar
**Result: LIVE. 25 PASSED, 0 FAILED.**

---

## WHAT SHIPPED, IN PLAIN ENGLISH

Every message the system sends now follows one written rule, and the site finally calls the
booking one thing.

**The booking had two names and two lengths.** The site said "Book a 30-minute call" in 127
places. The emails said "AVA strategy call." The calendar booked 30 minutes. The new law says
15. Everything now says **AVA strategy call, 15 minutes** — and the calendar was changed to
actually book 15, so the words and the system agree.

**Your alerts now lead with the answer.** They used to start with "AVA call:" and bury the
outcome mid-sentence. They now open with **BOOKED**, **MISSED**, **VOICEMAIL**, or
**FOLLOW-UP** — readable from a lock screen without opening anything.

**Two invented numbers were going out to real leads.** The 7th nurture email claimed "62% of
calls go unanswered, 85% never call back" and showed a big "$75,000–$126,000 a year walking
out the door." Neither is in our sourced set. Both are gone.

**"LSA" is spelled out.** Nobody outside the ads world knows what it means.

---

## THE LAW — appended to `CLAUDE.md`

Ratified as **MESSAGE FORMAT LAW (Jul 28 2026)**, placed before Appendix A:

- Every outbound message does **ONE job**.
- Owner alerts open **status-led** — `BOOKED` / `MISSED` / `VOICEMAIL` / `FOLLOW-UP` first.
- One canonical name: **"AVA strategy call" — 15 minutes, never 30.**
- Booking receipts include **`Hear AVA anytime: 414-240-8930.`**
- SMS: `Reply STOP to opt out` on **first touch only**. CTA phrasing varies across a sequence.
- Never fabricate stats, dollar amounts, or testimonials. Never "100 free minutes" or "locked
  in." **Caller-facing copy never says "Shane."**

---

## ⚠ THE 15-vs-30 CONFLICT — RESOLVED AT THE SOURCE

The law says 15 minutes. The live GHL calendar said otherwise:

| | |
|---|---|
| Calendar | `aCIv7rUnCGrysobt6Mlg` — **AVA Demo Call** |
| Before | `slotDuration=30 mins · slotInterval=30` |

Writing "15 minutes" onto 66 pages while the calendar held a 30-minute slot would have made
**every page contradict the real booking system** — the exact class of thing the
no-fabrication rule exists to prevent. A booked lead would read 15 and get a 30-minute hold.

**Shane's call: flip the calendar.** `tools/ghl-calendar-slot.mjs`:

```
before: slotDuration=30 mins · slotInterval=30 mins
PUT 200
after : slotDuration=15 mins · slotInterval=15 mins   VERIFIED PASS
```

The AIChauffeur and personal calendars were deliberately left at 30 — different events.

---

## SWEEP 1 · REPO — 65 files, 166 replacements

`tools/run7-copy-sweep.py`, every old→new recorded. Nav and footer CTAs are **stamp.py-owned**,
so they were changed in `tools/stamp.py` and propagated by re-running the stamper — never
edited inline, which the next stamp run would have reverted.

| Count | Old | New |
|---|---|---|
| **127** (61 files) | `Book a 30-minute call` | `Book the AVA strategy call` |
| 8 (5 files) | `Book My 30-Minute Call` | `Book My AVA Strategy Call` |
| 4 | `30 minutes, live on your line` | `15 minutes, live on your line` |
| 4 | `Twenty-minute call.` | `Fifteen-minute call.` |
| 2 | `Book the strategy call` | `Book the AVA strategy call` |
| 1 | `Your 30-minute call is set` | `Your AVA strategy call is set` |
| 1 | `The intro call is 30 minutes.` | `The AVA strategy call is 15 minutes.` |
| 1 | `<b>30 minutes</b>` | `<b>15 minutes</b>` |
| 1 | `BOOK A 30-MINUTE CALL` | `BOOK THE AVA STRATEGY CALL` |

**Email templates** (`work/emails/`): `receipt.html` was at 30 minutes while `receipt.txt` was
already authored at 15 — they had silently diverged. HTML aligned to 15, the Google Calendar
deep-link shortened from `T173000Z` to `T171500Z`, and both now carry
`Hear AVA anytime: 414-240-8930.`

**Left alone on purpose:** `/intake` and `/pitch` say "30-minute intake." That is the
onboarding intake — a genuinely different event from the strategy call, and shortening it
would have been wrong.

---

## ⚠ A RENDER REGRESSION I CAUSED, MEASURED AND FIXED

The canonical CTA is **32px wider** than what it replaced. Measured in Chrome:

| Viewport 1140px | CTA width | Nav phone number |
|---|---|---|
| **Old** `Book a 30-minute call` | 191px | fits, **12px to spare** |
| **New** `Book the AVA strategy call` | 223px | **20px off the right edge** |

The full-width nav row needs ~1170px, so the existing `@media(max-width:1120px)` compact rule
left the **1121–1170 band broken**. Raised the breakpoint to **1200px** in `assets/bridge.css`.

**Re-measured after the fix:**

| Check | Result |
|---|---|
| 1121px (compact styles) | **35px headroom** ✅ |
| 1201px (full styles) | **35px headroom** ✅ |
| 390×844 | `docScrollW 390` · **zero horizontal overflow** ✅ |
| Footer CTA at 390px | 262px wide, not clipped ✅ |

Evidence: `audits/RUN7-nav-desktop-1121.png`.

---

## SWEEP 2 · n8n — 42 rules, 55 replacements

`tools/n8n-message-law.mjs`, idempotent, every old→new printed.

| Workflow · node | Old | New |
|---|---|---|
| Post-Call · `Format Call Log` | title trailed `· BOOKED` / `· —` | leads `BOOKED · number · dur · when`, exposes `log_status` |
| Post-Call · `Owner Alert SMS` | `AVA call: {n} · {dur} · BOOKED · {sum}` | `BOOKED` ⏎ `{n} · {dur}` ⏎ `{sum}` |
| Post-Call · `Owner Alert Email` | subject `AVA call — …` | subject leads with the status |
| Receipt · `Prep Receipt` sms | `✅ You're set … your 15-min call …` | canonical name + `Hear AVA anytime: 414-240-8930.`, emoji dropped |
| Receipt · `Prep Receipt` email | `— Shane` · no phone line | `— AVA Team` · `Hear AVA anytime: 414-240-8930.` |
| Receipt · `Prep Receipt` owner | `✅ BOOKED: {name}` | `BOOKED` ⏎ `{name}` |
| Receipt · `Receipt SMS` | appended `. Reply here if that email looks wrong.` | removed — **one job per message** |
| Drip · `Build Steps` | `STOP to opt out` on **8 of 8** SMS | **first touch only** (7 stripped, C[0] keeps it) |
| Drip · `Build Steps` | `btn:Book` ×6, `Book your 15-min call` ×2 | **8 distinct CTAs** |
| Drip · `Build Steps` | `extra:414-240-8930` ×5 identical | **8 distinct sub-lines** |
| Drip · `Build Steps` | `— Shane` ×6, `— Shane Handel…` ×2 | `— AVA Team` / `— The AVA Team, AI Voice Agency` |
| Drip · `Owner NEW LEAD SMS` | `🔥 NEW LEAD: …` | `FOLLOW-UP` ⏎ `NEW LEAD: …` |
| Client Intake · `Build Payload` | `📋 INTAKE COMPLETE: …` | `FOLLOW-UP` ⏎ `INTAKE COMPLETE: …` |
| alert_owner · `Email Shane` | `AVA owner alert — {name}` | `FOLLOW-UP — AVA passed you a caller: {name}` |
| send_link · 4 SMS nodes | `book your strategy call` | `book your AVA strategy call` |
| social_intake · `Question Auto Reply` | `a 3-minute call` | `the 15-minute AVA strategy call` |

**The email footer keeps its unsubscribe line on every send.** The law scopes the STOP rule to
**SMS**; a commercial email needs an unsubscribe mechanism on every message. Only the SMS
repeats were stripped.

### ⚠ TWO HONESTY DEFECTS FOUND IN LIVE NURTURE COPY

Nobody was looking for these. Drip email 7 carried:

- `Industry data: 62% of calls to small businesses go unanswered — and 85% of those callers never call back.`
- A headline stat block: `$75,000–$126,000` / `a year walking out the door for a local service business.`

**Neither figure is in the CLAUDE.md sourced set** (AgentZap 47% / 73%-higher · ServiceTitan
10–14.1% · ~50→~3 shops). Both removed — the stat block is gone and the claim is now a
mechanism sentence with no invented numbers. This was going to real leads.

### ⚠ A BUG I SHIPPED AND CAUGHT

The first version of the tool used **occurrence-ordered** replacement for two identical
`btn:` strings. On the second apply it re-fired and rewrote the **wrong** drip step, making
C[1] a duplicate of C[14]. The idempotency re-run caught it. Each edit is now anchored on its
step's unique `extra:` line, and a re-run is a clean no-op.

---

## SWEEP 3 · LSA — 16 phrases

"LSA" → **"Google Local Services Ads"** on first mention per page, then **"Google's ads"** /
**"these Google leads"**.

| Surface | Old | New |
|---|---|---|
| `/lsa` `<title>` | `Missed LSA Calls Drop Your Ranking` | `Missed Google Local Services Ads Calls Drop Your Ranking` |
| `/lsa` meta desc | `Missed LSA calls lower your responsiveness` | `Missed calls on these Google leads lower your responsiveness` |
| `/lsa` OG + Twitter | `Every missed LSA call is graded against you.` | `Every missed call on Google's ads is graded against you.` |
| `/lsa` first body line | `Every LSA call runs through Google's own number.` | `Every Google Local Services Ads call runs through Google's own number.` |
| `/lsa` mechanism | `LSA calls are routed through Google's number.` | `These Google leads are routed through Google's number.` |
| `/lsa` ×2 | `LSA CALL RECORD` | `GOOGLE ADS CALL RECORD` |
| `/lsa` | `YOUR LSA PLACEMENT` | `YOUR GOOGLE ADS PLACEMENT` |
| `/lsa` ×3 sources | `LSA industry reporting / agency benchmarks / analysis` | `Google Local Services Ads …` |
| `/staging/xray` | `What missed LSA calls do to your ranking` | `What missed Google Local Services Ads calls do to your ranking` |

- **The `/lsa` URL slug is unchanged.**
- **PROTECTED ANCHOR A1 verified verbatim:** `3AM. Google Was Listening.` still opens the
  `<title>` and is the exact OG + Twitter title.
- **Zero "LSA" left on any visible surface.** Two remain in *code comments* only —
  `staging/xray.html:139` (HTML comment) and `tools/stamp.py:242` (Python comment).

---

## THE PROOF — 25/25

`tools/run7-proof.mjs`. One synthetic `call_analyzed` on the **live** webhook; the caller is
one of our own lines, so the RUN 6.5 guard routed it to the zz-test sink — **no real contact
touched**.

```
owner email subject: BOOKED · +14142408930 · 2m 10s · Jul 28, 9:30 PM CT
```

| Group | Checks |
|---|---|
| Drip CTA uniqueness | 8 buttons / 8 distinct · 8 sub-lines / 8 distinct ✅ |
| STOP first-touch-only | 1 SMS occurrence, on C[0]; email footer intact ✅ |
| No "Shane", no 62%/85%, no `$75,000–$126,000` | ✅ |
| Receipt: hear-AVA line, no "Shane", status-led owner, canonical name | ✅ |
| Live execution **4956** · success · guard held | ✅ |
| `log_title` opens `BOOKED · …` · `log_status` exposed · booked still `yes` | ✅ |
| Owner SMS `1nxSjORSH5Bf7NUF3cb1` + owner email dispatched | ✅ |
| **Status branch table** — BOOKED / VOICEMAIL / MISSED (short) / MISSED (no answer) / FOLLOW-UP | **5/5** ✅ |

The status table is replayed against the **deployed** `Format Call Log` code fetched live from
n8n, not a local copy.

---

## WHAT CHANGED LIVE

| Change | Surface | State |
|---|---|---|
| MESSAGE FORMAT LAW | `CLAUDE.md` | committed |
| AVA Demo Call calendar 30 → **15 min** | GHL | live, verified |
| 166 copy replacements across 65 files | repo | **live on Vercel** |
| Nav breakpoint 1120 → 1200 (regression fix) | `assets/bridge.css` | **live**, re-measured |
| 55 message replacements | n8n (7 workflows) | live, **proven** |
| `ghl-calendar-slot.mjs` · `run7-copy-sweep.py` · `n8n-message-law.mjs` · `run7-proof.mjs` | repo | committed |

**Voice: not touched.** All 13 active workflows still attached to `OPS — Error Sentry`.

---

## ROLLBACK — one line each

- **Calendar:** `tools/ghl-calendar-slot.mjs` with `WANT = 30`.
- **Repo copy:** `git revert` the RUN 7-CODE commit — the sweep is pure string replacement.
- **Nav breakpoint:** restore `@media(max-width:1120px)` in `assets/bridge.css`.
- **n8n:** every old→new pair is printed by `n8n-message-law.mjs --audit` and listed above;
  reversing the table restores prior copy.

---

## GOTCHAS WORTH KEEPING

1. **A copy law can contradict the system it describes.** Check the config before writing a
   number onto 66 pages — the calendar said 30 while the law said 15.
2. **Occurrence-ordered string replacement is not idempotent.** Two identical strings needing
   different replacements must be anchored on unique surrounding context, or the second apply
   rewrites the wrong one. Mine did.
3. **Copy length is a layout change.** +32px of CTA text pushed a nav element off-screen in a
   50px-wide viewport band. Re-render after any CTA rewrite.
4. **`stamp.py` version tags track the commit hash, not file content** — so a local CSS edit
   serves stale cached CSS until the next commit. Verify CSS behaviour by injecting the rule.
5. **Two templates of the same email can silently diverge** — `receipt.txt` was at 15 minutes
   while `receipt.html` was at 30.
6. **Scope matters in a message law.** "STOP on first touch only" is an SMS rule; applying it
   to email would strip a legally required unsubscribe line.

## STILL OPEN

- Frozen v37 Retell agent still points at chat-dash (carried from RUN 6.6-C).
- GHL draft publishes + contact hygiene (Block F), carried from RUN 6.5.
- `/lsa` and the homepage were edited under **§ 0 precedence** despite POLISH FREEZE — a
  direct instruction outranks the freeze. Worth a formal re-freeze note if that was not intended.
