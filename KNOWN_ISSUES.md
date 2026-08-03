# Known Issues

Tracked but deferred problems. Add new entries at the top.

## Cloudflare Workers Build: `aichauffeur-token` — failing since 2026-07-09

- **Status:** RETIREMENT AUTHORIZED (RUN 2, 2026-08-03). Disconnect is pending a dashboard
  action only Shane can perform — see "Retirement" below.

### Attribution corrected — RUN 2, 2026-08-03

The previous entry blamed **PR #33 (2026-05-25)** and claimed the build failed "on every
subsequent PR." **Both halves were wrong.** Measured by querying the GitHub check-runs API for
`Workers Builds: aichauffeur-token` across every commit from 2026-05-16 to 2026-08-03:

| Window | Result |
|---|---|
| 2026-05-16 → 2026-07-09 | **Mixed, mostly green.** Successes on May 16, 17, 19, 20, 21, 26, 27, 28, 31, Jun 11, 18, 28, Jul 1–8 |
| After PR #33 (May 25) | **Green repeatedly** — May 26, 27, 28, 31 all `success` |
| 2026-07-08 | 3 `success`, 1 `failure` |
| 2026-07-09 | 5 `success`, then `8bfadcc` → `failure` |
| `8bfadcc` (2026-07-09) → HEAD | **`failure` on every single commit**, unbroken |

- **PR #33 is not the cause.** Builds went green many times after it. The pre-July failures were
  intermittent, not a regression introduced by that PR.
- **Last green build:** `b8816ab`, 2026-07-09.
- **First failure of the permanent run:** `8bfadcc`, 2026-07-09.
- **Corroboration:** the deployed Worker's `modified_on` is `2026-07-09T08:59:50Z` — it last
  changed on the same day as the last green build, and has not been updated since.

### The Worker is dead anyway

Measured 2026-08-03: `GET https://aichauffeur-token.shanehandel.workers.dev/` returns **HTTP 200,
`text/html`, 49,475 bytes** — the AVA marketing homepage, not a LiveKit token. Whatever is
deployed is not the token service, so the endpoint has been non-functional independent of the
build status.

### Retirement

`/chauffeur/demo` no longer depends on it (RUN 2 converted that page to call-first; the page never
used LiveKit in the first place). Backup of the repo-side source: `infra/backups/worker-20260803.js`.

**RUN INCOMPLETE — the GitHub → Workers Builds disconnect is not done.** The Cloudflare MCP
connection exposes read-only Worker tools (`workers_list`, `workers_get_worker`,
`workers_get_worker_code`) and Doppler holds no Cloudflare API token, so there is no
programmatic route. Exact clicks for Shane:

1. https://dash.cloudflare.com/da54e14a36673e88bd413ad6e65239d7/workers/services/view/aichauffeur-token
2. **Settings** tab → **Build** section
3. **Git repository** → **Disconnect** → confirm
4. Optional, and the cleaner end state: **Manage Worker → Delete** to remove the dead service entirely.

After step 3 the red `Workers Builds: aichauffeur-token` check stops appearing on every push.
