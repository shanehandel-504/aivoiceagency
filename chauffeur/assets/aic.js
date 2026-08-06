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

  /* ── nav tint on scroll ────────────────────────────────────────────────── */
  (function navTint() {
    var nav = document.querySelector('nav.top');
    if (!nav) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.style.background = window.scrollY > 40 ? 'rgba(10,10,15,.94)' : 'rgba(10,10,15,.82)';
        ticking = false;
      });
    }, { passive: true });
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
    if (!cellEl || !btn || !note) return;

    function setNote(msg, kind) {
      note.textContent = msg || '';
      note.classList.toggle('is-err', kind === 'err');
      note.classList.toggle('is-ok', kind === 'ok');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      cellEl.setAttribute('aria-invalid', 'false');

      var cell = toE164(cellEl.value);
      if (!/^\+[1-9]\d{7,14}$/.test(cell)) {
        cellEl.setAttribute('aria-invalid', 'true');
        setNote('That number does not look right — check the digits.', 'err');
        cellEl.focus();
        return;
      }

      /* TCPA: fail closed. No explicit consent, no automated call — and the
         box is re-cleared on every reset so a new number needs a new tick. */
      if (!okEl || !okEl.checked) {
        setNote('Tick the box so AVA is allowed to call you.', 'err');
        if (okEl) okEl.focus();
        return;
      }

      btn.disabled = true;
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
          form.classList.add('is-done');
          setNote('Your phone rings in seconds. That call is the product.', 'ok');
          return;
        }
        btn.disabled = false;
        setNote('Could not reach AVA (' + r.status + '). Try again, or just call ' + TEL_DISPLAY + '.', 'err');
      }, function () {
        btn.disabled = false;
        setNote('Could not reach AVA. Try again, or just call ' + TEL_DISPLAY + '.', 'err');
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
    var suppressors = document.querySelectorAll('[data-rail-hide]');
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
         axe flags as aria-hidden-focus, and a guaranteed Lighthouse a11y miss
         on a page the gate requires to score 100. */
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
