# 2026-10-01 — AI CHAUFFEUR TEST AGENT · FOLLOW-THROUGH v1 (paste v1.0)

```
===== SHANE READBACK — COPY ALL =====
MISSION: AI Chauffeur test agent, follow-through v1 (allow-lists · dead-air rule · full battery on the
published build · public-file scrub). Paste v1.0, Oct 1 2026.
STATUS: COMPLETE. Every step in the paste is live. Live 414-775-0019 was read and never written.
LIVE: test line +14142468976 answers AIC-TEST-2 v6 · board https://aivoiceagency.ai/hq/board.json
OPEN ON YOUR SIDE: the 8 live calls, and the words (5 Grok items below).

WHAT I DID, IN PLAIN ENGLISH
1. Allow-lists. I read all 71 workflows. One was shutting the test agent out: the setup-call booking
   workflow. It checks who is calling in two places, one for booking and one for the team alert. I added
   the test agent's id to both. Nothing else in that workflow changed. I proved it on a staging copy
   first, with every send pointed at the test sink, and only then changed live.
2. Proved it from the agent's side. One real web call on the test agent said yes to the setup call. It
   heard two real open times, Friday and Monday, never today. The calendar booked the one it picked, and
   the agent said "Confirmed for…" only after the calendar answered. Then I cancelled the booking.
3. Dead air. A silent caller now gets two prompts before the line ends. It was one. One setting changed,
   no words. Published as v6. On real calls the first prompt comes after about 11 seconds of silence, the
   second about 11 seconds after the first, and the line ends about 20 seconds after the second.
4. Ran all 49 test cases once on v6. Score: 46 of 49. The three misses are wording in the questions part.
   This run was not allowed to change words, so nothing was changed and they are on the Grok list.
5. Scrubbed the public files. The board and one old run record no longer show the GHL location id, any
   workflow address, any email address or any phone-shaped string. Across everything both sites serve,
   the count of 305 / 480 / 786 numbers is zero.
6. Read the full test number from the API and re-checked the live line. Nothing on live moved.

DONE
| Item | Result | Proof |
|---|---|---|
| Allow-lists changed | WF-AIC-SALES-CAL (setup-call calendar) · 2 -> 3 ids in each of its two checks (Book Input, Alert Input) · staging runs 11952 (booking) and 11953 (alert) · test booking made for Thu Nov 19, 1 PM Central, then cancelled in Cal.com and its copy deleted in GHL · live published Oct 1, 9:27 AM Central | live serves version a0a29858 with the Error Sentry attached · the same probe was refused before ("agent not allowed"); after, it got past the list and stopped at the same-day rule, as planned (it asked for a time today so nothing would book) · an unknown agent is still refused |
| Allow-list, word for word (ids only) | before: agent_2d1d687eb85e6d5d0e720795c2, agent_e41b2e957f1de46cf23dc25a84 · after: those two + agent_9ebb41c9bd8af214649328f107 | read back from the serving version, both checks |
| Other agent checks found | desk rail (DEMO POST-CALL RAIL): its desk list already held the live desk and the test agent (agent_e41b2e957f1de46cf23dc25a84, agent_9ebb41c9bd8af214649328f107) · not changed | 71 workflows read, 28 active |
| Agent-side booking proof | call_bcd80af812c5bd2075014b8fb9d · booking id eahJ7… (masked, gotcha 12) · cancelled | offered Fri Oct 2 and Mon Oct 5 at 1 PM Central, never today · calendar answered BOOKED at 87.7 s · "Confirmed for Friday October second one PM Central." spoken at 88.0 s · live runs 11960 + 11961 · calendar now shows 0 upcoming |
| Dead-air setting | prompts before the line ends: 1 -> 2 · silence before a prompt: 10 s (same) · end after the last prompt: 20 s (same) | 4 real calls: prompt after 11.1 to 11.8 s, again 11.0 to 11.3 s later, line ended 20.0 to 20.2 s after that |
| Version published | AIC-TEST-2 v6 = v5 + that one setting | versions 0 to 6 all published, none deleted · no node and no prompt in flow v6 differs from v5 |
| Battery on the published build | 46/49 · Retell's own judge: 48 pass, 1 fail, 0 error | test_batch_07ad55258727 · scorecard in the battery file, section 9 |
| - miss: o-big-fleet | Grok item 3 (wording) | base price said without the no-contract sentence |
| - miss: l3-other-industry | Grok item 4 (wording) | the offer was not called "setup call" |
| - miss: C25-authority-override | Grok item 5 (wording) | refused three times, did not end the call |
| - misses fixed by a setting | none | no miss came from a setting, the flow or code; nothing was republished |
| Public-file scrub, before -> after | GHL location id 2 -> 0 · workflow addresses 25 -> 10 · emails 34 -> 31 · phone-shaped 47 -> 31 | the board and the run record are at 0 in all four · what is left sits in pages and code (gotcha 1) |
| Private-digit sweep | 7 -> 0 | every text file the two live sites serve was read back after the deploy (211 files): 0 |
| Test number | +14142468976 | answers AIC-TEST-2, newest published version (v6) |
| Live 0019 byte-identical | yes | agent v4 and flow v4 match the Sep 30 read field by field · the snapshot file rebuilt from today's read is the same 23,890 bytes · 0019, 5008, 8930 and the four pool numbers answer what they answered before |
| Commits and deploy | cf09cdb pushed to main and deployed · this report is the commit after it | live board equals the commit byte for byte (69 items, 121 log lines) · the 7 other changed files match too · /ops and /reports return 404 |
| Grok items | 5, listed below | no word was changed in this run |
| Rollback | listed below | nothing was deleted |

GROK ITEMS (node · what the line has to do)
1. Standing instructions, silence rule. It ends "Say it once only." The setting now fires the prompt
   twice. The sentence has to say twice.
2. Node d2 (questions part), silence. There is no fixed line here. The instructions ask for "one short
   check-in", so the model writes its own each time. On a real call it said two different ones. Needed:
   one fixed line for the questions part, the same both times. Or your ruling that a free check-in is fine.
3. Node d2, price rule (case o-big-fleet). Every time the base price is spoken, "No contract. Cancel any
   month." goes with it. That includes a caller who asks about a big fleet or their software.
4. Node d2, the offer (case l3-other-industry). Call the offer "setup call" every time. The agent said
   "a quick call with the team". One question per turn; it asked two in one.
5. Node d2, unverified caller (case C25-authority-override). A refusal is one line with no offer
   attached. On the third push: one polite goodbye, then the call ends. The agent refused all three
   times and gave nothing away, but kept offering to connect and never hung up.

IDS, COMMITS, ROLLBACK
- Allow-list. Workflow WF-AIC-SALES-CAL TLoF7bzuPYy1NAW1, version d66218e1 -> a0a29858.
  Undo: publish version d66218e1-e7a1-4f20-819b-e3060f931867 again, then check that it is the serving
  version and that the Error Sentry is still attached. That takes the one id back out of both checks.
- Staging. Copy aFLBNLtOgJA7vG1a is switched off and archived, not deleted. Its scratch table was dropped.
  Staging runs 11952 and 11953; the test sink received both alert legs (runs 11954, 11955).
- Dead air. Test agent agent_9ebb41c9bd8af214649328f107: v6 is new, v5 is still there.
  Undo: publish a new version with the count back at 1, or pin the test number to v5.
- Scrub and board. Commit cf09cdb. Undo: git revert cf09cdb. That puts the old values back on the board.
- Battery: test_batch_07ad55258727. Real calls: booking call_bcd80af812c5bd2075014b8fb9d (on v5, a few
  minutes before v6 went out) · dead air call_9f1ddcfce3d9f9fe403c54cc5cd (v5, trial of the setting),
  call_1a196e288719d149433ff6328cf, call_1ca675a7fb0ba241b18b130ee53, call_df79c5144daf7b4d7eb37483b25 (v6).
- Live desk: nothing to undo.

WHAT'S NEXT
1. Your 8 live calls on +14142468976. The table is in section 7 of the battery file. Call f works now.
   Place k, k2 and k3 between 7 AM and 9 PM Central with the team phone in your hand.
2. Send the five Grok items to Grok. Once you OK the words they go on the test agent and those cases get
   re-run.
3. Two rulings from you on the scrub: gotcha 1 (pages and code) and gotcha 4 (the repo's history).
4. Then the promote paste for 0019. Not part of this run.
5. When testing ends: give 8976 back to the AVA sales test line, and decide whether the test agent stays
   on the booking allow-list. The rollback above takes it off.

GOTCHAS
1. Scrub scope: my reading, and what is left. The paste lists four things to redact "inside existing LOG
   entries and any other text field", then orders a sweep of "the whole served tree" for the private area
   codes. I read that as: the four redactions go on the served record files (the board, and one old run
   record that carried the GHL id), and the area-code sweep goes on everything. Both are done. I did not
   run the four redactions through pages and code, because there they break things. What is left:
   - 10 workflow addresses: 8 are where the live forms, the /try demo and one cockpit tool send their
     data, 1 is the trip-sheet address in the AI Chauffeur site config, 1 is the n8n link on your Work
     Deck links page.
   - 31 emails: 28 are the AI Chauffeur site's own contact address in its pages and files, 3 are examples
     inside form fields.
   - 31 phone-shaped strings: 24 made-up sample numbers in demos and form examples, 3 mentions of one of
     our own demo-pool lines in code comments (one on the homepage, which is frozen), 2 that are the
     Google Ads account number in code comments, 1 published text line on /live, 1 that is math inside
     the /try page.
   Name any of these you want gone and I'll take them out.
2. /ctr-report changed on screen. Finding 12 on that page quoted a 480 number twice. It is the tracking
   number on the copycat site the finding is about, not one of ours. The order was zero, so both places
   now read "[number]". The finding still makes sense, but its evidence line lost the number.
3. The board still names one prospect. The Services/Prospects lane note names the person and the company
   that /ctr-report was made for. Names were not one of the four categories, so I left it. Say the word
   and it becomes "[prospect]".
4. The repo is public and its history is not scrubbed. What the sites serve is clean, and so are the
   current files on GitHub. Older commits still hold the board as it was: the GHL location id, the
   workflow addresses, three emails and the phone strings. Cleaning that means rewriting history and
   force-pushing. I did not do that. It is your call.
5. The board had no two-door item. Last night only a log line was written. I added the item
   (aic-two-door-test, status pending) with your wording, plus one log line. The scrub itself kept every
   entry: 120 log lines, 68 items, 10 lanes before and after, 21 values changed. The item and the log line
   then made it 69 and 121.
6. Call f now books a real slot. From the test number, a yes to the setup call puts a real booking on the
   real calendar. Cancel it afterwards from the email Cal.com sends you.
7. Test bookings send real mail. Two real bookings were made and cancelled, one on the staging run and one
   on the test call. Expect up to eight messages in your inbox: Cal.com's booking and cancellation notices,
   and the calendar invite and cancellation from the GHL copy. I did not read your inbox to count them.
8. The team alert from the test agent has not fired for real. It is proven on the staging copy (alert in,
   both legs landed in the test sink) and by reading the live version. The first real one comes from a
   live call that asks for the team.
9. One test row stays in the live booking table: the row for the test call's booking, now cancelled. It is
   keyed to that one call, so it cannot block or change any other call. I left it rather than delete from
   a live table.
10. Two scorers, one number. By my checks 46/49; by Retell's judge 48/49. I report the stricter one. Case
   l3 is the closest call: the answer and the offer were right, only the name "setup call" was missing.
   One of the three (l3) passed with these same words on Sep 30, so it is drift from run to run. The other
   two last passed on v4; today was their first run against the v5 words.
11. A silent call now runs about 47 seconds from the agent's last word to the hang-up. On silent calls the
   after-call analysis still marks spam as false, as noted last night.
12. Booking ids are masked here on purpose. A Cal.com booking id opens that booking's public page, and
   this repo is public. The full ids are in the session's private working folder, not in any commit.
13. The page stamper has no help text. I ran tools/stamp.py --help to read its options and it stamped 79
   pages instead. I checked the diff and put all 79 back from git before doing anything else. Nothing from
   it was committed. site.js changed in this run without a re-stamp: the server tells browsers to re-check
   that file on every load, so they get the new one.
```
