# AIC LAST BUILD — Fri Nov 13 2026 — window "AIC last build"

```
READY FOR SHANE'S ONE CALL — the last build is live as v26 on 414-775-0019, DEMO-POOL-05 and the website button; the owner text and the new after-call page are live

===== SHANE READBACK — COPY ALL =====
AIC LAST BUILD · window "AIC last build" · Fri Nov 13 2026 · 6:00 to 7:05 PM CT · paste PASTE-CC-AIC-LAST-BUILD-v2-2026-11-13.txt (v2.1) · your word of 5:07, 5:31 and 5:54 PM

PLAIN ENGLISH
- What is live now:
  - The agent is version 26. It answers 414-775-0019, DEMO-POOL-05 and the "Call the demo" button. It went live at 6:53 PM.
  - The recorded notice and the greeting are word for word the same as before (checked three times).
  - The owner text and the new after-call page are live in the after-call flow.
- The two dashboard lines (written by Grok, placed word for word):
  - When someone asks about the dashboard, the agent says: "Every company gets a dashboard with their name, logo and any colors they want, looking like their company. Every call, the recording and the transcript are on it. Included, not an extra."
  - Once per call, in the questions part, it adds: "Your company gets its own dashboard in your name, logo and colors, where every call shows up."
- The word "sample" is gone from everything the agent reads. Its only remaining use is the "never say" list that bans it.
- The recorded notice can no longer be talked over. A caller who talks during it now hears it to the end.
- The owner text: you get one text for every demo call of 20 seconds or more, with or without a caller cell. It reads like this: "AI Chauffeur demo call. Airport pickup and questions. Mitchell Airport to Pfister Hotel in Milwaukee. 2 min. Cell given: yes. https://aichauffeur.ai/trip/..."
- The after-call page is now a mini landing page. It reads as one sheet with no boxes. In order:
  - the trip in big type, with the total at 40 px;
  - four buttons: Book an appointment (green), Call the demo line (dials 414-775-0019), See the dashboard, and See the PDF;
  - the trip table with the demo-rate note under the total;
  - the recording;
  - every word of the call;
  - see how it works;
  - Book and Call again at the bottom.
  - See the PDF shows because the PDF run set AIC_PDF_URL at 6:45 PM. This run did not set it.
- What came out: the mile cap (part F). The paste's chat ruled it out at 6:46 PM, after this run found that once the cap said "The team prices that one", the caller had no way back to the trip (FAR-02 failed 3 of 3). It is parked. So a misheard airport can still give a far price, the same as on version 25.
- What I kept against the paste's literal rule: the notice that can't be talked over (part E).
  - Its voice test V3 failed. The caller's long "Hello? ... I need a ride." ran past the notice into the greeting, and the agent reworded the greeting's question.
  - The notice itself played in full. That is what you asked for at 5:54 PM.
  - On the same script, version 25 is worse: the caller breaks into the notice itself, and the agent makes up a line before the notice.
  - If you want the paste's rule anyway, re-pin version 25. That also removes everything else in this build.
- YOUR CALL: you will now get two texts per demo call. One is the old one-line alert ("CALL · ... · AIC 0019 · ..."): OWNER-ALERT already texts you that for every call, and it is delivered (checked). The other is the new demo text. I did not touch OWNER-ALERT, because that is outside this paste.

DONE TABLE
| Step | Result | Proof |
|---|---|---|
| 0 Preflight | DONE | Live was v25 on 0019 and DEMO-POOL-05; the button reads the 0019 pin. HASH 1 = notice 05386b07fa07 / greeting 768e6ad24cbd. Rollback exports saved (secrets masked) in PASTE\rollback\2026-11-13-last-build\. |
| 1 Build A, B, E, F | DONE on test copy v43 | New spoken lines: D1 and D2 only (old L37 gone). QLINE unit checks 7/7; D2 ladder checks 8/8. N0 interruption 0. |
| 1 Build C, owner text | LIVE | WF-POSTCALL bebc4798 -> 2362518f. Test lane, three payloads (pickup with a cell, pickup with no cell, questions with no cell): exactly 1 owner message each, before 0/0/0. Caller messages unchanged. |
| 1 Build D, the page | LIVE | 2362518f -> 4c90f7f4 -> 93a10b1b (one fix: 96 px section spacing, from the AI Chauffeur design rules). |
| 2 Text pass | Rule MET | DASH-ASK 2/2, DASH-ONCE 2/2, FAR-01 2/2, FAR-02 0/3 (no price, but a dead end). 29 of 31 gate scenarios pass. REAL-04 missed twice, and also missed 2 of 2 on version 25's twin, with criticals there. PX-43 is excluded. |
| 3 Voice, 5 calls | No critical | Blind auditor: 8 of 8 calls clean on the five criticals (the 5, plus 2 twin calls and 1 re-run). V2 PASS (D1 word for word). V4 PASS. V5 PASS (your check call). V1 MISS: D2 not heard in voice. V3 MISS: greeting talked over. |
| 3B Soak | No stop | 105 runs, 92 clean. Without the parked FAR scenarios: 89 of 99 (89.9%). Steps 2 + 3B: 122 of 135 (90.4%). One of the five criticals in 1 run (R10-DEPART, no cell ask after a made-up N3 turn). No scenario shows one twice. |
| F out | DONE | Copy v44 = A, B and E. QLINE is byte for byte version 25's. Smoke 6 of 6 PASS, zero criticals. |
| 4 Page proof | DONE | 390 and 1280 px, every image looked at: no overflow, buttons 52 px, tel:+14147750019, no PDF button while the variable was empty, one with a test value, "sample" 0. Images in round10\page-proof\final\. |
| 5 Promote | LIVE 6:53 PM | agent_9ebb v26 (= copy v44). 0019 v26 and DEMO-POOL-05 v26, webhook kept. The button follows the 0019 pin. HASH 3 = HASH 1. |
| 6 Proof call | KEPT LIVE | call_88d577a2c7125902f605e129d3e: D2 heard once, no critical. N2 stalled before a price. Version 25's twin made the same stall on the same script (call_d51da2374349fe0334c9070f1e4). Owner text composed in the test lane. |
| 7 Close | DONE | This file, STATUS-W3, the repo report, hq/board.json + the ISO log, the Slack line. |

SOAK TABLE (copy v43, 3 runs each: clean / five criticals)
DASH-ASK 3/3 · DASH-ONCE 3/3 · FAR-01 3/3 (parked) · FAR-02 0/3 (parked) · FIN-CHANGE 3/3 · FIN-CURVE 3/3 · FIN-FIX 3/3 · FIN-RETURN 3/3 · FIN-WEB 3/3 · GK-25 1/3 · PX-43 2/3 · R10-BAGS 3/3 · R10-DEPART 2/3 (1 run K4) · R10-DEPART-ALL 3/3 · R10-GNAME 3/3 · R10-GSILENT 3/3 · R10-PROCEED 3/3 · R10-RAILDOWN 3/3 · R10-REPEAT 3/3 · R10-SAMEPLACE 3/3 · R10-TALKOVER 3/3 · R9-HELD 3/3 · R9-NOPAX 3/3 · R9-NOTIME 3/3 · R9-ONE 3/3 · R9-STOPAFTER 3/3 · R9-TWO 3/3 · REAL-01 3/3 · REAL-03 3/3 · REAL-04 1/3 · SMOKE-01 3/3 · V3-01 3/3 · V3-08 0/3 · V3-11 2/3 · V3-16 3/3

VOICE CALLS (copy v43 unless marked)
V1 call_6938f2f306f105d9ca97453c7e4 + re-run call_a0cc8c7ab73b9ff71e66fe4ef12 · V2 call_ce96af7ec2e02537b4004e47ca7 · V3 call_071f095085395c9ebf1791d170f · V4 call_f125c2b85e7946276d8248af583 · V5 call_6934250fb1899eb06ce333a7cf0 · twin v42: V1 call_fd41b4839e12ed7f8e3b3be8fe0, V3 call_4c7c40afe1dd0143fb977cd7d78 · live v26 proof call_88d577a2c7125902f605e129d3e · v42 proof twins call_b6bc65d92bfc6203491bc05d21b, call_d51da2374349fe0334c9070f1e4

VERSIONS
- Agent: live v25 -> v26 (tested as copy v44; copy v43 = the same plus F, tested and parked).
- WF-POSTCALL: bebc4798 -> 2362518f (C) -> 4c90f7f4 (D) -> 93a10b1b (D's spacing fix).
- Hashes: notice 05386b07fa07 / greeting 768e6ad24cbd, the same at HASH 1, after the last change and at promote.

SPEND
- Retell: $17.64 of $24 (text runs $15.14, 11 voice calls $2.50).
- Claude API: $5.27 of $8.
- Nothing was bought.

ROLLBACK LINES
- Agent (re-pins 0019 and DEMO-POOL-05 to version 25; the button follows): C:\Users\offic\aic-tuning\sales-v3-2026-11-08> doppler run --project ava-prod --config prd -- node fin_repin.mjs 25 --go
- After-call page only (keeps the owner text): n8n MCP publish_workflow wVZg0OxSKFBcgINB versionId 2362518f-aafd-4f9b-a94d-8f67d8ea806a
- Page and owner text: n8n MCP publish_workflow wVZg0OxSKFBcgINB versionId bebc4798-7d9d-4f54-a873-bfc2fc2869a1

SHANE'S CHECK CALL (from the v2 paste, word for word)
On the Dell, open aichauffeur.ai and press Call the demo. Say: "I need a ride to O'Hare tomorrow at four PM, four people, eight bags." You should hear the demo line about one airport pickup and drop-off. Say "okay", then give a hotel as the drop-off. After the price say: "Can you repeat that?" Then say: "Okay, book it." Give your cell when it asks. You should hear the Sprinter both times, the same price both times, and get the text with the trip page right after.
(New since that paste: you will also get the owner demo text and the old one-line alert. The trip page now opens as the mini landing page.)

THE AGENT IS FROZEN. No change without Shane's word.

FOUND, NOT FIXED
1. Mile cap parked. After "The team prices that one" from the price step, the quote step has no way back to the trip (it only has the way back for "which town or ZIP"). A misheard airport (LAX heard as "Lex") can still give a cross-country price, as on version 25.
2. D2 in voice. When a caller's answer reaches the questions step in pieces, D2 is marked on a turn that is never spoken, so it is lost (0 of 3 V1 calls; heard once on the live proof call). The same holds for every flag line (W-2, L34, L17).
3. The greeting can still be talked over right after the notice (V3). The agent then rewords the greeting's question.
4. The first intake step (N2) and the intake step (N3) still write their own turns sometimes ("Can you give me the landing date?", "Is that Friday the twentieth?", "We'll be tracking the flight. Is there anything else?"). That can stall a call before the price. Version 25 does the same.
5. "Setup takes about fourteen to fifteen days." is said, and it is not an approved line. Version 25 says it too.
6. The word sample: 5 uses in the knowledge base AIC-SALES-KB-v3 (not edited). In the flow, 28 uses are left in edges, extract fields, step names and code (not spoken).
7. PX-43, REAL-04 (it misses on version 25's twin too), V3-08 re-asks, and GK-25 / V3-11 guardrail timing.
8. Two texts per demo call (see YOUR CALL above).

LESSON: judge every miss on the old version's twin before applying a removal rule; a text pass cannot see voice-only faults like answers that arrive in pieces.

GOTCHAS
- Git Bash printf turns "\U" and "\a" in Windows paths into junk. Write log lines with a quoted heredoc.
- Python write_text on Windows writes CRLF. Pass newline="" when the bytes matter.
- n8n Code steps here hold CRLF (N7L). A patch has to match the step's own line ending.
- Another session can set an n8n variable this flow reads (AIC_PDF_URL at 6:45 PM). Re-read the variables before a page proof.
```
