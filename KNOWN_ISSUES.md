# Known Issues

Tracked but deferred problems. Add new entries at the top.

## Cloudflare Workers Build: `aichauffeur-token` — failing on every commit

- **Status:** Open, pre-existing, not blocking
- **First observed (in tracking):** PR #33 (2026-05-25). Reproduces on every subsequent PR (#34, #36).
- **Symptom:** GitHub check `Workers Builds: aichauffeur-token` reports `failure` immediately after push, regardless of what the commit touches.
- **Impact:** None to the public site. Vercel deploys (`aichauffeur`, `aivoiceagency`) build and ship green. The token Worker is a separate service.
- **Likely cause:** Cloudflare CI/CD git-integration config drift, missing `wrangler.toml` at the build root, or stale build settings on the Cloudflare side. Source candidates in repo: `retell-token-worker.js` (root), `voice-stack/worker/wrangler.toml`.
- **Next step:** Investigate Cloudflare dashboard build logs at https://dash.cloudflare.com/da54e14a36673e88bd413ad6e65239d7/workers/services/view/aichauffeur-token — not scheduled.
