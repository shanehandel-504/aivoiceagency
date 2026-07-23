/* ============================================================================
   AVA SIGNAL — RUN 3 · FINAL SKIN, commit 2.
   Two components, no dependencies, safe to load on any page (each one no-ops
   if its markup is absent).

     1. STATUS RAIL     — replays REAL demo-line events under the nav.
     2. LIVING WAVEFORM — idle cyan sine; a real AnalyserNode trace on play.

   ----------------------------------------------------------------------------
   NO-FABRICATION LAW. Every line in REAL_EVENTS below is a recorded event with
   a named source. Nothing here is invented, rounded up, or dramatised. If you
   add a state, you must add its source with it.

   SINGLE SOURCE — reports/2026-07-22-run15-e2e-proof.md
     The Run 1.5 end-to-end live proof, hop by hop with measured latencies.
     A form POST produced a real text (GHL messageId RYEWnTvk9p5ycOdxP2c6), the
     READY gate produced a real outbound call from +1 414-946-6486
     (DEMO-POOL-03) by agent_67381fcfabf6731dad4f40c590, that call was ANSWERED
     and held 57 seconds of talk time before agent_hangup with all 8 dynamic
     variables resolved from a live scrape (none fell back), and the post-call
     text landed (messageId JKumJmYPx22L1FfHCNRS).

   WHY THE STATE NAMES DIVERGE FROM THE BRIEF. The brief's cycle ends
   SLOT HELD -> JOB BOOKED. The Run 1.5 call was a SYSTEM TEST — it never held
   a slot and never booked a job, so those two states have no real event behind
   them. The obvious second source, /audio/v2/plumbing/full.mp3, is disclosed on
   this very page as "Scripted scenarios, not customer recordings" — using it
   here would be dressing scripted copy as recent activity.
   NO FABRICATION outranks the state list, so the rail ships the five states
   that DID happen. Every line below is a measured hop from that proof.

   The rail is labelled REPLAY in the markup. It is not a live socket — the
   hook for that is window.AVA_LIVE_FEED (see below), wired but not connected.
   ============================================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* GLOW GATE (CLAUDE.md). Decorative motion may not compete with the LCP paint,
     so it waits behind body.glow-ready. funnel.js sets this on the legacy
     homepage; the backstage homepage never loads funnel.js, so the gate is
     opened here instead — same contract, same window-load timing. */
  function openGlowGate() { document.body && document.body.classList.add('glow-ready'); }
  if (document.readyState === 'complete') openGlowGate();
  else addEventListener('load', openGlowGate, { once: true });

  /* ==========================================================================
     1 · STATUS RAIL
     ========================================================================== */
  var REAL_EVENTS = [
    { state: 'TEXT SENT',    tone: 'idle', at: '22:28:11', line: 'READY GATE DISPATCHED IN 0.60s' },
    { state: 'RINGING',      tone: 'work', at: '22:31:04', line: 'OUTBOUND FROM 414-946-6486 · DEMO-POOL-03' },
    { state: 'ANSWERED',     tone: 'work', at: '22:31:06', line: 'PICKED UP · 57s TALK TIME' },
    { state: 'INTENT FOUND', tone: 'work', at: '22:31:12', line: '8/8 CALLER DETAILS READ FROM A LIVE SCRAPE' },
    { state: 'RECAP SENT',   tone: 'done', at: '22:32:29', line: 'POST-CALL TEXT LANDED IN 0.9s' }
  ];

  /* window.AVA_LIVE_FEED — the Phase-3 seam. When the Backstage Retell socket
     lands it calls push({state,line,at,tone}) and the rail paints it exactly
     like a replayed row. Nothing connects to it today; declaring it now means
     Phase 3 is a wiring job, not a rebuild. */
  var live = (window.AVA_LIVE_FEED = window.AVA_LIVE_FEED || {
    _subs: [],
    push: function (evt) { this._subs.forEach(function (fn) { try { fn(evt); } catch (e) {} }); },
    onEvent: function (fn) { this._subs.push(fn); }
  });

  (function statusRail() {
    var rail = document.querySelector('[data-rail]');
    if (!rail) return;
    var feed = rail.querySelector('[data-rail-feed]');
    if (!feed) return;

    var rows = [].slice.call(feed.children);   // 3 rows, server-rendered, real
    if (!rows.length) return;
    var i = 0;

    function paint(evt) {
      /* newest enters at the top; the other two age toward --neutral */
      var row = rows[rows.length - 1];
      feed.insertBefore(row, feed.firstChild);
      row.querySelector('[data-rail-state]').textContent = evt.state;
      row.querySelector('[data-rail-line]').textContent = evt.line;
      row.querySelector('[data-rail-at]').textContent = evt.at;
      row.setAttribute('data-tone', evt.tone || 'work');
      rows = [].slice.call(feed.children);
      rows.forEach(function (r, n) { r.setAttribute('data-age', n); });
    }

    live.onEvent(paint);

    /* Reduced motion: the latest real state, rendered once, no cycle. */
    if (REDUCED) { rail.setAttribute('data-static', ''); return; }

    var timer = null;
    function tick() { paint(REAL_EVENTS[i++ % REAL_EVENTS.length]); }

    function start() { if (!timer) { timer = setInterval(tick, 2600); } }
    function halt() { if (timer) { clearInterval(timer); timer = null; } }

    /* Never animate off-screen or in a background tab, and never before load —
       the GLOW GATE keeps decorative motion out of the LCP paint. */
    document.addEventListener('visibilitychange', function () { document.hidden ? halt() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : halt(); }, { threshold: 0 }).observe(rail);
    } else { start(); }
  })();

  /* ==========================================================================
     2 · LIVING WAVEFORM
     Idle is pure CSS (a 2px cyan breathing sine, see .ava-wave-idle). The
     canvas only wakes on play, and only then does an AudioContext get built —
     no autoplay policy warnings, no cost on pages nobody plays.
     ========================================================================== */
  (function livingWaveform() {
    var mounts = [].slice.call(document.querySelectorAll('[data-wave]'));
    if (!mounts.length) return;

    var ctx = null;   // one AudioContext for the page — browsers cap these hard
    function audioCtx() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) { try { ctx = new AC(); } catch (e) { return null; } }
      if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      return ctx;
    }

    mounts.forEach(function (mount) {
      var canvas = mount.querySelector('canvas');
      var clip = mount.closest('[data-clip]');
      var audio = clip && clip.querySelector('[data-audio]');
      if (!canvas || !audio) return;                    // idle-only mount (e.g. /live)

      var analyser = null, buf = null, raf = 0, wired = false;

      function size() {
        var dpr = Math.min(devicePixelRatio || 1, 2);
        var r = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
      }

      var wireTried = false;
      function wire() {
        if (wired) return true;
        if (wireTried) return false;    // createMediaElementSource throws if re-run
        wireTried = true;
        var ac = audioCtx(); if (!ac) return false;
        try {
          var srcNode = ac.createMediaElementSource(audio);
          /* AUDIBILITY FIRST. Routing an element through a MediaElementSource
             moves its output into the graph — if nothing reaches destination,
             the clip plays SILENTLY. So destination is connected before the
             analyser, and the analyser hangs off the source as a passive tap
             rather than sitting in the output path. If the analyser then fails,
             the visual degrades to the idle sine and the audio is untouched. */
          srcNode.connect(ac.destination);
          analyser = ac.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.72;
          srcNode.connect(analyser);
          buf = new Uint8Array(analyser.fftSize);
          wired = true;
        } catch (e) { analyser = null; wired = false; }
        return wired;
      }

      function draw() {
        if (!analyser) return;
        raf = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(buf);
        var w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
        g.clearRect(0, 0, w, h);
        g.lineWidth = Math.max(2, (devicePixelRatio || 1) * 1.5);
        g.strokeStyle = getComputedStyle(mount).getPropertyValue('--wave-ink').trim() || '#00D4FF';
        g.lineJoin = 'round'; g.lineCap = 'round';
        g.beginPath();
        var step = w / buf.length, x = 0;
        for (var n = 0; n < buf.length; n++) {
          var y = (buf[n] / 128.0) * (h / 2);
          n ? g.lineTo(x, y) : g.moveTo(x, y);
          x += step;
        }
        g.stroke();
      }

      function on() {
        if (REDUCED) { mount.setAttribute('data-wave-state', 'static'); return; }
        if (!wire()) { mount.setAttribute('data-wave-state', 'idle'); return; }
        size();
        mount.setAttribute('data-wave-state', 'live');
        cancelAnimationFrame(raf); draw();
      }
      function off() {
        cancelAnimationFrame(raf); raf = 0;
        mount.setAttribute('data-wave-state', REDUCED ? 'static' : 'idle');
        var g = canvas.getContext('2d'); g && g.clearRect(0, 0, canvas.width, canvas.height);
      }

      audio.addEventListener('play', on);
      audio.addEventListener('pause', off);
      audio.addEventListener('ended', off);
      addEventListener('resize', function () { if (mount.getAttribute('data-wave-state') === 'live') size(); }, { passive: true });
      mount.setAttribute('data-wave-state', REDUCED ? 'static' : 'idle');
    });
  })();
})();
