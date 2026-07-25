/* ============================================================================
   RUN 4 · BACKSTAGE 2.0 — one state machine, three renderers.
   ----------------------------------------------------------------------------
   STATES (12): boot · autoplay-summary · summary-locked · replay · audio-loading
   audio-playing · audio-paused · audio-ended-closedloop · roster-open
   roster-open-during-play · offscreen-paused · reduced-motion-final

   RENDERERS (3):
     renderSummary()  — phases, crew, status verbs. NEVER touches the playhead.
     renderAudio()    — waveform + playhead. OWNS the playhead exclusively.
     renderRoster()   — the 16, and the phase-row collapse that pays for them.

   DUAL-MODE HONESTY LAW. The summary is a SUMMARY: no timer, no waveform, no
   playhead, and a static label that says so in words. Those three artifacts
   are created and shown only once a real audio file is actually decoding.
   A compressed-looking clock over an 8.5s animation would be a lie about a
   46-second call, so the machine is built so that state cannot be reached.

   NO INVENTED TELEMETRY. Nothing here reports a measurement it did not take.
   Status is a progressive verb. There are no dB meters, no percentages, no
   progress bars and no integration logos. The waveform is an AnalyserNode on
   the real element; the playhead is audio.currentTime. That is all.
   ============================================================================ */
(function () {
  'use strict';

  var root = document.querySelector('[data-feed]');
  if (!root) return;

  /* ==========================================================================
     PHASE TIMESTAMP MAP — mapped to the real recording,
     /audio/v2/plumbing/full.mp3, measured duration 46.59s.

     These are CAPTION CUES, not telemetry: each is the point in the transcript
     where that phase's work becomes audible. Derived from the transcript
     published on this page (10 turns), not from a claimed instrument reading.
       0.0s  "Thanks for calling — this is AVA."          -> INTAKE
       9.5s  "Quick check: is it spraying, or seeping?"   -> TRIAGE
      24.0s  "Can someone come tonight? What's that cost?"-> BOOKING
      37.5s  "Seven A-M tomorrow, booked."                -> OUTPUT
     ========================================================================== */
  var PHASE_CUES = [
    { key: 'intake',  t:  0.0, verb: 'Listening…' },
    { key: 'triage',  t:  9.5, verb: 'Triaging…' },
    { key: 'booking', t: 24.0, verb: 'Checking the calendar…' },
    { key: 'output',  t: 37.5, verb: 'Writing the job…' }
  ];
  var END_VERB = 'Job on the board · customer texted';

  /* Summary beats. The label promises an 8.5-second summary, so the summary
     runs 8.5 seconds — the last row lands at 7.6s and locks at 8.5s.
     Stagger shortens as it goes: later rows arrive slightly faster (320 -> 180). */
  var SUMMARY_BEATS = [900, 3000, 5400, 7600];
  var SUMMARY_LOCK  = 8500;
  var CREW_BEATS    = [{ at: 2400, n: 4 }, { at: 4600, n: 8 }, { at: 7000, n: 12 }];

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- element handles ---------------------------------------------------- */
  var el = {
    chip:    root.querySelector('[data-chip]'),
    status:  root.querySelector('[data-status]'),
    more:    root.querySelector('[data-more]'),
    glyphs:  [].slice.call(root.querySelectorAll('[data-glyph]')),
    sum:     root.querySelector('[data-sumlabel]'),
    phases:  [].slice.call(root.querySelectorAll('.fd-phase')),
    outcome: root.querySelector('[data-outcome]'),
    audio:   root.querySelector('[data-fdaudio]'),
    zone:    root.querySelector('[data-audiozone]'),
    wave:    root.querySelector('[data-wave]'),
    canvas:  root.querySelector('[data-wave] canvas'),
    time:    root.querySelector('[data-time]'),
    scrub:   root.querySelector('[data-scrub]'),
    hear:    root.querySelector('[data-hear]'),
    expand:  root.querySelector('[data-expand]'),
    replay:  root.querySelector('[data-replay]'),
    roster:  root.querySelector('[data-roster]')
  };

  var state = 'boot';
  var timers = [];
  var played = false;          /* autoplay-once guard */
  var elapsed = 0;             /* summary ms already shown — offscreen RESUMES  */
  var startedAt = 0;
  var rosterOpen = false;
  var duration = 0;

  /* GA4 goes through tracking.js's public door ONLY. Calling window.gtag from
     here would skip its NOTRACK self-tag, and every headless gate run would
     land in analytics as a real visitor. If the spine is absent, we fire
     nothing — a missing event beats a poisoned dataset. */
  function ga(evt, params) {
    try {
      if (window.AVA_TRACK && window.AVA_TRACK.event) window.AVA_TRACK.event(evt, params || {});
    } catch (e) {}
  }

  /* AVA_LIVE_FEED seam (js/ava-signal.js). Phase 2 paints this component from a
     real socket; declaring the calls now means Phase 2 is a wiring job. */
  function emit(evt) {
    try { if (window.AVA_LIVE_FEED && window.AVA_LIVE_FEED.push) window.AVA_LIVE_FEED.push(evt); } catch (e) {}
  }

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function after(ms, fn) { timers.push(setTimeout(fn, ms)); }

  /* JITTER LAW — audio-synced transitions land with +/-150ms variance, because
     frame-perfect sync against a recording reads as pre-rendered. */
  function jitter() { return (Math.random() * 300) - 150; }

  function setState(next) {
    state = next;
    root.setAttribute('data-state', next);
  }

  /* ==========================================================================
     RENDERER 1 · SUMMARY  (never touches the playhead)
     ========================================================================== */
  function resetSummary() {
    clearTimers();
    el.phases.forEach(function (p) { p.classList.remove('is-in', 'is-done'); });
    el.glyphs.forEach(function (g) { g.classList.remove('is-on'); });
    if (el.more) { el.more.classList.remove('is-in'); el.more.textContent = '+4'; }
    if (el.chip) el.chip.classList.remove('is-lock');
    if (el.status) el.status.textContent = '—';
    if (el.outcome) el.outcome.style.opacity = '';
    elapsed = 0;
  }

  function lockSummary() {
    el.phases.forEach(function (p) { p.classList.add('is-in', 'is-done'); });
    if (el.status) el.status.textContent = END_VERB;
    if (el.more) { el.more.textContent = '+12'; el.more.classList.add('is-in'); }
    el.glyphs.forEach(function (g) { g.classList.add('is-on'); });
    if (el.chip) el.chip.classList.add('is-lock');
    setState('summary-locked');
    ga('backstage_summary_complete');
    emit({ state: 'JOB BOOKED', line: 'SUMMARY COMPLETE', at: '02:14', tone: 'done' });
  }

  /* Plays the summary forward from `elapsed` ms. Offscreen pauses by recording
     how far it got; it RESUMES from there and never restarts. */
  function playSummary() {
    setState('autoplay-summary');
    startedAt = Date.now();
    var base = elapsed;

    SUMMARY_BEATS.forEach(function (at, i) {
      if (at <= base) {
        el.phases[i].classList.add('is-in', 'is-done');
        el.glyphs[i] && el.glyphs[i].classList.add('is-on');
        return;
      }
      after(at - base, function () {
        el.phases[i].classList.add('is-in');
        el.glyphs[i] && el.glyphs[i].classList.add('is-on');
        if (el.status) el.status.textContent = PHASE_CUES[i].verb;
        after(260, function () { el.phases[i].classList.add('is-done'); });
        emit({ state: PHASE_CUES[i].key.toUpperCase(), line: PHASE_CUES[i].verb, at: '02:14', tone: 'work' });
      });
    });

    CREW_BEATS.forEach(function (b) {
      if (b.at <= base) { if (el.more) { el.more.textContent = '+' + b.n; el.more.classList.add('is-in'); } return; }
      after(b.at - base, function () {
        if (!el.more) return;
        el.more.textContent = '+' + b.n;
        /* re-trigger the 120ms overshoot on each step */
        el.more.classList.remove('is-in');
        void el.more.offsetWidth;
        el.more.classList.add('is-in');
      });
    });

    if (SUMMARY_LOCK > base) after(SUMMARY_LOCK - base, lockSummary);
    else lockSummary();
  }

  function pauseSummary() {
    if (state !== 'autoplay-summary') return;
    clearTimers();
    elapsed += Date.now() - startedAt;
    setState('offscreen-paused');
  }

  function finalState(why) {
    clearTimers();
    el.phases.forEach(function (p) { p.classList.add('is-in', 'is-done'); });
    el.glyphs.forEach(function (g) { g.classList.add('is-on'); });
    if (el.more) { el.more.textContent = '+12'; el.more.classList.add('is-in'); }
    if (el.status) el.status.textContent = END_VERB;
    setState(why || 'summary-locked');
  }

  /* ==========================================================================
     RENDERER 2 · AUDIO  (owns the playhead — nothing else may write it)
     ========================================================================== */
  var actx = null, analyser = null, srcNode = null, rafId = 0;

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function wireAnalyser() {
    if (analyser || !el.audio) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      srcNode = actx.createMediaElementSource(el.audio);
      analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      srcNode.connect(analyser);
      analyser.connect(actx.destination);
    } catch (e) { analyser = null; }   /* no analyser -> no fake bars, just no wave */
  }

  function drawWave() {
    if (!el.canvas) return;
    var c = el.canvas, ctx = c.getContext('2d');
    var w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!analyser) return;
    var n = analyser.frequencyBinCount, data = new Uint8Array(n);
    analyser.getByteFrequencyData(data);
    var bars = 48, step = Math.floor(n / bars), bw = w / bars;
    ctx.fillStyle = getComputedStyle(root).getPropertyValue('--cyan').trim() || '#00D4FF';
    for (var i = 0; i < bars; i++) {
      var v = data[i * step] / 255;
      var bh = Math.max(2, v * (h - 6));
      ctx.globalAlpha = 0.35 + v * 0.65;
      ctx.fillRect(i * bw + bw * 0.22, (h - bh) / 2, bw * 0.56, bh);
    }
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(drawWave);
  }

  function syncPlayhead() {
    if (!el.audio) return;
    var cur = el.audio.currentTime || 0;
    var dur = duration || el.audio.duration || 0;
    if (el.time) el.time.textContent = fmt(cur) + ' / ' + fmt(dur);
    if (el.scrub && dur) el.scrub.value = String((cur / dur) * 100);
    applyAudioPhases(cur);
  }

  /* audio-mode phase lighting, with the jitter law applied once per cue */
  var cueFired = [];
  function applyAudioPhases(cur) {
    PHASE_CUES.forEach(function (cue, i) {
      if (cueFired[i]) return;
      if (cur >= cue.t + (cueFired['j' + i] || 0) / 1000) {
        cueFired[i] = true;
        el.phases[i].classList.add('is-in');
        el.glyphs[i] && el.glyphs[i].classList.add('is-on');
        if (el.status) el.status.textContent = cue.verb;
        after(260, function () { el.phases[i].classList.add('is-done'); });
        if (el.more) {
          el.more.textContent = '+' + Math.min(12, (i + 1) * 4);
          el.more.classList.remove('is-in'); void el.more.offsetWidth; el.more.classList.add('is-in');
        }
        if (i === PHASE_CUES.length - 1 && el.chip) el.chip.classList.add('is-lock');
        emit({ state: cue.key.toUpperCase(), line: cue.verb, at: '02:14', tone: i === 3 ? 'done' : 'work' });
      }
    });
  }

  function enterAudio() {
    if (!el.audio) return;
    clearTimers();
    cueFired = [];
    PHASE_CUES.forEach(function (_, i) { cueFired['j' + i] = jitter(); });
    el.phases.forEach(function (p) { p.classList.remove('is-in', 'is-done'); });
    el.glyphs.forEach(function (g) { g.classList.remove('is-on'); });
    /* the crew cluster restarts with the phases — audio mode replays the call,
       so it must not inherit the summary's finished +12 */
    if (el.more) { el.more.classList.remove('is-in'); el.more.textContent = '+4'; }
    if (el.chip) el.chip.classList.remove('is-lock');
    if (el.zone) el.zone.hidden = false;
    setState('audio-loading');
    ga('hear_call_tap');

    wireAnalyser();
    if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }

    el.audio.play().then(function () {
      duration = el.audio.duration || 0;
      setState('audio-playing');
      if (el.hear) el.hear.textContent = '❚❚ Pause the call';
      cancelAnimationFrame(rafId); drawWave();
    }).catch(function () {
      /* autoplay blocked or decode failed — fall back honestly, no fake state */
      if (el.zone) el.zone.hidden = true;
      finalState('summary-locked');
    });
  }

  function pauseAudio() {
    if (!el.audio) return;
    el.audio.pause();
    cancelAnimationFrame(rafId);
    setState('audio-paused');
    if (el.hear) el.hear.textContent = '▸ Resume the call';
  }

  function resumeAudio() {
    if (!el.audio) return;
    el.audio.play().then(function () {
      setState('audio-playing');
      if (el.hear) el.hear.textContent = '❚❚ Pause the call';
      cancelAnimationFrame(rafId); drawWave();
    }).catch(function () {});
  }

  function endAudio() {
    cancelAnimationFrame(rafId);
    setState('audio-ended-closedloop');
    el.phases.forEach(function (p) { p.classList.add('is-in', 'is-done'); });
    el.glyphs.forEach(function (g) { g.classList.add('is-on'); });
    if (el.more) { el.more.textContent = '+12'; el.more.classList.add('is-in'); }
    if (el.status) el.status.textContent = 'Call complete · job booked at 2:14 AM';
    if (el.hear) el.hear.textContent = '▸ Play the call again';
    if (el.replay) el.replay.textContent = '↺ Replay summary';
    ga('backstage_audio_complete');
  }

  /* ==========================================================================
     RENDERER 3 · ROSTER  (and the phase collapse that keeps us under 680px)
     ========================================================================== */
  function toggleRoster() {
    rosterOpen = !rosterOpen;
    root.classList.toggle('is-roster', rosterOpen);
    if (el.roster) el.roster.hidden = !rosterOpen;
    if (el.expand) {
      el.expand.setAttribute('aria-expanded', String(rosterOpen));
      el.expand.textContent = rosterOpen ? 'Hide the 16 agents' : 'See all 16 agents';
    }
    if (rosterOpen) {
      ga('backstage_expand');
      /* roster-open-during-play is its own state: the audio keeps its playhead,
         the phases become the strip. Nothing about playback changes. */
      setState(state.indexOf('audio') === 0 ? 'roster-open-during-play' : 'roster-open');
    } else {
      setState(el.audio && !el.audio.paused ? 'audio-playing'
              : (el.audio && el.audio.currentTime > 0 ? 'audio-paused' : 'summary-locked'));
    }
  }

  /* ==========================================================================
     WIRING
     ========================================================================== */
  if (REDUCED) {
    finalState('reduced-motion-final');
  } else {
    resetSummary();
    setState('boot');
  }

  /* autoplay ONCE on first 60% entry, guarded; offscreen pauses and resumes */
  if (!REDUCED && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          if (!played) {
            played = true;
            ga('backstage_view');
            playSummary();
          } else if (state === 'offscreen-paused') {
            playSummary();
          }
        } else if (state === 'autoplay-summary') {
          pauseSummary();
        }
      });
    }, { threshold: [0, 0.6, 1] });
    io.observe(root);
  } else if (!REDUCED) {
    played = true;
    playSummary();
  }

  if (el.hear) el.hear.addEventListener('click', function () {
    if (state === 'audio-playing') return pauseAudio();
    if (state === 'audio-paused') return resumeAudio();
    if (state === 'audio-ended-closedloop') { el.audio.currentTime = 0; return enterAudio(); }
    enterAudio();
  });

  if (el.expand) el.expand.addEventListener('click', toggleRoster);

  var deep = root.querySelector('a[href="/backstage/"]');
  if (deep) deep.addEventListener('click', function () { ga('backstage_deep_link'); });

  /* Replay is idempotent: a clean reset every time, from any state. */
  if (el.replay) el.replay.addEventListener('click', function () {
    if (el.audio) { el.audio.pause(); el.audio.currentTime = 0; }
    cancelAnimationFrame(rafId);
    if (el.zone) el.zone.hidden = true;
    if (el.hear) el.hear.textContent = '▸ Hear the real call';
    if (el.replay) el.replay.textContent = '↺ Replay';
    cueFired = [];
    resetSummary();
    setState('replay');
    playSummary();
  });

  if (el.audio) {
    el.audio.addEventListener('timeupdate', syncPlayhead);
    el.audio.addEventListener('loadedmetadata', function () {
      duration = el.audio.duration || 0;
      syncPlayhead();
    });
    el.audio.addEventListener('ended', endAudio);
  }

  if (el.scrub) el.scrub.addEventListener('input', function () {
    if (!el.audio || !duration) return;
    el.audio.currentTime = (parseFloat(el.scrub.value) / 100) * duration;
  });

  /* offscreen also pauses AUDIO — pause/resume, never restart */
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting && state === 'audio-playing') pauseAudio();
      });
    }, { threshold: 0 });
    io2.observe(root);
  }

  window.addEventListener('resize', function () { if (state === 'audio-playing') drawWave(); });
})();
