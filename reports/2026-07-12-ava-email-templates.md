# AVA EMAIL TEMPLATE SYSTEM v1 — THE SIGNAL + THE RECEIPT — 2026-07-12

**Tag:** [L3] · **Mission:** Two production email shells (dark drip/marketing + light transactional booking), a `/work/emails` review surface, real samples, live GHL test sends. **Do NOT install into the live drip yet.**

**Result:** ✅ Both built, adversarially QA'd, and **live-sent to shane@aivoiceagency.ai via the real GHL path (HTTP 201)**. Review surface live. One flag: `PENDING-SHANE` unsubscribe URL for the marketing template.

---

## PREFLIGHT (no mutation)
| Question | Finding |
|---|---|
| Drip email send | `AVA Drip Engine v1` (`Pu661B1J1ZgezJT7`): HTML in code node **Build Steps** (`emailHtml()`) → node **Send Step** → `POST leadconnectorhq.com/conversations/messages {type:'Email',contactId,subject,html}`. |
| Receipt send | `AVA Booking Receipt` (`NMSWFtcyEQhSypSx`): **Prep Receipt** (`email_html`) → **Receipt Email** → same endpoint/shape. |
| Merge syntax | **JS `${first_name}` in the code node — NOT GHL `{{contact.first_name}}`** (verified, not guessed). |
| Locked wordmark | `brand/logo-horizontal.png` (canon: primary lockup incl. email). Serves **200** at absolute URL. Near-white "AIVOICE" + **cyan "AGENCY"** + cyan dot → **dark-surface only**; canon forbids regenerating / placing on white. SVG doesn't render in Gmail/Outlook → **PNG only**. |
| GHL CAN-SPAM auto-footer | **No reliable auto-inject** on the Conversations-API path; live receipt hardcodes address + reason, no unsubscribe. Address known/canonical: 1787 Edgewood Road, Kewaskum, WI 53040. → **PENDING-SHANE** for the SIGNAL's unsubscribe URL. |

## TEMPLATES
- **THE SIGNAL** (`work/emails/signal.html`, dark drip) — 1px cyan rule → locked PNG wordmark (absolute URL, alt) → hairline → 28px headline → body → **gold $497 money line** → one bulletproof cyan CTA (dark text) → bordered proof card (SOURCED stat: 62% unanswered / 85% never call back, 411 Locals 2024) → divider → footer (unsubscribe slot + address, signed "AVA Team").
- **THE RECEIPT** (`work/emails/receipt.html`, light booking) — cyan header bar with **reversed white-text wordmark** (locked PNG can't sit on cyan and can't be regenerated → bulletproof text lockup, print/forward-safe) → "You're booked ✓" → 2-column detail table (Name/Date/Time/Phone/Calendar) → **Add-to-calendar** (Google Calendar render link) → cyan CTA → next steps → plain footer (address).

## EMAIL ENGINEERING (all met)
Table-based · 600px max · **all CSS inline** · VML `<!--[if mso]>` bulletproof buttons (verified in QA) · font stack `'Space Grotesk','Helvetica Neue',Arial` · **hidden preheader + whitespace hack** · dark-mode `color-scheme`/`supported-color-schemes` meta + explicit `bgcolor` attrs · images absolute-URL + width/height + alt · no critical info in an image · no flex/grid.

## QA — adversarial 3-client review (Outlook-VML / Gmail-dark-mobile / law-a11y-canspam)
**0 blockers · 0 majors · 5 minor** WCAG contrast sub-thresholds — all applied: signal signature `#6B7280→#9AA1AD`; receipt table labels `#7A828F→#5C6573`; receipt footer `#8A94A3→#6A727E`; receipt tel-link `#0093b3→#007A93` (26px checkmark left as-is, passes large-text). Content-law + Outlook-VML + CAN-SPAM elements verified clean.

## PROOFS
- **/work/emails** — FIFTHGEAR-gated review surface: both templates in same-origin iframes, subject + preheader + install-target shown, **copy-HTML per template**, desktop/mobile toggle, PENDING-SHANE flag. Hub card + mininav wired.
- **Live sends (real GHL path, under Doppler, keys never printed)** to shane@aivoiceagency.ai (contact `P9ZrGdOL9087JJaI8unu`, send-only — no upsert, no tag change):
  - THE SIGNAL → HTTP **201** · messageId `MyLdX7r2RXcPhNYoHH4W`
  - THE RECEIPT → HTTP **201** · messageId `jP4VKwI2t7hGDe5gOQzs`
  - conversationId `jdtWcsXireMU0kagSpww`

## DONE TABLE
| ITEM | STATUS | PROOF |
|---|---|---|
| THE SIGNAL email | BUILT | work/emails/signal.html · VML+preheader+dark-lock verified |
| THE RECEIPT email | BUILT | work/emails/receipt.html · reversed wordmark + detail table + cal link |
| /work/emails review surface | LIVE | FIFTHGEAR page, copy-HTML, device toggle; hub card+nav |
| Adversarial QA | DONE | 0 blocker / 0 major / 5 minor fixed |
| Live test — SIGNAL | SENT | GHL 201 · msg MyLdX7r2RXcPhNYoHH4W |
| Live test — RECEIPT | SENT | GHL 201 · msg jP4VKwI2t7hGDe5gOQzs |
| board.json | UPDATED | L3 note + work-emails item + ISO log |
| Live drip install | NOT DONE (by design) | awaiting Shane "SHIP EMAILS" |

## PENDING-SHANE
- **Unsubscribe URL (SIGNAL / marketing):** GHL Conversations API doesn't auto-inject; the footer carries a `{{unsubscribe_url}}` slot + the physical address. Confirm GHL populates that token on send, or wire an unsubscribe endpoint, **before the drip goes live**. (RECEIPT is transactional — none required.)
- **SHIP EMAILS:** on your word, install SIGNAL → `Build Steps.emailHtml()` and RECEIPT → `Prep Receipt.email_html` (swap sample values for `${first_name}` / appt vars).

## ROLLBACK
- Pages/templates: `git revert <this commit>` (removes /work/emails + hub nav delta + board delta). Nothing was installed into the live drip — the sends were one-off tests to Shane's own inbox.
