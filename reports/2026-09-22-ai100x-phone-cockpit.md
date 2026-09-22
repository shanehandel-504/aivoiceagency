# AI100X PHONE COCKPIT — run report (2026-09-22)

A private, passcode-gated phone dashboard that reads real GHL and Retell numbers at request
time. Separate private repo, separate Vercel project. The ai100x.ai site was not touched.

**Live:** https://ai100x-cockpit.vercel.app/ (also `/cockpit`)
**Repo:** `shanehandel-504/ai100x-cockpit` (PRIVATE) · build commit `be87cf2` · deploy `dpl_5ayXAAhr1EsWmniYybEei8kNLs1o`
**Rollback:** promote `dpl_3JiheMkAR6n6EBbYEazY5g6zWnwy`, or `git revert be87cf2` and push.
**Open:** `cockpit.ai100x.ai` needs one record at the registrar. Until it exists, the project URL is the link.

## Recon that shaped the build

- `AVA-factory/metrics/collect.mjs` reads `GHL_PIT`, `GHL_LOCATION_ID`, `RETELL_API_KEY` — all
  already in Doppler `ava-prod/prd`, so no key was copied anywhere.
- Leads come from `POST /contacts/search` filtered on `dateAdded`; bookings from
  `GET /calendars/?locationId` (calendars named "personal" excluded, 2 remain) then
  `GET /calendars/events` per calendar, counted by the date each was booked.
- `collect.mjs` counts a rolling 24h/7d, not Chicago calendar days, and it calls the retired
  `POST /v2/list-calls`. This port uses `POST /v3/list-calls` with the tightened filter shape.
- **ai100x.ai is already served** by the existing `ai100x` Vercel project and already has a page
  at `/cockpit`. Per the brief's own rule, this build went to `cockpit.ai100x.ai` instead.
- All three lines are on the Retell account, and `/v3/list-calls` accepts a `to_number` filter
  (`{type:'string', op:'eq'}`), so each line's last call time is exact rather than estimated.

## Decisions (grilled before any code)

| Question | Answer |
|---|---|
| Vercel's own login on the new project | Preview deployments only; production answers to the passcode alone |
| "This week" | Monday 12:00 AM Central to now; "today" is midnight Central to now |
| Calls tile | Every Retell call, as the collector counts them; sub-line shows `N phone · N web` |
| Prompt-critique footer | Dropped — CLAUDE.md PROMPT-FOOTER KILL wins |

## What is on the wire

- **Gate:** `POST /api/login` compares SHA-256 digests with `timingSafeEqual`; a miss waits 800 ms
  then 401; 10 misses from one address in 10 minutes returns 429. Success sets `ck` =
  expiry + HMAC-SHA256(expiry), HttpOnly, Secure, SameSite=Strict, Path=/, Max-Age=15552000.
  The passcode is four common lowercase words from a 578-word list (~37 bits).
- **`GET /api/pulse`:** leads, bookings, calls (+ phone/web split, average length) and each line's
  last call. 5-minute in-function cache that only ever stores a clean read. `?fresh=1` skips it.
- **`GET /api/today`:** `data/today.json` in the private repo. Editing it on GitHub redeploys.
- **Screens:** Today (spoken morning brief, Do this next, three numbers, Needs you) and Pipeline
  (Deals, Your lines, Running now), bottom nav, 390 px first.
- **Brief:** built from live data with a plain template, read by the free Web Speech API,
  preferring a Premium/Enhanced English voice; the 48 bars fill from word-boundary events with a
  timer fallback; on iPhone, pause stops and the next tap restarts from the top.
- **Honesty:** a failed source shows "Couldn't reach GHL" / "Couldn't reach Retell" with Retry.
  A failed refresh clears the old numbers rather than presenting them as live. A calendar that
  fails to load is an error here; the collector skips it silently, which can undercount.

## Proof (all run against production)

| Check | Result |
|---|---|
| Gate, headers, leak sweep | **23/23 PASS**: no-cookie 401 on both data routes; wrong passcode 401 after 959 ms; forged cookie 401; cookie carries all five attributes; data `Cache-Control: private, no-store`; `X-Robots-Tag: noindex, nofollow` on `/`, `/cockpit`, `/api/pulse`; `robots.txt` disallows all; `data/today.json`, `SPEC.md`, `vercel.json`, `package.json`, `.env` and the lib sources all unreachable |
| Secret sweep | 0 hits across 22 Doppler values, 5 key patterns and the 4 never-show numbers — in the 6 deployed public files and in all 29 tracked repo files |
| Renders | **8/8 clean** at 390×844, 320×568, 430×932, 1440×900 on both screens: `scrollWidth === innerWidth`, no element past the viewport, no console errors, no tap target under 44 px, both fonts loaded |
| Interaction | **16/16 PASS**: play, boundary-driven fill, pause/resume, iPhone restart, voice preference, brief template, Mark done / Not today / Approve incl. surviving a reload, gold focus ring |
| Contrast | Lowest measured text on screen **5.5:1** (12 px "Updated" line and the 13 px sub-lines) |
| Numbers vs the collector | **8/8 match** on the Chicago window and **6/6** on the collector's own rolling window, where the counts are non-zero (booked 7d = 1, calls 7d = 5, average 20 s) |
| Unit tests | 13/13 — Chicago day/week boundaries across both daylight-saving changes, cookie signing, expiry, tampering |

## Defects found and fixed before close

1. `/cockpit` returned 404: the rewrite pointed at `/index.html`, which `cleanUrls` does not serve.
   Destination is now `/`, and the check asserts the page itself, not only its header.
2. The leak scanner stored the four never-show numbers as literals, so committing it would have
   put them in the repo. It now matches them by SHA-256 hash.
3. The client never read the body of a 401, so those connections stayed open and a render wait
   timed out. It drains the body now.
4. A nested-array bug in the DOM helper rendered the new calls sub-line as `,[object HTMLSpanElement]`.
   Caught by the contrast sweep, fixed, and the render check now fails on that kind of junk text.

## Gotchas for next time

- `doppler run` overrides a variable you set on the command line unless you pass `--preserve-env`.
  A baseline run intended for a scratch folder wrote to the real vault metrics folder instead —
  harmless, because the Dell's own scheduled task writes the same files every 30 minutes.
- The Vercel CLI login on this machine had expired, and a device code lasts only a few minutes.
- `create_git_project` reports a "preview deployment", but a push to `main` is a **production**
  deploy, which is why preview-only protection does not apply to it.
- Vercel's `domains inspect` recommends an A record; a CNAME is the safer instruction for a
  subdomain because it survives an IP change.
- Matching zeros proves little, so the number check also runs the collector's rolling window,
  where the counts are non-zero.

## Next step (not built)

Server write-back for taps, so "Mark done" and "Approve" sync across devices and reach the board.
Needs a `POST /api/taps` behind the same cookie, a store that survives cold starts
(Vercel KV / Upstash, or a commit to `data/state.json` with a repo-scoped token), and an
idempotency key per tap.
