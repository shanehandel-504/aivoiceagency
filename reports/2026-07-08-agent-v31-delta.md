# AVA SALES v3.1 (agent v32) — delta rollout — 2026-07-08

## Plain-English summary (non-coder)
AVA's live sales agent — the one that answers **414-240-8930** — got a small, surgical
upgrade today, from **"AVA SALES v3"** (version 31) to **"AVA SALES v3.1"** (version 32).
Her voice, pricing knowledge, and booking tools were **not** changed. Four things were added:

1. **Name protocol** — she now asks your name early and repeats it back to confirm
   ("Andy — got it."), and apologizes in a few words if she heard it wrong. Same for the
   business name (confirm once, then use it).
2. **Human reframe** — if a caller asks for a human or gets nervous about talking to an AI,
   she reframes: the 15-minute call **is** with a real human (the founder) — she's just the
   one who books it. She never argues to keep you with the AI.
3. **Founder-framed close** — at the close she now says the appointment is "with our founder,"
   and reassures the founder will read your notes before the call.
4. **Voicemail law (new)** — if a call goes to voicemail, AVA now **leaves a ~25-second message**
   (pitch + callback number + booking link) instead of hanging up.

We backed up the exact old and new settings, published v32 live, and placed a real test call
to your cell to prove it works.

## What the live test call proved (real ~3-min call to your cell, on AVA v32)
You role-played "Andy, a plumber." Verified from the transcript + tool logs:
- ✅ Asked **"Who am I talking with?"** then confirmed **"Andy — got it."** (new name protocol)
- ✅ Confirmed the business: **"Okay, plumbing."**
- ✅ Opened price at **$497**: "The Starter is $497 a month plus setup, no contract."
- ✅ Full **NATO email spell-back**: "S as in Sierra, H as in Hotel… shanehandel@icloud.com, correct?"
- ✅ New **founder-framed close fired verbatim** (captured in the booking tool):
  *"So that's Andy, shanehandel@icloud.com, Thursday July 9 at 2:30 PM Central, with our founder — booking it now."*
- ✅ All three close tools fired: **book_appointment + write_to_crm + send_link (both)**
- Not triggered by this role-play (configured but not observed): the **name-correction apology**
  branch (you never gave a wrong name), the **explicit "can I talk to a human?" reframe** (you
  never asked for a human), and the **voicemail message** (you answered — call was not voicemail).
  The call hit the 180-second cap and cut off the spoken close mid-sentence; the booking tool
  still captured the full close text.

## DONE table
| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Push 2 backup commits on main | ✅ Already live | HEAD = origin/main = remote tip `fe3b9a7`; `rev-list` 0/0 — nothing to push (both commits already on GitHub) |
| 2 | LLM prompt: NAME PROTOCOL + HUMAN REFRAME inserts + 2 CLOSE edits | ✅ | LLM v32 `general_prompt` **byte-identical** to computed target (4529→5373 chars); unified diff = only the 4 intended changes; reverse-check reproduced the original byte-for-byte |
| 3 | Voicemail law (leave message, never hang up) | ✅ | agent v32 `voicemail_option.action.type = static_text`; 432-char script **byte-identical** to verbatim |
| 4 | Publish v32 + snapshot + README rollback + commit/push | ✅ | agent v32 & LLM v32 `is_published=true`; number serves `latest_published` = v32; commit **877e5b1** pushed to main |
| 5 | Test call using Doppler OWNER_CELL | ✅ (name caveat) | `call_2e89884fbf4242f06e0ff5421e8`, agent_version 32, 180s, `call_successful=true`; **secret is named `OWNER_CELL_OHONE`, not `OWNER_CELL`** |

## Version IDs + one-line rollback
- **Agent:** `agent_d5ada9f774fe3ae7f034d2c677` — now **v32 "AVA SALES v3.1"** (was v31 "AVA SALES v3")
- **LLM:** `llm_d0f4aff62bb8b60ff878055aa18c` — now **v32** (gpt-5.5, temp 0.2, KB `knowledge_base_913893be26fee4bc`)
- **Voice:** LOCKED `custom_voice_705a2cb49b0413f7fc1c456d02`, speed 1.05 (unchanged)
- **Number:** `+14142408930` inbound + outbound = `latest_published` (auto-serves v32)
- **Repo:** commit `877e5b1` on `main` (backups only, no site impact)

**Rollback to v31 (pre-v3.1):**
```bash
doppler run --project ava-prod --config prd -- bash -c 'curl -s -X PATCH "https://api.retellai.com/update-phone-number/+14142408930" -H "Authorization: Bearer $RETELL_API_KEY" -H "Content-Type: application/json" -d "{\"inbound_agents\":[{\"agent_id\":\"agent_d5ada9f774fe3ae7f034d2c677\",\"agent_version\":31,\"weight\":1}],\"outbound_agents\":[{\"agent_id\":\"agent_d5ada9f774fe3ae7f034d2c677\",\"agent_version\":31,\"weight\":1}]}"'
```
Swap `31`→`30` to revert all the way to pre-v3. To return to v3.1, set `agent_version` back to `"latest_published"` (or `32`). Both rollbacks live in `retell-backups/README.md`.

## What's next
- **Rename the Doppler secret `OWNER_CELL_OHONE` → `OWNER_CELL`** (or `OWNER_CELL_PHONE`) so future
  runbooks that look for "OWNER_CELL" don't false-fail. The value is a valid US cell (480 area
  code); I normalized it to E.164 for the call and never printed it.
- Optional **branch-coverage test call**: deliberately (a) give a wrong name then correct it,
  (b) ask "can I talk to a human?", and (c) let it ring to voicemail — to observe the three
  branches this role-play didn't trigger.
- The booking tools fired with a **placeholder cell** (`+10000000000`) because outbound test calls
  don't carry `{{cell}}`; real inbound callers pass their number automatically — test-only artifact.
- `max_call_duration_ms` is 180000 (3 min) — fine for real calls; it truncated only the very end
  of this test. Nothing to fix.

## Gotchas (confirmed / learned this run)
- **Retell published versions are IMMUTABLE.** `PATCH update-retell-llm` on a published LLM → HTTP 400
  "Cannot update published LLM." Correct flow: `POST /create-agent-version/{agent_id}` with
  `{"base_version":N}` FIRST (this forks an editable draft of **both** the agent **and** its linked
  LLM, copying voice/KB/tools), then `PATCH update-retell-llm` + `PATCH update-agent`, then
  `POST /publish-agent-version` with `{version, version_title, version_description}`.
- **publish-agent-version publishes the linked LLM too** — confirmed (LLM went `is_published=true`
  at v32 when the agent was published).
- **create-agent-version preserved voice_id/speed/KB/tools** automatically; I still pinned `voice_id`
  explicitly on the agent PATCH per the standing gotcha (belt-and-suspenders).
- **OWNER cell secret** is named `OWNER_CELL_OHONE` (typo) and stored non-E.164 (has separators);
  normalized to `+1XXXXXXXXXX` in-process, never printed.
- **Windows:** every curl ran from a script file via `doppler run --project ava-prod --config prd
  -- bash <script>`; `jq` is absent → used Python for all JSON parsing/edits/diffs.
