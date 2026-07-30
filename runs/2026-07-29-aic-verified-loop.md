# RUN BRIEF — AIC VERIFIED RESERVATION LOOP

**Filed:** 2026-07-29
**Status:** STEP 0 filed — AWAITING GO. Zero mutations beyond this file.

---

## MISSION TEXT (verbatim, as issued)

MISSION: AIC VERIFIED RESERVATION LOOP — full AI Chauffeur build. Todd = tenant #1 config only.

STEP 0: Write this entire message to runs/2026-07-29-aic-verified-loop.md, commit it, print your execution plan, then WAIT FOR GO. Zero mutations before GO.

LANE LAW: You own repo + GHL API + Retell API (keys via Doppler; if a needed key is absent, STOP and print exactly which one). You DO NOT touch n8n — the architect chat owns all n8n work in parallel. PROMPT AUTHORITY: you never author agent prompt text; at STEP R you will prompt "PASTE AGENT PROMPT NOW" and deploy verbatim what Shane pastes.

STEP 1 — REPO: Commit schema/aic-reservation-v1.json — canonical object: trip_type HOURLY|ROADSHOW|AIRPORT_ARR|P2P; booker{name,company}; passenger{first,last,mobile_e164,email,pax_count}; vehicle{class:SEDAN|SUV|STRETCH|MINIBUS|LIMOBUS|SPRINTER|COACH,luggage_count}; pickup{datetime_local,tz,address,notes}; dropoff{address,null for hourly}; stops[]; hours_booked; flight{airline,number,meet_style:CURBSIDE|BAGGAGE|PLANESIDE}; billing{type:CC_ON_FILE|DIRECT_BILL|NEW_ACCOUNT}; pricing{mode:CAPTURE_ONLY}; special_notes; source{call_id,agent_id,recording_url,consent,captured_at}; ids{tenant_id,intake_id}; status. Commit templates/aic-proof-ticket.html (proof header: CRM WRITE VERIFIED · execution chain checklist · record id · timestamp; then dispatch trip ticket: header block, customer info, routing & time windows, flight tracking, special instructions; provider line "Limo Anywhere — Not submitted, demo mode"; zero dollar amounts, "Rate: dispatch confirms"; absent fields print "— NOT PROVIDED"; signed {{company_name}} Dispatch) and templates/aic-dispatch-sheet.txt (plain reservation sheet, same fields).

STEP 2 — GHL (API, location sdShCZCaxce8DHKbYcIl): Create contact custom fields with keys exactly: aic_trip_type, aic_pickup_datetime, aic_pickup_address, aic_dropoff_address, aic_stops, aic_pax_count, aic_luggage_count, aic_vehicle_class, aic_hours_booked, aic_airline, aic_flight_number, aic_meet_style, aic_special_notes, aic_booker_name, aic_booker_company, aic_billing_type, aic_intake_id, aic_call_id, aic_recording_url, aic_crm_status, aic_payload_hash, aic_consent, aic_tenant. Create pipeline "AI Chauffeur Reservations" with stages: Demo Call Taken, CRM Verified, Ticket Sent, Follow-Up, Client Signed. If pipeline creation is API-blocked, print exact 60-second UI steps and pause for Shane. Print every created field ID in the DONE table — the architect needs them for n8n.

STEP R — RETELL (existing GO package rulings apply): scope writes to +14147750019 ONLY, never 414-240-8930. Prompt "PASTE AGENT PROMPT NOW" → deploy Shane's paste verbatim to the 775 agent. Voice: ElevenLabs gJx1vCzNCD1EQHT212Ls, stability 0.78 / similarity 0.85 / style 0.15. Model: flagship tier, enum-gated via throwaway-LLM probe, ABORT if absent. begin_message carries {{company_name}}. Set custom_analysis_data schema: trip_type, caller_first, caller_last, caller_phone, caller_email, pax_count, luggage_count, vehicle_class, pickup_address, dropoff_address, pickup_date, pickup_time, hours_booked, airline, flight_number, meet_style, special_notes, consent. Register realtime custom function write_reservation → URL: PAUSE and ask Shane for the webhook URL (architect supplies it from the n8n build). Backup precall JSON to retell-backups/. Publish → verify the PUBLISHED version → simulate_conversation: greeting must contain the company name; a literal unresolved {{business_name}} in sim = simulator gap, NOT deploy fail — verify with one real dial.

STEP 3 — VERIFY SLATE: sim the four trip types + failure cases (missing flight, vague address, mid-call correction). Zero fabricated fields, zero premature "confirmed" language.

PUBLISH CHECKPOINT: everything live, board.json status flip + ISO LOG entry, commit /reports/2026-07-29-aic-verified-loop.md, print DONE table (artifact → live status → proof). Anything not live: first line "RUN INCOMPLETE — what/why/next" in caps.

---

## KEY AVAILABILITY (read-only check, 2026-07-29)

| Key | Doppler | Needed for |
|---|---|---|
| `GHL_PIT` | PRESENT | STEP 2 — custom fields + pipeline |
| `GHL_LOCATION_ID` | PRESENT | STEP 2 — location scope |
| `RETELL_API_KEY` | PRESENT | STEP R — agent deploy + publish |
| `ELEVENLABS_API_KEY` | PRESENT | voice id reference only |

No missing key. No STOP condition on credentials.

---

## HARD BLOCKS ALREADY IDENTIFIED

1. **Agent prompt text** — I do not author it. STEP R halts on `PASTE AGENT PROMPT NOW`.
2. **`write_reservation` webhook URL** — owned by the architect chat (n8n). STEP R halts for it.
3. **n8n** — out of my lane entirely. No n8n tool call will be made in this run.
