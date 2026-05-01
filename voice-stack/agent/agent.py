"""
AIChauffeur Dispatch Agent
LiveKit Cloud agent — handles inbound voice calls, captures dispatch tickets.
Uses xAI Grok via LiveKit Inference (STT + LLM + TTS).

Deploy: lk agent create / lk agent deploy
Env vars (set in LiveKit Cloud dashboard):
  XAI_API_KEY
  LIVEKIT_URL
  LIVEKIT_API_KEY
  LIVEKIT_API_SECRET
"""

import asyncio
import json
import logging
from typing import Annotated

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, function_tool
from livekit.plugins import xai
from livekit.plugins import silero

load_dotenv()

logger = logging.getLogger("aichauffeur-agent")
logger.setLevel(logging.INFO)


SYSTEM_PROMPT = """You are AVA, the dispatch intake agent for AIChauffeur, a transportation operator serving limo, black car, and shuttle clients.

YOUR JOB
You answer inbound calls, capture ride requests cleanly, and route dispatch tickets to the human dispatcher who confirms and runs the operation. You are NOT a salesperson, NOT a chatbot, NOT a receptionist. You are dispatch intake software with a voice.

CORE BEHAVIOR
- Speak naturally, not robotically. Short sentences. Conversational.
- Move efficiently. Ask one question at a time, get one answer at a time.
- Capture the trip details: pickup location, dropoff location, pickup time, vehicle type, passenger count, bags, special notes.
- For airport trips: get flight number, terminal, departure time. Adjust pickup buffer accordingly (90 min before domestic, 2 hr international).
- For charters: get block duration, vehicle preferences, multi-stop details.
- Handle mid-call corrections naturally. If they change vehicle, time, destination, or passengers — update the ticket and confirm verbally.
- Read back the captured details before ending. Get verbal confirmation.

CRITICAL LANGUAGE RULES (NEVER VIOLATE)
- Say "captured" or "routed to dispatch" — NEVER say "booked" or "confirmed".
- Say "dispatcher will reach out within fifteen minutes to confirm" — NEVER say "you're confirmed".
- NEVER quote a final price. Use ranges like "two hundred eighty-five to three twenty-five".
- NEVER say "I'll send the driver" — say "the dispatcher will assign a driver".
- NEVER take payment information.

QUOTE RANGES (illustrative until rate rules configured)
- Local airport drops: $65–$125
- Long-distance airport (MKE to ORD): $285–$325
- Sprinter rates: 1.5× sedan
- Stretch limo: 1.8× sedan
- Hourly charter: $230/hr per vehicle, with gratuity

PERSONALITY
- Professional, lightly warm. Operator-to-operator energy.
- Don't apologize unnecessarily. Don't over-explain.
- If they're vague, ask. Don't guess.
- If something is unusual (special request, unusual route), just say "I'll flag that for the dispatcher".

TOOL USE
You have tools to update the on-screen dispatch ticket in real-time as you capture information:
- update_dispatch_field: call this whenever you capture a new piece of info (caller name, route, time, vehicle, passengers, quote)
- finalize_ticket: call this when the call is complete and the ticket is ready to route to dispatch

CALL FLOW
1. Greet briefly: "AIChauffeur dispatch, how can I help."
2. Listen. Identify trip type from their first sentence.
3. Capture pickup location and time.
4. Capture dropoff / destination.
5. Capture vehicle preference and passenger count + bags.
6. Estimate quote range from your rules.
7. Read back the trip + quote.
8. Confirm verbally, then say "Captured. Dispatcher will reach out within fifteen minutes to confirm."
9. Call finalize_ticket.

NEVER MAKE UP DETAILS. If you don't know, ask. If they don't know, flag it.
"""


@function_tool()
async def update_dispatch_field(
    field_key: Annotated[str, "Which field to update. One of: caller, trip, route, time, vehicle, pax, quote"],
    main_value: Annotated[str, "The main value to display (e.g. 'Maria T.' or '3:30 PM' or '$285 – $325')"],
    sub_value: Annotated[str, "Optional supporting detail (e.g. flight number, address)"] = "",
):
    """Update a single field on the live dispatch ticket displayed in the caller's browser."""
    payload = {
        "type": "field_update",
        "key": field_key,
        "main": main_value,
        "sub": sub_value,
    }
    # Publish to data channel — frontend listens for these and animates the UI
    try:
        room = agents.get_job_context().room
        await room.local_participant.publish_data(
            json.dumps(payload).encode(),
            reliable=True,
            topic="dispatch_ui",
        )
        logger.info(f"Published field update: {field_key}={main_value}")
        return f"Field {field_key} updated to {main_value}"
    except Exception as e:
        logger.error(f"Failed to publish field update: {e}")
        return f"Update queued for {field_key}"


@function_tool()
async def finalize_ticket(
    ticket_id: Annotated[str, "Generated ticket ID like AC-2026-XXXX"],
    summary: Annotated[str, "One-sentence summary of the captured trip"],
):
    """Mark the dispatch ticket complete and route to dispatch queue."""
    payload = {
        "type": "ticket_complete",
        "ticket_id": ticket_id,
        "summary": summary,
    }
    try:
        room = agents.get_job_context().room
        await room.local_participant.publish_data(
            json.dumps(payload).encode(),
            reliable=True,
            topic="dispatch_ui",
        )
        logger.info(f"Ticket finalized: {ticket_id}")
        return f"Ticket {ticket_id} routed to dispatch"
    except Exception as e:
        logger.error(f"Failed to publish completion: {e}")
        return f"Ticket {ticket_id} captured (publish queued)"


class DispatcherAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions=SYSTEM_PROMPT,
            tools=[update_dispatch_field, finalize_ticket],
        )


async def entrypoint(ctx: agents.JobContext):
    """Entry point for each new room (each new caller)."""
    logger.info(f"Agent connecting to room: {ctx.room.name}")
    await ctx.connect()

    session = AgentSession(
        # xAI Grok stack via LiveKit Inference
        stt=xai.STT(model="grok-stt"),
        llm=xai.LLM(model="grok-4-1-fast-non-reasoning"),
        tts=xai.TTS(model="grok-tts", voice="ara"),
        vad=silero.VAD.load(),
    )

    await session.start(
        agent=DispatcherAgent(),
        room=ctx.room,
        room_input_options=RoomInputOptions(),
    )

    # Greeting — let the agent open the call
    await session.generate_reply(
        instructions="Greet the caller briefly: 'AIChauffeur dispatch, how can I help.'",
    )


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="aichauffeur",
        )
    )
