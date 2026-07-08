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

  /* single audio element for the pod */
  var audio = new Audio();
  audio.preload = "none";
  audio.muted = true;

  /* ---- Web Audio analyser (lazy, first gesture) ---- */
  var actx = null, analyser = null, freq = null, rafId = 0, srcNode = null;
  function initAnalyser() {
    if (actx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      srcNode = actx.createMediaElementSource(audio);
      analyser = actx.createAnalyser();
      analyser.fftSize = 64;
      freq = new Uint8Array(analyser.frequencyBinCount);
      srcNode.connect(analyser);
      analyser.connect(actx.destination);
    } catch (e) { actx = null; }
  }
  /* waveform bars */
  var bars = [];
  (function buildBars(){ if(!elWave) return; for(var i=0;i<14;i++){var b=document.createElement('i');elWave.appendChild(b);bars.push(b);} })();
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
      bars[j].style.height = Math.max(12, v*100) + '%';
      bars[j].style.background = v>0.05 ? 'var(--cyan)' : '#233';
    }
  }
  function stopPump(){ if(elOrb) elOrb.style.transform='scale(1)'; for(var j=0;j<bars.length;j++){bars[j].style.height='20%';bars[j].style.background='#233';} }

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

  /* ---- playback (per-line sequential, 150ms gaps) ---- */
  function playLine(i) {
    var lines = D.verticals[current].lines;
    if (i >= lines.length) { stop(); return; }
    lineIdx = i;
    lightCap(lines[i].n);
    audio.src = lines[i].audio;
    audio.muted = !soundOn;
    var p = audio.play();
    if (p && p.catch) p.catch(function(){});
  }
  audio.addEventListener('ended', function () {
    if (!playing) return;
    gapTimer = setTimeout(function () { playLine(lineIdx + 1); }, 150);
  });
  function start() {
    if (!soundOn) enableSound();
    try { window.dispatchEvent(new CustomEvent('ava:play', { detail: 'pod' })); } catch (e) {}
    try { window.va && window.va('event', { name: 'demo_play', vertical: current }); } catch (e) {}
    playing = true; if (elPlay) elPlay.textContent = '❚❚';
    if (actx && actx.state === 'suspended') actx.resume();
    if (!rafId) pump();
    playLine(lineIdx >= D.verticals[current].lines.length ? 0 : lineIdx);
  }
  function stop() {
    playing = false; if (elPlay) elPlay.textContent = '▶';
    audio.pause(); clearTimeout(gapTimer);
    cancelAnimationFrame(rafId); rafId = 0; stopPump();
  }
  function reset() { stop(); lineIdx = 0; if (elCaps) elCaps.querySelectorAll('.cap').forEach(function(c){c.classList.remove('on');}); }

  function enableSound() {
    soundOn = true; audio.muted = false;
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
  if (elTap) elTap.addEventListener('click', function (e) { e.stopPropagation(); answer(); });

  /* ---- controls ---- */
  if (elPlay) elPlay.addEventListener('click', function () { playing ? stop() : start(); });
  if (elMute) elMute.addEventListener('click', function () {
    soundOn = !soundOn; audio.muted = !soundOn;
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

  /* init */
  renderChips();
  renderCaps();
})();
