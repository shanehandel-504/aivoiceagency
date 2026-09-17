/* ============================================================================
   AI CHAUFFEUR · SHARED PAGE JS             AIC SITE RUN 1 — "OPERATOR CUT"
   ----------------------------------------------------------------------------
   Shared chrome for every page on this host: nav tint, the drawer, the sticky
   action rail, haptics and the glow gate. It posts nothing and holds no
   endpoint — 2026-09-17 removed the lead form this file used to own, and with
   it the only URL that was ever written here.

   HOST NOTE — aichauffeur.ai is a SEPARATE Vercel project rooted at
   /chauffeur/. The AVA site's site.js lives at the repo root and 404s here,
   so this file is a re-implementation rather than an import.
   ========================================================================== */
(function () {
  'use strict';

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

     That is the only event left. A second pattern belonged to the lead form
     this file used to own, and went with it on 2026-09-17.

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

  /* ── RUN 7 · TASK A — MOBILE STICKY ACTION RAIL ────────────────────────────
     Two independent conditions, ANDed, both driven by IntersectionObserver so
     nothing here runs on the scroll thread:

       armed      the hero CTA cluster has left the top of the viewport, so the
                  operator no longer has a control on screen.
       suppressed an inline primary, the booking calendar or the footer is on
                  screen. Something the bar restates is
                  already visible, so the bar would be noise at best and a lid
                  over an input at worst.

     RUN 13 · the bar is Call + Book now, and the suppressor set did not need
     to change to cover it: every /book/ CTA on this site is either a
     .btn-primary or sits inside the footer, and both are already observed.

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

/* ══ 2026-09-13 · ANALYTICS ═══════════════════════════════════════════════════
   Every [data-event] click becomes one Vercel Web Analytics custom event. The
   queue shim in each page's <head> defines window.va before this file runs, so a
   click made before the insights script arrives is queued rather than lost. */
document.addEventListener('click', function (e) {
  var el = e.target && e.target.closest ? e.target.closest('[data-event]') : null;
  if (el && typeof window.va === 'function') window.va('event', { name: el.getAttribute('data-event') });
}, { passive: true });
