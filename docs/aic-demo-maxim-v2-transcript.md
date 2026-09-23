# maxim-v2.mp3 — transcript and the trip it states

Source of truth for the "Play the call" card on the aichauffeur.ai homepage
(`chauffeur/index.html`, `#demo-console`). Transcribed 2026-09-22 with
faster-whisper, model `base`, English, from `chauffeur/audio/demos-v2/maxim-v2.mp3`.
Runtime 69.2s (ffprobe). Not deployed: `docs/` is in `.vercelignore`.

Written down because the card and the recording had drifted apart: the card
described an ORD airport drop for a Maria T. with a flight number, and this call
is an anniversary pickup. Anyone changing that card again should check it against
the lines below rather than re-transcribing.

## Transcript

```
[  0.00 ->   2.76] Maxim Limousine, this is Ava. How can I help you tonight?
[  3.56 ->   8.08] Yeah, hi. I need a car for tonight. It's my anniversary.
[  8.28 ->  11.80] I need to pick my wife up at seven, take her downtown to 11 Madison Park.
[ 12.48 ->  17.08] Happy anniversary. Let's make it perfect. Pick up at seven from your home address on
[ 17.08 ->  20.64] file, the one on Brickle. Yeah, wait, you have that already?
[ 21.32 ->  25.32] I do, Mr. Reyes. You rode with us in March, the airport run. For tonight,
[ 25.32 ->  29.96] I'd suggest the black escalade. But for an anniversary, can I put you in the Mercedes
[ 29.96 ->  34.72] S class, same rate tonight, champagne on ice, no extra charge.
[ 35.48 ->  38.00] Yeah, yeah, do that. That's, that's perfect.
[ 38.60 ->  42.88] Done. Marcus is your chauffeur. He had you in March. You mentioned the jazz
[ 42.88 ->  45.68] station. I've noted it for tonight. Seven o'clock sharp.
[ 45.88 ->  48.16] I'm texting you his photo and live tracking right now.
[ 50.44 ->  51.24] Got it. Wow.
[ 51.80 ->  55.24] I also emailed your trip ticket and the confirmation to the Gmail on file.
[ 55.52 ->  59.76] One more thing, the lobby at 11 Madison has your reservation noted for 730.
[ 59.76 ->  64.68] So there's no rush at pickup. How did you even? Okay, this is wild. Thank you.
[ 65.40 ->  68.80] My pleasure, Mr. Reyes. Marcus will see you at seven. Happy anniversary.
```

## Card field → the line that states it

| Card field | Value | Stated at |
|---|---|---|
| Console title | Trip sheet — anniversary pickup | 3.56 "It's my anniversary" |
| Inbound caller | Mr. Reyes | 21.32 "I do, Mr. Reyes" |
| Caller sub | Inbound · Repeat — rode in March | 21.32 "You rode with us in March, the airport run" |
| Trip type | Anniversary · downtown drop | 3.56 + 8.28 "take her downtown" |
| Trip sub | To 11 Madison Park · lobby holds 7:30 PM | 8.28 + 55.52 "reservation noted for 730" |
| Pickup | 7:00 PM | 12.48 "Pick up at seven" · 42.88 "Seven o'clock sharp" |
| Vehicle | Mercedes S-Class | 25.32 "can I put you in the Mercedes S class, same rate tonight" |
| Passengers | 1 | 8.28 "pick my wife up ... take her downtown" — one passenger. A reading of the sentence, not a number the call speaks. The only field on the card that is not verbatim. |
| Pickup address | Home address on file / On file from the March run | 12.48 "from your home address on file" · 21.32 |
| Status | Trip ticket emailed | 51.80 "I also emailed your trip ticket and the confirmation" |
| Chauffeur | Marcus assigned | 38.60 "Marcus is your chauffeur" |
| Meta | Call 1:09 · Photo and live tracking texted · Trip ticket emailed | ffprobe 69.2s · 45.88 · 51.80 |

## Stated in the call but deliberately not on the card

Champagne on ice at no extra charge (29.96), the jazz station noted for the
chauffeur (42.88), and the upgrade from the black Escalade (25.32). All true,
all cut for space — add them from these lines, do not invent new ones.

## On the card until 2026-09-22, stated nowhere in the call

Maria T. · +1 (262) 555-0144 · airport drop · ORD · United 414 · departure
7:15 PM · pickup 3:30 PM · Black SUV · 3 passengers · 4 bags · 142 N. Riverwalk
Way · hotel lobby / valet circle · "Captured 2:14" · "Routed to dispatch" ·
"Awaiting confirmation" · "Callback number captured" · "Dispatcher notified".

## The street name

The transcript hears "the one on Brickle" at 17.08. That is a phonetic guess by
the model and the card does not repeat it — "Home address on file" is what the
card says. Confirm the spelling off the master script before any surface prints
a street.
