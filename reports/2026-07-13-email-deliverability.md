# [L3] EMAIL DELIVERABILITY — get AVA's mail out of spam — 2026-07-13

**Tag:** [L3] · **Mission:** Diagnose why THE SIGNAL + THE RECEIPT landed in spam, fix what's fixable in-repo now, and hand Shane an exact DNS/GHL punch-list. Templates were NOT assumed guilty.

**Capability note (read first):** Two things this environment CANNOT do — and the shortest human path for each:
1. **Read raw SMTP auth headers** (Authentication-Results / SPF / DKIM / DMARC pass-fail, and the `List-Unsubscribe` header). The Gmail connector returns *parsed* bodies only, not the RFC822 source. → **Shane: open either test email in Gmail → ⋮ → "Show original."** That one screen validates or refutes most of this report in 60 seconds.
2. **Retrieve GHL's own generated sending-domain records / flip GHL + Namecheap settings.** DNS lives at Namecheap and the send identity lives in the GHL account — both are Shane's to edit; account-settings + registrar changes are out of scope for me. → **Shane: GHL Settings → Email Services, and Namecheap → Advanced DNS.** Exact records + click-path below.

**Bottom line:** The templates are clean. The spam cause is the **sending identity**: GHL is sending AVA's mail from LeadConnector's **shared pool** (`mg.msgsndr.biz` / `send.lcmsgsndr.org`), not from the dedicated `mail.aivoiceagency.ai` domain — which is already DNS-complete but **not selected** in GHL. Two smaller hygiene gaps ride alongside (no root-domain auth for Shane's own Workspace mail; DMARC has no reporting). Nothing here is live yet — the deliverability fix is gated on Shane's DNS/GHL actions in the PENDING-SHANE block.

---

## 0 · THE TWO MAIL STREAMS (the correction that reframes everything)

`aivoiceagency.ai` sends mail through **two completely independent paths.** They fail — and get fixed — separately. Conflating them was the biggest trap in the first-pass diagnosis; an adversarial review panel flagged it.

| | **Stream A — AVA automated mail** (drip + receipt) | **Stream B — Shane's human mail** (Workspace) |
|---|---|---|
| Sender | GHL / LeadConnector → **Mailgun** | Google Workspace (Gmail) |
| Seen From | `shane+aivoiceagency.ai@mg.msgsndr.biz` | `shane@aivoiceagency.ai` |
| Authenticates against | **Mailgun's own domain** (`mg.msgsndr.biz`) — SPF/DKIM/DMARC already **PASS** here | The **root** `aivoiceagency.ai` — which has **NO SPF, NO DKIM, NO DMARC** → **unauthenticated** |
| Why it spams / is at risk | Shared-pool reputation + no brand alignment ("via mg.msgsndr.biz" tag) + likely missing one-click `List-Unsubscribe` **header** + cold ~6-mo domain, no warm-up | No auth at all → any strict receiver can spam/junk Shane's own digests, booking notes, client mail |
| The fix | **Switch GHL to the already-built `mail.aivoiceagency.ai` dedicated domain** (config flip) + warm up | **Add root SPF + Workspace DKIM + DMARC** (pure DNS hygiene) |

> **Key nuance:** adding root SPF/DMARC does **NOT** fix AVA's (Stream A) spam problem — that mail doesn't even use the root domain. Root records are real and worth doing, but they are **Stream B hygiene**, not the AVA fix. The AVA fix is the dedicated-domain switch + warm-up.

---

## 1 · DNS AUDIT (live `dig`/`Resolve-DnsName` + RDAP, 2026-07-13)

**Registrar/DNS host:** Namecheap (nameservers `dns1.registrar-servers.com` / `dns2.registrar-servers.com`) → **edit at Namecheap → Domain List → aivoiceagency.ai → Advanced DNS.**
**Web A record:** `76.76.21.21` (Vercel). **MX:** Google Workspace (`aspmx.l.google.com` + alts). **Domain age:** registered **2026-01-26** (~6 months → thin reputation, warm-up matters).

| Record | Host | Present? | Value / Finding | Verdict |
|---|---|---|---|---|
| **SPF (root)** | `@` | ❌ **ABSENT** | Only `google-site-verification` + `openai-domain-verification` TXT exist. No `v=spf1`. | **Stream B gap — ADD** |
| **DKIM (root/Workspace)** | `google._domainkey` | ❌ **ABSENT** | Google Workspace DKIM never generated. | **Stream B gap — ADD** |
| **DMARC (root)** | `_dmarc` | ❌ **ABSENT** | No policy on the org domain. | **Stream B gap — ADD** |
| **SPF (send subdomain)** | `mail` | ✅ present | `v=spf1 include:spf.leadconnectorhq.com include:mailgun.org ~all` — **~4 DNS lookups, under the 10 limit; both includes needed** (LC IPs + Mailgun IPs). | OK, no change |
| **DKIM (send subdomain)** | `smtp._domainkey.mail` | ✅ present | Valid 1024-bit RSA public key (Mailgun `smtp` selector). | OK, no change |
| **Tracking/return-path CNAME** | `email.mail` | ✅ present | `email.mail.aivoiceagency.ai → mailgun.org` (Mailgun's tracking/bounce host). | OK, no change |
| **DMARC (send subdomain)** | `_dmarc.mail` | ⚠️ partial | `v=DMARC1;p=none;` — **no `rua`** → zero visibility into what's passing/failing. | **REPLACE (add reporting)** |

**Read-out:** `mail.aivoiceagency.ai` is **DNS-ready for Mailgun** (SPF + DKIM + tracking CNAME + a DMARC record). The only DNS edit it needs is adding reporting to its DMARC. Everything missing (root SPF/DKIM/DMARC) belongs to **Stream B**.

**Header check (attempted):** I pulled the live sends via the Gmail connector on the `shane@aivoiceagency.ai` mailbox. Confirmed sender = `shane+aivoiceagency.ai@mg.msgsndr.biz` (Stream A shared pool) and that all links — including the unsubscribe — are wrapped through `email.mg.msgsndr.biz` (shared tracking). **The connector does not expose Authentication-Results / List-Unsubscribe headers**, so pass/fail + one-click-header presence are **PENDING-SHANE via "Show original."** (Notably: in that mailbox the SIGNAL currently sits in **Inbox** and Spam is empty for 14 days — same-domain self-sends get gentler treatment; cold third-party recipients will judge harder, which is exactly what the fix + warm-up protect.)

---

## 2 · THE FIX PLAN

### Track A — AVA automated mail (the actual spam fix) — mostly config, 1 DNS edit

**A1 · GHL config flip (this is the #1 lever — done by Shane in the GHL UI):**
The dedicated domain is built but **not selected**, so GHL defaults every send to the shared pool. The lever depends on the send path, and AVA's drip/receipt go out via the **n8n curl → `POST /conversations/messages`** path (there is no GHL "workflow email" action to set a From on):
1. **GHL → Settings → Email Services** (wording varies — "Dedicated Domain" / "Dedicated Sending Domain" / "Manage Dedicated Domain"). Confirm `mail.aivoiceagency.ai` shows **every row green** (SPF, DKIM, tracking CNAME, DMARC) — not just the domain header. If any single row is red, GHL silently reverts the whole account to the shared pool.
2. **Set the location's DEFAULT sending domain to `mail.aivoiceagency.ai`** and set a From like **`ava@mail.aivoiceagency.ai`.** For the API path, also pass **`emailFrom: ava@mail.aivoiceagency.ai`** in the n8n Conversations-API body. Verify in the UI which mechanism this account honors.
3. **Never point a GHL/Mailgun send at a root `@aivoiceagency.ai` From** — root SPF authorizes only Google, so a Mailgun send as root would fail SPF + DKIM alignment once DMARC is enforced. All AVA mail uses the `mail.` subdomain identity.
4. **Re-send one test, then verify in "Show original":** From flips to `@mail.aivoiceagency.ai`, **DKIM `d=mail.aivoiceagency.ai` = pass**, **Return-Path/envelope aligns to `mail.aivoiceagency.ai`** (not `mailgun.org`), **DMARC = pass (aligned).** *Setting the From alone is not enough — if DKIM still signs `d=mailgun.org`, you keep inheriting shared-pool reputation. This header check is the proof the switch actually took.*

**A2 · DNS edit (Namecheap):** add reporting to the subdomain DMARC.

**A3 · Branded link tracking (optional, improves it further):** once the dedicated domain is active, tracked links render as `email.mail.aivoiceagency.ai` instead of `email.mg.msgsndr.biz`. Use the **exact tracking CNAME GHL displays** — do not invent a `link.` host.

### Track B — Shane's Workspace/human mail (hygiene) — pure DNS (Namecheap)

Add root SPF + Google DKIM + DMARC so `shane@aivoiceagency.ai` (digests, booking notes, client mail) authenticates.

### Copy-paste record list → **Namecheap → Advanced DNS → aivoiceagency.ai**

Namecheap's **Host** field is the label only (it appends the domain). TTL "Automatic" is fine.

| # | TYPE | HOST | VALUE | TTL | ACTION |
|---|---|---|---|---|---|
| 1 | TXT | `@` | `v=spf1 include:_spf.google.com ~all` | Automatic | **ADD** (root SPF — Stream B) |
| 2 | TXT | `google._domainkey` | *(paste the value Google Admin generates — see note)* | Automatic | **ADD** (Workspace DKIM — Stream B) |
| 3 | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@aivoiceagency.ai; sp=none; pct=100` | Automatic | **ADD** (root DMARC — Stream B) |
| 4 | TXT | `_dmarc.mail` | `v=DMARC1; p=none; rua=mailto:dmarc@aivoiceagency.ai; pct=100` | Automatic | **REPLACE** the existing `v=DMARC1;p=none;` (Stream A reporting) |

Already present — **do NOT touch:** `mail` SPF · `smtp._domainkey.mail` DKIM · `email.mail`→mailgun.org CNAME.

**Sequencing + gotchas (these matter):**
- **Record 2 order:** publish the `google._domainkey` TXT **first**, confirm it resolves, **then** click **Start authentication** in Google Admin → Apps → Google Workspace → Gmail → **Authenticate email**. Enabling before the TXT propagates makes *every* Gmail message fail DKIM until it does. If Google gives a 2048-bit key, paste the **exact multi-string value** it shows — don't truncate to one 255-char string.
- **Record 3 `sp=none`** is fine: the `mail.` subdomain has its **own** `_dmarc.mail`, which **overrides** the root `sp` for the AVA stream. (So any future enforcement decision for AVA mail is made on **`_dmarc.mail`**, not root `sp`.)
- **`rua` mailbox must exist.** Create `dmarc@aivoiceagency.ai` as a real Workspace alias, or point `rua` at a free DMARC processor (Dmarcian / Postmark DMARC / Valimail). Reports are XML — useless unread.
- **One SPF per host.** Never add a second `v=spf1` at `@`. If another service ever sends as root `@aivoiceagency.ai`, add its `include:` to record #1 — don't create a new SPF record.
- **DMARC enforcement ramp (later):** keep `p=none` for 2–4 weeks, read `rua`, then tighten `_dmarc.mail` (AVA) and `_dmarc` (root) to `p=quarantine` → `p=reject`. BIMI (brand logo in Gmail) is downstream of that — needs quarantine/reject + a VMC. Not now.

---

## 3 · TEMPLATE-SIDE HARDENING (done in-repo now)

**Spam-signal audit — both templates PASS** (the mission's hypothesis was right — templates weren't the problem):

| Check | THE SIGNAL | THE RECEIPT |
|---|---|---|
| Image-to-text ratio | 1 tiny 178×32 logo + 1px pixel, rest live text ✅ | text lockup, zero content images ✅ |
| Link count | CTA + footer book + tel + unsub (~4) ✅ | calendar + tel (2) ✅ |
| ALL-CAPS / exclamation density | none in body, **zero `!`** ✅ | none, **zero `!`** ✅ |
| Spam trigger words | sourced stat, "$497/mo" money line — no "free/guaranteed/act now" ✅ | transactional, clean ✅ |
| Physical address (CAN-SPAM) | ✅ 1787 Edgewood Rd, Kewaskum, WI 53040 | ✅ present |
| AI disclosure | ✅ "AVA is an AI assistant" | ✅ present |
| Unsubscribe | ✅ `{{unsubscribe_url}}` — **proven to populate** a working link in the live send | not required (transactional) |
| Plain-text alternative | ⚠️ was auto-generated only → **added `signal.txt`** | ⚠️ → **added `receipt.txt`** |

**Shipped:**
- **`work/emails/signal.txt` + `work/emails/receipt.txt`** — clean, hand-authored `text/plain` alternatives. A missing/ugly text part is itself a spam signal; wire these as the multipart `text/plain` at install (SIGNAL keeps `{{unsubscribe_url}}`; receipt has none).
- **`/work/emails` review surface** — the stale "CAN-SPAM / unsubscribe unverified" flag is replaced with the real, current deliverability status + link to this report.

**Two clarifications the review panel forced (important):**
- **`{{unsubscribe_url}}` (body link) ≠ `List-Unsubscribe` (header).** The body link populated and works — that satisfies **CAN-SPAM**. But Gmail/Yahoo's 2024 bulk rules require the **`List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers**, which are set by the **send path**, not by any token in the HTML. → Confirm both headers in "Show original." If the 1:1 Conversations-API path doesn't emit them, the **marketing drip** should enroll into a GHL path that does (keep n8n as the trigger). *This conflicts with the "n8n is the drip engine, not GHL workflows" rule — Shane's call to make deliberately.* The transactional receipt can stay on the API.
- **Opt-out enforcement:** confirm clicking unsubscribe flips the contact's **email DND** in GHL, and that the n8n drip **filters DND/opt-out before every step** (Conversations-API "send-only" calls can bypass DND). An ignored opt-out is a CAN-SPAM violation *and* a complaint-rate spike that would poison the warm-up.

*(Deliberately NOT built: a separate `/unsubscribe` page + webhook. GHL already injects a working unsubscribe that updates its own opt-out state; a parallel page that doesn't write back to GHL would be an unsubscribe that doesn't actually stop sends — worse than none.)*

---

## 4 · WARM-UP PLAN (for the freshly-activated `mail.aivoiceagency.ai` identity)

**What you're warming:** **domain + engagement reputation on Mailgun's shared, already-warm IP pool** — *not* a dedicated IP (Shane doesn't control the IP or its rDNS/PTR; that's Mailgun's). This is why a 14-day ramp to ~2,000/day is even plausible.

**Hard gate before Day 1 (do not skip):** a real send from `ava@mail.aivoiceagency.ai` via the intended path passes a seed test (mail-tester.com / GlockApps / raw "Show original") showing **SPF=pass, DKIM=pass aligned to `mail.aivoiceagency.ai`, DMARC=pass** — AND **Google Postmaster Tools** is verified for the domain. Auth green → then ramp.

| Day | Max sends/day (ceiling) | Day | Max sends/day (ceiling) |
|---|---|---|---|
| 1 | 20 | 8 | 300 |
| 2 | 30 | 9 | 400 |
| 3 | 50 | 10 | 600 |
| 4 | 75 | 11 | 800 |
| 5 | 100 | 12 | 1,200 |
| 6 | 150 | 13 | 1,600 |
| 7 | 200 | 14 | 2,000 |

After Day 14: grow ~1.5–2× every few days toward target.

**Rules (the ladder is a ceiling, not a quota):**
- **Inventory-bound:** each day's cap = **min(ladder target, count of genuinely engaged opted-in contacts).** **NEVER** pad a ramp day with cold/unverified addresses to hit the number — that's the fastest way to torch a fresh domain. If the engaged pool is small, **plateau / stretch the calendar** instead of reaching down the list.
- **Engaged first:** people who booked, replied, or explicitly opted in — best-openers lead every day.
- **Consistent daily cadence during the ramp** (smooth day-over-day). Save "Tue–Thu business hours" targeting for *after* reputation reads High/Medium — on/off spikes hurt a warming domain.
- **Complaint rate:** operational target **< 0.1%**; **hard never-hit ceiling 0.3%** (Gmail *and* Yahoo), measured against **Gmail-received** volume in Postmaster. Early ramp days (20–200) are statistically too small for Postmaster to report a rate — lean on seed tests + Mailgun's complaint/FBL data then.
- **Bounces:** verify every list (NeverBounce / ZeroBounce / Kickbox) **before** it enters the pipeline; suppress hard bounces immediately; keep hard-bounce **< 2%** (monitored in Mailgun — Postmaster doesn't surface bounces).
- **Sunset policy:** stop mailing non-openers after N sends; drop role accounts (`info@`, `sales@`); purge hard bounces. Hitting dead/unengaged addresses is the top reputation killer for a young domain.
- **"No cold list until clean history" — defined trigger:** Postmaster **Domain Reputation High/Medium** for ~7 consecutive days + complaints < 0.1% + bounce < 2% + DMARC aligned-pass > 98%. Only then start cold — and start cold as its **own** mini-ramp on verified, tightly-targeted addresses (cold lists carry spam traps a young domain can't absorb in one hit).
- **Consideration:** keep the complaint-prone **marketing drip** and the **transactional receipt** on separate identities (e.g. `news.mail…` vs `txn.mail…`) so drip complaints never drag booking-receipt deliverability.

---

## DONE TABLE

| ITEM | STATUS | PROOF |
|---|---|---|
| DNS audit (SPF/DKIM/DMARC/MX/NS/age) | DONE | §1 table — live `Resolve-DnsName` + RDAP |
| Root-cause diagnosis | DONE | Stream A sends from shared `mg.msgsndr.biz`; dedicated `mail.` verified-but-unselected (links = `email.mg.msgsndr.biz`) |
| Fix plan — copy-paste record list | DONE | §2 Namecheap table + GHL click-path |
| Plain-text alternatives | SHIPPED | `work/emails/signal.txt` + `work/emails/receipt.txt` |
| Template spam audit | DONE (PASS) | §3 table — templates were not the cause |
| Review-surface flag corrected | SHIPPED | `/work/emails` now shows real deliverability status |
| Warm-up plan | DONE | §4 14-day ladder + rules |
| Adversarial verification | DONE | 3-lens panel (DNS-auth / GHL / warm-up) — all "ship-with-fixes," folded in |
| **Deliverability fix LIVE** | **NOT DONE — gated on Shane** | DNS + GHL are Shane's to edit (registrar + account settings) |

## PENDING-SHANE (exact actions)

**A) GHL (the #1 fix):** Settings → Email Services → confirm `mail.aivoiceagency.ai` **all rows green** → set it as the **default sending domain** + From `ava@mail.aivoiceagency.ai` (+ `emailFrom` in the n8n body) → re-send test → verify in **"Show original"**: From `@mail.aivoiceagency.ai`, DKIM `d=mail.aivoiceagency.ai` pass, DMARC aligned pass.
**B) Namecheap → Advanced DNS** — add records #1–3, replace #4 (§2 table). Publish `google._domainkey` **before** enabling in Google Admin. Create `dmarc@aivoiceagency.ai`.
**C) Verify (cheapest first):** open the 2 test emails → **"Show original"** → check `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click`. If absent on the API path, route the marketing drip through a GHL send that emits them (n8n stays the trigger). Confirm unsubscribe flips email DND + n8n honors it each step.
**D) Monitoring:** verify **Google Postmaster Tools** for `aivoiceagency.ai` before ramping.
**E) Then warm up** per §4 — auth-gate first, engaged-only, inventory-bound.

## ROLLBACK
- In-repo changes (`signal.txt`, `receipt.txt`, `/work/emails` flag, board, this report): `git revert <this commit>`.
- DNS: each record is independently removable at Namecheap. No existing record was modified except the `_dmarc.mail` REPLACE (old value: `v=DMARC1;p=none;`).
- Nothing was installed into the live drip; no send identity was changed by me.
