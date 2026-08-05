# AIC-BRAND-INSTALL — 2026-08-05

The AI Chauffeur brand kit is extracted, installed, and live on aichauffeur.ai.

Commits `53c750a` (install) + `b34d9b8` (cache re-stamp) · pushed to `main` · Vercel deployed.

---

## PHASE 1 — EXTRACT

All **18/18** production SVGs pulled from the Claude Design project *AI Chauffeur brand
exploration* (`fc8d765c-4eca-44fe-8c7e-8cbb182c088c`) and written to
`chauffeur/assets/brand/`.

The kit's own file index — not the chat summary — was treated as authoritative. The
summary said 14 files; the project's `ListFiles` returned 18, and the spec sheet text
confirms "all 18 production SVGs."

**Byte-exactness is proven, not assumed.** Each file was SHA-256'd in-page at the source
before transfer and re-verified after writing. All 18 matched on hash and byte length, all
18 parse as XML, all 18 carry a viewBox. Geometry is provably unmodified.

marks (7): full · compact · mono · black · white · full-ink · compact-ink
lockups (6): short · short-ink · horizontal · horizontal-ink · stacked · stacked-ink
wordmarks (3): white · ink · black — cards (2): front · back

## PHASE 2 — INSTALL

**SVGO ran behind a render gate.** Every file was rasterized before and after via headless
Chrome and pixel-diffed. The default profile was pixel-identical on the 7 bar-only marks
but moved pixels on **all 11 outlined-type files**, up to a full 255 channel delta on
`lockup-stacked.svg`. Those 11 were re-run under a lossless profile with
`convertPathData` / `convertTransform` / `cleanupNumericValues` off.

Final: **18/18 optimized, 18/18 pixel-identical to source**, 63,604 → 61,951 bytes.

| Item | Result |
|---|---|
| Favicon set | `favicon.svg` · `favicon-16/32.png` · `apple-touch-icon-180.png` · `icon-192/512.png` · `site.webmanifest`, linked in the `<head>` of all 11 pages |
| Nav | `lockup-short.svg` at 176×30 on every page; `mark-compact.svg` below 420px. Car glyph gone repo-wide (0 occurrences) |
| Rasters | avatars 512 (both opaque) · email logos @2x · cards 1125×675 @300 DPI · `assets/aic-logo.png` at the exact RUN 4 Slack rail path |
| og-card | Re-rendered with the mark left of the wordmark |
| README | `chauffeur/assets/brand/README.md` — surface map, minimums, ink-on-light rule, five misuse failures |

## PHASE 3 — LIVE VERIFICATION

| Check | Result |
|---|---|
| 19 asset paths, cache-busted | **all 200**, correct content types |
| Car glyph across 11 live pages | **0** |
| Lockup + 3 icon links + manifest per page | **11/11** |
| LIVE-DIFF, live HTML vs repo | **11/11 IDENTICAL** |
| Live SVG bytes vs repo (6 sampled) | **6/6 SHA match** |
| Nav render, live 1280 | lockup 176.1×30, above kit min 120px |
| Nav render, live 390 | compact mark, tap target 44×44, zero horizontal overflow |

---

## DECISIONS WORTH KNOWING

**Favicon ground is baked in, not transparent.** The bars are `#EEF0F4`. A transparent
favicon disappears against a light-mode tab strip. The kit's surface map calls for
"dark ground baked in" and that is what shipped.

**og-card uses the supplied `lockup-short.svg`,** not `mark-compact` set beside the
hand-tracked type. The composition asked for is exactly what that file already is, and a
hand-built lockup is the kit's fifth misuse.

**Both avatars are opaque.** An avatar is composited on chrome we do not control; a
transparent one becomes a black or white box depending on platform.

**A second commit was required for cache armor.** `aic.css` changed, but the pages still
pointed at `?v=cbdf741`. Returning visitors inside the 24h max-age would have been served
the OLD stylesheet against the NEW markup — a 446px-wide lockup in the header. Re-stamping
bumped every page to `?v=53c750a`. That repo-wide diff is version-token only.

## GOTCHAS

- **Your clipboard was overwritten.** claude.ai blocks page→localhost transfers, so the 18
  files were moved through the OS clipboard. Whatever was on it before is gone.
- **`stamp.py` does not version images.** Its `ASSET_RE` covers css/js/json/audio only, so
  no `?v=` was hand-written onto the new `.svg`/`.png` refs — one would go stale and never
  update. These are new URLs, so nothing is cached yet, but **replacing a brand PNG in place
  later will serve stale bytes for up to 24h.** Change the filename or extend `ASSET_RE`.
- **`assets/aic-logo.png` is load-bearing at that exact path.** The RUN 4 Slack rail
  conditional probes for it; moving or renaming it drops the logo out of Slack silently.
- **The card SVG/PNG bake in (414) 775-0019.** Same number already published site-wide, so
  no new exposure — but it is now inside committed binaries.
- **`.playwright-mcp/` is untracked** and was left alone; it is a tool scratch dir, not
  gitignored.
- Headless Chrome on Windows cannot lay out below ~500px, so a `--window-size=390` capture
  silently renders wider and scales. The 390 proof was taken with Playwright instead.
