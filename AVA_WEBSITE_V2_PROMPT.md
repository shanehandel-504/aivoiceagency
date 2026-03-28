# AI VOICE AGENCY — WEBSITE V2 REBUILD BRIEF

From: Claude (CEO/Architect) + Shane Handel (Founder)
Date: March 28, 2026
Status: Build 31+ live at aivoiceagency.ai. Needs full V2 overhaul.
Deploy target: aivoiceagency.ai (Vercel, GitHub: shanehandel-504/aivoiceagency)

---

## ROLE

You are a world-class frontend engineer building a high-conversion landing page for AI Voice Agency. You ship production code. No frameworks. No npm. No React. No Tailwind. Vanilla HTML/CSS/JS only. Single index.html file. Must run at 60fps on desktop and mobile.

---

## BUSINESS CONTEXT

AI Voice Agency sells done-for-you AI voice agents (powered by Retell AI) that answer business phone calls 24/7. The product is AVA — an AI receptionist that books appointments, qualifies leads, and follows up.

- Target customer: Service businesses (HVAC, plumbing, dental, legal, med spa) who lose revenue from missed calls.
- Price range: $497 to $1,997/mo.
- Phone number: 786-937-1218 (live demo line — anyone can call it right now)
- Booking link: https://cal.com/shane-handel/strategy-call
- Founder: Shane Handel, Wisconsin-based, national coverage.

---

## WHAT EXISTS (keep these — they work)

### Signal V6 Particle Engine
- THREE.js r128, GPU vertex shader, 250K particles desktop, 30K mobile
- 7-state machine: IDLE / BREATHING / LISTENING / SPEAKING / ACTIVATED / CELEBRATION / SCREENSAVER
- Audio bridge for voice reactivity (mic input drives particle chaos)
- Retell Web SDK integration (call_started, agent_start_talking, agent_stop_talking, call_ended)
- FPS guard (auto-drops to 150K or 75K if below 30fps)
- KEEP the engine. FIX the visuals. The orb must be a DRAMATIC, centered, glowing cyan sphere — not scattered dust.

### CIRCULANT Design System Tokens
- Void: #0A0A0F (background, NEVER use pure black #000)
- Ice: #EEF0F4 (text)
- Cyan: #00D4FF (primary accent, CTAs, orb glow)
- Font Display: Space Grotesk (headings, buttons)
- Font Body: DM Sans (paragraphs, descriptions)
- Font Mono: JetBrains Mono (status labels, tech accents)
- Button Radius: 50px (pill shape)
- Glass: rgba(26,26,46,0.2) with backdrop-filter blur(16px) brightness(1.2)
- Border: 1px solid rgba(238,240,244,0.1)

### Retell Voice Call Flow
- SDK imported via ESM: https://esm.sh/retell-client-js-sdk
- Token endpoint and Agent ID are placeholders (need real values)
- Events wired: call_started, agent_start_talking, agent_stop_talking, call_ended, error

---

## WHAT MUST BE BUILT (7 sections in this exact order)

### Section 1: HERO (full viewport height)

Background: Signal V6 orb, centered, roughly 50% of viewport, breathing animation.

- Headline: "Your phones are ringing. Is anyone picking up?"
- Sub-headline: "AVA answers every call. Qualifies every lead. Books every job. 24/7. No hold times. No missed revenue."
- Primary CTA: "Call AVA Now" — triggers Retell web call (fallback: tel:7869371218)
- Secondary link: "Call 786-937-1218" text with underline
- The orb must be VISIBLE, GLOWING, ALIVE. Not faint dust particles.

### Section 2: PROOF BAR (not full viewport height)

4 capability statements in a row (desktop) or 2x2 grid (mobile):
- "24/7 Coverage"
- "< 1 Second Answer Time"
- "Zero Hold Times"
- "10-Day Setup"

NO fake numbers. These are capability statements, not inflated metrics.

### Section 3: HOW IT WORKS (timeline/workflow)

3-step vertical timeline with staggered reveal-on-scroll animation:

1. "We learn your business" — Discovery call, pricing rules, booking logic
2. "We build your agent" — Custom voice, custom script, custom integrations
3. "AVA goes live" — Answers calls, books jobs, qualifies leads, 24/7

### Section 4: INDUSTRY SELECTOR

Tabbed interface with these tabs: HVAC | Plumbing | Dental | Legal | Med Spa | Other

Each tab shows an industry-specific headline plus 3 bullet points about how AVA handles that industry's calls. Active tab has cyan underline/highlight.

### Section 5: PRICING (4 glass-morphism cards)

Starter — $497/mo
- Tagline: "Never miss the call."
- Best for: Small businesses that need reliable 24/7 call coverage.
- CTA: "Start Your AVA Setup" links to tel:7869371218

Pro — $997/mo (MOST POPULAR)
- Tagline: "Turn calls into bookings."
- Best for: Growing businesses that want automated booking and lead qualification.
- CTA: "Start Your AVA Setup" links to tel:7869371218
- Badge: "Most Popular" at top of card
- Desktop: transform scale(1.05) to visually pop

Enterprise — $1,997/mo
- Tagline: "Full revenue engine."
- Best for: Multi-location businesses that need full-stack AI voice operations.
- CTA: "Start Your AVA Setup" links to tel:7869371218

White Glove — NO PRICE SHOWN
- Tagline: "Fully managed. We build it, run it, optimize it."
- Best for: Enterprises that want a done-for-you AI voice operation with dedicated support.
- CTA: "Apply" links to https://cal.com/shane-handel/strategy-call

Grid layout: 1 column mobile, 2 columns tablet (768px+), 4 columns desktop (1024px+). Use explicit media queries, NOT auto-fit.

### Section 6: FAQ ACCORDION (6 questions)

1. "How long does it take to get set up?" — 7-10 business days. We handle everything technical.
2. "Will callers know they are talking to AI?" — Sounds natural, uses your business name, follows your tone. Most callers don't notice. Transparency is configurable.
3. "What if I already have a receptionist?" — Handles overflow, after-hours, and high-volume periods. Doesn't replace your team.
4. "How much does it cost?" — $497-$1,997/mo depending on call volume and integrations. Month-to-month. No long-term contracts.
5. "What happens when something goes wrong?" — Human quality control built in. We monitor calls, review edge cases, update the agent continuously.
6. "What about HIPAA/TCPA compliance?" — Scoped during discovery call. Call recording disclosures, data handling, opt-in flows all configurable.

First FAQ item should include: "Listen to a live demo by calling 786-937-1218."

Accordion technique: CSS grid with grid-template-rows 0fr to 1fr transition (NOT max-height hack).

ARIA attributes required: role="button", tabindex="0", aria-expanded on each toggle.

### Section 7: FINAL CTA (full viewport height)

- Headline: "Stop losing calls. Start closing jobs."
- CTA: "Call AVA Now" links to tel:7869371218
- Orb re-expands behind this section (Signal V6 lerp-based scale)

---

## NAVIGATION (fixed top bar)

- Logo: "AI VOICE AGENCY" text with small cyan accent icon
- Links: How It Works | Pricing | FAQ (smooth scroll anchors)
- Right side: "CALL AVA NOW" primary button
- Hamburger menu on mobile — opens full-screen overlay nav
- Background: rgba(10,10,15,0.92) with backdrop-filter blur(16px)

---

## FOOTER

- "WE DEPLOY AI BUSINESS OPERATIONS SYSTEMS THAT HAPPEN TO ANSWER THE PHONE."
- Copyright 2026 AI Voice Agency with Book a Call link and 786-937-1218
- "Wisconsin-built. National coverage."
- Privacy Policy and Terms links

---

## MOBILE STICKY BAR (bottom of screen, mobile only)

- Two buttons side by side: "Call AVA" (60% width, cyan fill) + "Listen" (40% width, ghost/outline)
- Both link to tel:7869371218
- Slides in with CSS transform translateY, NOT display:none toggle
- Shows on scroll after hero section

---

## VISUAL REQUIREMENTS

- The orb is THE signature visual element. It must glow. It must breathe. It must feel ALIVE. If WebGL can't look premium, build a CSS radial-gradient animation fallback that still looks incredible.
- Glass cards must have a specular highlight effect that follows the mouse X position.
- All sections use reveal-on-scroll animation via IntersectionObserver.
- Edge pulse: subtle cyan box-shadow heartbeat animation on viewport edges.
- God ray text effect on hero headline: gradient fill plus text-stroke.
- 2028 aesthetic: dark void background, glass morphism, particle fields, monospace tech accents.
- Entry animation on first load: CIRCULANT detonation (orb expands from zero).

---

## ACCESSIBILITY (non-negotiable)

- prefers-reduced-motion media query: kill all animations (duration 0.01ms).
- focus-visible on all interactive elements: 2px solid #00D4FF with 4px offset.
- No viewport zoom restrictions (no maximum-scale, no user-scalable=no).
- ARIA attributes on FAQ toggles, industry tabs, and all interactive elements.
- Semantic HTML throughout: nav, main, section, article, footer.
- Keyboard navigable: all interactive elements reachable via Tab.

---

## SEO (non-negotiable)

- Title: "AI Voice Agency — Your AI Business Operations System"
- Meta description: "AVA answers every call, qualifies every lead, books every job. 24/7. No hold times. No missed revenue. AI voice agents for any business."
- Open Graph: og:title, og:description, og:type (website), og:url
- JSON-LD schemas: Organization, WebSite, FAQPage (all 6 questions)
- Canonical URL: https://www.aivoiceagency.ai/

---

## PERFORMANCE REQUIREMENTS

- Single HTML file with inline CSS and JS
- THREE.js r128 via CDN (only external JS dependency)
- Retell SDK via ESM import from esm.sh
- Google Fonts: Space Grotesk (300,700) + DM Sans (300,400,500,600) + JetBrains Mono (400,500)
- Target: Lighthouse 90+ on mobile
- FPS guard: auto-reduce particle count if average falls below 30fps

---

## WHAT NOT TO DO

- No React, Vue, Svelte, Angular, or any framework
- No Tailwind, Bootstrap, or CSS frameworks
- No npm, webpack, vite, or any build tools
- No fake stats or inflated numbers
- No "she/her" pronouns for AVA (it is a system, not a person)
- No pure black (#000) anywhere — always use #0A0A0F (Void)
- No max-height accordion hacks — use CSS grid 0fr/1fr technique
- No display:none for show/hide animations — use CSS transform
- No skip hooks or --no-verify on git commits

---

## CEO CRITIQUE OF CURRENT BUILD (what is wrong right now)

1. The orb is invisible. 250K particles render as faint scattered dust instead of a dramatic glowing sphere. Either fix the shader math or build a CSS alternative that actually looks like a premium AI product.

2. Only 3 of 7 sections exist. Missing: navigation bar, proof bar, how-it-works timeline, industry selector, and final CTA section.

3. FAQ has 1 question instead of 6. No accordion behavior.

4. No scroll-triggered animations. The page feels completely static.

5. No entry animation. The first impression is flat — no CIRCULANT detonation.

6. Retell integration uses placeholder endpoints. The "Call AVA Now" button in the hero does nothing until real Cloudflare Worker URL and Retell Agent ID are configured.

7. The page does not SELL. It shows pricing but does not build desire first. The conversion flow should be: Hook (hero) then Proof then How It Works then Industries then Pricing then FAQ then Close. Right now it goes: Hook then Pricing then 1 FAQ then Footer. That skips the entire trust-building middle.

---

## DELIVERY

Output a single complete index.html file. All CSS inline in a style tag. All JS inline in script tags. Only external resources are THREE.js CDN, Google Fonts, and Retell SDK ESM import. The file must be copy-paste deployable to any static hosting service.

---

## PRIORITY

Ship something that makes a business owner think: "This company is from the future. I need to call that number." The orb, the glass, the animations — they are not decoration. They are trust signals. They say: "We build technology this sophisticated for OUR website. Imagine what we will build for YOUR phones."

---

## FILING SYSTEM NOTE (future phase)

The operating system will include a dispatch filing system where updates flow automatically: Dispatch updates on the fly, syncs to Google Drive, then pushes to Notion. Everything is boom boom boom — real-time, zero manual filing. This is Phase 2 infrastructure. The website V2 is Phase 1.

---

Claude CEO/Architect — March 28, 2026
Reviewed against: Definitive Website Playbook (locked March 26, 2026)
