/* ============================================================
   AVA — AI Voice Agency · Interactive Sales Deck
   Vanilla JS engine. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var deck       = document.getElementById('deck');
  var slides     = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var TOTAL      = slides.length;
  var prevBtn    = document.getElementById('prevBtn');
  var nextBtn    = document.getElementById('nextBtn');
  var counterCur = document.getElementById('counterCur');
  var counterTot = document.getElementById('counterTot');
  var progress   = document.getElementById('progressFill');
  var hint       = document.getElementById('hint');

  var current = 0;

  /* ---------- per-slide lifecycle registry ---------- */
  var enter = {}, leave = {};

  /* ============================================================
     NAVIGATION CORE
     ============================================================ */
  function goTo(i, dir) {
    i = Math.max(0, Math.min(TOTAL - 1, i));
    if (i === current && slides[current].classList.contains('is-active')) return;

    var prevIndex = current;
    if (typeof leave[prevIndex] === 'function') leave[prevIndex]();

    slides.forEach(function (s, idx) {
      s.classList.toggle('is-active', idx === i);
      s.classList.toggle('is-prev', idx < i);
      s.setAttribute('aria-hidden', idx === i ? 'false' : 'true');
    });

    current = i;
    counterCur.textContent = (i + 1);
    progress.style.width = (((i + 1) / TOTAL) * 100) + '%';
    prevBtn.disabled = (i === 0);
    nextBtn.disabled = (i === TOTAL - 1);

    // scroll the freshly-shown slide back to top (mobile / overflow)
    slides[i].scrollTop = 0;

    if (typeof enter[i] === 'function') enter[i]();
    if (notesOpen) renderNotes();
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  counterTot.textContent = TOTAL;
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  /* ============================================================
     KEYBOARD
     ============================================================ */
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);

    if (k === 'p' || k === 'P') { e.preventDefault(); toggleNotes(); return; }
    if (k === 'Escape' && notesOpen) { e.preventDefault(); closeNotes(); return; }
    if (k === 'f' || k === 'F') {
      // let inputs receive an 'f'; but on the deck at large, F = fullscreen
      if (!typing) { e.preventDefault(); toggleFullscreen(); return; }
    }

    // the before/after handle owns its own arrow / Home / End keys
    if (document.activeElement === baHandle && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Home' || k === 'End')) return;
    // never hijack keys while typing in a field (e.g. the ROI number inputs) — lets digits/space/nav reach the input
    if (typing) return;

    switch (k) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Spacebar':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'ArrowDown': e.preventDefault(); next(); break;
      case 'ArrowUp':   e.preventDefault(); prev(); break;
      case 'Home':      e.preventDefault(); goTo(0); break;
      case 'End':       e.preventDefault(); goTo(TOTAL - 1); break;
      default:
        if (/^[1-9]$/.test(k)) { var n = parseInt(k, 10) - 1; if (n < TOTAL) { e.preventDefault(); goTo(n); } }
    }
  });

  /* ============================================================
     TOUCH / SWIPE
     ============================================================ */
  (function () {
    var x0 = null, y0 = null, t0 = 0, moved = false;
    deck.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); moved = false;
    }, { passive: true });
    deck.addEventListener('touchmove', function () { moved = true; }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0, dt = Date.now() - t0;
      // ignore drags that began on the before/after handle or a slider
      var tgt = e.target;
      var onControl = tgt.closest && (tgt.closest('.ba') || tgt.closest('input[type=range]'));
      if (!onControl && moved && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6 && dt < 700) {
        if (dx < 0) next(); else prev();
      }
      x0 = y0 = null;
    }, { passive: true });
  })();

  /* ============================================================
     FULLSCREEN
     ============================================================ */
  function toggleFullscreen() {
    var d = document, el = d.documentElement;
    var fsEl = d.fullscreenElement || d.webkitFullscreenElement;
    if (!fsEl) {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el);
    } else {
      var exit = d.exitFullscreen || d.webkitExitFullscreen;
      if (exit) exit.call(d);
    }
  }

  /* ============================================================
     PRESENTER NOTES
     ============================================================ */
  var notes      = document.getElementById('notes');
  var notesBody  = document.getElementById('notesBody');
  var notesNum   = document.getElementById('notesNum');
  var notesClose = document.getElementById('notesClose');
  var notesOpen  = false;
  var notesLastFocus = null;

  function renderNotes() {
    notesNum.textContent = (current + 1);
    notesBody.textContent = slides[current].getAttribute('data-notes') || 'No notes for this slide.';
  }
  function openNotes()  { notesLastFocus = document.activeElement; notesOpen = true; notes.hidden = false; renderNotes(); notesClose.focus(); }
  function closeNotes() { notesOpen = false; notes.hidden = true; if (notesLastFocus && notesLastFocus.focus) notesLastFocus.focus(); else deck.focus(); }
  function toggleNotes(){ notesOpen ? closeNotes() : openNotes(); }
  notesClose.addEventListener('click', closeNotes);
  notes.addEventListener('click', function (e) { if (e.target === notes) closeNotes(); });
  // keep focus inside the modal while it's open (it declares aria-modal=true)
  notes.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = notes.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ============================================================
     HINT auto-fade
     ============================================================ */
  if (hint) {
    var hideHint = setTimeout(function () { hint.classList.add('fade'); }, 5200);
    deck.addEventListener('pointerdown', function () { clearTimeout(hideHint); hint.classList.add('fade'); }, { once: true });
  }

  /* ============================================================
     SLIDE 1 — WAVEFORM that flatlines on click
     ============================================================ */
  (function () {
    var stage  = document.getElementById('waveStage');
    var canvas = document.getElementById('waveCanvas');
    var label  = document.getElementById('waveText');
    var hintEl = document.getElementById('waveHint');
    if (!stage || !canvas) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1;
    var amp = 1;          // current amplitude multiplier
    var ampTarget = 1;    // eased toward
    var dropped = false;
    var raf = null, t = 0;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var waves = [
      { len: 0.015, sp: 0.022, a: 0.30, alpha: 0.18, lw: 1.4 },
      { len: 0.022, sp: -0.030, a: 0.40, alpha: 0.24, lw: 1.6 },
      { len: 0.031, sp: 0.038, a: 0.24, alpha: 0.85, lw: 2.4 }
    ];

    function draw() {
      ctx.clearRect(0, 0, w, h);
      amp += (ampTarget - amp) * 0.10;
      var mid = h * 0.5;
      var color = dropped ? '255,84,112' : '0,212,255';
      for (var i = 0; i < waves.length; i++) {
        var wv = waves[i];
        ctx.beginPath();
        for (var x = 0; x <= w; x += 3) {
          var env = Math.sin((x / w) * Math.PI);           // taper toward the edges
          var y = mid + Math.sin(x * wv.len + t * wv.sp + i * 1.7) * h * wv.a * amp * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(' + color + ',' + wv.alpha + ')';
        ctx.lineWidth = wv.lw;
        ctx.shadowColor = 'rgba(' + color + ',.6)';
        ctx.shadowBlur = (i === waves.length - 1) ? 12 : 0;
        ctx.stroke();
      }
    }
    function frame() {
      t += 1; draw();
      raf = (current === 0 && !document.hidden) ? requestAnimationFrame(frame) : null;
    }
    function start() {
      size();
      draw();   // paint one frame immediately so the waveform is never blank if rAF is throttled
      if (reduceMotion) { amp = ampTarget; draw(); return; }
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    function drop() {
      dropped = true; ampTarget = 0;
      stage.classList.add('dropped');
      label.textContent = 'CALL DROPPED';
      hintEl.textContent = '';
      if (reduceMotion) { amp = 0; draw(); }
    }
    function restore() {
      dropped = false; ampTarget = 1;
      stage.classList.remove('dropped');
      label.textContent = 'INCOMING CALL';
      hintEl.textContent = 'click to restore';
      if (reduceMotion) { amp = 1; draw(); }
    }
    stage.addEventListener('click', function () { dropped ? restore() : drop(); });

    enter[0] = start;
    leave[0] = stop;
    window.addEventListener('resize', function () { if (current === 0) size(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && current === 0) start(); });
  })();

  /* ============================================================
     SLIDE 2 — phone transcript typing
     ============================================================ */
  (function () {
    var box = document.getElementById('transcript');
    var timer = document.getElementById('callTimer');
    if (!box) return;

    var script = [
      { who: 'caller', label: 'Caller', text: 'Hi, I need to book a service for Tuesday.' },
      { who: 'ava',    label: 'AVA',    text: 'Of course — let me check availability. What time works best?' },
      { who: 'caller', label: 'Caller', text: 'Afternoon, around 2.' },
      { who: 'ava',    label: 'AVA',    text: 'I have Tuesday at 2:15. Can I get your name and phone number?' }
    ];
    var token = 0, timers = [], tick = null, secs = 7;

    function clearTimers() { timers.forEach(clearTimeout); timers = []; if (tick) { clearInterval(tick); tick = null; } }
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

    function addMsg(item) {
      var el = document.createElement('div');
      el.className = 'msg ' + item.who;
      el.innerHTML = '<span class="who">' + item.label + '</span>' + escapeHtml(item.text);
      box.appendChild(el);
      box.scrollTop = box.scrollHeight;
    }
    function addTyping() {
      var el = document.createElement('div');
      el.className = 'msg typing';
      el.innerHTML = '<i></i><i></i><i></i>';
      box.appendChild(el);
      box.scrollTop = box.scrollHeight;
      return el;
    }

    function run() {
      var my = ++token;
      clearTimers();
      box.innerHTML = '';
      secs = 7; timer.textContent = '00:07 · incoming';
      tick = setInterval(function () {
        if (current !== 1) return;
        secs++; var mm = Math.floor(secs / 60), ss = secs % 60;
        timer.textContent = '0' + mm + ':' + (ss < 10 ? '0' + ss : ss) + ' · in progress';
      }, 1000);

      if (reduceMotion) { script.forEach(addMsg); return; }

      var delay = 350;
      script.forEach(function (item) {
        if (item.who === 'ava') {
          at(delay, function () { if (my !== token) return; var tp = addTyping(); item._tp = tp; });
          delay += 900;
          at(delay, function () { if (my !== token) return; if (item._tp) item._tp.remove(); addMsg(item); });
          delay += 1500;
        } else {
          at(delay, function () { if (my !== token) return; addMsg(item); });
          delay += 1500;
        }
      });
    }
    function stop() { token++; clearTimers(); }

    enter[1] = run;
    leave[1] = stop;
  })();

  /* ============================================================
     SLIDE 3 — flow sequence + mini waveform tile
     ============================================================ */
  (function () {
    var flow = document.getElementById('flow');
    if (!flow) return;
    var nodes = Array.prototype.slice.call(flow.querySelectorAll('.flow-node'));
    var links = Array.prototype.slice.call(flow.querySelectorAll('.flow-link'));
    var timers = [], token = 0;

    function clearAll() {
      timers.forEach(clearTimeout); timers = [];
      nodes.forEach(function (n) { n.classList.remove('lit'); });
      links.forEach(function (l) { l.classList.remove('lit'); });
    }
    function run() {
      var my = ++token;
      clearAll();
      if (reduceMotion) { nodes.forEach(function (n) { n.classList.add('lit'); }); links.forEach(function (l) { l.classList.add('lit'); }); return; }
      var step = 520, d = 260;
      nodes.forEach(function (n, idx) {
        timers.push(setTimeout(function () {
          if (my !== token) return;
          n.classList.add('lit');
          if (links[idx]) links[idx].classList.add('lit');
        }, d + idx * step));
      });
    }
    function stop() { token++; clearAll(); }
    enter[2] = run;
    leave[2] = stop;

    // mini waveform inside "AVA answers" tile
    var twCanvas = flow.querySelector('.tile-wave');
    if (twCanvas) {
      var tctx = twCanvas.getContext('2d');
      var raf = null, tt = 0;
      function tdraw() {
        var W = twCanvas.width, H = twCanvas.height;
        tctx.clearRect(0, 0, W, H);
        tctx.beginPath();
        for (var x = 0; x <= W; x += 2) {
          var env = Math.sin((x / W) * Math.PI);
          var y = H / 2 + Math.sin(x * 0.16 + tt * 0.12) * (H * 0.32) * env;
          if (x === 0) tctx.moveTo(x, y); else tctx.lineTo(x, y);
        }
        tctx.strokeStyle = 'rgba(0,212,255,.9)';
        tctx.lineWidth = 2;
        tctx.stroke();
      }
      function tframe() { tt++; tdraw(); raf = (current === 2 && !document.hidden) ? requestAnimationFrame(tframe) : null; }
      var origEnter = enter[2], origLeave = leave[2];
      enter[2] = function () { origEnter(); tdraw(); if (!reduceMotion && !raf) raf = requestAnimationFrame(tframe); };
      leave[2] = function () { origLeave(); if (raf) { cancelAnimationFrame(raf); raf = null; } };
    }
  })();

  /* ============================================================
     SLIDE 4 — ROI CALCULATOR  (mirrors /roi/ logic)
     ============================================================ */
  (function () {
    var FIELDS = ['calls', 'missed', 'value', 'conv'];
    var state = { calls: 300, missed: 40, value: 850, conv: 25 };
    var fInt = function (v) { return Math.round(v).toLocaleString('en-US'); };
    var fUSD = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };

    function clamp(el, val) {
      var min = parseFloat(el.min), max = parseFloat(el.max), step = parseFloat(el.step) || 1;
      if (isNaN(val)) val = min;
      val = Math.min(max, Math.max(min, val));
      return Math.round((val - min) / step) * step + min;
    }
    function setFill(range) {
      var min = parseFloat(range.min), max = parseFloat(range.max);
      var pct = ((parseFloat(range.value) - min) / (max - min)) * 100;
      range.style.background = 'linear-gradient(90deg, var(--cyan) ' + pct + '%, rgba(255,255,255,.1) ' + pct + '%)';
    }

    FIELDS.forEach(function (key) {
      var range = document.getElementById(key);
      var num = document.getElementById(key + '-num');
      if (!range || !num) return;
      range.addEventListener('input', function () {
        var v = parseFloat(range.value); state[key] = v; num.value = v; setFill(range); compute();
      });
      num.addEventListener('input', function () {
        var raw = parseFloat(num.value); if (isNaN(raw)) return;   // allow empty/partial while typing
        var max = parseFloat(num.max);
        if (raw > max) { raw = max; num.value = max; }             // cap the upper bound live
        // use the typed value as-is for live compute (don't snap to min mid-typing, or "1500" can't be entered)
        state[key] = raw; range.value = raw; setFill(range); compute();
      });
      num.addEventListener('change', function () {
        var v = clamp(num, parseFloat(num.value)); num.value = v;  // enforce min + step on blur/enter
        state[key] = v; range.value = v; setFill(range); compute();
      });
      setFill(range);
    });

    var elMissed = document.getElementById('r-missed');
    var elMonthly = document.getElementById('r-monthly');
    var elAnnual = document.getElementById('r-annual');
    var el3yr = document.getElementById('r-3yr');
    var roiStatus = document.getElementById('roi-status');
    var statusTimer;

    function animateValue(el, to, fmt) {
      var from = (typeof el._val === 'number') ? el._val : 0;
      el._val = to;
      if (reduceMotion || from === to || document.hidden || current !== 3) { el.textContent = fmt(to); return; }
      if (el._raf) cancelAnimationFrame(el._raf);
      var dur = 650, start = null, ease = function (t) { return 1 - Math.pow(1 - t, 3); };
      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        el.textContent = fmt(from + (to - from) * ease(t));
        if (t < 1) el._raf = requestAnimationFrame(step);
        else { el.textContent = fmt(to); el._raf = null; }
      }
      el._raf = requestAnimationFrame(step);
    }
    function announce(mc, lm, la, l3) {
      if (!roiStatus) return;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(function () {
        roiStatus.textContent = 'Calls missed per month ' + fInt(mc) + '. Lost monthly revenue ' + fUSD(lm) +
          '. Lost annual revenue ' + fUSD(la) + '. Lost over three years ' + fUSD(l3) + '.';
      }, 450);
    }
    function compute() {
      var missed_calls = state.calls * (state.missed / 100);
      var lost_monthly = missed_calls * (state.conv / 100) * state.value;
      var lost_annual = lost_monthly * 12;
      var lost_3yr = lost_annual * 3;
      animateValue(elMissed, missed_calls, fInt);
      animateValue(elMonthly, lost_monthly, fUSD);
      animateValue(elAnnual, lost_annual, fUSD);
      animateValue(el3yr, lost_3yr, fUSD);
      announce(missed_calls, lost_monthly, lost_annual, lost_3yr);
    }
    compute();
    // replay count-up each time the slide is entered
    enter[3] = function () {
      [elMissed, elMonthly, elAnnual, el3yr].forEach(function (el) { el._val = 0; });
      compute();
    };
  })();

  /* ============================================================
     SLIDE 5 — before/after drag-to-reveal
     ============================================================ */
  var baHandle = document.getElementById('baHandle');
  (function () {
    var ba = document.getElementById('ba');
    var before = document.getElementById('baBefore');
    if (!ba || !before || !baHandle) return;
    var pos = 50, dragging = false;

    function apply(p) {
      pos = Math.max(0, Math.min(100, p));
      before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      baHandle.style.left = pos + '%';
      baHandle.setAttribute('aria-valuenow', Math.round(pos));
      baHandle.setAttribute('aria-valuetext', Math.round(pos) + '% revealing the With-AVA view');
    }
    function fromEvent(clientX) {
      var r = ba.getBoundingClientRect();
      apply(((clientX - r.left) / r.width) * 100);
    }
    function down(e) { dragging = true; baHandle.focus(); fromEvent(getX(e)); e.preventDefault(); }
    function move(e) { if (dragging) fromEvent(getX(e)); }
    function up() { dragging = false; }
    function getX(e) { return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX; }

    baHandle.addEventListener('mousedown', down);
    baHandle.addEventListener('touchstart', down, { passive: false });
    // allow grabbing anywhere on the panel
    ba.addEventListener('mousedown', function (e) { if (e.target.closest('.ba-handle')) return; dragging = true; fromEvent(getX(e)); });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', function (e) { if (dragging) { fromEvent(getX(e)); e.preventDefault(); } }, { passive: false });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);

    baHandle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); apply(pos - 4); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); apply(pos + 4); }
      else if (e.key === 'Home') { e.preventDefault(); apply(0); }
      else if (e.key === 'End') { e.preventDefault(); apply(100); }
    });

    apply(50);
    // little reveal nudge on entry to signal it's draggable
    enter[4] = function () {
      apply(50);
      if (reduceMotion) return;
      var seq = [[120, 62], [320, 38], [520, 50]];
      seq.forEach(function (s) { setTimeout(function () { if (current === 4 && !dragging) apply(s[1]); }, s[0]); });
    };
  })();

  /* ============================================================
     SLIDE 6 — count-up the big numbers
     ============================================================ */
  (function () {
    var nums = Array.prototype.slice.call(document.querySelectorAll('.why-big'));
    if (!nums.length) return;
    function run() {
      nums.forEach(function (el) {
        var to = parseInt(el.getAttribute('data-count'), 10) || 0;
        if (reduceMotion || document.hidden) { el.textContent = to; return; }  // rAF won't fire while hidden — show final
        if (el._raf) cancelAnimationFrame(el._raf);
        var dur = 1100, start = null, ease = function (t) { return 1 - Math.pow(1 - t, 3); };
        function step(ts) {
          if (start === null) start = ts;
          var t = Math.min(1, (ts - start) / dur);
          el.textContent = Math.round(to * ease(t));
          if (t < 1) el._raf = requestAnimationFrame(step); else { el.textContent = to; el._raf = null; }
        }
        el.textContent = '0';
        el._raf = requestAnimationFrame(step);
      });
    }
    enter[5] = run;
    // if the deck was backgrounded on slide 6, animate once it returns to view
    document.addEventListener('visibilitychange', function () { if (!document.hidden && current === 5) run(); });
  })();

  /* ---------- util ---------- */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  goTo(0);
  if (deck && deck.focus) deck.focus();
})();
