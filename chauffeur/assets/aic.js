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
})();
