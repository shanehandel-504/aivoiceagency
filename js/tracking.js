/* ============================================================================
 * AVA TRACKING SPINE v2 — the ONE tracking file for aivoiceagency.ai
 * ----------------------------------------------------------------------------
 * Every tag + every event lives here. Pages carry exactly one line:
 *   <script src="/js/tracking.js" async></script>
 * Public tag IDs only (they are public by design). No secrets. No GTM. No build.
 * Guard law: a placeholder ID silently skips its tag — never throws, never
 * breaks the page.
 * ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------ TAG IDS -- */
  var META_PIXEL_ID = '1029719056532809';
  var GA4_ID = 'G-ZJZD091SMC';
  /* TODO(SHANE): Google Ads — account 916-658-0915 exists, the AW- ID does
   * not yet. Enabling Ads later is EXACTLY these two lines — the code below
   * is already live and silently skips while these hold placeholders:      */
  var ADS_ID = 'AW-PENDING';                    // <- 1/2: real AW-XXXXXXXXXX
  var ADS_BOOKING_LABEL = 'LABEL-PENDING';      // <- 2/2: booking conversion label (Ads > Goals > Conversions)

  function isPlaceholder(id) {
    return !id || /PENDING|X{4,}/i.test(String(id));
  }

  /* -------------------------------------------- INTERNAL / BOT SELF-TAG -- */
  /* Never pollute analytics with our own traffic. Three off-switches, any one
   * of which silences EVERY fire (GA4 / gtag / Google Ads / Meta):
   *   - navigator.webdriver          Playwright / headless / THE EYE gate runs
   *   - localStorage ava_internal    an operator device we've opted out
   *   - ?notrack=1 in the URL        one-shot opt-out; also PERSISTS the flag
   * When NOTRACK holds, no tag ever initializes and fb()/ga()/adsConversion()
   * are no-ops — the page itself is untouched.                              */
  var NOTRACK = (function () {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('notrack') === '1') {
        try { localStorage.setItem('ava_internal', '1'); } catch (e) {}
        return true;
      }
      if (localStorage.getItem('ava_internal') === '1') return true;
    } catch (e) { /* storage/URL blocked — fall through to the bot check */ }
    return navigator.webdriver === true;
  })();

  /* -------------------------------------------- /booked QUERY SCRUB ------ */
  /* The GHL post-booking redirect may carry query params. Strip them BEFORE
   * either tracker initializes so nothing beyond the path ever reaches
   * Google/Meta logs; stash them for the /booked calendar builder.          */
  try {
    var p0 = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (p0.length > 1) p0 = p0.replace(/\/$/, '');
    if (p0 === '/booked' && location.search) {
      window.__avaBookedSearch = window.__avaBookedSearch || location.search;
      history.replaceState(null, '', location.pathname);
    }
  } catch (e) { /* never break the page */ }

  /* ---------------------------------------------------------------- GA4 -- */
  try {
    if (!NOTRACK && !isPlaceholder(GA4_ID)) {
      var gs = document.createElement('script');
      gs.async = true;
      gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
      document.head.appendChild(gs);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA4_ID);
      if (!isPlaceholder(ADS_ID)) window.gtag('config', ADS_ID); // Google Ads — live once ADS_ID is real
    }
  } catch (e) { /* tracking must never break the page */ }

  /* --------------------------------------------------------- META PIXEL -- */
  try {
    if (!NOTRACK && !isPlaceholder(META_PIXEL_ID) && !window.fbq) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }
  } catch (e) { /* never break the page */ }

  /* ------------------------------------------------------ SAFE WRAPPERS -- */
  function fb(event, params) {
    if (NOTRACK) return;
    try { if (window.fbq) window.fbq('track', event, params || {}); } catch (e) {}
  }
  function ga(event, params) {
    if (NOTRACK) return;
    try { if (window.gtag) window.gtag('event', event, params || {}); } catch (e) {}
  }
  /* Google Ads conversion — live code, silently skips on placeholder IDs. */
  function adsConversion(label) {
    if (NOTRACK) return;
    try {
      if (window.gtag && !isPlaceholder(ADS_ID) && !isPlaceholder(label)) {
        window.gtag('event', 'conversion', { send_to: ADS_ID + '/' + label });
      }
    } catch (e) {}
  }

  /* --------------------------------------------------------- PAGE UTILS -- */
  function pagePath() {
    var p = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (p.length > 1) p = p.replace(/\/$/, '');
    return p || '/';
  }
  var PATH = pagePath();

  /* ============================ EVENT WIRING ============================ */
  /* All delegated — works on every page with zero per-page code.           */

  /* 1 · tel: click — the demo IS the sale. #1 signal. */
  document.addEventListener('click', function (e) {
    try {
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href^="tel:"]') : null;
      if (!a) return;
      fb('Contact');
      ga('click_to_call', { phone_number: (a.getAttribute('href') || '').replace('tel:', '') });
    } catch (err) {}
  }, true);

  /* 1b · demo pill tap (RUN 3) — hub → homepage theater deep-link. GA4 only, no new
   * pixels/IDs. gtag uses sendBeacon transport so the event survives the navigation. */
  document.addEventListener('click', function (e) {
    try {
      var t = e.target;
      var a = t && t.closest ? t.closest('[data-event="demo_pill_tap"]') : null;
      if (!a) return;
      ga('demo_pill_tap', { page: PATH, trade: a.getAttribute('data-trade') || '' });
    } catch (err) {}
  }, true);

  /* 2 · lead-form submit (hero call-me form, gate form, /intake — any form).
   * Semantics: submit ATTEMPT = Lead (client-side validation rejects are
   * counted once). Per-form dedupe caps retry inflation per page view.      */
  var leadFiredForms = [];
  document.addEventListener('submit', function (e) {
    try {
      var f = e.target;
      if (!f || f.tagName !== 'FORM') return;
      if (leadFiredForms.indexOf(f) !== -1) return; // one Lead per form per page view
      leadFiredForms.push(f);
      var formId = f.id || (f.hasAttribute('data-callform') ? 'callform' : '') || f.className || 'form';
      fb('Lead');
      ga('generate_lead', { form_id: String(formId).slice(0, 100) });
    } catch (err) {}
  }, true);

  /* 3 · /book reached — booking intent. */
  if (PATH === '/book') {
    fb('InitiateCheckout');
    ga('begin_booking');
  }

  /* 4 · pricing section in view — once per page view.
   * DOM-ready gated: this async script usually evaluates before the body is
   * parsed, so an eval-time querySelector would silently miss the section.
   * Threshold 0.1: tall pricing sections (>viewport×3) can never reach 0.3. */
  function initPricingView() {
    try {
      var pricingEl = document.querySelector('#pricing, [id*="pricing" i], [data-pricing], .pricing, .tier');
      if (pricingEl && 'IntersectionObserver' in window) {
        var pricingSeen = false;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !pricingSeen) {
              pricingSeen = true;
              fb('ViewContent', { content_name: 'pricing' });
              ga('view_pricing');
              io.disconnect();
            }
          });
        }, { threshold: 0.1 });
        io.observe(pricingEl);
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPricingView, { once: true });
  } else {
    initPricingView();
  }

  /* 5 · ROI calculator interaction — once per page view. */
  if (PATH === '/roi') {
    var roiFired = false;
    var roiHandler = function () {
      if (roiFired) return;
      roiFired = true;
      ga('roi_engaged');
    };
    document.addEventListener('input', roiHandler, true);
    document.addEventListener('change', roiHandler, true);
  }

  /* 6 · /lsa campaign lander (RUN 5.5). Three named GA4 events, all declarative
   * via data-event so the markup stays the source of truth, all through ga() so
   * NOTRACK silences every one exactly like the rest of the spine:
   *   lsa_call_tap  — "Call or text" / "Text AVA" CTAs (tel: + sms:)
   *   lsa_demo_tap  — "Hear AVA live" CTAs
   *   lsa_calc_use  — first interaction with the loss calculator            */
  if (PATH === '/lsa') {
    document.addEventListener('click', function (e) {
      try {
        var t = e.target;
        var el = t && t.closest
          ? t.closest('[data-event="lsa_call_tap"],[data-event="lsa_demo_tap"]') : null;
        if (!el) return;
        ga(el.getAttribute('data-event'), { page: PATH });
      } catch (err) {}
    }, true);

    var lsaCalcFired = false;
    document.addEventListener('input', function (e) {
      if (lsaCalcFired) return;
      var t = e.target;
      if (!t || (t.id !== 'calls' && t.id !== 'ticket')) return;
      lsaCalcFired = true;
      ga('lsa_calc_use', { page: PATH });
    }, true);
  }

  /* ==================== BOOKING CONVERSION (the money) ================== */
  /* Primary: /booked thank-you page (GHL post-booking redirect).           */
  /* Fallback: GHL widget postMessage on /book.                             */
  /* Dedupe: sessionStorage flag — a booking never double-counts.           */
  var bookingFiredThisPage = false;
  function fireBookingConversion(source) {
    if (bookingFiredThisPage) return;
    try {
      if (sessionStorage.getItem('ava_booking_tracked')) return;
      sessionStorage.setItem('ava_booking_tracked', '1');
    } catch (e) { /* storage blocked — in-memory flag still dedupes this page */ }
    bookingFiredThisPage = true;
    fb('Schedule');
    ga('booking_complete', { source: source }); // RUN 2 /booked — GA4 conversion event
    ga('booking_confirmed', { source: source }); // legacy alias (kept for existing GA4 config)
    adsConversion(ADS_BOOKING_LABEL); // Google Ads — live once the two ADS_ constants are real
  }

  if (PATH === '/booked') {
    fireBookingConversion('booked_page');
  }

  if (PATH === '/book') {
    window.addEventListener('message', function (e) {
      try {
        var host = '';
        try { host = new URL(e.origin).hostname; } catch (err) { return; }
        if (!/(^|\.)leadconnectorhq\.com$|(^|\.)msgsndr\.com$/.test(host)) return;
        var d = e.data;
        var s = typeof d === 'string' ? d : JSON.stringify(d || {});
        if (/appointment[-_ ]?(booked|scheduled|confirmed)|booking[-_ ]?(confirmed|complete|success|booked)|widget[-_ ]?(submitted|success)/i.test(s)) {
          fireBookingConversion('ghl_postmessage');
        }
      } catch (err) {}
    });
  }
})();
