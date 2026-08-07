/* ============================================================================
   AI CHAUFFEUR · SHARED PAGE JS             AIC SITE RUN 1 — "OPERATOR CUT"
   ----------------------------------------------------------------------------
   ONE source of truth for the "AVA calls you" rail. The endpoint appears in
   this file and nowhere else — CLAUDE.md § 7's principle is one swap at the
   token, not N edits across surfaces, and a lead endpoint duplicated into six
   pages is exactly the drift hazard that rule exists to prevent.

   HOST NOTE — aichauffeur.ai is a SEPARATE Vercel project rooted at
   /chauffeur/. The AVA site's site.js lives at the repo root and 404s here,
   so the rail is re-implemented rather than imported. Endpoint and payload
   contract are kept IDENTICAL to site.js so the n8n spine needs no branch;
   only source / brand / tag differ so GHL can route chauffeur leads apart.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT = 'https://circulant.app.n8n.cloud/webhook/ava-call';
  var TEL_DISPLAY = '(414) 775-0019';

  /* ── RUN 11 · § 7 — ANDROID HAPTICS ────────────────────────────────────────
     Progressive enhancement in the strict sense: feature-detected, wrapped, and
     the page is complete without it. navigator.vibrate is an Android surface;
     iOS Safari does not expose it and gets nothing here on purpose — the § 2
     press physics (2px drop, scale .985, the shadow collapsing) ARE the tactile
     layer on that platform, and they are the layer on Android too. This only
     adds a second channel where one exists.

     Two events, and only two:
       12ms         on a PRIMARY CTA tap. Short enough to read as the control
                    closing rather than as a notification.
       20/40/20     on a callback SUCCESS. Three pulses, and it fires in the
                    same block that flips the module to CALLING NOW, so the
                    buzz and the word cannot disagree.

     Never on a nav link, never on scroll, never on a failure. A phone that
     buzzes when something did not work teaches the reader to distrust the buzz.
     The try/catch is not decoration: Chrome throws if the call is not inside a
     user gesture, and a page that dies in a click handler takes the click with
     it. ─────────────────────────────────────────────────────────────────── */
  var CAN_BUZZ = ('vibrate' in navigator);
  function buzz(pattern) {
    if (!CAN_BUZZ) return;
    try { navigator.vibrate(pattern); } catch (e) { /* never let this break a tap */ }
  }
  (function primaryHaptics() {
    if (!CAN_BUZZ) return;
    /* The filled primaries only. .nav-cta / .nav-book / .nav-burger and every
       drawer link are excluded by omission, and the two closest() guards keep
       them excluded if one of these classes is ever used inside the chrome. */
    var PRIMARY = '.tel-btn,.btn-primary,.demo-play-btn,.rail-call';
    document.addEventListener('click', function (e) {
      var t = (e.target && e.target.closest) ? e.target.closest(PRIMARY) : null;
      if (!t) return;
      if (t.closest('nav.top') || t.closest('.nav-drawer')) return;
      buzz(12);
    }, { passive: true });
  })();

  /* ── nav tint on scroll ────────────────────────────────────────────────── */
  (function navTint() {
    var nav = document.querySelector('nav.top');
    if (!nav) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        /* rgba(7,11,20,...) is --midnight. This line used to write rgba(10,10,15,...)
           — the AVA PARENT's void — as an inline style, which beats the stylesheet.
           Every chauffeur page tinted to the wrong brand's background the moment
           the reader scrolled 40px, and the CSS said otherwise the whole time. */
        nav.style.background = window.scrollY > 40 ? 'rgba(7,11,20,.94)' : 'rgba(7,11,20,.86)';
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ── § G · NAV LAYER — dropdowns + drawer ──────────────────────────────────
     The links do not depend on any of this. Every anchor in the header, the
     three group panels and the drawer is a real <a href> in the served HTML,
     and the closed state is opacity + visibility, so a crawler with JS off
     reads exactly what a person gets. What this adds is keyboard behaviour:
     click-to-toggle, Escape, click-outside, and a focus trap while the drawer
     owns the screen.

     CSS already opens a panel on :hover and on :focus-within — focus-within
     fires the moment the TRIGGER takes focus, which is what makes the panel
     reachable by Tab before any of this runs. aria-expanded is kept truthful
     alongside it so a screen reader is never told a menu is shut while it is
     painted open.
     ──────────────────────────────────────────────────────────────────────── */
  (function navLayer() {
    var groups = [].slice.call(document.querySelectorAll('[data-nav-group]'));

    function closeGroups(except) {
      for (var i = 0; i < groups.length; i++) {
        if (groups[i] === except) continue;
        groups[i].classList.remove('is-open');
        var b = groups[i].querySelector('[aria-expanded]');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    }

    groups.forEach(function (g) {
      var btn = g.querySelector('[aria-expanded]');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = g.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        closeGroups(open ? g : null);
      });
    });

    if (groups.length) {
      document.addEventListener('click', function (e) {
        for (var i = 0; i < groups.length; i++) {
          if (groups[i].contains(e.target)) return;
        }
        closeGroups(null);
      });
    }

    /* ---- drawer ---------------------------------------------------------- */
    var drawer = document.querySelector('[data-drawer]');
    var burger = document.querySelector('[data-drawer-open]');
    var closer = document.querySelector('[data-drawer-close]');
    var lastFocus = null;

    var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

    function setDrawer(open) {
      if (!drawer || !burger) return;
      drawer.classList.toggle('is-open', open);
      document.body.classList.toggle('drawer-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        lastFocus = document.activeElement;
        var first = drawer.querySelector(FOCUSABLE);
        if (first) first.focus();
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }

    if (burger) burger.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('is-open'));
    });
    if (closer) closer.addEventListener('click', function () { setDrawer(false); });

    /* A link inside the drawer that points at an anchor on THIS page would
       otherwise leave the sheet covering the thing it just scrolled to. */
    if (drawer) drawer.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (a) setDrawer(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (drawer && drawer.classList.contains('is-open')) { setDrawer(false); return; }
        for (var i = 0; i < groups.length; i++) {
          if (groups[i].classList.contains('is-open')) {
            var b = groups[i].querySelector('[aria-expanded]');
            closeGroups(null);
            if (b) b.focus();
            return;
          }
        }
        return;
      }
      /* Focus trap. Only while the drawer is the thing on screen — it is a
         full-viewport sheet, so tabbing out of it lands on controls the reader
         cannot see. */
      if (e.key !== 'Tab' || !drawer || !drawer.classList.contains('is-open')) return;
      var items = [].slice.call(drawer.querySelectorAll(FOCUSABLE))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* Crossing the desktop breakpoint with the drawer open would leave the body
       scroll-locked under a sheet CSS has just hidden. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width:1024px)');
      var onChange = function (ev) { if (ev.matches) setDrawer(false); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  })();

  /* ── "AVA calls you" ───────────────────────────────────────────────────── */

  /* digits only; 10 -> +1XXXXXXXXXX; 11 leading 1 -> +...; already-+ kept. */
  function toE164(raw) {
    var hadPlus = (raw || '').trim().charAt(0) === '+';
    var d = (raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (hadPlus) return '+' + d;
    if (d.length === 10) return '+1' + d;
    if (d.length === 11 && d.charAt(0) === '1') return '+' + d;
    return '';
  }

  function wireForm(form) {
    var nameEl = form.querySelector('[data-cb-name]');
    var cellEl = form.querySelector('[data-cb-cell]');
    var okEl   = form.querySelector('[data-cb-consent]');
    var btn    = form.querySelector('[data-cb-submit]');
    var note   = form.querySelector('[data-cb-note]');
    var head   = form.querySelector('[data-cb-toggle]');
    var body   = form.querySelector('.cb-body');
    var status = form.querySelector('[data-cb-status]');
    if (!cellEl || !btn || !note) return;

    function setNote(msg, kind) {
      note.textContent = msg || '';
      note.classList.toggle('is-err', kind === 'err');
      note.classList.toggle('is-ok', kind === 'ok');
    }

    /* ── RUN 11 · § 5 — THE THIRD STATE ──────────────────────────────────────
       STANDING BY -> CALLING NOW was a two-state module that had a third state
       all along and painted it in neither colour nor word: every failure left
       the header reading STANDING BY in --neutral while the note underneath
       said the call had not been placed. Collapsed on a phone the note is not
       even on screen, so the module's own header was the only thing a reader
       could see and it was wrong.

       STATE LAW applies exactly as it does to the green: the class that
       repaints the chip and the assignment that rewrites the word are ONE
       synchronous block, and .cb-status carries transition:none, so no frame
       can render red beside "Standing by". Miss-red is failure and only
       failure. The sentence explaining WHAT failed stays in the note, in
       prose — a three-word chip cannot carry a reason, and pretending it can
       is how a status ends up meaning nothing.
       ────────────────────────────────────────────────────────────────────── */
    function fail(msg) {
      form.classList.remove('is-done');
      form.classList.add('is-err');
      if (status) status.textContent = 'Not sent';
      setNote(msg, 'err');
    }
    function clearFail() {
      if (!form.classList.contains('is-err')) return;
      form.classList.remove('is-err');
      if (status) status.textContent = 'Standing by';
      setNote('', '');
    }

    /* ── RUN 10 · COLLAPSE ────────────────────────────────────────────────────
       The 390 fold has to carry the headline, one line of subhead, the phone
       control AND this module. Collapsed to its 44px header row it fits; open
       it does not. JS-gated on purpose and honest about it: this form has no
       `action`, so with scripting off it could not submit anyway — collapsing
       it hides nothing that would otherwise work. It ships OPEN in the markup,
       so a crawler and a no-JS reader see the whole thing.
       ─────────────────────────────────────────────────────────────────────── */
    function isOpen() {
      /* Ask the RENDERED state rather than a remembered one. CSS owns the
         initial value (open at >=768, collapsed below) and JS owns every value
         after that, so reading the box is the only way the two agree on frame
         one. getClientRects() over offsetParent because the latter is null for
         anything inside a fixed ancestor. */
      return !!(body && body.getClientRects().length);
    }
    function setOpen(open) {
      form.setAttribute('data-collapsed', open ? 'false' : 'true');
      if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (head) {
      /* aria-expanded is NOT in the served markup. Without scripting this button
         does nothing, and a button that statically claims a disclosure state it
         cannot change is a lie in one direction or the other at every width. It
         gets the attribute here, set from what CSS actually rendered. */
      head.setAttribute('aria-expanded', isOpen() ? 'true' : 'false');
      head.addEventListener('click', function () {
        setOpen(!isOpen());
      });
      /* Tab into a collapsed body is impossible — display:none takes it out of
         the tab order — but a browser restoring a scroll position or an autofill
         pass can still focus inside it. Opening on focusin costs nothing and
         removes the one state where a focused control is invisible. */
      form.addEventListener('focusin', function (e) {
        if (e.target !== head) setOpen(true);
      });
    }

    /* The rail's own target is this form. Landing on a collapsed card after
       tapping "Get a call back" would be a dead end, so the same click opens it. */
    var jumps = document.querySelectorAll('a[href="#' + (form.id || '') + '"]');
    for (var q = 0; q < jumps.length; q++) {
      jumps[q].addEventListener('click', function () { setOpen(true); });
    }

    /* ── RUN 10 · READINESS ───────────────────────────────────────────────────
       The submit rests as a ghost and only takes the filled blue once both
       fields validate and consent is ticked, which keeps exactly one filled
       control on the fold until the reader has actually chosen this path.
       It is a PAINT, not a gate: the button stays enabled the whole time and
       the submit handler still does the real validation and still explains what
       is wrong. A disabled control that will not say why is worse than an
       enabled one that will.
       ─────────────────────────────────────────────────────────────────────── */
    function refreshReady() {
      var okCell = /^\+[1-9]\d{7,14}$/.test(toE164(cellEl.value));
      var okName = !nameEl || (nameEl.value || '').trim().length > 0;
      var okBox  = !!(okEl && okEl.checked);
      form.classList.toggle('is-ready', okCell && okName && okBox);
      /* Touching the form is the reader answering the error. Leaving the chip
         red while they fix it says the fix did not register. */
      clearFail();
    }
    ['input', 'change'].forEach(function (ev) {
      if (nameEl) nameEl.addEventListener(ev, refreshReady);
      cellEl.addEventListener(ev, refreshReady);
      if (okEl) okEl.addEventListener(ev, refreshReady);
    });
    refreshReady();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      cellEl.setAttribute('aria-invalid', 'false');

      var cell = toE164(cellEl.value);
      if (!/^\+[1-9]\d{7,14}$/.test(cell)) {
        cellEl.setAttribute('aria-invalid', 'true');
        fail('That number does not look right — check the digits.');
        cellEl.focus();
        return;
      }

      /* TCPA: fail closed. No explicit consent, no automated call — and the
         box is re-cleared on every reset so a new number needs a new tick. */
      if (!okEl || !okEl.checked) {
        fail('Tick the box so AVA is allowed to call you.');
        if (okEl) okEl.focus();
        return;
      }

      btn.disabled = true;
      form.classList.remove('is-err');
      if (status) status.textContent = 'Standing by';
      setNote('Sending your number to AVA…', '');

      var payload = {
        first_name: nameEl ? (nameEl.value || '').trim() : '',
        phone: cell,
        source: 'aichauffeur',
        brand: 'AI Chauffeur',
        tag: 'aichauffeur',
        page: location.pathname,
        selected_role: 'Limo / Black Car Operator',
        business_type: 'Ground Transportation',
        email: '',
        tcpa_consent: true,
        tcpa_consent_at: new Date().toISOString()
      };

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (r.ok) {
          /* STATE LAW — the class that repaints the chip and the word inside it
             change in the same synchronous block, so no frame can render green
             beside a label that still says the call has not been placed. */
          form.classList.remove('is-err');
          form.classList.add('is-done');
          if (status) status.textContent = 'Calling now';
          setNote('Your phone rings in seconds. That call is the product.', 'ok');
          /* § 7 — the ONLY success buzz on this site, and it fires inside the
             same block that paints the chip green and writes the word. */
          buzz([20, 40, 20]);
          return;
        }
        btn.disabled = false;
        fail('Could not reach AVA (' + r.status + '). Try again, or just call ' + TEL_DISPLAY + '.');
      }, function () {
        btn.disabled = false;
        fail('Could not reach AVA. Try again, or just call ' + TEL_DISPLAY + '.');
      });
    });
  }

  var forms = document.querySelectorAll('[data-cb-form]');
  for (var i = 0; i < forms.length; i++) wireForm(forms[i]);

  /* ── RUN 7 · TASK A — MOBILE STICKY ACTION RAIL ────────────────────────────
     Two independent conditions, ANDed, both driven by IntersectionObserver so
     nothing here runs on the scroll thread:

       armed      the hero CTA cluster has left the top of the viewport, so the
                  operator no longer has a control on screen.
       suppressed the callback form or the booking calendar is on screen. The
                  rail's own targets are visible, so a bar restating them would
                  be noise at best and a lid over an input at worst.

     Both observers are edge-triggered; `sync` is the only thing that touches
     the DOM, and only when the resulting state actually changed. body.rail-on
     reserves the rail's height at the foot of the document so the last line of
     a page is never trapped underneath it.

     rootMargin '-1px 0px 0px 0px' on the suppressor observer keeps a form that
     is exactly flush with the fold from flickering the rail on and off.
     ──────────────────────────────────────────────────────────────────────── */
  (function stickyRail() {
    var rail = document.querySelector('[data-rail]');
    if (!rail || !('IntersectionObserver' in window)) return;

    var trigger = document.querySelector('[data-rail-after]');
    /* ── RUN 11 · § 3 — WHAT SUPPRESSES THE BAR ─────────────────────────────
       The set used to be hand-tagged regions only, which meant the law "one
       filled action-blue control per viewport" held on the opening fold — the
       only place RUN 10's gate measured it — and stopped holding the moment
       the reader scrolled. Every inline filled primary on this site could sit
       in the same viewport as the rail's own filled control: two identical
       blue objects, both asking, neither obviously the ask.

       The classes are read from the DOM rather than tagged in markup on
       purpose. A filled primary added to a page in some future run suppresses
       the bar without anyone remembering to write an attribute, which is the
       failure mode a hand-maintained list actually has.

       `summary` joins them so the bar is never sitting on an FAQ control while
       a reader is opening and closing rows. querySelectorAll de-duplicates, so
       a .demo-play-btn inside a [data-rail-hide] bar is observed once; and the
       counter is symmetric either way, incrementing on enter and decrementing
       on exit. ──────────────────────────────────────────────────────────── */
    var suppressors = document.querySelectorAll(
      '[data-rail-hide],.btn-primary,.tel-btn,.demo-play-btn,summary');
    var armed = false;
    var visible = 0;
    var on = false;

    function sync() {
      var next = armed && visible === 0;
      if (next === on) return;
      on = next;
      rail.classList.toggle('is-on', on);
      document.body.classList.toggle('rail-on', on);
      /* No aria-hidden here on purpose. The hidden state is `visibility:hidden`
         in CSS, which already takes the rail out of BOTH the accessibility tree
         and the tab order. Adding aria-hidden on top would leave a container
         marked hidden while still holding focusable links — the exact pattern
         axe flags as aria-hidden-focus, and a certain Lighthouse a11y miss
         on a page the gate requires to score 100.
         (The adjective there was changed in RUN 10 for one reason: the word it
         used is on this brand's banned-claims grep list, and a comment that
         carries a banned string makes the audit report a clean file as dirty.
         COMMENTS SHIP — describe the rule, never quote the banned word.) */
    }

    if (trigger) {
      new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          /* Armed only when the cluster went UP and out. Scrolled off the
             BOTTOM (someone deep-linking to an anchor above it) is not a
             reason to show the rail — the CTAs are still ahead of them. */
          armed = !e.isIntersecting && e.boundingClientRect.top < 0;
        }
        sync();
      }, { threshold: 0 }).observe(trigger);
    } else {
      armed = true;
    }

    if (suppressors.length) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          var was = e.target.getAttribute('data-rail-seen') === '1';
          if (e.isIntersecting === was) continue;
          e.target.setAttribute('data-rail-seen', e.isIntersecting ? '1' : '0');
          visible += e.isIntersecting ? 1 : -1;
          if (visible < 0) visible = 0;
        }
        sync();
      }, { threshold: 0, rootMargin: '-1px 0px 0px 0px' });
      for (var s = 0; s < suppressors.length; s++) io.observe(suppressors[s]);
    }

    sync();
  })();

  /* ── MISSED-NIGHT CALCULATOR ─────────────────────────────────────────────
     Entirely client-side. Nothing is stored, nothing is sent, and neither
     input carries a default — the whole point is that every figure on screen
     came from the operator. We supply the arithmetic and nothing else.

     Basis: weekly = fare x missed calls. Monthly = weekly x 52 / 12 (not x 4,
     which quietly under-reports by roughly a week every quarter).
     Yearly = weekly x 52. The basis is stated on the page, not just here.

     The section is markup-hidden and revealed here, so with JS disabled it
     never renders as a dead set of inputs.
     ──────────────────────────────────────────────────────────────────────── */
  (function missedNightCalculator() {
    var calc = document.querySelector('[data-calc]');
    if (!calc) return;

    var fareEl = calc.querySelector('[data-calc-fare]');
    var missEl = calc.querySelector('[data-calc-missed]');
    var outs   = calc.querySelectorAll('[data-calc-out]');
    if (!fareEl || !missEl || !outs.length) return;

    var money = (typeof Intl !== 'undefined' && Intl.NumberFormat)
      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      : null;

    function fmt(n) {
      if (money) return money.format(n);
      return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function recompute() {
      var fare = parseFloat(fareEl.value);
      var miss = parseFloat(missEl.value);
      var ok = isFinite(fare) && isFinite(miss) && fare > 0 && miss > 0;
      var weekly = ok ? fare * miss : 0;
      var vals = { week: weekly, month: weekly * 52 / 12, year: weekly * 52 };

      for (var i = 0; i < outs.length; i++) {
        var key = outs[i].getAttribute('data-calc-out');
        if (ok) {
          outs[i].textContent = fmt(vals[key]);
          outs[i].setAttribute('data-empty', 'false');
        } else {
          outs[i].textContent = '—';
          outs[i].setAttribute('data-empty', 'true');
        }
      }
    }

    fareEl.addEventListener('input', recompute);
    missEl.addEventListener('input', recompute);
    recompute();
    calc.hidden = false;
  })();
})();
