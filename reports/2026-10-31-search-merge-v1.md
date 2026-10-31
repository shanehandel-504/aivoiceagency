# SEARCH MERGE v1 · aivoiceagency.ai · 2026-10-31

```
===== SHANE READBACK — COPY ALL =====
SEARCH MERGE v1 · aivoiceagency.ai · Sat Oct 31 2026 · COMPLETE

WHAT HAPPENED (plain English)
Google, Bing and the AI engines now read Shane Handel as the founder of AI Voice
Agency. They also stop reading AI Voice Agency and AI Chauffeur as one company:
AI Chauffeur is now listed as a company under AI Voice Agency, with its own ID.
All of it lives in hidden page code (schema markup). No word, picture or button
changed on any of the 72 pages, and that was checked byte for byte. Bing and the
other IndexNow engines were told about the 72 updated pages.

DONE
| What                          | Status       | Proof |
|-------------------------------|--------------|-------|
| Generator, 3 edits            | done         | scripts/entity_schema.py staged blob 716f9823, as the PASTE expected |
| 72 sitemap pages rewritten    | done         | dry run "would touch 72, problems 0" -> applied 72 -> --check "would touch 0, problems 0" |
| Visible words unchanged       | done         | all 72 committed pages identical to HEAD byte for byte once ld+json is removed |
| JSON-LD gate                  | green        | validate_jsonld: 75 pages, 0 errors |
| llms gate                     | no new red   | the same 8 llms.txt header lines red on a clean HEAD copy and after |
| Board                         | live         | hq/board.json item SEARCH-MERGE-V1 + 1 log line, same commit |
| Commit                        | pushed       | 76184c4 · 75 files: 72 pages + generator + board + sitemap.xml (hook lastmods = commit time 11:49:18 CT) |
| Deploy                        | READY        | dpl_HQ7SLvp38S2mVbX9P8KiE8eCzNNj on aivoiceagency.ai |
| Live proof                    | pass         | / and /ground-transportation/: 200, one Organization, founder @id https://aivoiceagency.ai/#founder, subOrganization @id https://aichauffeur.ai/#organization, https://aichauffeur.ai gone from sameAs |
| IndexNow                      | 200 OK       | 72 URLs submitted, key file verified live |

IDS + ROLLBACK
- Commit 76184c4 · deploy dpl_HQ7SLvp38S2mVbX9P8KiE8eCzNNj
- Rollback: git revert 76184c4, push.
- Instant rollback: promote dpl_5R6fb4fgiCC4d5VnZbxGsJJkPpP4 (a92e9ac) in Vercel.

NEXT
- The aichauffeur window's half (parentOrganization with its @id + founder). This
  window did not check that repo, so read that window's readback.
- Optional: run the live homepage through Google's Rich Results Test to see the
  founder read.

GOTCHAS
- Run the visible-copy guard on git blobs (HEAD vs staged). Comparing working files
  flagged 21 pages whose only difference was line endings (21 pages are LF on disk,
  51 are CRLF). Blob to blob: 72 of 72 identical.
- In PowerShell, a here-string after `git commit -F -` is read as a pathspec, not as
  stdin. The first try failed and wrote nothing. The second try used a message file.
- tools/ and scripts/ have no FAQ gate script. Only validate_jsonld.py and
  llms-verify ran.
- On Windows, llms-verify ends with a Node "UV_HANDLE_CLOSING" assertion after it
  prints. The report it prints is complete.
- The n8n IndexNow workflow (gdFqOxFFVe13CfvX) may also send these 72 URLs on its
  own, because their lastmods changed. A repeat send does no harm.
- This mirror is on disk but NOT committed, because the PASTE allowed one push. It
  goes with the next push.
```
