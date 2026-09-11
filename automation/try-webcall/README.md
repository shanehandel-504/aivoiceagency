# WF-TRY-WEBCALL — the browser calls behind aichauffeur.ai/try

`WF-TRY-WEBCALL.json` is an export of what is live, pulled from the n8n API on
2026-09-11. It is the record, not the source of truth: n8n is.

| | |
|---|---|
| Workflow | `9nKn8i2dRuALikuv` · https://circulant.app.n8n.cloud/workflow/9nKn8i2dRuALikuv |
| Webhook | `POST /webhook/7b9e6dee2ce9ce780673725e0448791f` (public by nature; it sits in the page) |
| Credential | `Retell API` (`kGVhqVmqLgPUAxpM`), header auth, restricted to `api.retellai.com` |
| Error workflow | `OPS — Error Sentry` (`SlnAeMrVRORsF0w7`) |
| Kill switch / rollback | Unpublish the workflow. The page then falls back to the phone line on every tap. |

## The order, and why it is that order

Cheap refusals first, then the checks that cost a round trip, then the one request
that costs money:

1. **Origin gate** — `https://aichauffeur.ai` only. This stops another website's
   browser, not a script that sets its own header. The budget below stops that.
2. **Daily cap** — 40 created calls per UTC day, counted in workflow static data.
3. **Per-IP limit** — 3 attempts per rolling hour, counted on attempts rather than
   successes, keyed on `cf-connecting-ip`. Measured on this instance: a client's own
   `X-Forwarded-For` is replaced by Cloudflare, not appended to, so it cannot be forged.
4. **Proof of work** — the page must return a counter where SHA-256("nonce:counter")
   starts with 20 zero bits. Nonces are issued by this same webhook, single use, and
   expire after three minutes. SHA-256 is implemented in plain JS because the Code
   sandbox is not guaranteed to allow `require('crypto')`.
5. **Capacity ceiling** — `GET /get-concurrency`; at 10 of the account's 20 slots busy
   the demo steps aside so both phone lines keep answering.
6. **Create** — `POST /v3/create-web-call`, pinned to `latest_published` with an
   8-minute per-call cap and a 60-second silence hang-up. Those caps ride on this call
   only; the phone line keeps its own settings.
7. **Respond** — `call_id`, `access_token`, `transport`, `ice_servers` (and `url` when
   Retell sends one). Retell's error text stays in the execution log.

State lives in workflow static data, which n8n saves after each production execution.
Under concurrent executions it is best effort, which is why the caps are budgets
rather than locks.

## Changing it

Two operations, always: update, then publish. Then assert `versionId ===
activeVersionId` — the API reads and writes the draft, and an active workflow serves
the published version. Re-export this file in the same commit.
