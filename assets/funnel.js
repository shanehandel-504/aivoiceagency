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
  function armGlow() { requestAnimationFrame(function () { document.body.classList.add('glow-ready'); startTerm(); }); }
  if (document.readyState === 'complete') armGlow();
  else window.addEventListener('load', armGlow);

  /* ---------- hero terminal observer (BRIDGE Phase 3.6) ----------
     Static list by default (no-JS / reduced-motion safe); after load it
     becomes a typing loop: 350ms per line, 2.5s hold, fade-restart. */
  function startTerm() {
    var term = document.querySelector('[data-term]');
    if (!term) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var lines = [].slice.call(term.querySelectorAll('.term-line'));
    if (!lines.length) return;
    term.classList.add('typing');
    var i = 0;
    function tick() {
      if (document.hidden) { setTimeout(tick, 1200); return; }
      if (i < lines.length) {
        lines[i].classList.add('on');
        i++;
        setTimeout(tick, 350);
      } else {
        setTimeout(function () {
          lines.forEach(function (l) { l.classList.remove('on'); });
          i = 0;
          setTimeout(tick, 420);
        }, 2500);
      }
    }
    tick();
  }

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

  /* sticky live mini-player — driven by the ava:live / ava:progress bus (pod + theater) */
  var stickyProg = sticky && sticky.querySelector('[data-sticky-prog]');
  var demoLive = false;
  window.addEventListener('ava:live', function (e) {
    demoLive = !!(e.detail && e.detail.on);
    if (sticky) sticky.classList.toggle('live', demoLive);
    document.body.classList.toggle('audio-live', demoLive);   /* audio-reactive hero dot */
    if (!demoLive && stickyProg) stickyProg.style.transform = 'scaleX(0)';
  });
  window.addEventListener('ava:progress', function (e) {
    if (demoLive && stickyProg) { var f = Math.max(0, Math.min(1, +e.detail || 0)); stickyProg.style.transform = 'scaleX(' + f + ')'; }
  });

  /* trust-spine — grow the cyan bar once when each signal card first enters view */
  if ('IntersectionObserver' in window) {
    var sigIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in-view'); sigIO.unobserve(en.target); } });
    }, { threshold: 0.2 });
    document.querySelectorAll('.signal-card, .signal-step').forEach(function (el) { sigIO.observe(el); });
  }

  /* ---------- interactive Ripcord (Homepage Candy item 1) ---------- */
  var rip = document.querySelector('[data-ripcord]');
  if (rip) {
    var rcLine = rip.querySelector('[data-rc-line]');
    var rcHandle = rip.querySelector('[data-rc-handle]');
    var rcRest = rcLine ? rcLine.textContent : '';
    var rcReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rcPulled = false, rcDrag = false, rcMoved = false, rcStartY = 0, rcResetT = 0;

    function ripFire() {
      if (rcPulled) return;
      rcPulled = true;
      rip.style.setProperty('--pull', 0);
      rip.classList.add('pulled');
      if (rcLine) rcLine.textContent = '→ Transferring you to the owner now.';
      if (navigator.vibrate) { try { navigator.vibrate(20); } catch (_) {} }
      try { window.va && window.va('event', { name: 'ripcord_pull' }); } catch (_) {}
      clearTimeout(rcResetT);
      rcResetT = setTimeout(function () {
        rcPulled = false;
        rip.classList.remove('pulled');
        if (rcLine) rcLine.textContent = rcRest;
      }, 3000);
    }

    if (rcHandle && !rcReduce && window.PointerEvent) {
      rcHandle.addEventListener('pointerdown', function (e) {
        if (rcPulled) return;
        rcDrag = true; rcMoved = false; rcStartY = e.clientY;
        try { rcHandle.setPointerCapture(e.pointerId); } catch (_) {}
      });
      rcHandle.addEventListener('pointermove', function (e) {
        if (!rcDrag) return;
        var dy = Math.max(0, e.clientY - rcStartY);
        if (dy > 6) rcMoved = true;
        rip.style.setProperty('--pull', Math.min(1, dy / 48).toFixed(3));
        if (dy >= 40) { rcDrag = false; try { rcHandle.releasePointerCapture(e.pointerId); } catch (_) {} ripFire(); }
      });
      rcHandle.addEventListener('pointerup', function () {
        if (!rcDrag) return;
        rcDrag = false; rip.style.setProperty('--pull', 0);
        if (!rcMoved) ripFire();            /* a plain tap fires too */
      });
      rcHandle.addEventListener('pointercancel', function () { if (rcDrag) { rcDrag = false; rip.style.setProperty('--pull', 0); } });
      rcHandle.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ripFire(); } });
    } else if (rcHandle) {
      rcHandle.addEventListener('click', ripFire);   /* reduced-motion / no-pointer: static tap */
    }
  }

  /* ---------- single green pulse per viewport (Homepage Candy: the Call-me beacon leads) ----------
     Keeps the page from becoming a christmas tree of competing green pulses. At any scroll position
     only ONE green beacon animates; the Call-me tab (data-beacon) wins when it is visible + unselected,
     otherwise priority falls to the nearest visible .pulse-live. Suspended ones get .pulse-hold. */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var pulsers = [].slice.call(document.querySelectorAll('.pulse-live, [data-beacon]'));
    if (pulsers.length < 2) return;
    /* priority: data-beacon first, then document order */
    pulsers.sort(function (a, b) {
      return (a.hasAttribute('data-beacon') ? 0 : 1) - (b.hasAttribute('data-beacon') ? 0 : 1);
    });
    var vis = [];
    function eligible(p) {
      /* a selected beacon tab isn't pulsing, so it yields priority to the form's own CTA */
      return !(p.hasAttribute('data-beacon') && p.getAttribute('aria-selected') === 'true');
    }
    function reconcile() {
      var chosen = null;
      for (var i = 0; i < pulsers.length; i++) {
        if (vis.indexOf(pulsers[i]) > -1 && eligible(pulsers[i])) { chosen = pulsers[i]; break; }
      }
      pulsers.forEach(function (p) { p.classList.toggle('pulse-hold', p !== chosen); });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = vis.indexOf(en.target);
        if (en.isIntersecting && i < 0) vis.push(en.target);
        else if (!en.isIntersecting && i > -1) vis.splice(i, 1);
      });
      reconcile();
    }, { threshold: 0.2 });
    pulsers.forEach(function (p) { io.observe(p); });
    /* tab switches change which beacon is eligible — re-pick after the aria-selected flip */
    var tabs = document.querySelector('.pod-tabs');
    if (tabs) tabs.addEventListener('click', function () { setTimeout(reconcile, 0); });
  })();

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
    btn.addEventListener('click', function (e) {
      /* transcript ▶ lives inside <summary>; don't let the click toggle the <details> */
      if (e) { e.preventDefault(); e.stopPropagation(); }
      emit('clip');
      if (!clip.paused && clip.src.indexOf(btn.getAttribute('data-audio')) > -1) { clip.pause(); btn.textContent = '▶'; document.body.classList.remove('audio-live'); return; }
      clip.src = btn.getAttribute('data-audio'); clip.play().catch(function(){});
      document.querySelectorAll('[data-audio]').forEach(function(x){ x.textContent='▶'; });
      btn.textContent = '❚❚';
      document.body.classList.add('audio-live');   /* audio-reactive hero dot */
      clip.onended = function(){ btn.textContent = '▶'; document.body.classList.remove('audio-live'); };
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

      submit.disabled = true;
      status.setAttribute('role', 'status');
      status.textContent = 'Starting your demo call…';
      /* 3B.7 — visible delayed state */
      var slowT = setTimeout(function () {
        if (status.textContent === 'Starting your demo call…') {
          status.textContent = 'Taking longer than expected — call 414-240-8930 instead.';
        }
      }, 12000);
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
        clearTimeout(slowT);
        if (r.ok) {
          status.setAttribute('role', 'status');
          status.textContent = 'AVA is calling now. Keep your phone nearby.';
          status.classList.add('ok');
          if (offer && offer.getAttribute('data-webcall') === 'on') offer.hidden = false;
          if (consent) { consent.checked = false; }
        } else {
          status.setAttribute('role', 'alert');
          status.textContent = 'We couldn’t start the demo call. Try again or call 414-240-8930.';
          status.classList.add('err'); submit.disabled = false;
        }
      }, function () {
        clearTimeout(slowT);
        status.setAttribute('role', 'alert');
        status.textContent = 'We couldn’t start the demo call. Try again or call 414-240-8930.';
        status.classList.add('err'); submit.disabled = false;
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

    /* smooth rAF count-up — crisp on every device (replaces the per-digit odometer that
       ghosted/misregistered on iOS Safari). Same value, same gold flip, just reliable. */
    money.textContent = '$0/mo';
    var moneyVal = 0, moneyRAF = 0, moneyTO = 0;
    var reduceMoney = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function paintMoney(v) { money.textContent = '$' + fmt(Math.round(v)) + '/mo'; }
    function setMoney(target) {
      cancelAnimationFrame(moneyRAF); clearTimeout(moneyTO);
      if (reduceMoney || firstRun || target === moneyVal || document.hidden) { moneyVal = target; paintMoney(target); return; }
      var start = moneyVal, delta = target - start, t0 = null, dur = 420;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        paintMoney(start + delta * eased);
        if (p < 1) moneyRAF = requestAnimationFrame(step);
        else { moneyVal = target; paintMoney(target); }
      }
      moneyRAF = requestAnimationFrame(step);
      moneyTO = setTimeout(function () { moneyVal = target; paintMoney(target); }, dur + 90);  /* safety net if rAF stalls */
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

      setMoney(revenue);
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
      /* calculator bridge (Phase 4.5) — book label carries the user's own figure past $5k/mo */
      var bookCta = roi.querySelector('[data-roi-book]');
      if (bookCta) {
        bookCta.textContent = revenue > 5000
          ? 'Book a 15-minute call — recover $' + fmt(revenue) + '/mo'
          : 'Book a 15-minute call';
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
