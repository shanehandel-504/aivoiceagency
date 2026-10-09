# CC-SHOOT-PREP-v3 — push to call on both sites

Paste dated Oct 8 2026. Run on Oct 9 2026 (Central). Site commit `1963428`.

## What ran and what did not

The owner cut the run after the read-only step. Ran: step 0 (read-only), step 3 in full on both
sites, three n8n workflows turned off, and the read-only answers for steps 5 and 6. Not run:
steps 1, 2 and 4 (the hidden shoot page and its callback) and step 7. No Doppler value was added.
No phone agent, post-call rail, booking workflow or GoHighLevel record was changed.

```
===== SHANE READBACK — COPY ALL =====
WHAT CHANGED
Neither site asks for a number or places a call any more. Every "try it" or
"call me" control is now one tap that dials the line from the visitor's own
phone: 414-775-0019 on aichauffeur.ai, 414-240-8930 on aivoiceagency.ai.

DONE TABLE
aichauffeur.ai/try call page ........ LIVE   undo: git revert 1963428
aichauffeur.ai, 74 Try controls ..... LIVE   undo: git revert 1963428
aivoiceagency.ai/live call page ..... LIVE   undo: git revert 1963428
Call AVA block, 3 pages + site.js ... LIVE   undo: git revert 1963428
Browser-call files out of the site .. LIVE   undo: git revert 1963428
Money Path Spine .................... OFF    undo: publish 82bd9f69-c7b1-4a1c-b828-ed816eae384b
WF-TRY-WEBCALL ...................... OFF    undo: publish 4514c0c1-8acd-45c3-8e20-198db0070529
LIVE INTAKE v1 ...................... OFF    undo: publish 32dd3550-1c35-490d-9863-b9ce1d589ad1
Tap test, both lines ................ DONE   each call reached the right agent
Steps 5 and 6 ....................... READ   answers below, nothing changed
Steps 1, 2, 4 (shoot callback) ...... DEFERRED by the owner
Step 7 .............................. SKIPPED by the owner

WHAT IS NEXT
The shoot callback run. Before it: bind the 414-775-0019 outbound side to the
two-door agent, and set SHOOT_ALLOWLIST and SHOOT_FORM_SECRET in Doppler. The
two picks for that run are recorded in "Deferred" below.

GOTCHAS
- The Oct 6 test did not go through the spine. It was the /live form; the
  reply to its text was not READY, so no call went out, and the caller dialed
  414-240-8930 instead.
- GoHighLevel still forwards inbound texts to the /live reply address. That
  address is off now, so each forward gets a 404. Nothing breaks.
- Three served files still name the old browser-call endpoint in words only:
  hq/board.json (old log lines), chauffeur/DESIGN-SYSTEM.md and
  AVA_WEBSITE_V2_PROMPT.md. No served code does.
- If the worker in infra/retired/retell-token-worker.js was ever deployed at
  Cloudflare, it is still there. This run did not look at Cloudflare.
- /book on both sites, /reserve and /intake are unchanged by ruling.
- The tuning check-call harness still uses the old web-call version and still
  has to be rebuilt before Oct 18. This run did not touch it.
```

## Step 3 — what is live

### aichauffeur.ai

| Surface | Before | Now |
|---|---|---|
| `/try/` | Browser call with a gate panel, transcript, meter, recording, receipt and an email form | One screen: "Hear it answer. Call from your phone.", the button "Call AI Chauffeur" (`tel:+14147750019`), the number in JetBrains Mono |
| "Live demo" in nav, drawer and footer (57 links) | link to `/try/` | `tel:+14147750019` |
| Related "Demo" cards (8) | link to `/try/` | `tel:+14147750019` |
| Inline links (5) | "Try AI Chauffeur …" to `/try/` | "Call AI Chauffeur …" to `tel:+14147750019` |
| PUSH TO TRY AI buttons (4) | link to `/try/` | three read PUSH TO CALL AI and dial; the fourth sat in the homepage QR dialog and is removed |
| Copy | "it talks to you in your browser" in page text, FAQ structured data and `llms.txt` | says to call (414) 775-0019 |

### aivoiceagency.ai

| Surface | Before | Now |
|---|---|---|
| `/live` | Form: business details and a cell, a READY text, then AVA called back from a pool line | One screen: "Hear AVA answer. Call from your phone.", the button "Call AVA" (`tel:+14142408930`), the number |
| `/ground-transportation`, `/chatgpt-example`, `/templates/vertical.html` | Call-me widget that posted to the spine | Call AVA block with the number |
| `/legacy/index-legacy-2026-07-07.html` | Same widget, archived copy | Markup untouched; `site.js` swaps it for the Call AVA block when the page loads |
| `site.js` | Posted the widget's fields to the spine | Posts nowhere. New cache token `bacf4549` on the 47 pages that load it |
| `/api/web-call`, `/retell-token-worker.js`, `/js/config.js` | served | 404. The first two moved to `infra/retired/`; `js/config.js` removed |

The AVA homepage was not touched. The nav item "Hear AVA Live" still points at `/live`, which is
now the call page.

### Files changed (the rollback list)

One commit, `1963428`, 76 files. `git revert 1963428` restores every one of them; cache tokens
then need one more bump.

- Rewritten: `chauffeur/try/index.html`, `live/index.html`
- Edited: `site.js`, `ground-transportation/index.html`, `chatgpt-example/index.html`,
  `templates/vertical.html`, `chauffeur/index.html`, `chauffeur/what-it-does/index.html`,
  `chauffeur/what-it-can-do/index.html`, `chauffeur/llms.txt`, `chauffeur/DESIGN-SYSTEM.md`,
  and the 17 other `chauffeur/**/index.html` pages (links only)
- Moved: `api/web-call.js` and `retell-token-worker.js` to `infra/retired/`
- Removed: `js/config.js`
- Token only: the `/site.js?v=` value on the other aivoiceagency.ai pages
- By the commit hook: `sitemap.xml`, `chauffeur/sitemap.xml` (lastmod)

### Proof

| Check | Result |
|---|---|
| Render gate before the commit, local, 8 pages at 390×844 and 1440×900 | 16 of 16 clean |
| Same gate on production after the deploy | 16 of 16 clean: no horizontal overflow, no console error, no failed request, no request to n8n, Retell or a script CDN |
| Both call pages fit one screen | page height equals the viewport at both sizes; number bottom at 524 px (AI Chauffeur) and 480 px (AVA) on the 844 px phone screen |
| Contrast, measured | headline and number 16.74:1 (AI Chauffeur) and 17.31:1 (AVA); button labels 12.18:1 and 11.16:1 per the token tables |
| Twelve live pages and files fetched | 0 hits for the browser-call library, the web-call endpoint, `/v2/`, a spine or intake webhook address, or a link to `/try/` |
| Phone numbers | every `tel:` link on aichauffeur.ai is 414-775-0019; every one on the changed aivoiceagency.ai pages is 414-240-8930 |
| Removed endpoints | `/api/web-call` (GET and POST), `/retell-token-worker.js`, `/js/config.js`: 404 |
| Tap test, Oct 9, from one of the owner cells | 11:54 AM CT, `call_48c7d271…`, 31 s, reached AVA `agent_d5ada9f774fe3ae7f034d2c677` v51 on 414-240-8930. 11:55 AM CT, `call_3940030c…`, 38 s, reached AIC-LIVE two-door `agent_9ebb41c9bd8af214649328f107` v13 on 414-775-0019 |

Counting code only: zero references in the served tree. Words only, in documents and the ledger:
`hq/board.json`, `chauffeur/DESIGN-SYSTEM.md`, `AVA_WEBSITE_V2_PROMPT.md`.

## n8n — three workflows turned off

Turned off after both sites were verified live, so no live page ever posted to a dead address.

| Workflow | Id | State now | Undo: publish this version |
|---|---|---|---|
| AVA Layer 1 — Money Path Spine | `u3FaLLiH0loGf1BN` | inactive, nothing serving | `82bd9f69-c7b1-4a1c-b828-ed816eae384b` |
| WF-TRY-WEBCALL | `9nKn8i2dRuALikuv` | inactive, nothing serving | `4514c0c1-8acd-45c3-8e20-198db0070529` |
| LIVE INTAKE v1 | `V6wAFgJ803xmLM0K` | inactive, nothing serving | `32dd3550-1c35-490d-9863-b9ce1d589ad1` |

Checked after: each draft still equals the version above, the Error Sentry is still attached to
each, and all seven of their webhook addresses answer 404. The Error Sentry, both post-call rails
and both booking workflows are active and unchanged.

With LIVE INTAKE off, nothing on the site sends a text to a typed number and nothing dials out.
It was also the only workflow that called the website-reading model, so that call no longer
happens either.

## Step 0 — what the read found

### a. Money Path Spine (serving `82bd9f69` when read)

- Posted to by four aivoiceagency.ai pages through `site.js`: `/ground-transportation`,
  `/chatgpt-example`, `/legacy/index-legacy-2026-07-07.html`, `/templates/vertical.html`. Fields:
  `first_name`, `phone`, `source`, `selected_role`, `business_type`, `email`, `tcpa_consent`,
  `tcpa_consent_at`, `company_url` (a hidden trap field). No aichauffeur.ai page posted to it.
- Its last run was Sep 16 2026, from a homepage form on aichauffeur.ai that has since been removed.
- **The Oct 6 test came from the `/live` form, not the spine.** LIVE INTAKE v1 ran twice that
  afternoon: the form submit (contact filed, READY text sent), then a reply that was not READY,
  so no call went out. The same caller then dialed 414-240-8930.
- Brand: `Route by Brand` sends from 414-775-0019 when `source`, `brand` or `tag` contains
  "chauffeur", otherwise from 414-240-8930.
- Agent: the spine names none, so Retell uses the outbound agent bound to the number. On
  414-775-0019 that is the old capture desk `agent_e41b2e957f1de46cf23dc25a84` at its latest
  published version, 5. It is not the two-door agent.
- Start values sent: `first_name`, `cell`, `business_type`, `email`, `brand`. The capture desk
  reads none of them. Its opener is a fixed line that says AI Chauffeur; the name Ava appears
  nowhere in that agent. **It would not say the form's first name.**
- The spine, the capture desk and the demo rail have never run together.
- Gate, in order: trap field filled; consent not true; not a phone number; not +1; invalid
  US/Canada shape; 900/976, twenty Caribbean area codes, toll-free; a number on `OUR_NUMBERS`;
  an allowed call to the same number in the last 24 hours. A block wrote one row to
  `callback_gate_log`, texted the owner and answered 403.
- `OUR_NUMBERS` holds 11 entries: the eight Retell lines, the text line, and both owner cells.

### b. DEMO POST-CALL RAIL (`TkETvvnABhUPd7ME`, serving `c7bd86fd`)

- Caller number, same order for every call: the number the caller says, then the number the
  agent captured from caller id, then `call.from_number`. On an outbound call `from_number` is
  our own line, so the rail would need to read the called number there.
- Our own numbers: `Flags Ctx` sets `is_our_number`; `Our Number (GHL)?` skips `Find Caller`,
  `Create Caller`, `Tag Caller`, `Note Caller`; `Own Number (text)?`, `Find Own Caller` and
  `Resolve Caller Contact` send the caller text to the test contact, which has no phone. The owner
  email, owner text, trip sheet and sheet row still go out.
- Sends for a real caller: the trip sheet page, a row in the trip log sheet, the owner email to
  shane@aivoiceagency.ai, the owner text to the owner-alert contact, and the caller text with the
  trip sheet link. **The caller text goes only when a trip was captured and the caller said yes
  to the text.** A setup-call ask adds the setup texts and a team alert.
- What GoHighLevel gets: a contact found by phone, or created with name, phone, company, source
  "AI Chauffeur demo line", the tag `demo-caller` and the trip fields. On an existing contact,
  the tag and one note with the trip line and the trip sheet link. The caller's texts sit in
  that contact's conversation. A booked setup call adds an appointment entry and the tag
  `aic-setup-call`. A call with no trip writes nothing to the contact. Owner alerts land in the
  owner-alert contact's thread.

### c. AVA line (`6r8YHuMEJbxeDyT5`, serving `e0454827`)

- Caller text: yes, for an inbound call of 10 seconds or more that is not spam, not voicemail
  and not handed to the AI Chauffeur desk. It reads: "AVA here from AI Voice Agency — thanks for
  calling. $497/mo, done-for-you, answers every call 24/7. Book a walkthrough:
  book.aivoiceagency.ai — AVA Team. Reply STOP to opt out." A transportation caller who was not
  handed off gets the AI Chauffeur demo-line text instead.
- Email to the caller: no. Both caller-send steps are disabled.
- GoHighLevel: contact upsert by phone (source "AVA Inbound Demo Call", tag `ava-demo-hot`) and
  one call-log note.
- Appointment: only when AVA books on the call, on the GoHighLevel calendar "AVA Demo Call".
- Owner alert: a text to the owner-alert contact and an email to shane@aivoiceagency.ai, both
  held back for our own numbers.
- `WF-POSTCALL-AVA · 8930 Call Wrap` is active with no runs on record. Nothing points at it.

### d. Native Retell–GoHighLevel connection

Read in the Retell dashboard, nothing changed. It is an API-key connection named
"GoHighLevel - API key", last edited Sep 1 2026 (the Oct 8 rows there are Notion and Cal.com). It
points at the same GoHighLevel location the rail writes to. Contact Sync is off, and it is used
by no agent. It writes nothing for a call today. Two switches would change that: the Contact
Sync toggle in that panel, or adding a GoHighLevel function to an agent.

### e. Landing times

Seconds after hang-up, read from each run's own log. The time is when GoHighLevel or Gmail
accepted the send, not when the handset showed it.

| 414-775-0019 | To whom | Oct 5 | Sep 28, second call | Sep 28, first call |
|---|---|---|---|---|
| Call report reaches n8n | rail | 7.6 | 4.1 | 5.6 |
| Trip sheet page stored | trip link | 9.7 | 6.2 | 7.6 |
| Contact tagged and noted | caller's contact | 10.7 | 8.2 | 8.3 (created) |
| Trip log row | sheet | 14.4 | 9.6 | 10.5 |
| Owner email | shane@aivoiceagency.ai | 15.4 | 10.4 | 11.2 |
| Owner text | owner-alert contact | 17.9 | 12.9 | 12.5 |
| Caller text | caller's phone | 18.8 | 14.5 | not due |
| Setup-call "booked" text | caller's phone | 36.9 | — | — |
| Team alert text / email | owner | 38.3 / 38.8 | 16.9 / 17.4 | — |

| 414-240-8930 | To whom | Oct 8, evening | Oct 8, morning | Oct 6 |
|---|---|---|---|---|
| Call report reaches n8n | rail | 1.3 | 2.6 | 1.9 |
| Contact | caller's contact | 3.4 | 4.8 | 4.1 |
| Call-log note | same | 3.6 | 5.1 | 4.4 |
| Caller text | caller's phone | 4.8 | 6.8 | 5.6 |
| Owner text | owner-alert contact | 6.9 | 8.6 | 7.5 |
| Owner email | shane@aivoiceagency.ai | 7.5 | 9.3 | 8.2 |

### f. Browser calls and forms, as found before the change

- `/try` on aichauffeur.ai: browser-call library version 3.0.1 from a script CDN, posting to
  WF-TRY-WEBCALL, which called the version 3 web-call endpoint. The paste expected version 2 of
  both; the move to 3 was made on Oct 7.
- The call-me widget on the four aivoiceagency.ai pages in section a.
- `/live` on aivoiceagency.ai, posting to LIVE INTAKE v1.
- `/api/web-call` (a function that answered 503) and `/retell-token-worker.js` (a worker source
  file served as plain text).
- Forms that call or text no typed number, left alone by ruling: `/book` on both sites,
  aichauffeur.ai `/reserve`, `/intake`.

### g. Voice and version

| Line | Agent | Version | Voice | Provider | Voice model | Max call |
|---|---|---|---|---|---|---|
| 414-775-0019 inbound | AIC-LIVE two-door | 13, pinned | Kate | Cartesia | `sonic-3.6` | 12 min |
| 414-775-0019 outbound and the test line, both ways | AI CHAUFFEUR — CAPTURE DESK | latest published, 5 | Kate | Cartesia | `sonic-3.6` | 12 min |
| 414-240-8930 both ways | AVA — AI Voice Agency | latest published, 51 | Kate | Cartesia | `sonic-3-latest` | 10 min |

Published versions, newest first. The time is each version's last-modified stamp in Central,
the only time the API carries.

- Two-door: v13 Oct 2 12:09 PM · v12 Oct 2 10:29 AM · v11 Oct 1 6:11 PM · v10 Oct 1 5:37 PM ·
  v9 Oct 1 3:37 PM · v8 Oct 1 12:38 PM · v7 Oct 1 11:03 AM · v6 Oct 1 9:37 AM · v5 Sep 30
  10:43 PM · v4 Sep 30 10:26 PM. All `sonic-3.6`.
- AVA: v51 Oct 7 1:47 PM and v49 Aug 30 2:59 PM are `sonic-3-latest`. v48 Aug 19 10:46 PM ·
  v46 Aug 19 10:43 AM · v45 Aug 18 8:17 PM · v44 Aug 18 1:52 PM · v43 Aug 18 12:41 PM ·
  v42 Aug 18 11:38 AM · v41 Aug 17 5:57 PM · v40 Aug 13 1:23 PM are `sonic-3.5`.
- Capture desk: five published versions, v5, v4, v3, v1, v0. All `sonic-3.6`.

**The change is AVA v49, Aug 30 2026, 2:59 PM Central:** `sonic-3-latest` replaced `sonic-3.5`.
Before v40 no model was set. The AVA agent was never on 3.6 in any of its 52 versions. 3.6 is
what both AI Chauffeur agents carry on every version.

## Step 5 — booking (read only)

- 414-775-0019: WF-AIC-SALES-CAL (serving `47af9608`) books the Cal.com event type "AI Chauffeur
  Setup Call" (20 minutes), then copies it to the GoHighLevel calendar "AIChauffeur Setup Call".
  Cal.com adds new bookings to its default destination calendar, a Google Calendar on a personal
  Google account, not shane@aivoiceagency.ai, and checks conflicts against three connected
  Google accounts. Last real proof: a call on Oct 5, run 12323: Cal.com booking, GoHighLevel
  copy, then the "booked" text.
- 414-240-8930: WF-AVA-SALES-CAL (serving `17f9249b`) books straight onto the GoHighLevel
  calendar "AVA Demo Call" (15 minutes). No Cal.com. GoHighLevel's own Google link for that
  calendar could not be read by API, and no real phone booking has run since the Oct 7 go-live.

## Step 6 — ChatDash (read only)

Connected to the 414-775-0019 agent: **no.** ChatDash holds one agent, the AVA 414-240-8930
agent, added Jun 17 2026. Retell's account webhook is empty, the 414-775-0019 agent's only
webhook is the n8n rail, and the n8n variable `CHATDASH_URL` is empty. No 414-775-0019 call
appears in ChatDash, so there is no call id to cite. Nothing was set up.

## Deferred — the shoot callback (steps 1, 2 and 4)

Deferred by the owner on Oct 9. What that run needs, and the two picks recorded for it:

- **First: bind the 414-775-0019 outbound side to the two-door agent.** Today it is the old
  capture desk. Note for that run: the two-door flow reads no first-name start value either, so
  the name will be filed but not spoken unless the agent's words change, which is not Claude
  Code's to write.
- `SHOOT_ALLOWLIST` and `SHOOT_FORM_SECRET` in Doppler. Neither exists yet.
- **Pick, how the hidden page carries the key:** the key rides in the link. The owner opens
  `aichauffeur.ai/shoot/#<key>` once on each device; the page remembers it and clears the
  address bar. The repo is public, so the key cannot sit in the page file.
- **Pick, the owner-alert contact:** one owner cell is the owner-alert contact's own number. That
  row stays protected: the caller text still reaches that phone, but the rail does not tag,
  rename or note the owner-alert row. Every other number on the list is filed in full with the
  tag `shoot`. The form submit skips the spine's own GoHighLevel write; the post-call rail files
  the contact after the call.
- The rail must read the called number on an outbound call (section b).
- The spine is off. That run starts by publishing `82bd9f69-c7b1-4a1c-b828-ed816eae384b` or its
  replacement.
- The caller text still depends on a captured trip and a spoken yes.
