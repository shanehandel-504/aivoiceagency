---
name: circulant-funnel
description: CIRCULANT FUNNEL design + conversion skill for AI Voice Agency landing pages. Use when building or editing conversion funnels, the /new homepage, demo pods, or any AVA lead-capture page. Governs tokens, doctrine, conversion/honesty/forms/audio/perf/SEO laws, and QA greps.
---

# CIRCULANT FUNNEL — design + conversion skill
STACK LAW: vanilla HTML/CSS/JS only. No React, Tailwind, npm builds, frameworks, Framer. CDN scripts allowed (jsDelivr/cdnjs). Static HTML = SEO weapon.
TOKENS (dark stage): --void:#0A0A0F; --panel:#10131A; --line:#23232E; --text:#EEF0F4; --dim:#9AA1AD; --cyan:#00D4FF; --green:#28D07A (live-status dots ONLY); --gold:#D4A94E (pricing scope note ONLY).
TOKENS (light paper cards — pricing, forms, FAQ answers, receipts): --paper:#FFFFFF; --paper2:#F6F7F9; --ink:#10131A; --ink2:#4A5160; CTA on paper = ink button, cyan-tinted hover, white text (contrast ≥ 7:1).
TYPE: Space Grotesk everywhere. Body 17px min mobile, weight 500 on dark backgrounds. H1 clamp(34px,7vw,64px), tight -0.02em. Serif-italic twist words in H1 only (Georgia italic).
DOCTRINE: dark theater, white paper. ONE focal element per viewport. Generous void. One accent. The demo is the hero — never bury it.
CONVERSION LAWS: 5-second clarity (7th grade). CTA every viewport. Sticky bottom bar [Talk to AVA][Talk to a Human], 56px targets, never covering inputs. Trust Ladder order: Hear → Watch → Text → Try live → Book. Watching is free; touching AVA live costs a phone number. tel: 414-240-8930 stays ungated in hero.
HONESTY LAWS: no fake liveness, counts, ratings, logos, testimonials. Sample data labeled "Sample" or "Demo call — AVA's real voice. Sample data." One speed claim sitewide: "one ring." AVA is never "she/her" in copy. No written free-minutes offers. Cold surfaces sign "AVA Team". Public numbers ONLY: 414-240-8930 (call), 350-220-5305 (text).
SAMPLE DIALOGUE: the demo-copy word ban targets marketing CLAIMS about AVA's service; natural booking language ("booked," "locked in") IS allowed inside clearly-labeled sample call dialogue (audio, SMS, theater).
FORMS: TCPA fail-closed — submit disabled until consent checked; label "OK to call and text me at this number."; aria-live status region; POST blocked without consent server- and client-side.
AUDIO: pre-rendered MP3s, lazy-loaded on first interaction; page loads MUTED with animation; one tap enables sound; captions ALWAYS rendered; collapsible text transcript under every player (SEO + a11y); noscript fallback text.
PERF BUDGET: <150KB HTML+CSS+JS before audio; LCP <2.0s mobile; CLS <0.05 (reserve all media dimensions); INP <200ms (init audio/analyser off main thread on first tap); zero console errors.
SEO/AEO: URLs never change; H1s keep keyword targets; answer-first 40–60 word block under a question H2 per page; FAQPage/HowTo/Service/Product/Organization/AudioObject/Speakable/BreadcrumbList JSON-LD as relevant; llms.txt; visible "Updated <Month Year>"; self-canonical + matching og:url; per-page OG image; footer AI-disclosure line.
QA GREPS BEFORE ANY MERGE: forbidden numbers above; " she "/" her " within 3 words of AVA; "free minute"; "guaranteed"; "iMessage"; react|tailwind imports; exactly 3 pricing tiers.
PUBLISH CHECKPOINT: every run ends live + verified + DONE table (artifact → status → URL). Draft = failed run.
