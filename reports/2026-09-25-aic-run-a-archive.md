===== SHANE READBACK — COPY ALL =====

AI CHAUFFEUR CAPTURE DESK — RUN A: ARCHIVE-FIRST + PRECONDITIONS · 2026-09-25

WHAT I DID (plain English)
- I froze a copy of the AI Chauffeur phone agent exactly as it answers today (v27). It sits in
  Retell as its own agent, not published and not on any number. If run B goes wrong, this copy is
  the undo button.
- I saved everything the desk runs on into the repo's /archive folder. That covers both agents and
  their flows, the post-call rail, the rate engine and its 7 rate tables, the commit rail, both
  caller-lookup rails, the /try web-call rail, and the sales booking rail. I added a rollback
  bundle with the exact API call to restore each piece, and an index of 16 capabilities. Secrets
  were scrubbed before the commit. A sweep checked every file against the real value of 24
  secrets and 3 private numbers and found 0 leftovers.
- /archive is blocked from all three websites. It returns 404 on aichauffeur.ai,
  aivoiceagency.ai and ai100x.ai.
- I tested the booking calendar end to end: read open times, book one, check it, delete it. It works.
- I traced the "time offered, then not available" bug. The cause is **not** a time-zone mix-up.
  The agent names a time before it has checked the calendar, and the booking rail then refuses it
  with the wrong reason.
- Call recordings play in a web browser straight from Retell's link. No copying is needed.
- I found the name the real Aug 17 caller typed into the booking form. The post-call rail
  overwrote it on Sep 24. I did not change the contact.
- Nothing that answers a phone, runs a workflow or holds tenant settings changed. Before and after
  readings match exactly.

DONE TABLE
| Artifact | Status | Evidence |
|---|---|---|
| Archive agent created | DONE | `agent_932712356e6093929d711033d2` "AIC-FULL-ARCHIVE (frozen 2026-09-25)", v0, unpublished, 0 numbers bound. Own flow `conversation_flow_fe11945611fa`: 0 content differences from flow v27 apart from Retell's default `skippable:false`, and 9 of 9 component refs resolve. One platform-default field was added (`contact_memory_config` read=true). |
| Retell exports | DONE — 12 files | AIC agent v27 + flow v27 + 3 local components, draft agent v28, Reliable v29 + flow + 2 components, archive-agent record, number bindings. The account has 0 shared components. |
| n8n exports | DONE — 15 files | The 4 requested workflows + WF-ANI-AIC + WF-TRY-WEBCALL + the booking rail, a listing of all 29 workflows (23 active, 0 drift), and 7 rate tables (127 rows). |
| Rollback bundle | DONE | `archive/ROLLBACK-BUNDLE-2026-09-25.md`: versions, bindings, /try, tenants, restore calls R1–R7 |
| Archive index | DONE | `archive/ARCHIVE-INDEX-2026-09-25.md`: 16 capability rows, each verified 2026-09-25 |
| Redaction pass | PASS — 8 values in 5 files | 5 `x-rate-secret` values + 3 copies of the owner's personal email. Scrubbed at export time: SIP trunk config (8 numbers), /try visitor-IP runtime data, owner project blocks. Private numbers found: 0. Negative control: a sweep-only run over planted values exits 1 with 9/9 caught, and redact-plus-sweep exits 0. |
| .vercelignore + 404 proof | DONE | `archive` added. On deploy of `7189a10`: 4 archive paths × 3 hosts = 12/12 return 404; each host's `/` returns 200 as a control. |
| Calendar verdict | `UaxV0ENx2cEUYs6qeWZ7`: trustworthy YES, **with fixes** | Open hours are real (Mon–Fri 1–6 PM CT). Free-slots is exact (75 = 11 + 60 + 4). Create 201 + GET match, delete 200. Reads take 0.2–0.5 s. **Create takes 1.2–2.7 s, which does not fit a 3 s tool.** |
| Booking mechanism found | DONE | AIC flow: no calendar tool. Reliable v29: no tools (v19–v26 had `book_appointment`). AVA sales v49: one custom `book_appointment` → n8n `c5GPBkma1HyvonEa`, default timeout, **no availability tool**. No Retell-native GHL calendar function exists (Retell's native ones are Cal.com). |
| Failure cause from evidence | DONE | 38 booking attempts on 30 calls (Jul 2–Sep 4): 18 booked, 20 refused. 0 slots were sent in Eastern time. Cause = caller-first ordering plus a rail that misreads the calendar (details below). |
| Recording verdict | Browser-playable as-is | Public CloudFront URL, unsigned, no expiry. HTTP 200 with no auth, `binary/octet-stream`, 14.5 MB WAV, byte ranges supported. Headless Chromium and WebKit both loaded it (302.9 s). |
| Sheets credential | NO | 8 credentials, none for Google Sheets. Click steps under WHAT'S NEXT. |
| Data Tables | YES | 12 tables exist, API returns 200. None created. |
| Vercel rewrite feasible | YES | `chauffeur/vercel.json` has redirects and headers but no rewrites, and there is no `/trip` folder to shadow it. n8n webhook base: `https://circulant.app.n8n.cloud/webhook/` |
| Original name found | YES | Taken from the booking widget's own form record (appointment `BvHR9CC1f23ycPhPX27z`, Aug 17). The name is in the Notion receipt, not here, because the repo is public. |
| board.json flipped | DONE | `aic-capture-desk` → `run-a-archive-complete`, log entry appended |
| Found and fixed: private numbers on the public site | DONE | Since `4fbda4c` (2026-07-17), one `board.json` log line had listed all three private numbers. `board.json` is served at aivoiceagency.ai/hq/board.json (HTTP 200). The 3 occurrences are now `[REDACTED-private-number]`. They remain in git history. |
| Report committed | DONE | this file |
| **LIVE CHANGES MADE** | **NONE** | Before 19:12:57Z and after 19:34:13Z, all unchanged: 8/8 number bindings · 3 agents' version count, max published and per-version timestamp hash (AIC v27, Reliable v29, sales v49) · flow v27/v28/v29 timestamps · all 29 n8n version ids (rail `0652d902-…`) · rail node hash (tenants) `9d2841934512cdd9` · 7 rate tables' row counts. The only writes were the unbound archive agent + flow, and one test appointment on the ZZ sink, created then deleted. |

CALENDAR — THE DETAIL
- Two candidates, one schedule. AIChauffeur Setup Call (`UaxV0…`): 20-min slots, no buffers, no
  minimum notice, 1 per slot. AVA Demo Call (`aCIv…`): 15-min slots, 15 min before + 30 min after,
  4-hour minimum notice, 30 days ahead, 3 per day. Both run on the owner's "Work Hours" schedule,
  Mon–Fri 13:00–18:00 America/Chicago, and both have the same assigned user. Title `{{contact.name}}`.
  Default form collects first name, last name, email and phone. Auto-confirm is on, Google invites
  are on, and alerts are in-app only.
- Why `UaxV0…`: it is the aichauffeur.ai/book calendar. `aCIv…` is the AVA parent's strategy call,
  and the two brands must not cross.
- The failure, measured. 5 refusals said `slot_taken`. Only one was a real conflict: Aug 20 2 PM,
  an earlier test booking. Of the others: Jul 29 2 PM was asked at 10:50 AM, inside the 4-hour
  notice. Aug 12 9 AM is before the 1 PM opening, but the rail's own fence says 8 AM–6 PM. Aug 17
  5:20 PM is off the 15-minute grid. Aug 6 2 PM has no appointment or block in GHL, so it is
  unexplained. 5 more said `outside_service_hours` (7 PM, 6 PM, Sundays). All were times the
  caller or agent picked before any check.
- Timing inside n8n: free-slots 0.35–0.63 s · the Slot Gate Code node **1.7 s on every run** ·
  create 1.2–2.1 s (2.7 s in this run's direct test).

IDS · COMMITS · ROLLBACK
- Archive agent `agent_932712356e6093929d711033d2` · archive flow `conversation_flow_fe11945611fa`
- Live: AIC `agent_2d1d687eb85e6d5d0e720795c2` v27 (flow `conversation_flow_ec560891b66b` v27) ·
  Reliable `agent_367be6cf3c722e89fca03e34b5` v29 · rail `TkETvvnABhUPd7ME` @ `0652d902-3832-4a62-ba89-9edd73e33b2f`
- Commit `7189a10` = the archive + `.vercelignore`. The report and board are in the commit after it.
- Undo this run: `git revert 7189a10` removes the archive. The archive agent stays in Retell until
  someone deletes it by hand; this run deletes nothing.
- Undo a bad run B: `archive/ROLLBACK-BUNDLE-2026-09-25.md` R1 (pin the phone to v27), R2 (republish
  v27 content, which also covers /try), R3 (serve the frozen copy), R5 (restore any n8n workflow).

WHAT'S NEXT (RUN B)
1. Give the chauffeur sales branch two n8n functions on `UaxV0…`. `get_open_slots` fits a 3 s
   timeout. `book_slot` needs 8 s or more with speech during the wait, and no Code node on the
   path. The agent offers only times that `get_open_slots` returned.
2. Rebuild the slot check to trust GHL's free-slots only. Delete the 8–18 fence, send true reason
   codes, and set the end time from the calendar's slot length.
3. Stop the rail's caller upsert from overwriting a name that already exists, then put the Aug 17
   caller's name back.
4. Decide (Shane): are weekday 1–6 PM CT the right hours for setup calls?
5. Decide (Shane): the repo is public, so should /archive stay on GitHub?
6. If run B needs Google Sheets, in n8n: left sidebar → Overview → Credentials tab → Create
   credential (or the arrow beside Create Workflow → Create credential) → search "Google Sheets OAuth2
   API" → Continue → Sign in with Google → choose the account → Allow → Save.
7. `/trip/:id`: add a `rewrites` entry to `chauffeur/vercel.json` pointing at
   `https://circulant.app.n8n.cloud/webhook/trip/:id`.

GOTCHAS
- **The three private numbers were on the public website for 10 weeks.** An old `hq/board.json`
  "LAWS-CHECK" log line listed them, and that file is served at /hq/board.json. They are redacted
  now, but they are still in git history. Rewriting history is your call.
- The `board.json` sweep still flags the `OWNER_ALERT_EMAIL` value. It is an `@aivoiceagency.ai`
  alert inbox, not a credential or a private number, so I left it. It was already in 5 older entries.
- **The GitHub repo is PUBLIC.** `.vercelignore` hides /archive from the websites, not from GitHub.
  No secrets are in it, but prompts, flows and the rate card can be read at
  github.com/shanehandel-504/aivoiceagency/tree/main/archive.
- Neither chauffeur number is pinned; both follow `latest_published`. /try does too. A number pin
  (R1) does not cover /try.
- Draft v28 is waiting, unpublished, with a 12-minute cap (live is 15) and a 60 s silence hang-up.
  Anything published from the head will carry it.
- The chauffeur flow calls WF-ANI `XLSd3vt41vhsXIA9` for caller lookup, not WF-ANI-AVA. The brief
  named the sales line's rail. Both are archived.
- The booking rail says "slot taken" for closed hours, for the 4-hour notice window and for off-grid
  times. The agent then tells callers the time "just got taken".
- GHL delete is soft. A deleted appointment still reads 200 with `deleted:true`. Judge by the
  calendar list or free-slots.
- Recording links are public and never expire. A 5-minute call is a 14.5 MB WAV.
- n8n keeps only 17 runs of the booking rail (Aug 29–Sep 6). The older evidence came from Retell's
  call records.
- WF-COMMIT: 23 of its last 30 runs were idempotent repeats. Nothing was written twice, but the
  commit fires more than once per call.
- The rail's owner-email recipient is typed into the node, and it is not the n8n `OWNER_ALERT_EMAIL`.
- The public text line 350-220-5305 is left in the archive on purpose. It is the published footer
  number, not a private one.
