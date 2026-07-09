/* ava-pod.js — hero phone pod: voice/text/call tabs, captioned per-line playback,
   Web Audio analyser orb + waveform. Vanilla JS. Follows circulant-funnel SKILL.
   Audio loads MUTED behind an incoming-call screen; one tap enables sound. */
(function () {
  "use strict";
  var D = window.AVA_DATA;
  var pod = document.querySelector('.phone');
  if (!D || !pod) return;

  var order = D.order.slice();
  var current = order[0];
  var lineIdx = 0;
  var playing = false;
  var soundOn = false;
  var gapTimer = null;

  var elChips = pod.querySelector('[data-chips]');
  var elCaps  = pod.querySelector('[data-captions]');
  var elPlay  = pod.querySelector('[data-play]');
  var elMute  = pod.querySelector('[data-mute]');
  var elOrb   = pod.querySelector('[data-orb]');
  var elWave  = pod.querySelector('[data-wave]');
  var elIncoming = pod.querySelector('[data-incoming]');
  var elTap   = pod.querySelector('[data-tap]');

  /* ---- ping-pong audio pipeline: A plays line N while B preloads line N+1 ---- */
  var pair = [new Audio(), new Audio()];
  pair.forEach(function (a) { a.preload = "none"; a.muted = true; });
  var actEl = 0;
  function activeAudio(){ return pair[actEl]; }

  /* unlock BOTH elements on the first pointer gesture (iOS silently kills element two) */
  var unlocked = false;
  function unlockAudio() {
    if (unlocked) return; unlocked = true;
    pair.forEach(function (a) {
      try { a.muted = true; var p = a.play(); if (p && p.then) p.then(function () { a.pause(); }).catch(function () {}); } catch (e) {}
    });
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });

  /* ---- Web Audio analyser (lazy, first gesture) — both elements feed one analyser ---- */
  var actx = null, analyser = null, freq = null, rafId = 0;
  function initAnalyser() {
    if (actx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      analyser = actx.createAnalyser();
      analyser.fftSize = 64;
      freq = new Uint8Array(analyser.frequencyBinCount);
      pair.forEach(function (a) { actx.createMediaElementSource(a).connect(analyser); });
      analyser.connect(actx.destination);
    } catch (e) { actx = null; }
  }
  /* waveform bars — transform:scaleY only (no per-frame height writes = no layout thrash) */
  var bars = [];
  (function buildBars(){ if(!elWave) return; for(var i=0;i<14;i++){var b=document.createElement('i');b.style.setProperty('--i',i);elWave.appendChild(b);bars.push(b);} })();
  function pump() {
    rafId = requestAnimationFrame(pump);
    if (!analyser) return;
    analyser.getByteFrequencyData(freq);
    var sum = 0, n = freq.length;
    for (var i=0;i<n;i++) sum += freq[i];
    var avg = sum / n / 255;               /* 0..1 */
    if (elOrb) elOrb.style.transform = 'scale(' + (1 + avg * 0.6).toFixed(3) + ')';
    for (var j=0;j<bars.length;j++){
      var v = freq[Math.floor(j/bars.length*n)] / 255;
      bars[j].style.transform = 'scaleY(' + Math.max(0.12, v).toFixed(3) + ')';
      bars[j].style.background = v>0.05 ? 'var(--cyan)' : '#233';
    }
  }
  function stopPump(){ if(elOrb) elOrb.style.transform='scale(1)'; if(elWave) elWave.classList.remove('live'); for(var j=0;j<bars.length;j++){bars[j].style.transform='scaleY(0.12)';bars[j].style.background='#233';} }

  /* ---- captions ---- */
  function renderCaps() {
    if (!elCaps) return;
    var lines = D.verticals[current].lines;
    elCaps.innerHTML = lines.map(function (l) {
      return '<div class="cap ' + (l.speaker === 'ava' ? 'ava' : 'caller') + '" data-cap="' + l.n + '">' +
             '<span class="spk">' + (l.speaker === 'ava' ? 'AVA' : 'Caller') + '</span>' + esc(l.text) + '</div>';
    }).join('');
  }
  function lightCap(n) {
    var all = elCaps.querySelectorAll('.cap');
    all.forEach(function (c) { c.classList.toggle('on', +c.getAttribute('data-cap') === n); });
    var on = elCaps.querySelector('.cap[data-cap="' + n + '"]');
    if (on) on.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ---- playback (per-line sequential, 150ms breath, ping-pong preload) ---- */
  function preloadNext(i) {
    var lines = D.verticals[current].lines, nx = pair[1 - actEl];
    if (lines[i + 1]) { try { nx.src = lines[i + 1].audio; nx.preload = 'auto'; nx.load(); } catch (e) {} }
  }
  function playLine(i) {
    var lines = D.verticals[current].lines;
    if (i >= lines.length) { stop(); showEndCard(); return; }   /* natural finish ONLY */
    lineIdx = i;
    lightCap(lines[i].n);
    var el = pair[actEl];
    if (el.src.indexOf(lines[i].audio) < 0) el.src = lines[i].audio;
    el.muted = !soundOn;
    var p = el.play();
    if (p && p.catch) p.catch(function(){});
    preloadNext(i);
  }
  pair.forEach(function (a) {
    a.addEventListener('ended', function () {
      if (!playing || a !== pair[actEl]) return;
      gapTimer = setTimeout(function () { actEl = 1 - actEl; playLine(lineIdx + 1); }, 150);
    });
  });
  function start() {
    if (!soundOn) enableSound();
    clearEndCard();
    stopRing();                             /* answered → kill the ring cadence + idle nudge */
    try { window.dispatchEvent(new CustomEvent('ava:play', { detail: 'pod' })); } catch (e) {}
    try { window.va && window.va('event', { name: 'demo_play', vertical: current }); } catch (e) {}
    playing = true; if (elPlay) elPlay.textContent = '❚❚';
    if (elWave) elWave.classList.add('live');
    emitLive(true); setFocus(true);
    if (actx && actx.state === 'suspended') actx.resume();
    if (!rafId) pump();
    playLine(lineIdx >= D.verticals[current].lines.length ? 0 : lineIdx);
  }
  function stop() {
    playing = false; if (elPlay) elPlay.textContent = '▶';
    pair.forEach(function (a) { a.pause(); }); clearTimeout(gapTimer);
    cancelAnimationFrame(rafId); rafId = 0; stopPump();
    emitLive(false); setFocus(false);
  }
  function reset() { stop(); clearEndCard(); lineIdx = 0; if (elCaps) elCaps.querySelectorAll('.cap').forEach(function(c){c.classList.remove('on');}); }

  function enableSound() {
    soundOn = true; activeAudio().muted = false;
    if (elMute) elMute.textContent = '🔊';
    initAnalyser();
    if (actx && actx.state === 'suspended') actx.resume();
  }

  /* ---- chips ---- */
  function renderChips() {
    if (!elChips) return;
    elChips.innerHTML = order.map(function (slug) {
      return '<button class="chip" data-chip="' + slug + '" aria-pressed="' + (slug === current) + '">' +
             D.verticals[slug].chip + '</button>';
    }).join('');
  }
  function selectVertical(slug) {
    if (!D.verticals[slug]) return;
    current = slug; reset(); renderCaps();
    elChips.querySelectorAll('.chip').forEach(function (c) {
      c.setAttribute('aria-pressed', c.getAttribute('data-chip') === slug);
    });
    start();
  }

  /* ---- tabs ---- */
  var tabs = pod.querySelectorAll('.pod-tab');
  var panels = pod.querySelectorAll('.pod-panel');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var name = t.getAttribute('data-tab');
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t); });
      panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === name); });
      if (name !== 'voice') stop();
      if (name === 'text') startSMS();
    });
  });

  /* ---- SMS tab ---- */
  var elSms = pod.querySelector('[data-sms]');
  var elSmsMeta = pod.querySelector('[data-sms-meta]');
  var smsTimer = null;
  function startSMS() {
    if (!elSms || !D.sms) return;
    if (elSmsMeta) elSmsMeta.textContent = 'Missed call · ' + D.sms.missedAt + ' — ' + D.sms.label;
    elSms.innerHTML = ''; clearInterval(smsTimer);
    var i = 0, b = D.sms.bubbles;
    function step() {
      if (i >= b.length) { clearInterval(smsTimer); return; }
      var bub = document.createElement('div');
      bub.className = 'bub ' + (b[i].from === 'ava' ? 'ava' : 'customer');
      bub.textContent = b[i].text;
      elSms.appendChild(bub);
      elSms.scrollTop = elSms.scrollHeight;
      i++;
    }
    step(); smsTimer = setInterval(step, 900);
  }
  var elSmsReplay = pod.querySelector('[data-sms-replay]');
  if (elSmsReplay) elSmsReplay.addEventListener('click', startSMS);

  /* ---- incoming overlay: tap to answer ---- */
  function answer() {
    if (!elIncoming || elIncoming.classList.contains('hide')) return;
    elIncoming.classList.add('hide');
    enableSound();
    start();
  }
  if (elIncoming) elIncoming.addEventListener('click', answer);
  var elAnswer = pod.querySelector('[data-answer]');
  if (elAnswer) elAnswer.addEventListener('click', function (e) { e.stopPropagation(); answer(); });

  /* ---- controls ---- */
  if (elPlay) elPlay.addEventListener('click', function () { playing ? stop() : start(); });
  if (elMute) elMute.addEventListener('click', function () {
    soundOn = !soundOn; activeAudio().muted = !soundOn;
    elMute.textContent = soundOn ? '🔊' : '🔇';
    if (soundOn) enableSound();
  });
  if (elChips) elChips.addEventListener('click', function (e) {
    var c = e.target.closest('[data-chip]'); if (c) selectVertical(c.getAttribute('data-chip'));
  });

  /* expose scroll-to-pod hook for hero/sticky buttons */
  window.AVA_answerPod = function () {
    pod.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(answer, 600);
  };

  /* cross-module: stop pod when theater or a clip plays */
  window.addEventListener('ava:play', function (e) { if (e.detail !== 'pod') stop(); });

  /* ---- CP2: sticky-live bus + soft-focus (demo-active) ---- */
  function emitLive(on) { try { window.dispatchEvent(new CustomEvent('ava:live', { detail: { on: on, src: 'pod' } })); } catch (e) {} }
  function setFocus(on) { document.body.classList.toggle('demo-active', on); }
  pair.forEach(function (a) {
    a.addEventListener('timeupdate', function () {
      if (!playing || a !== pair[actEl]) return;
      var total = D.verticals[current].lines.length || 1;
      var f = (lineIdx + (a.duration ? a.currentTime / a.duration : 0)) / total;
      try { window.dispatchEvent(new CustomEvent('ava:progress', { detail: Math.min(1, f) })); } catch (e) {}
    });
  });
  /* clear the soft-focus on any tap outside the hero or Esc — audio keeps playing (never trap) */
  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('demo-active') && e.target.closest && !e.target.closest('.hero')) document.body.classList.remove('demo-active');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) document.body.classList.remove('demo-active');
  });

  /* ---- peak-end escalation card (shown ONLY on natural finish; removed on replay / vertical change) ---- */
  var endCard = null;
  function clearEndCard() { if (endCard && endCard.parentNode) endCard.parentNode.removeChild(endCard); endCard = null; }
  function showEndCard() {
    if (!elCaps) return;
    clearEndCard();
    endCard = document.createElement('div');
    endCard.className = 'end-card';
    endCard.innerHTML =
      '<div class="ec-heard">Demo heard ✓</div>' +
      '<button class="btn btn-cyan" type="button" data-ec-call data-event="call_switch_endcard">📞 Have AVA call your phone</button>' +
      '<a class="btn btn-ghost" href="https://book.aivoiceagency.ai" target="_blank" rel="noopener" data-event="book_click_endcard">Book 15 min</a>';
    elCaps.appendChild(endCard);
    var callBtn = endCard.querySelector('[data-ec-call]');
    if (callBtn) callBtn.addEventListener('click', function () {
      var callTab = pod.querySelector('.pod-tab[data-tab="call"]');
      if (callTab) callTab.click();
    });
    elCaps.scrollTop = elCaps.scrollHeight;
    requestAnimationFrame(function () { if (endCard) endCard.classList.add('in'); });
  }

  /* ---- ring cadence cinema + gentle idle nudge (post-load, on-screen, ≤3 cycles; reduced-motion safe) ---- */
  var phoneEl = document.querySelector('.phone');
  var ringTimers = [], idleTimer = null;
  var nudged = false, visible = false, cadenceRan = false, ringStopped = false;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { if (sessionStorage.getItem('ava_nudged')) nudged = true; } catch (e) {}

  function answered() { return !elIncoming || elIncoming.classList.contains('hide') || playing; }
  function buzzOnce() {
    if (!phoneEl || reduceMotion || !visible || ringStopped) return;
    phoneEl.classList.remove('ringing'); void phoneEl.offsetWidth; phoneEl.classList.add('ringing');
    ringTimers.push(setTimeout(function () { if (phoneEl) phoneEl.classList.remove('ringing'); }, 1000));
  }
  function settlePhone() { if (phoneEl && !answered()) phoneEl.classList.add('settled'); }
  function runRingCadence(cycles) {
    if (!phoneEl || reduceMotion) return;
    var i = 0;
    (function cycle() {
      if (ringStopped || answered() || i >= cycles) { settlePhone(); return; }
      buzzOnce(); i++;
      ringTimers.push(setTimeout(cycle, 3000));   /* ~1s buzz + ~2s silence = true phone cadence */
    })();
  }
  function stopRing() {
    ringStopped = true;
    ringTimers.forEach(clearTimeout); ringTimers = [];
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    if (phoneEl) { phoneEl.classList.remove('ringing'); phoneEl.classList.remove('settled'); }
    hideToast();
  }

  var toastEl = null;
  function showToast(msg) {
    if (nudged || !phoneEl) return;
    nudged = true;
    try { sessionStorage.setItem('ava_nudged', '1'); } catch (e) {}
    toastEl = document.createElement('div');
    toastEl.className = 'ava-toast'; toastEl.textContent = msg;
    phoneEl.appendChild(toastEl);
    requestAnimationFrame(function () { if (toastEl) toastEl.classList.add('show'); });
    ringTimers.push(setTimeout(hideToast, 6000));
  }
  function hideToast() {
    if (!toastEl) return;
    var el = toastEl; toastEl = null;
    el.classList.remove('show');
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 400);
  }
  function startIdleWatch() {
    if (reduceMotion || nudged) return;
    idleTimer = setTimeout(function () {
      if (answered() || nudged || !visible) return;
      runRingCadence(1);
      showToast('Tap to hear the 2 AM call');
    }, 40000);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, hideToast, { passive: true });
  });

  function armRing() {
    if (reduceMotion || !phoneEl || ringStopped) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !cadenceRan && !answered()) { cadenceRan = true; runRingCadence(3); startIdleWatch(); }
      }, { threshold: 0.4 });
      io.observe(phoneEl);
    } else {
      visible = true; cadenceRan = true; runRingCadence(3); startIdleWatch();
    }
  }
  if (document.readyState === 'complete') armRing();
  else window.addEventListener('load', armRing);

  /* init */
  renderChips();
  renderCaps();
})();
