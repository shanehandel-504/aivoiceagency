#!/usr/bin/env python3
"""
LOADOUT GUARD — machine enforcement for CLAUDE.md § SKILL ROUTER.

Ratified RUN S2 (2026-08-06). Wired as a `Stop` hook in .claude/settings.json.

THE LAW IT ENFORCES
  Every reply must open with `SKILLS: ...`. A turn that loads nothing must say
  `SKILLS: none — <why>`. Silence is a routing failure.

HOW IT WORKS
  On Stop, read the session transcript, isolate the assistant text produced since
  the last real user turn, and check the first non-empty line starts with SKILLS:.
  On violation, emit {"decision":"block", ...} so the model is handed the reason
  and must correct the reply before it can stop.

FAIL-OPEN BY DESIGN
  Every unexpected condition exits 0. A guard that blocks the session because of
  its own bug is worse than no guard. The only exit-with-block is a positively
  identified violation: assistant text was found, and it did not open with SKILLS:.
"""

import json
import os
import sys

MARKER = "SKILLS:"
LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "loadout-guard.log")
LOG_KEEP = 200


def log(status, detail=""):
    """Append one audit line, capped at LOG_KEEP lines. Never raises."""
    try:
        line = f"{status}\t{detail}\n"
        old = []
        if os.path.exists(LOG_PATH):
            with open(LOG_PATH, "r", encoding="utf-8", errors="replace") as fh:
                old = fh.readlines()
        with open(LOG_PATH, "w", encoding="utf-8", newline="\n") as fh:
            fh.writelines(old[-(LOG_KEEP - 1):])
            fh.write(line)
    except Exception:
        pass


def blocks_of(msg):
    """Normalize a message's content to a list of blocks."""
    content = (msg or {}).get("content")
    if isinstance(content, str):
        return [{"type": "text", "text": content}]
    if isinstance(content, list):
        return [b for b in content if isinstance(b, dict)]
    return []


def is_real_user_turn(rec):
    """
    True for a genuine human turn. Tool results also arrive as role=user, so a
    record carrying any tool_result block is machine traffic, not Shane talking.
    """
    if rec.get("type") != "user":
        return False
    bl = blocks_of(rec.get("message"))
    if any(b.get("type") == "tool_result" for b in bl):
        return False
    return any(b.get("type") == "text" and (b.get("text") or "").strip() for b in bl)


def main():
    # ---- read hook input -------------------------------------------------
    try:
        payload = json.load(sys.stdin)
    except Exception:
        log("SKIP", "unparseable hook stdin")
        return 0

    # Never fight a block we already issued — this is the infinite-loop guard.
    if payload.get("stop_hook_active"):
        log("SKIP", "stop_hook_active")
        return 0

    path = payload.get("transcript_path")
    if not path or not os.path.exists(path):
        log("SKIP", "no transcript")
        return 0

    # ---- load transcript -------------------------------------------------
    records = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            for raw in fh:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    records.append(json.loads(raw))
                except Exception:
                    continue
    except Exception:
        log("SKIP", "transcript unreadable")
        return 0

    if not records:
        log("SKIP", "empty transcript")
        return 0

    # ---- isolate the current turn ----------------------------------------
    start = 0
    for i in range(len(records) - 1, -1, -1):
        if is_real_user_turn(records[i]):
            start = i + 1
            break

    first_line = None
    for rec in records[start:]:
        if rec.get("type") != "assistant":
            continue
        for b in blocks_of(rec.get("message")):
            # Thinking is not the reply. Only surfaced text counts.
            if b.get("type") != "text":
                continue
            for ln in (b.get("text") or "").splitlines():
                if ln.strip():
                    first_line = ln.strip()
                    break
            if first_line:
                break
        if first_line:
            break

    # A pure tool-call turn surfaces no text. Nothing to police.
    if first_line is None:
        log("SKIP", "no assistant text this turn")
        return 0

    if first_line.upper().startswith(MARKER):
        log("PASS", first_line[:120])
        return 0

    # ---- violation -------------------------------------------------------
    log("BLOCK", first_line[:120])
    reason = (
        "LOADOUT LAW VIOLATION (CLAUDE.md § SKILL ROUTER).\n"
        f"Your reply opened with: {first_line[:160]!r}\n\n"
        "The FIRST LINE of every response must declare the loadout:\n"
        '  SKILLS: [names loaded]\n'
        "If this turn genuinely loaded no skill, the line reads:\n"
        '  SKILLS: none — <why>\n\n'
        "Re-send the reply with that line first. Do not change anything else, and "
        "do not apologise for the correction — just lead with the declaration.\n"
        "Route the task against the § SKILL ROUTER table before you answer: if it "
        "touches a page, HTML, CSS or any visual surface, the visual row applies and "
        "those skills must actually be read, not merely named."
    )
    print(json.dumps({
        "decision": "block",
        "reason": reason,
        "systemMessage": "LOADOUT GUARD: reply did not open with 'SKILLS:' — blocked, model asked to re-lead.",
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
