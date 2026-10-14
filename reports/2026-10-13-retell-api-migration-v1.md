===== SHANE READBACK — COPY ALL =====

CC-RETELL-API-MIGRATION v1 · 2026-10-13 · deadline Sat Oct 18 2026

PLAIN ENGLISH
Retell's two warnings are handled. Everything on the Dell that talked to Retell's old addresses now
uses the new ones. Each one was run once, and each one worked.
- The 3 old web-call requests came from the scripted test caller used in tuning runs (the Oct 9
  voice-pin run). It now uses Retell's new browser client, version 3.0.2. One test call on AVA
  proved it: AVA's voice reached the caller, the caller's words reached AVA, and AVA hung up after
  the goodbye. Test mode was on, so no owner alert went out. No phone line rang.
- The 1 old test-case request came from a one-off read on Oct 9. It now uses the new address.
  It returns the same 54 saved test cases, byte for byte.
- The 96 old call-list requests: the only timed job that ever used that address is the cockpit
  metrics job, every 30 minutes. It was moved on Oct 7 and has logged OK on every run since.
  I found nothing else using it. The schedule is unchanged.
- Nine repo tools had been moved to the new addresses on Aug 17 but never committed. They are on
  main now.
- Neither website loads a Retell browser library any more (removed Oct 9), so no site file
  changed. Phone agents, prompts, voices and numbers were only read, never written.

DONE
| Caller | Old endpoint | New endpoint | Tested | Proof |
|---|---|---|---|---|
| Tuning test caller (vp-listen, Dell) | POST /v2/create-web-call + SDK 2.0.7 RetellWebClient | RetellClient 3.0.2 (pinned) → POST /v3/create-web-call | yes | one web call, call_38529dbf5e2fde6bd7f08348d6b: gateway transport (v3), agent audio reached the caller, every caller line in AVA's transcript, greeting exact, 0 talk-overs; after-call run 13888: no contact, text or alert node |
| 8 older run copies of that caller + 1 preflight (Dell) | same v2 | stopped: each exits before any request | yes | ran under Doppler: "RETIRED" exit 3, no request sent |
| Discovery-prep read (Dell, one-off) | GET /list-test-case-definitions | GET /v2/list-test-case-definitions, paged (2 pages) | yes | 54 = 54 definitions, all byte-identical to the Oct 9 legacy read |
| retell_calls.py (Dell, July) | POST /v2/list-calls | POST /v3/list-calls + GET /v2/get-call for recording_url | yes | 200 most recent listed, recordings read, newest = today's test call |
| fetch_clone_calls.py (Dell, July) | POST /v2/list-calls | POST /v3/list-calls + GET /v2/get-call | yes | ran: clone has no calls (same answer v2 gave) |
| run5/state_check.py (Dell, July) | POST /v2/list-calls, GET /get-agent-versions | POST /v3/list-calls, GET /list-agent-versions (paged) | yes | ran: test agent found, versions read, test calls listed |
| retell_voice.py (Dell, July) | GET /list-phone-numbers | GET /v2/list-phone-numbers (paged) | yes | ran: 8930 found, voice rail read |
| run5/list.sh (Dell, July) | GET /list-phone-numbers | GET /v2/list-phone-numbers (paged) | yes | ran: 8 numbers; July snapshot file restored after |
| tools/retell-8930-forensics.mjs (repo) | /list-phone-numbers, /v2/list-calls | /v2/list-phone-numbers, /v3/list-calls (paged) | yes | ran read-only: bound agent resolved, 25 calls pulled |
| tools/retell-number-pool.mjs (repo) | GET /list-phone-numbers | GET /v2/list-phone-numbers (paged) | yes | --list: 8 numbers |
| tools/run65-proof.mjs (repo) | POST /v2/list-calls | POST /v3/list-calls | yes | ran: list read; answer agrees with the 24h check |
| tools/n8n-rail-repair.mjs (repo) | GET /list-agents | POST /v2/list-agents + GET /get-agent | yes | audit mode (read-only): every agent's webhook read |
| tools/outage_recovery_audit.py (repo) | POST /v2/list-calls | POST /v3/list-calls (paged) | yes | retell_calls() alone: unique calls, all inside the window; its report file untouched |
| tools/retell-aic-agent.mjs, retell-v37-assemble/-test-build/-test-verify.mjs (repo, write tools) | GET /list-phone-numbers | GET /v2/list-phone-numbers | helper only | not run (they write agents or place calls); their list code cut out verbatim and run read-only: full list of 8 each |
| 24h per-agent check (new, read-only) | — | POST /v3/list-calls | yes | 21 agents; per-agent count equal three ways: unfiltered list grouped by agent = agent_id filter = agent filter |
| n8n (77 workflows read via API) | — | already /v3/create-web-call | read | no old address in any workflow; every WF-TRY-WEBCALL copy is off |
| Vercel functions | — | none exist | read | api/ is empty on main |

Commit: "retell: v3 list endpoints + v3 web client" on main. Rollback: git revert <that commit>.
Dell rollback: each edited Dell file has a .bak-2026-10-13 beside it; the 9 stopped copies lose
their stop by deleting the four lines at the top.

WHAT'S NEXT
- Yellow: compare the 24h count with the Retell dashboard yourself. It needs your sign-in, so I
  could not do it. The API side agreed with itself three ways.
- Yellow: add two rows to CLAUDE.md § RETELL API RULES (Never → Use instead):
  POST /v2/create-web-call → POST /v3/create-web-call, and
  GET /list-test-case-definitions → GET /v2/list-test-case-definitions.
  Not done here because the brief said change nothing else.
- Green: future tuning runs copy the v3 test caller from the Oct 9 voice-pin folder.

GOTCHAS
- The v3 browser client has no "agent started / stopped talking" events. Its live transcript
  needs the secret key inside the browser. So the test caller now times AVA's turns from AVA's
  audio level, not AVA's words. A short "mm-hm" is too short to count as a turn.
- The new test-case list comes back in pages. Reading only the first page would have shown 54
  as fewer.
- Retell's call-list reference now documents an `agent` filter. The house tools send `agent_id`.
  Both filter correctly today (checked per agent).
- The Retell emails are not in the connected Gmail inbox. The Oct 9 "last used" date for the
  call list could not be matched to any job: the only timed caller moved on Oct 7.
- A stale March copy of this repo on the Dell (ava-deploy) still has old web-call code. It is
  not deployed and nothing runs it. It was left as is.
- On Windows, Node prints a libuv assertion after a tool ends with process.exit (exit 127). That
  comes after the right output; it is not an API error.
- On the test call AVA said "discovery call" again; the house name is "AVA strategy call". That is
  prompt text, so it stays with Grok's lane.
