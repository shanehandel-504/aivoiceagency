# A2P 10DLC resubmission — AI Voice Agency · Oct 31 2026

Retell rejected the SMS campaign on Oct 31 at 1:36 PM CT:
"a compliant privacy policy can not be verified" and
"the multiple opt-in workflow description is incomplete or unclear."

You resubmit in Retell yourself: open the campaign, click **Edit**, paste the pieces below, click **Save**.
**Do not click "Next".** In the Oct 31 drive session, "Next" attached the $20-a-month SMS add-on.

Everything below was read from the live systems on Oct 31 (Retell API, n8n, GHL, the live sites).
Nothing is invented. Where a number has no clear consent step today, this report says so.

---

## 1. What changed today (the privacy half)

Both privacy pages now carry the two sentences carriers look for, word for word:

> No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.
> Text messaging originator opt-in data and consent will not be shared with any third parties.

- https://aivoiceagency.ai/privacy — both sentences, in "3. Text messages (SMS)". Live, commit af0796b.
- https://aichauffeur.ai/privacy/ — the first sentence was already there; the second was added. Live, commit 6f62f5b.

## 2. Brand

- **AI Voice Agency.** AI Chauffeur is its product for limousine and black car companies.
- Website: https://aivoiceagency.ai · Mailing address: PO Box 241, Kewaskum, WI 53040 (as printed on the site).
- Legal-entity details (EIN, legal name) are whatever you already registered in Retell; the API does not expose them.

## 3. Campaign description (one paragraph to paste)

> AI Voice Agency builds AI phone agents for local businesses. We text only people who called one of our
> demo lines or booked a call with our team, and who said yes to texts on that call or on the booking form.
> Messages are about what they asked for: the trip sheet from a demo call they placed, the confirmation of a
> Discovery Call they booked, a reminder before that call, the booking link when a time could not be set on
> the call, and follow-up messages about the service they asked about. No purchased lists. Message frequency
> varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.

## 4. How people opt in — one path per number

**Read this first.** Retell's own texting (custom SMS) is **off on all eight Retell numbers** today
(`custom_sms_enabled: false`). The texts people get today go out from GHL: the published text line
350-220-5305, and the AI Chauffeur texting line (…9244, reminders only, behind the AIC_TEXTS_ON switch).
If this Retell campaign is meant to turn on texting from the Retell numbers, these are the opt-in paths
that exist today.

### 414-775-0019 — AI Chauffeur demo line (agent "AIC-LIVE two-door", published v17; the same agent answers …8976)

1. The caller dials 414-775-0019.
2. The agent says it is the demo line and that "Calls are recorded and transcribed."
3. After it takes the trip, it asks (live published flow): **"Okay to text the trip sheet to that number?"**
   On the Oct 31 recorded call it was spoken as: "Is this the best callback number, and is it okay to text
   the trip sheet there?"
4. Only a yes is saved as consent (`sms_consent`), with the call recording and transcript as the record.
5. If the caller books a Discovery Call, the agent asks again (live published flow):
   **"Okay to text the confirmation to the number you're calling from?"** — or, when they gave a different
   number, **"Okay to text the confirmation to that number?"** Only a yes sends the confirmation.

### …5008 — AI Chauffeur capture desk (agent "AI CHAUFFEUR — CAPTURE DESK", published v5)

1. The caller dials the line.
2. After the trip is taken, the agent asks: **"Okay to text the trip sheet to that number?"**
3. Only a yes is saved as consent, with the recording and transcript.

### 414-240-8930 — AVA demo line (agent "AVA — AI Voice Agency", published v54; the same agent answers …8042, …6409, …6486, …1886)

**There is no clear consent step on this line today.** The published prompt never asks the caller if it is
okay to text them. The only texting line in it is "the team will text it with the link after the call".
Do not describe a phone opt-in for this number until the agent asks for one. Adding that question is an
agent run (PROMPT AUTHORITY LOCK: Claude Code does not write the agent's words).

### Web booking — aivoiceagency.ai/book and aichauffeur.ai/book/

Both pages book through the GHL booking widget. The consent checkbox in that widget reads, on both:

> I confirm that I want to receive content from this company using any contact information I provide.

It does not say "text messages", how often, "Msg & data rates may apply", STOP or HELP. That generic GHL
line is the most likely reason the reviewer called the opt-in "unclear". Fix it in GHL (calendar →
consent label) before you resubmit, with words you approve, for example a line that names texts,
frequency, rates, STOP and HELP. The AI Chauffeur calendar uses the form "AIC Discovery Call booking".

### Two page mismatches a reviewer can find

- **aichauffeur.ai/privacy/, section 3** says "Give us your cell number and tick the consent box … an automated
  phone call". That web form is not on the site any more. The page describes an opt-in that no longer exists.
- **aivoiceagency.ai/privacy, "How you opt in"** lists booking, forms and texting us first, but not the phone
  call (where AI Chauffeur asks "Okay to text…?").

## 5. Three sample messages (copied from the live templates)

1. AI Chauffeur booking confirmation (WF-SHANE-SLOTS, live since today's fix):
   > Your AI Chauffeur Discovery Call is booked for Tuesday, November 3 at 8 AM Central. — AI Chauffeur Team
2. AI Chauffeur trip sheet to a demo caller (post-call rail):
   > AI Chauffeur — trip request received
   > Sun, Nov 1 · 2:00 PM
   > 128 Main Street, Phoeni… → Phoenix Sky Harbor
   > Southwest 2258 · 4 passengers · Executive SUV
   > Trip sheet + recording: https://aichauffeur.ai/trip/AIC-…
   > Questions? Call 414-775-0019
3. AVA booking confirmation (WF-SHANE-SLOTS):
   > Your AVA setup call is booked for Tuesday, November 3 at 8 AM Central. Hear AVA anytime: 414-240-8930. — AVA Team

On the first text in any conversation, GHL adds its own line: "Reply STOP to unsubscribe. Thanks, AI Voice Agency".

## 6. Opt-out and help

- **STOP** (and other opt-out words): GHL turns on the contact's SMS do-not-disturb and nothing more is sent.
  GHL sends its own confirmation; the exact wording is set in GHL (Settings → Phone System → Messaging) and is
  not readable by API — check it before you submit.
- **HELP**: both privacy pages promise "you will get our contact details". The HELP auto-reply wording is not
  readable by API either — check that it gives the business name, 414-240-8930 and an email before you submit.

## 7. Policy URLs

- Privacy: https://aivoiceagency.ai/privacy · https://aichauffeur.ai/privacy/
- Terms: https://aivoiceagency.ai/terms.html · https://aichauffeur.ai/terms/
- SMS policy: https://aivoiceagency.ai/sms-policy.html

## 8. What Retell exposes by API

Nothing about the campaign. `/v2/list-phone-numbers` shows `custom_sms_enabled` per number (false on all
eight). Campaign and brand reads returned 404 on every path tried. The campaign lives in the dashboard only.
