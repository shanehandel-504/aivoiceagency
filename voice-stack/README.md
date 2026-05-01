# AIChauffeur Voice Stack

Live voice demo wiring for aichauffeur.ai/demo.

## Architecture

```
Browser (mic/audio)
    ↓ WebRTC
LiveKit Cloud (wss://aichauffeur-peohpvww.livekit.cloud)
    ↓
LiveKit Agent (agent.py) — runs in LiveKit Cloud
    ↓
xAI Grok (STT + LLM + TTS) — via LiveKit Inference layer
```

Token issuance:
```
Browser → POST → Cloudflare Worker (aichauffeur-token) → returns LiveKit JWT
```

## Components

### `worker/worker.js`
Cloudflare Worker that issues short-lived (30 min) LiveKit JWTs to browser clients.
Already deployed to: `https://aichauffeur-token.<account>.workers.dev`
Secrets baked in via Cloudflare API.

### `agent/agent.py`
LiveKit agent — the dispatcher AI. Listens to caller, captures trip details, calls tools to update the on-screen dispatch ticket, finalizes ticket at end of call.

### `agent/requirements.txt`
Python dependencies. Install: `pip install -r requirements.txt`

### `agent/.env.template`
Template for local dev. Copy to `.env` with real values from AICHAUFFEUR KEYS doc.

## Deploy Agent (Shane, at Dell)

```bash
cd voice-stack/agent
python -m venv venv
venv\Scripts\activate         # Windows
pip install -r requirements.txt
cp .env.template .env         # Then edit .env with real XAI_API_KEY
python agent.py dev           # Local test mode
```

Once local works:

```bash
# Install LiveKit CLI
winget install LiveKit.CLI

# Authenticate
lk cloud auth

# Deploy agent
lk agent create
lk agent deploy
```

## Tools the agent calls

- `update_dispatch_field(field_key, main_value, sub_value)` — pushes a field update to the browser via LiveKit data channel on topic `dispatch_ui`
- `finalize_ticket(ticket_id, summary)` — marks ticket complete, pushes completion event to browser

The frontend (chauffeur/demo/index.html, when wired live) listens on the `dispatch_ui` data channel and animates the UI on every event.
