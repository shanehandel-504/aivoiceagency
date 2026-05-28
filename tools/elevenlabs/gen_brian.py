"""Generate brian-message.mp3 via ElevenLabs TTS.

Reads the API key from the ELEVENLABS_API_KEY environment variable.
Writes the MP3 to ../../outputs/brian-message.mp3 relative to this script.
"""

import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

VOICE_ID = "tnSpp4vdxKPjI9w0GnoV"
MODEL_ID = "eleven_multilingual_v2"

OUTPUT_PATH = (
    pathlib.Path(__file__).resolve().parent.parent.parent
    / "outputs"
    / "brian-message.mp3"
)

TEXT = """Hey Brian — alright, let me actually break down what I'm building, the whole thing, because last time it sounded like tech word salad and I want you to really get it.

Start with the simple version. You know how you fill out a form on a truck — a lifted F-350, a trophy truck, whatever — and then you just sit there waiting for somebody to call you back? Hours. Sometimes the next day. Sometimes never. I built the thing that kills that wait.

The second somebody fills out a form, my system calls them. Not in an hour — in one or two seconds. And it doesn't sound like a robot reading a script. It talks like a real salesperson. It knows everything about that truck — every spec, every answer to every question somebody might throw at it. And it's trying to close them right there on the phone. Take the deposit. Take the card. Lock the deal.

If they're not ready, it books an appointment. If somebody's red hot and ready to buy right now, it transfers the call straight to you, live, while they're still fired up. You set your calendar — available, it sends you the hot ones. Out on the lake, it handles everything and texts you the summary. You never answer a cold call again.

But here's the part most people don't get. The phone calls are just the front door. This is a full operating system for a business. It controls every lead that comes in. It runs the follow-up — the seven-day drip, the text sequences, the email chases — automatically, so no lead ever falls through the cracks. The stuff that normally takes a whole sales team and an office full of people? The system does it. By itself. All day, all night, never sleeps, never has a bad day.

And it's smart, Brian. Like genius-in-your-pocket smart. It's AI. You can ask it anything. When you're buying trucks, you can run a deal past it before you pull the trigger and it'll give you the smartest read you've ever gotten. As it grows, it can watch your numbers and tell you which ads are actually making money and which ones are burning cash, so you stop guessing and start pointing your money where it actually works.

It's like having a superhuman business partner that thinks ten steps ahead and gives you the next best move, every single time. That's literally how I run my whole operation right now. Every decision, every next step — I've got the system pointing me in the right direction.

And here's the thing — trucks is just my example because that's your world. It doesn't matter what the business is. Construction. Boats. Real estate. Whatever. Every business runs the same underneath — leads come in, you follow up, you sell, you deliver. That's it. This system controls all of it. Same machine, any business.

Now here's why I'm telling YOU. I'm not looking for a partner on the software — that's mine, I'm building that. But I'm going fifty-fifty with guys who've got a business they actually love. You love trucks. You love building them, flipping them, talking to people about them. So you do that — the part you're good at and you enjoy. And my system runs the entire back end.

No appointment setters. No sales floor. No payroll for any of that. The AI talks to every lead, qualifies them, sells them, books them, and only hands you the deals worth your time.

Think about what that means. You could run a serious operation, big volume, with basically just you and me and maybe a closer or two if we want them. No overhead eating you alive. The margins are stupid. Hard-to-lose stupid.

That's the unfair advantage. Everybody else is drowning in missed calls and slow follow-up. We'd have a machine that never misses, never sleeps, and never lets a hot buyer cool off.

That's what I've been heads-down building for six months, brother. It's almost ready to rip.

Oh — and hey, real quick. This whole message you're listening to? This is the actual voice. It's conversational. So go ahead — ask me a question. Anything you want. About the system, about your trucks, whatever. I'm listening. Go ahead. <break time="2.5s" /> <break time="2.5s" /> I'm waiting, Brian. Ask me something. <break time="2.5s" /> <break time="2.5s" /> <break time="2.5s" /> Ha. Gotcha. I'm just messing with you, brother — this one's a recording. But that pause you just sat through talking to your phone? On the real system, it would've already answered you. That fast. That's the whole point.

Alright. Pick a business you love. Let me bolt this thing onto it. Let's go make some real money. Talk soon."""


def main() -> int:
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        print(
            "ERROR: ELEVENLABS_API_KEY env var is not set.\n"
            "Set it with: export ELEVENLABS_API_KEY=your_key_here",
            file=sys.stderr,
        )
        return 2

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
        "?output_format=mp3_44100_128"
    )
    payload = {
        "text": TEXT,
        "model_id": MODEL_ID,
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.80,
            "style": 0.10,
            "use_speaker_boost": True,
            "speed": 1.0,
        },
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP_ERROR {e.code} {e.reason}\n{body}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        return 1

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_bytes(data)
    print(f"OK bytes={len(data)} path={OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
