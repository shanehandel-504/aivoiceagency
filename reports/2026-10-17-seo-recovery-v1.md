# SEO-RECOVERY v1 · 2026-10-17

RUN INCOMPLETE — PART 4.2 / SHANE'S 16 BRICKS WERE NOT DRY-RUN: claude/PASTE-BRICKS-2026-10-17.txt IS NOT ON THIS MACHINE OR IN DRIVE / SAVE EACH CORRECTED BRICK AS bricks/inbox/<aic|ava>/<slug>.txt, THEN RUN node scripts/brick.mjs --all --dry

Parts 1, 2, 3 and 5 are live on production. Part 4 (the answer press) is built and tested and publishes nothing, as ordered. Part 6 is this report and the board.

===== SHANE READBACK — COPY ALL =====

WHAT HAPPENED, IN PLAIN WORDS
- aivoiceagency.ai never counted its visitors. Vercel's counter was turned on, but no AVA page loaded the counter script. The one visit Vercel saw in 31 days was a /chauffeur page. Now every AVA page that loads the tracking file loads the counter too. A real browser load of / and /book now reports a page view and gets back a 200.
- aichauffeur.ai now says the canon lines: "Answers the call. Quotes your rates. Books the trip." "One call or a thousand" and "1 or 1,000" are gone from the site. Every "17 years" now reads "14 years".
- Both sites have a pricing page that search and AI engines can quote. aichauffeur.ai/pricing/ shows $997 a month and a $997 one-time setup. aivoiceagency.ai/pricing shows $497 a month. Every menu links to them, and both sitemaps list them.
- Both llms.txt files (the summary AI engines read) now quote only words that are live on their own site. A checker proves it on demand: node scripts/llms-verify.mjs.
- The answer press is built (scripts/brick.mjs). One brick file in, one answer page out, checked before anything is written. Nothing was published.
- Bing (and through it ChatGPT search and Perplexity) gets every page of both sites at 7:00 AM Chicago time every day, and again on every production deploy. First run: both sites answered 200.

DONE
| Part | Files changed | Verified by (exact command → result) | Live |
|---|---|---|---|
| 1 · AVA page counter | js/tracking.js · tracking.js ?v= on the 60 pages that load it · sitemap.xml (lastmod hook) | Playwright, Chrome user agent: `node va-check.mjs https://aivoiceagency.ai/ https://aivoiceagency.ai/book` → `POST https://aivoiceagency.ai/_vercel/insights/view 200` on both, 0 console errors | yes |
| 2 · AIC canon facts | chauffeur/index.html · chauffeur/how-setup-works/index.html · chauffeur/madison-limo-answering-service/index.html · chauffeur/milwaukee-limo-answering-service/index.html · chauffeur/llms.txt · chauffeur/DESIGN-SYSTEM.md · scripts/llms-verify.mjs (new) | `curl -s https://aichauffeur.ai/ \| grep -ic "one call or a thousand"` → 0 · title and H1 = "Answers the call. Quotes your rates. Books the trip." · `curl -s https://aichauffeur.ai/llms.txt \| grep -ic -e "one call or a thousand" -e "17 years"` → 0 · `node scripts/llms-verify.mjs --live` → GREEN 86/86 segments, 20/20 links · `python tools/truth_audit.py --page chauffeur/index.html` → 0 defects (was 2) | yes |
| 3 · Pricing pages | chauffeur/pricing/index.html (new) · pricing/index.html (new) · Pricing in the Product nav/drawer/footer of 19 chauffeur pages · nav + footer chrome of 56 AVA pages · tools/stamp.py · sitemap.xml · chauffeur/sitemap.xml · llms.txt | `curl` → aichauffeur.ai/pricing/ 200, H1 "One price. Everything on the list.", $997 ×16 · aivoiceagency.ai/pricing 200, H1 "AVA starts at $497 a month.", $497 ×10 · both sitemaps list them · `python tools/validate_jsonld.py` → 86 pages, 0 errors · `node scripts/llms-verify.mjs --live` → AVA GREEN 110/110, 37/37 links · prod render 390 + 1440: 0 overflow, 0 console errors | yes |
| 4 · Answer press | scripts/brick.mjs (new) · bricks/inbox/aic, bricks/inbox/ava, bricks/built/aic, bricks/built/ava (.gitkeep) · tools/stamp.py (answer pages register themselves) · .vercelignore (bricks/) | `node scripts/brick.mjs --site aic --file <fixture> --dry` → PASS 435 words, 0 schema errors · `--site ava` → PASS 408 words, 0 errors · broken fixture → FAIL with all 8 planted faults · real build in a throwaway worktree: runs 2 and 3 changed nothing · `curl` /answers/ on both hosts → 404 (nothing published) | n/a (publishes nothing by order) |
| 5 · IndexNow daily + deploy hook | n8n gdFqOxFFVe13CfvX · Vercel webhook account_hook_D3CX9I1nt4NXFPIY76iLje47 · automation/seo-indexnow-daily.workflow.json | ZZ sink first: exec 14947 (fail path, 2 alert lines at the sink), 14950 (ok path, 2 IndexNow bodies at the sink, no alert) · live exec 14953 → aivoiceagency.ai 200 (61 URLs), aichauffeur.ai 200 (20 URLs) · deploy deliveries 14954 + 14955 → 200/200 each | yes |
| 6 · Board + report | hq/board.json · reports/2026-10-17-seo-recovery-v1.md | board.json parses; 5 items + 1 log entry appended | yes |

ANSWERS
(a) AVA showed zero visitors because no AVA page ever loaded /_vercel/insights/script.js (Web Analytics was on the whole time). The fix: js/tracking.js now loads it on every page that loads the tracking file.
(b) https://aichauffeur.ai/pricing/ and https://aivoiceagency.ai/pricing
(c) 19 retired lines came off aichauffeur.ai: "one call or a thousand" ×8, "one call to a thousand" ×4, "1 or 1,000" ×1, "17 years" ×6. Every one now reads 0.
(d) IndexNow: aivoiceagency.ai 200 · aichauffeur.ai 200 (live run 14953, and again on both deploy deliveries).
(e) Waiting on Shane: the Slack alert credential. In n8n, open Credentials → Add credential → "Header Auth". Name it "Slack Bot ava_command (SEO alerts)". Set Name to Authorization. Set Value to "Bearer " followed by SLACK_BOT_TOKEN from Doppler ava-prod/prd. Save. Then open workflow "SEO — IndexNow daily" → node "Alert #social" → pick that credential → Publish. Until then, a failed ping pages you through the Error Sentry instead of posting to #social. (This run's tool permissions would not write a token into n8n.) Also waiting on Shane: the 16 corrected bricks (see NEXT).
(f) NEEDS WORDS:
   1. aichauffeur.ai/how-setup-works/, Cost section: the H2 "There is no price list, and here is the reason.", its two paragraphs, and the rows "No packages / What drives it / Not metered / When you hear a number". Plus the FAQ "What does it cost?" (visible and JSON-LD): "It depends on the operation… There is no package to pick from, which is why there is no price list on this page." All of it now contradicts /pricing/.
   2. aichauffeur.ai/how-setup-works/: "Your dispatcher still prices the trip." contradicts "Quotes from your rate sheet".
   3. aichauffeur.ai/ (homepage setup block) and chauffeur/llms.txt: "Every build is custom to your operation — your rates, your service area, your vehicle classes. We scope it on the setup call." reads against one published price. Unchanged: not on the 2.1 list.
   4. aivoiceagency.ai/ground-transportation (2 lines) and /wisconsin-limo (2 lines) still say "17 years". These are AVA pages, outside this run's chauffeur/ sweep.
   5. The caller email footer (2.4) lives in n8n, and this run may not edit it. Its exact strings are below.

2.4 · WHERE THE EMAIL FOOTER LIVES (rides the next agent run; nothing changed)
- Workflow TkETvvnABhUPd7ME "DEMO POST-CALL RAIL v1 (all demo agents)", node "Build Trip Ticket" (ACTIVE):
  - 'AI Chauffeur answers your phone, takes the whole trip, reads it back, and sends the sheet — one call or a thousand, any hour.'  → change "one call or a thousand, any hour" to "any hour"
  - 'AI Chauffeur answers your phone day and night, takes the whole trip, and sends you the sheet — one call or a thousand.'  (FOOTER_PICK B)
  - 'AI Chauffeur answers the phone for limousine, black car and chauffeured transportation companies. It takes the whole trip, reads it back, and texts a sheet like this one — one call or a thousand.'
- Workflow 3PfmC7sxOjUHI0rE "WF-TRIP-SHEET — AI Chauffeur trip sheet page v1.0", node "Build Page" (ACTIVE): the same third string. It is a call workflow, so it was left alone too.
- Inactive ZZ STAGING copies (3pTWPbVyHSRCfHdM, KKinym6AIQIUAeUF, aSJzU8khFwNZ9RSC, kSCtouiy1iO5fL2S, br6hEmHKjcizrITx) carry the same strings and were not touched.

IDS AND ROLLBACK
| Checkpoint | Commit | aivoiceagency deployment | aichauffeur deployment | One-line rollback |
|---|---|---|---|---|
| before this run | 8fbe535 | dpl_eEgpiWC7eqT2u1jCB4CWVSnqXFxo | dpl_CzGv69eY3UDaPGHEHVMridoHDvFo | promote these two to undo every page change |
| Part 1 | 435bd58 | dpl_7mT2wXC4zmXHQjcKr9vWocU8noja | dpl_HYTdv6PSpJK2vg6xjqQwbQ5qkeAC | `git revert 435bd58` |
| Parts 2 + 3 | aed5436 · 3c930b9 | dpl_GAW62qEhk4mYw7FgMWqwNufXYNVP | dpl_3og7FZjX6jh1wUsmbKEWto5fgdxj | promote the Part 1 pair, or `git revert 3c930b9 aed5436` |
| Parts 4 + 5 | 183cb9b · 30ecd38 · 2a7150b | dpl_EmoFKbnU1iSVYGuvo5zqwBoJGdb7 | dpl_3WFcAydt9jJKGxXRVqW5wxAyj62T | `git revert 2a7150b 30ecd38 183cb9b` (tools/scripts only; no page changes) |
- n8n "SEO — IndexNow daily": gdFqOxFFVe13CfvX, active version 2738ef57-3f6c-4d85-99de-209d1701eedc (first publish 71a6873d-05e7-4c60-b481-0294078ad336). Error Sentry SlnAeMrVRORsF0w7 attached. Rollback: unpublish it in n8n.
- Vercel webhook: account_hook_D3CX9I1nt4NXFPIY76iLje47 (deployment.succeeded, both projects → https://circulant.app.n8n.cloud/webhook/indexnow-deploy). Rollback: `npx vercel@61.0.0 webhooks remove account_hook_D3CX9I1nt4NXFPIY76iLje47 --scope shanehandel-504s-projects`.
- IndexNow key 69c6723b4b145a13877f1c954bdb0e09 (public by design), served 200 at both roots.

PART 0 · WHAT EXISTED BEFORE
| # | Question | Answer |
|---|---|---|
| a | scripts/brick.mjs | no |
| b | chauffeur/pricing/index.html | no (chauffeur/rates/ is a different page) |
| c | pricing/index.html | no |
| d | AVA shells load /_vercel/insights/script.js | no, on 0 AVA pages ever |
| e | Web Analytics on for aivoiceagency | yes: the script served 200 and the API answered |
| f | n8n workflow named IndexNow | no (0 of 78 by the n8n API) |
| g | key file 200 on both hosts | yes, byte-exact |

CHECKPOINT 8 · FILES OUTSIDE THE PASTE'S LIST, AND WHY
- 60 AVA pages: the tracking.js ?v= token only (one line each), so browsers fetch the new tracker.
- 56 AVA pages: the nav Pricing href and one footer line, written from the new tools/stamp.py templates. A full stamp run in a temp copy matched 57/57 pages.
- tools/stamp.py: the two chrome strings; both new pages registered; answer pages register themselves.
- sitemap.xml / chauffeur/sitemap.xml: lastmods written by the pre-commit hook.
- scripts/llms-verify.mjs: the INDEXING RUN 1 verifier was never committed, so it was rebuilt.
- chauffeur/DESIGN-SYSTEM.md: "17 years" → "14 years" in the authority-rail line.
- .vercelignore: bricks/, so inbox drafts are never served.

NEXT
1. Add the Slack credential (answer e).
2. Correct the 16 Friday bricks to the canon, save them as bricks/inbox/<aic|ava>/<slug>.txt, run `node scripts/brick.mjs --all --dry`, read the PASS/FAIL list, then build for real.
3. Get words for the NEEDS WORDS lines, starting with /how-setup-works/'s Cost section.
4. Give the next agent run the 2.4 footer strings.

GOTCHAS
- Vercel's analytics script ignores headless Chrome. A Playwright check with the default user agent loads the script but never sends a page view. Use a normal Chrome user agent and mask navigator.webdriver, or the check fails while the site works.
- A full `python tools/stamp.py` run rewrites every hand-set token on the chauffeur pages and adds ?v= to their /_vercel/insights/script.js tag. This run never ran it in place. Run it only on purpose, and check the diff.
- aic.css already owns `.answer` as a panel component. An answer page's body carries `page-answer`, not `answer`, or the whole page paints as a bordered box.
- AVA llms.txt had 23 lines that quoted homepage words rewritten on Oct 1. They were replaced with the live lines that replaced them, one for one. llms-verify now counts a <title> or meta description as served text and labels it "live (meta)". The AIC summary sentence is one such line: the paste dictated it, and it lives in the homepage meta description.
- Node on Windows aborts (exit 127, a libuv assertion) when process.exit() runs while fetch sockets close. brick.mjs sets process.exitCode instead.
- The deploy webhook's signing secret was never displayed or stored. The n8n webhook accepts a run only when the body says deployment.succeeded with target "production". Anything else gets a 200 and no execution.
- /how-setup-works/ now sits one click from /pricing/ while it still says "There is no price list". That is the first NEEDS WORDS item.
