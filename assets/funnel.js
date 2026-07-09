/* funnel.js — page glue for /new: sticky bar, scroll-to-pod, ROI calculator,
   shared TCPA call form (n8n), before/after clip players. Vanilla JS. */
(function () {
  "use strict";

  /* Step 7 — analytics beacons (no-op if window.va absent). Fires on any [data-event] click. */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-event]');
    if (el && window.va) { try { window.va('event', { name: el.getAttribute('data-event') }); } catch (_) {} }
  }, true);

  /* start pulse animations only after load so they never compete with the LCP paint.
     Fires whether or not the load event has already passed (defer can run post-load
     in some engines) — the rAF still lands after LCP, so no perf regression. */
  function armGlow() { requestAnimationFrame(function () { document.body.classList.add('glow-ready'); }); }
  if (document.readyState === 'complete') armGlow();
  else window.addEventListener('load', armGlow);

  /* n8n webhook — lifted verbatim from the working /chatgpt-example live-call form */
  var AVA_CALL_ENDPOINT = 'https://circulant.app.n8n.cloud/webhook/ava-call';

  /* ---------- sticky bottom bar ---------- */
  var sticky = document.querySelector('[data-sticky]');
  var hero = document.querySelector('.hero');
  function onScroll() {
    if (!sticky || !hero) return;
    var past = window.scrollY > (hero.offsetHeight * 0.7);
    var nearBottom = (window.innerHeight + window.scrollY) > (document.body.scrollHeight - 160);
    sticky.classList.toggle('show', past && !nearBottom);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- scroll to pod / open gate ---------- */
  document.querySelectorAll('[data-scroll-pod]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (window.AVA_answerPod) window.AVA_answerPod();
      else document.getElementById('pod-anchor').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  document.querySelectorAll('[data-open-gate]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.getElementById('gate').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- before/after clip players (S3) ---------- */
  var clip = new Audio(); clip.preload = 'none';
  function emit(src){ try{ window.dispatchEvent(new CustomEvent('ava:play',{detail:src})); }catch(e){} }
  window.addEventListener('ava:play', function (e) { if (e.detail !== 'clip') clip.pause(); });
  document.querySelectorAll('[data-audio]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      emit('clip');
      if (!clip.paused && clip.src.indexOf(btn.getAttribute('data-audio')) > -1) { clip.pause(); btn.textContent = '▶'; return; }
      clip.src = btn.getAttribute('data-audio'); clip.play().catch(function(){});
      document.querySelectorAll('[data-audio]').forEach(function(x){ x.textContent='▶'; });
      btn.textContent = '❚❚';
      clip.onended = function(){ btn.textContent = '▶'; };
    });
  });

  /* ---------- TCPA call form (fail-closed) ---------- */
  function toE164(raw) {
    var d = (raw || '').replace(/[^\d+]/g, '');
    if (d.charAt(0) === '+') return d;
    d = d.replace(/\D/g, '');
    if (d.length === 10) return '+1' + d;
    if (d.length === 11 && d.charAt(0) === '1') return '+' + d;
    return d ? '+' + d : '';
  }
  document.querySelectorAll('[data-callform]').forEach(function (form) {
    var cell = form.querySelector('[data-cell]');
    var consent = form.querySelector('[data-consent]');
    var submit = form.querySelector('[data-callsubmit]');
    var status = form.querySelector('[data-status]');
    var offer = form.querySelector('[data-webcall]');
    var offerBtn = form.querySelector('[data-webcall-btn]');

    /* fail-closed: submit disabled until consent checked */
    function sync() { if (submit) submit.disabled = !(consent && consent.checked); }
    if (consent) consent.addEventListener('change', sync);
    sync();

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      status.className = 'gate-status';
      if (!consent || !consent.checked) { status.textContent = 'Please check the box so AVA can call you.'; status.classList.add('err'); return; }
      var phone = toE164(cell && cell.value);
      if (phone.replace(/\D/g, '').length < 11) { status.textContent = 'Enter a valid mobile number.'; status.classList.add('err'); return; }

      submit.disabled = true; status.textContent = 'Connecting AVA…';
      var payload = {
        first_name: '',
        phone: phone,
        source: 'aivoiceagency.ai /new funnel',
        selected_role: '',
        business_type: '',
        email: '',
        tcpa_consent: true,
        tcpa_consent_at: new Date().toISOString()
      };
      fetch(AVA_CALL_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      }).then(function (r) {
        if (r.ok) {
          status.textContent = '📞 Calling you now — answer your phone.';
          status.classList.add('ok');
          if (offer && offer.getAttribute('data-webcall') === 'on') offer.hidden = false;
          if (consent) { consent.checked = false; }
        } else {
          status.textContent = 'Could not reach AVA (' + r.status + '). Tap to try again.';
          status.classList.add('err'); submit.disabled = false;
        }
      }, function () {
        status.textContent = 'Network error. Try again in a moment.'; status.classList.add('err'); submit.disabled = false;
      });
    });

    /* web-call button (only wired live when data-webcall flips to "on" — see Step 5) */
    if (offerBtn) offerBtn.addEventListener('click', function () {
      if (window.AVA_startWebCall) window.AVA_startWebCall(status);
      else { status.textContent = 'Browser calling is warming up — use the phone call above.'; }
    });
  });

  /* ---------- ROI calculator ---------- */
  var roi = document.getElementById('roi');
  if (roi) {
    var keys = ['calls', 'missed', 'job', 'close', 'handle', 'labor'];
    var money = roi.querySelector('[data-roi-money]');
    var mLeads = roi.querySelector('[data-roi-leads]');
    var mHours = roi.querySelector('[data-roi-hours]');
    function inp(k){ return roi.querySelector('[data-roi="' + k + '"]'); }
    function out(k){ return roi.querySelector('[data-out="' + k + '"]'); }
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    var mult = roi.querySelector('[data-roi-multiple]');
    var firstRun = true;

    /* odometer: per-digit strips roll on translateY (rebuild only when length changes) */
    money.innerHTML = '<span class="odo" data-odo></span>';
    var odo = money.querySelector('[data-odo]'), odoLen = -1, odoCells = [];
    function setMoney(str) {
      if (str.length !== odoLen) {
        odo.innerHTML = ''; odoCells = [];
        for (var i = 0; i < str.length; i++) {
          var ch = str.charAt(i);
          if (ch >= '0' && ch <= '9') {
            var cell = document.createElement('span'); cell.className = 'odo-d';
            var col = document.createElement('span'); col.className = 'odo-col';
            for (var d = 0; d < 10; d++) { var nn = document.createElement('span'); nn.className = 'odo-n'; nn.textContent = d; col.appendChild(nn); }
            cell.appendChild(col); odo.appendChild(cell); odoCells.push(col);
          } else {
            var s = document.createElement('span'); s.className = 'odo-s'; s.textContent = ch; odo.appendChild(s); odoCells.push(null);
          }
        }
        odoLen = str.length;
      }
      for (var j = 0; j < str.length; j++) {
        var c = str.charAt(j), col2 = odoCells[j];
        if (col2 && c >= '0' && c <= '9') col2.style.transform = 'translateY(-' + (parseInt(c, 10) * 10) + '%)';
      }
    }

    function calc() {
      var C = +inp('calls').value, M = +inp('missed').value, J = +inp('job').value;
      var CL = +inp('close').value, H = +inp('handle').value, L = +inp('labor').value;
      if (out('calls')) out('calls').textContent = fmt(C);
      if (out('missed')) out('missed').textContent = M + '%';
      if (out('job')) out('job').textContent = '$' + fmt(J);
      if (out('close')) out('close').textContent = CL + '%';
      if (out('handle')) out('handle').textContent = H;
      if (out('labor')) out('labor').textContent = '$' + L;

      var missedCalls = C * M / 100;
      var recovered = missedCalls * CL / 100;
      var revenue = Math.round(recovered * J);
      var hours = missedCalls * H / 60;
      var laborSaved = Math.round(hours * L);

      setMoney('$' + fmt(revenue) + '/mo');
      mLeads.textContent = Math.round(recovered);
      mHours.innerHTML = hours.toFixed(1) + ' <span style="font-size:12px;color:var(--dim)">(≈ $' + fmt(laborSaved) + ' labor)</span>';

      /* break-even flip at the $497 plan: cyan below, gold at/above.
         The one-shot flash + haptic fire ONLY on a real post-load crossing (never on the initial paint). */
      var crossed = revenue >= 497;
      if (crossed) {
        if (!money.classList.contains('crossed')) {
          money.classList.add('crossed');
          if (!firstRun) {
            money.classList.add('flash');
            setTimeout(function () { money.classList.remove('flash'); }, 680);
            if (navigator.vibrate) { try { navigator.vibrate(8); } catch (_) {} }
          }
        }
        if (mult) { mult.textContent = '≈ ' + Math.round(revenue / 497) + '× the $497 plan'; mult.hidden = false; }
      } else {
        money.classList.remove('crossed', 'flash');
        if (mult) mult.hidden = true;
      }
      firstRun = false;
      /* hash hygiene: never written on input — only on the Copy-my-results tap */
    }
    function writeHash() {
      var parts = keys.map(function (k) { return k + ':' + inp(k).value; });
      history.replaceState(null, '', '#roi=' + parts.join(','));
    }
    function readHash() {
      var m = location.hash.match(/#roi=([^#]+)/); if (!m) return;
      m[1].split(',').forEach(function (p) {
        var kv = p.split(':'); if (inp(kv[0])) inp(kv[0]).value = kv[1];
      });
    }
    keys.forEach(function (k) { var el = inp(k); if (el) el.addEventListener('input', calc); });

    /* presets */
    var PRESETS = {
      HVAC:      { calls: 350, missed: 28, job: 380, close: 40 },
      Plumbing:  { calls: 300, missed: 30, job: 450, close: 42 },
      Dental:    { calls: 260, missed: 22, job: 620, close: 35 },
      'Med-Spa': { calls: 220, missed: 25, job: 350, close: 45 }
    };
    var pWrap = roi.querySelector('[data-roi-presets]');
    if (pWrap) {
      pWrap.innerHTML = Object.keys(PRESETS).map(function (n) { return '<button class="th-v" data-preset="' + n + '">' + n + '</button>'; }).join('');
      pWrap.addEventListener('click', function (e) {
        var b = e.target.closest('[data-preset]'); if (!b) return;
        var p = PRESETS[b.getAttribute('data-preset')];
        Object.keys(p).forEach(function (k) { if (inp(k)) inp(k).value = p[k]; });
        pWrap.querySelectorAll('[data-preset]').forEach(function(x){ x.setAttribute('aria-pressed', x===b); });
        calc();
      });
    }

    /* advanced toggle */
    var advBtn = roi.querySelector('[data-adv-toggle]');
    var adv = roi.querySelector('[data-adv]');
    if (advBtn && adv) advBtn.addEventListener('click', function () {
      adv.classList.toggle('open');
      advBtn.textContent = adv.classList.contains('open') ? 'Advanced ▴' : 'Advanced ▾';
    });

    /* Copy my results — the ONLY place the #roi hash is written */
    var share = roi.querySelector('[data-roi-share]');
    var copied = roi.querySelector('[data-roi-copied]');
    if (share) share.addEventListener('click', function (e) {
      e.preventDefault(); writeHash();
      function flash() { if (!copied) return; copied.hidden = false; copied.classList.add('show'); setTimeout(function () { copied.classList.remove('show'); setTimeout(function () { copied.hidden = true; }, 220); }, 1600); }
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(flash, flash);
      else flash();
    });

    readHash();
    history.replaceState(null, '', location.pathname + location.search);  /* clean the URL; any shared values are already applied */
    calc();
  }
})();
