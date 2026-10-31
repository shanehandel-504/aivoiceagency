# RUN 2 CROSS-LINK + ANSWERS · aivoiceagency.ai · 2026-10-31

```
===== SHANE READBACK — COPY ALL =====
RUN 2 CROSS-LINK + ANSWERS · aivoiceagency.ai · Sat Oct 31 2026 · COMPLETE

WHAT HAPPENED (plain English)
Every AVA page now has "AI Chauffeur · limo and black car" at the bottom of the
footer's Company list. It takes a limo or black car owner straight to
aichauffeur.ai. Nothing was removed: the homepage line about AI Chauffeur is word
for word the same, and every page that already linked to AI Chauffeur still does
(41 pages before, 104 now). Two new answer pages are live: "What if the caller asks
something it can't answer?" and "Can it answer calls in more than one language?".
Bing and the other IndexNow engines were told about the changed pages.

DONE
| Part | What shipped | Commit | Deploy | Live proof |
|------|--------------|--------|--------|------------|
| A | Footer item "AI Chauffeur · limo and black car" -> https://aichauffeur.ai/ on all 68 stamped pages (tools/stamp.py, re-stamped) | b1e49c4 | dpl_ANMDTJEYgEc6aSUMqnKZS2DNJFBn | / and /plumber-answering-service/: 200, item present, links to https://aichauffeur.ai/; homepage AI Chauffeur line unchanged |
| B | 2 answer pages + /answers/ hub (12 answers) + sitemap.xml + llms.txt + llms-full.txt | 03f9daa | dpl_ANMDTJEYgEc6aSUMqnKZS2DNJFBn (same push) | both pages 200 with their H1, in sitemap.xml, in llms.txt, on the hub, new footer item present |
| IndexNow | the 73 URLs this run changed or created (all 74 sitemap pages except /deck) | n/a | n/a | manual ping 200 OK, 73 URLs; deploy hook (n8n run 18266) 200 OK, 73 URLs |

BRICKS (PASTE-BRICKS-AVA-2026-10-29)
| Slug | Host | 200 | Schema ok | In sitemap | In llms.txt | IndexNow |
|------|------|-----|-----------|------------|-------------|----------|
| what-if-the-caller-asks-something-ava-cant-answer | aivoiceagency.ai | yes | yes (0 errors) | yes | yes | 200 manual + 200 hook |
| can-ava-answer-calls-in-more-than-one-language | aivoiceagency.ai | yes | yes (0 errors) | yes | yes | 200 manual + 200 hook |

CHECKS RUN
- Diff guard: 68 pages differ from HEAD only by the new footer line + cache tokens,
  4 by cache tokens only, 0 by anything else. Pages linking to aichauffeur.ai: 41 -> 104, 0 lost.
- Render 390x844 + 1440 (+1024), dark + light, homepage + trade page: contrast 6.40
  dark / 5.67 light, item on the column's one left edge, no overflow at 390, no console errors.
- New answer pages at 390 + 1440: one H1, body 17 / 20 px, lowest text contrast 6.40, no overflow, no console errors.
- entity_schema --check 0/0 (74 pages) · validate_jsonld 77 pages, 0 errors ·
  llms-verify 146/154, the same 8 llms.txt header lines red as before, 0 new red.
- Brick files staged byte for byte from the PASTE (blobs b2b58505, c88ca9d7).

IDS + ROLLBACK
- Footer link: git revert b1e49c4, push.
- Answer pages: git revert 03f9daa, push (the bricks file names no rollback of its own).
- Instant: promote dpl_HQ7SLvp38S2mVbX9P8KiE8eCzNNj (76184c4) in Vercel.

NEXT
- The nav overflow at 1024 px (below) needs its own run if Shane wants it fixed.

GOTCHAS
- At 1024 px wide, the homepage scrolls sideways 16 px and trade pages 52 px. The cause is the
  nav (.bnav-menu / .bnav-tel), and it was the same at HEAD before this run. Not touched (Law 1).
- Trade pages set the footer in Inter, not Space Grotesk. That was already there; the new
  item matches its neighbours on every page.
- A re-stamp rewrites every ?v= cache token, including hand-written ones like ?v=s1001c, so
  71 sitemap lastmods moved and IndexNow got 73 URLs. The deploy hook sent the same 73 again; harmless.
- tools/stamp.py still lists 20 chauffeur/* pages that left in the Oct 22 repo split. They
  print "missing" on every stamp run; harmless, cleanup is a separate change.
- On the new pages the H1 is the brick's question ("Can it answer calls...") and the title
  says "Can AVA answer calls...". That is how the press builds every answer page.
- llms_full.py was re-run after the press (52 lines added, only the 2 new answers). The
  bricks file did not name it; my standing note says run it after every brick batch.
- validate_jsonld only reads git-tracked pages, so the 2 new pages count only once staged (75 -> 77).
- The first live check read the trade page seconds after READY and missed the footer item
  (an edge still on the old deploy). The re-run passed all 17 checks.
- The SEARCH MERGE v1 report (written earlier today, left uncommitted) goes in the same
  report commit as this one.
```
