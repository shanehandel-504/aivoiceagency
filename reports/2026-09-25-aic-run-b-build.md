# AI Chauffeur Capture Desk — RUN B: test agent, calendar rail, post-call rail v2, trip sheet, site copy

2026-09-25 · 20:17Z–21:45Z · commits `a072c2d` (archive moved) · `b92668d` (site) · this report + board.
Undo steps: private repo `shanehandel-504/aivoiceagency-archive` → `archive/ROLLBACK-BUNDLE-2026-09-25.md` § 7 (U1–U5).
Nothing sensitive is in this file: no lead names, no private numbers, no recording links, no keys.

```
===== SHANE READBACK — COPY ALL =====

WHAT HAPPENED (plain English)
The new capture desk is live on a TEST agent. Nothing that answers 414-775-0019 changed.
- 414-409-5008 and aichauffeur.ai/try?agent=test now reach the test agent. Every word it speaks
  comes from your approved lines, with one exception: when a caller goes quiet, Retell makes up
  a check-in line (gotcha 1).
- After each call, the post-call rail does its jobs once per call: it stores a trip sheet at
  aichauffeur.ai/trip/<ref>, texts and emails the owner, texts the caller the trip-sheet link,
  tags and notes the caller in GHL (never renames them), and writes a row to the trip log sheet.
- A call where nothing was captured sends one MISSED CAPTURE alert.
- The setup-call calendar tools (open slots, book, team alert) are live.
- The site shows the new capture-desk copy.

DONE
| Item | Live | Proof |
|---|---|---|
| Archive moved to private repo | yes | github.com/shanehandel-504/aivoiceagency-archive (a072c2d removed /archive from the public repo) |
| Test agent + flow | yes | agent_e41b2e957f1de46cf23dc25a84 (AIC-LEAN-TEST) v0 · conversation_flow_c3c710be6c94 v0 |
| Published | yes | agent v0 and flow v0 both is_published=true |
| Web-test-callable | yes | 2 web calls through /try?agent=test today, both on agent v0 |
| Lines | 53 / 53 | 91 nodes · 50 static-text nodes = 48 line nodes + the booking wait line + 1 composer speaker · 49 lines + 4 composer frames = 53 = the block · zero LLM-worded node prompts |
| Global prompt | byte-exact | 1381 chars in flow = 1381 in the block |
| Tools | yes | get_open_slots 3000 ms · book_slot 8000 ms · team_alert 2000 ms · no knowledge base |
| WF-AIC-SALES-CAL | published | TLoF7bzuPYy1NAW1 c58f71de · server p50: slots 372 ms (max 1988, n=58) · book 91 ms (max 2304, n=7) · alert 83 ms (max 2183, n=3) |
| Rail tenant rows | yes | test agent row mode TEST; CAPTURE_ONLY on 0019 + test rows; no reserve link |
| Rail dedup | yes | same payload posted twice: 1st run every leg, 2nd run every leg skipped (exec 10673 → 10678) |
| Rail label | yes | "TRIP REQUEST — DEMO" on demo tenants |
| trip_sheets store | yes | Data Table x9ANXgd6qTcriXQn |
| WF-TRIP-SHEET | published | 3PfmC7sxOjUHI0rE 2dab7f6d · server p50 65 ms |
| /trip 200 | yes | aichauffeur.ai/trip/AIC-REAL0004-0199 → 200, text/html, no-store, noindex, audio player present, transcript present; unknown ref → 404 |
| Owner SMS | 201 | "TRIP REQUEST — DEMO · <name> <number> · <one-liner> · <trip-sheet link>" |
| Owner email | sent | ticket subject, "EXCEPTIONS: none" strip, trip-sheet link |
| Caller SMS | 201 | "AI Chauffeur: your trip sheet with the recording and transcript is ready — <trip-sheet link>" |
| GHL safeguard | proven | Sim #1 replay onto a ZZ contact on a 555 number: found → tagged demo-caller + note added, name unchanged |
| Lead contact from RUN A | restored | first + last name set back; read-back matches; tags + phone unchanged (no name printed) |
| Sheet leg | enabled | row appended to "AI Chauffeur — Trip Requests", tab per tenant |
| Missed-capture branch | proven | 5 s web call → call_analyzed → "MISSED CAPTURE — 0m 5s — <recording>" text 201 + email |
| Vercel rewrite | live | /trip/:id → n8n /webhook/trip/:id (b92668d) |
| /try agent param | live | ?agent=test sends agent_key=test → test agent; no param → live agent (WF-TRY-WEBCALL b81c966b) |
| Copy | live | see COPY below |
| 5008 → test agent | yes | in + out → agent_e41b…a84 latest_published (was agent_367be6…b5 Reliable) |
| 0019 unchanged | yes | in + out → agent_2d1d687eb85e6d5d0e720795c2 latest_published, before = after; version list hash unchanged, max published v27 |
| Board + report + receipt | yes | hq/board.json → run-b-test-agent-live · this file · Notion receipt |

COPY (before → after)
- Homepage console step row + badge: "Quoted" → "Captured" · "Booked" → "Ticketed"
- FAQ + FAQ JSON-LD: "sample rate card" → "sample trip ticket"
- 5 related-page links: "Try AI Chauffeur and hear it book a trip" → "Play the customer and request a trip."
- #built: new "Included · Custom options" pair
  (INCLUDED IN THE CAPTURE DESK / CUSTOM OPTIONS)

LIVE CHANGES MADE — exactly these
- 414-409-5008 rebind → test agent (in + out)
- Rail TkETvvnABhUPd7ME: 0652d902 → e161d03b
- WF-TRY-WEBCALL 9nKn8i2dRuALikuv: 89829d66 → b81c966b
- Site deploy: b92668d (aichauffeur.ai)
- New workflows: TLoF7bzuPYy1NAW1 (WF-AIC-SALES-CAL) · 3PfmC7sxOjUHI0rE (WF-TRIP-SHEET)
- 0019 agent: NONE · 0019 number: NONE
- Temporary workflows (staging rail copy, isExecuted probe, sheet helper) were unpublished and archived.

ROLLBACK (one line each; full calls in the private bundle § 7)
- U1 rail: MCP publish_workflow TkETvvnABhUPd7ME versionId 0652d902-3832-4a62-ba89-9edd73e33b2f
- U2 5008: PATCH update-phone-number/+14144095008 → agent_367be6cf3c722e89fca03e34b5 latest_published, in + out
- U3 /try: MCP publish_workflow 9nKn8i2dRuALikuv versionId 89829d66-d05c-4e54-96de-2647f627db69
- U4 kill switch: unpublish TLoF7bzuPYy1NAW1 and/or 3PfmC7sxOjUHI0rE
- U5 site: git revert b92668d, push

WHAT'S NEXT
- Your three smoke tests (SMOKE READY list).
- Decide the silence nudge (gotcha 1) and the owner-contact variable (gotcha 2).
- Then promote to 0019.

GOTCHAS
1. SILENCE SPEAKS UNAPPROVED WORDS. Your settings (nudge at 8 s, max 1) make Retell's model
   say its own line on silence: "Just checking in—are you ready to request a trip? Would you
   like airport, point to point, or by the hour?" It does not use N09-SILENCE1. The global
   prompt also says never ask if the caller is still there.
   On the same web call, "end call after 20 s of silence" did not end it: the page hung up at
   80 s. Your choice: nudge max 0 (no invented line; relies on the silence hang-up, which
   still needs a phone test), or keep it.
2. $vars.OWNER_ALERT_CONTACT_ID POINTS AT A DELETED GHL CONTACT (GHL: "Contact not found").
   Any rail whose owner text falls back to that variable texts nobody. This rail is not
   affected, because it finds the owner row by $vars.OWNER_CELL. Not changed here; other
   workflows read it.
3. § 9 FIX. The rail's "Ensure Owner Contact" used to UPSERT the owner-alert row, which also
   rewrote its tags. It is now a read-only lookup, and so is the new team-alert lookup. The
   row's last update time was unchanged after the replay.
4. OWNER EMAIL now goes to $vars.OWNER_ALERT_EMAIL, not the gmail that was hard-coded in the node.
5. CALL 5008 FROM YOUR OWN CELL AND NO CALLER TEXT ARRIVES. Your cell is in OUR_NUMBERS, so
   the caller text is routed to the ZZ sink contact, and that contact has no phone. The owner
   ticket, the owner text and the calendar event still arrive. To see the caller text, call
   from a phone that is not one of ours.
6. CALLER SMS HAS NO "Reply STOP" LINE. That is your approved text exactly, but MESSAGE FORMAT
   LAW wants STOP on the first touch.
7. THE /trip PROOF LINK NOW 404s ON PURPOSE. The replay reused a real demo call's recording, so
   the 3 test trip sheets were deleted after the 200 proof. The replay rows in the trip log
   sheet still link that recording (private sheet).
8. TEXTS YOU GOT FROM THIS RUN, none of them a lead:
   - 1 CALL ALERT at ~20:56Z (my callable-check web call);
   - 2 TRIP REQUEST — DEMO tickets (staging + real replay);
   - 2 MISSED CAPTURE alerts (5 s call + 80 s silence call);
   - plus the calendar test alerts.
9. A 555 test number fails at Twilio (30006), and GHL then turns on SMS DND for that contact.
   The ZZ replay contact was cleared once. Expect DND again on the next replay.
10. A REST PUT on an ACTIVE n8n workflow publishes at once. It put an unfinished rail live
    for a few minutes. The undo (U1) was run and proven; no call ran in that window. Staging
    went through a copy after that.
11. Still open from the build:
    - there is no approved AI-disclosure line;
    - a bare "airport" is treated as an arrival;
    - "next Saturday" means the soonest Saturday;
    - going back to the greeting repeats the whole greeting.
```
