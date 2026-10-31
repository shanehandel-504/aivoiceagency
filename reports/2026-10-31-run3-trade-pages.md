# RUN 3 TRADE PAGES TO PAGE ONE · aivoiceagency.ai · 2026-10-31

```
===== SHANE READBACK — COPY ALL =====
RUN 3 TRADE PAGES TO PAGE ONE · aivoiceagency.ai · Sat Oct 31 2026 · COMPLETE

WHAT HAPPENED (plain English)
The four national trade pages (plumber, HVAC, electrician, 24-hour) now match what
owners type into Google. Their Google descriptions no longer say "Wisconsin" or carry
the phone number. Each one says the service books the job, from $497 a month. The
plumber page title now reads "Plumbing Answering Service That Books the Job". Each
page's main headline now starts with its search term in the page code, and on screen
it looks the same as before. The plumbing and HVAC pages now play their real sample
call, with the job ticket filling in, using the same player as the homepage. The 15
city pages for HVAC, plumbing and electrical (Milwaukee, Madison, West Bend, Green Bay,
Waukesha) now link their trade crumb up to the national page. The copy freeze record
says it is lifted. The homepage was not touched.

DONE
| What shipped | Commit | Deploy | Live proof |
|--------------|--------|--------|------------|
| New descriptions on 4 pages + plumber title, og and twitter tags | d867967 | dpl_3oEWEGzFTosFEKoSbxpttXNhYKc6 | all 4 return 200 with the new description in the HTML; plumber title live |
| Search term first in each H1 (label moved inside the H1, "// " drawn by CSS) | d867967 | same | all 4 H1s start with the term; the label sits at the same spot as before (16,212 at 390 · 112,272 at 1440) |
| Sample call on /plumber-answering-service (plumbing) and /hvac-answering-service (heating) + an AudioObject on each | d867967 | same | both play (0:03 on the clock, audio 206), page-local AudioObject @id present |
| 15 city crumbs link up (hvac, plumbing, electrical x 5 cities) | d867967 | same | milwaukee-hvac, madison-plumbing, waukesha-electrical: crumb links to the national page, BreadcrumbList item matches |
| Copy freeze lifted | d867967 | same | hq/copy-freeze-2026-10-28.json: lifted 2026-10-31, lifted_by Shane, rule_now |
| Board | d867967 | same | item RUN3-TRADE-PAGES live + 1 log line |
| IndexNow | n/a | n/a | 200 OK, the 19 changed URLs (dry run first) |

CHECKS RUN
- Diff guard: 19 pages changed (4 national + 15 city), nothing else; each city page changed
  exactly 2 lines (crumb + BreadcrumbList item); homepage untouched.
- Hero, before vs after, 390 + 1440, dark + light: label box, label CSS and every H1 line
  position identical; entrance delays still 0 / 80 / 160 ms.
- Player: plays at 390 and 1440, no overflow at 390, lowest text contrast 6.04, no
  console errors, lines up with the page's sections. Homepage player still 5 tabs and plays.
- City crumb at 390 + 1440: link, contrast 6.91, no overflow.
- entity_schema --check 0/0 · validate_jsonld 77 pages, 0 errors · llms-verify 146/154,
  the same as before the run (0 new red) · stamp-sitemap --check in sync.

ROLLBACK
- git revert d867967, push.
- Instant: promote dpl_297xtAdrw1vx9EFp6636AWmaVGEV (318ac7c) in Vercel.

NEXT
- Fix the reduced-motion headline bug below (one line in site.js, its own run).
- Watch Search Console on the six terms for 2 to 4 weeks.

GOTCHAS
- The hero is not pixel-for-pixel identical. One letter in each label is drawn about a
  quarter pixel differently (26 to 56 pixels at 1x, under 0.01% of the hero). That is
  because "// " is now drawn by CSS, as the PASTE asked. Layout, CSS and positions are
  identical, and at 4x zoom the two look the same, so step 3 stays on all four pages.
  To undo it on one page, put the label div back above the H1.
- Found, not fixed (outside this run): on the first page of a visit, people who turn on
  "reduce motion" see no hero headline at all. site.js adds the rise animation without
  checking that setting, and styles.css then switches the animation off, which leaves
  the lines invisible. This affects every page with the .hero-line rise.
- The player loads the homepage's three stylesheets on the 2 pages (guide.css,
  backstage.css, calls.css, about 90 KB before compression). Measured on both pages in
  dark theme: they change none of the 302 existing elements (light theme: hero checked only).
- js/calls.js (rev d) is shared with the homepage. The homepage keeps its old ?v=
  token because it was not to be touched. The change only adds data-call, and the
  homepage was checked: 5 tabs, plays.
- tools/stamp.py was re-run. Its token-only changes to 55 out-of-scope pages, the homepage
  among them, were reverted. The next stamp run will update their tokens.
- On the 15 city pages, the last crumb and the last BreadcrumbList item now point to
  the national page instead of the page itself, as ordered. Google may show that crumb with
  the national URL.
- The trade-page player keeps the homepage's data-event names (sample_play_calls,
  book_click_aftercall, sample_tab_*). GA4 tells them apart by page path.
- The single tab copied from the homepage carried aria-selected="false" there; it is
  set to true on these pages.
```
