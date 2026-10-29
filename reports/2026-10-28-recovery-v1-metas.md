===== SHANE READBACK — COPY ALL =====

PLAIN ENGLISH
You said yes, so the last two "first ring" lines on aivoiceagency.ai are gone. They were the search descriptions of /backstage and /deck. With this, RECOVERY v1 is complete: "first ring" is off every page and file a visitor or a search engine reads on both sites. The only place it is still written down is the old history entries of the internal board.

DONE
| Item | What shipped | Status | Proof |
|---|---|---|---|
| /backstage meta | "from the first ring to the booked job" -> "from hello to the booked job" (160 -> 151 characters) | live | curl count 0 |
| /deck meta | "every call, after hours, on the first ring." -> "every call, after hours." (179 -> 160 characters) | live | curl count 0 |
| Board | RECOVERY item note + one log line | live | /hq/board.json |
| IndexNow | Deploy run sends only the 2 changed pages | live | execution read after deploy |

LESSON: when a literal swap repeats the words right before it, dropping the phrase is the honest fix, not stacking "every call" twice.

IDS + ROLLBACK
- This commit: git revert it (3 files + sitemap lastmods); the earlier rollbacks in reports/2026-10-28-recovery-v1.md still apply.

NEXT
- Recovery chat: resubmit both sitemaps and check the three unknown AVA answer pages.

GOTCHAS
- "/deck" is a straight drop of ", on the first ring", because swapping in "every call" would have read "every call, after hours, every call."
- Old board history entries (5 lines in hq/board.json) still quote the retired lines, because they record past runs and were left as written.
