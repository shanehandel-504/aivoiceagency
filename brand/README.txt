AI VOICE AGENCY — PRODUCTION IDENTITY ASSET KIT
=================================================================
AVA is the AI voice agent that answers missed business calls, books
appointments, and writes call details into the CRM.

Files are deterministically generated. Wordmarks are baked to vector
paths, so every SVG is self-contained (no font install required) and
rasterizes identically everywhere.

SOURCE OF TRUTH
-----------------------------------------------------------------
The company mark is the cyan dot.
The dot-left horizontal lockup is canon: the cyan dot sits to the LEFT
of "AI VOICE AGENCY" on the same baseline and never overlaps a letter.

Not allowed on company surfaces:
  - dot behind the wordmark
  - dot overlapping VOICE or AGENCY
  - dot embedded in a letter
  - dot used as a large central glow behind text
  - AVA disc badge (see /parked)
  - AVA letterforms on avatars/favicons/banners/GBP

LOCKED MARK
-----------------------------------------------------------------
Soft glowing cyan dot: cyan core + soft cyan halo.
  no ring  /  no white center  /  no gloss highlight

PALETTE
-----------------------------------------------------------------
  Background  #0A0A0F      Text  #EEF0F4      Accent  #00D4FF
  Typeface    Space Grotesk (geometric, technical, premium)

WORDMARK
-----------------------------------------------------------------
  "AI VOICE" in #EEF0F4, "AGENCY" in #00D4FF, wide uppercase tracking.
  Transparent logos are built for DARK surfaces. Do not place them on
  white.

TAGLINE
-----------------------------------------------------------------
  Full (where space allows):
    ANSWERS CALLS -> BOOKS APPOINTMENTS -> WRITES CRM
  Tight crop fallback:
    ANSWERS CALLS -> BOOKS -> WRITES CRM
  Exports auto-select full, shrinking type to fit, and only drop to the
  tight line when the full line cannot fit cleanly.

-----------------------------------------------------------------
FILES & WHERE THEY GO
-----------------------------------------------------------------

LOGOS (transparent, for dark surfaces)
  logo-horizontal.svg / .png   Primary canonical lockup. Site header,
                               decks, docs, email signatures, footers.
  logo-compact.svg  / .png     Tighter lockup for mobile / narrow space.

AVATAR / PROFILE (pure cyan dot on #0A0A0F)
  social-avatar.svg / .png     1000x1000  Company profile image for X,
                               LinkedIn, IG, etc. Dot only.
  gbp-profile.png              1024x1024  Google Business Profile logo.
                               Dot only; reads in a circular crop.

FAVICON / APP ICONS (cyan dot only on #0A0A0F)
  favicon.ico                  16/32/48/64 multi-size browser icon.
  favicon.svg                  scalable dark-bg dot icon.
  favicon-256.png              256x256  PWA / general app icon.
  favicon-512.png              512x512  PWA maskable / store icon.
  apple-touch-icon.png         180x180  iOS home-screen icon.
  (These are mirrored to the repo root: favicon.ico / favicon.svg /
   apple-touch-icon.png. Do not touch live nav dot CSS.)

SOCIAL / SHARE
  social-banner-master.svg/.png  1600x900  Master banner: canonical
                               lockup + tagline. No phone, no website.

PLATFORM BANNERS (canonical lockup + tagline, centered, safe-area aware)
  x-banner.png                 1500x500   X / Twitter header.
  linkedin-banner.png          1584x396   LinkedIn profile cover.
  facebook-cover.png           1640x624   Facebook page cover.
  youtube-banner.png           2560x1440  Channel art; content inside the
                               1546x423 TV-safe centre.
  gbp-cover.png                1080x608   Google Business Profile cover.

PRINT
  business-card-front.png      1050x600   3.5x2in @ 300 DPI. Canonical
                               lockup + tagline. No phone / website
                               unless separately approved.

SUBFOLDERS
  product-marks/   AVA product UI marks. NOT for company marketing.
  parked/          AVA disc badge. Not in use; retained for reference.

-----------------------------------------------------------------
REGENERATING
-----------------------------------------------------------------
Source generator: scratchpad/brandgen.py (fonttools, cairosvg, Pillow).
Deterministic: same input, identical output.

NOT INCLUDED ON PURPOSE
-----------------------------------------------------------------
No robots, microphones, headsets, chat bubbles, brain icons, purple
gradients, glossy SaaS styling, or white dot centers. No taglines on
small assets. No phone numbers or website URLs on banners or card.
