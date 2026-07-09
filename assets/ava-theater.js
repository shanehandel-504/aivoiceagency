/* ava-theater.js — S4 "Watch AVA work": transcript + live data board + timeline + receipt.
   Plays per-line audio and fills the board as each datum is spoken. Vanilla JS. */
(function () {
  "use strict";
  var D = window.AVA_DATA;
  var root = document.querySelector('.theater');
  if (!D || !root) return;

  var live = D.theaterLive, soon = D.theaterSoon;
  var cur = live[0], idx = 0, playing = false, gap = null;

  var elPick   = root.querySelector('[data-th-picker]');
  var elTx     = root.querySelector('[data-th-transcript]');
  var elBoard  = root.querySelector('[data-th-board]');
  var elTl     = root.querySelector('[data-th-timeline]');
  var elRc     = root.querySelector('[data-th-receipt]');
  var elHandle = root.querySelector('[data-th-handle]');
  var elItems  = root.querySelector('[data-th-items]');
  var bPlay = root.querySelector('[data-th-play]');
  var bSkip = root.querySelector('[data-th-skip]');
  var bReplay = root.querySelector('[data-th-replay]');

  /* ping-pong: A plays line N while B preloads line N+1 (kills the LTE per-line stutter) */
  var pair = [new Audio(), new Audio()];
  pair.forEach(function (a) { a.preload = 'none'; });
  var actEl = 0;
  var unlocked = false;
  function unlockAudio() {
    if (unlocked) return; unlocked = true;
    pair.forEach(function (a) {
      try { a.muted = true; var p = a.play(); if (p && p.then) p.then(function () { a.pause(); a.muted = false; }).catch(function () {}); } catch (e) {}
    });
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* cross-module: stop the hero pod when the theater plays */
  function emitPlay(){ try{ window.dispatchEvent(new CustomEvent('ava:play',{detail:'theater'})); }catch(e){} }
  window.addEventListener('ava:play', function(e){ if(e.detail!=='theater') hardStop(); });

  var FIELDS = ['name','urgency','job','time'];

  function renderPicker() {
    var html = live.map(function (s) {
      return '<button class="th-v" data-thv="' + s + '" aria-pressed="' + (s === cur) + '">' + D.verticals[s].label + '</button>';
    }).join('');
    html += soon.map(function (s) {
      return '<button class="th-v" disabled title="Coming this week">' + D.verticals[s].label + ' · soon</button>';
    }).join('');
    elPick.innerHTML = html;
  }

  function renderTranscript() {
    var lines = D.verticals[cur].lines;
    elTx.innerHTML = lines.map(function (l) {
      return '<div class="th-line ' + (l.speaker==='ava'?'ava':'caller') + '" data-line="' + l.n + '">' +
        '<button class="mini" data-linebtn="' + l.n + '" aria-label="Play line ' + l.n + '">▶</button>' +
        '<div><span class="spk">' + (l.speaker==='ava'?'AVA':'Caller') + '</span> ' + esc(l.text) + '</div></div>';
    }).join('');
  }

  function renderBoard() {
    var b = D.verticals[cur].board;
    elBoard.innerHTML = FIELDS.map(function (k) {
      var f = b[k];
      return '<div class="slot" data-slot="' + k + '"><span class="k">' + f.label + '</span>' +
             '<span class="v">' + esc(f.value) + '</span></div>';
    }).join('');
    // timeline
    elTl.innerHTML = D.verticals[cur].timeline.map(function (t, i) {
      return '<div class="tl" data-tl="' + i + '"><span class="d"></span>' + esc(t) + '</div>';
    }).join('');
    // receipt (hidden until done)
    var r = D.verticals[cur].receipt;
    elHandle.textContent = 'Call handled in ' + r.handle;
    elItems.innerHTML = r.items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('');
    elRc.hidden = true;
  }

  function updateAt(lineNo, done) {
    var b = D.verticals[cur].board;
    FIELDS.forEach(function (k) {
      var slot = elBoard.querySelector('[data-slot="' + k + '"]');
      if (slot) slot.classList.toggle('filled', lineNo >= b[k].fillAtLine);
    });
    var tfill = b.time.fillAtLine;
    var tls = elTl.querySelectorAll('.tl');
    if (tls[0]) tls[0].classList.toggle('lit', lineNo >= 3);
    if (tls[1]) tls[1].classList.toggle('lit', lineNo >= tfill);
    if (tls[2]) tls[2].classList.toggle('lit', lineNo >= 9);
    if (tls[3]) tls[3].classList.toggle('lit', !!done);
    elRc.hidden = !done;
  }

  function lightLine(n) {
    elTx.querySelectorAll('.th-line').forEach(function (r) {
      r.classList.toggle('on', +r.getAttribute('data-line') === n);
    });
    var on = elTx.querySelector('.th-line[data-line="' + n + '"]');
    if (on) on.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function preloadNext(i) {
    var lines = D.verticals[cur].lines, nx = pair[1 - actEl];
    if (lines[i + 1]) { try { nx.src = lines[i + 1].audio; nx.preload = 'auto'; nx.load(); } catch (e) {} }
  }
  function playLine(i) {
    var lines = D.verticals[cur].lines;
    if (i >= lines.length) { finish(); return; }
    idx = i;
    lightLine(lines[i].n);
    updateAt(lines[i].n, false);
    var el = pair[actEl];
    if (el.src.indexOf(lines[i].audio) < 0) el.src = lines[i].audio;
    el.muted = false;
    var p = el.play(); if (p && p.catch) p.catch(function(){});
    preloadNext(i);
  }
  pair.forEach(function (a) {
    a.addEventListener('ended', function () {
      if (!playing || a !== pair[actEl]) return;
      gap = setTimeout(function () { actEl = 1 - actEl; playLine(idx + 1); }, 150);
    });
  });

  function play() { emitPlay(); playing = true; bPlay.textContent = '❚❚ Playing'; playLine(idx >= D.verticals[cur].lines.length ? 0 : idx); }
  function hardStop() { playing = false; if (bPlay) bPlay.textContent = '▶ Play'; pair.forEach(function (a) { a.pause(); }); clearTimeout(gap); }
  function finish() { hardStop(); updateAt(99, true); }
  function reset() { hardStop(); idx = 0; renderTranscript(); renderBoard(); }

  function skip() {
    hardStop(); idx = D.verticals[cur].lines.length;
    D.verticals[cur].lines.forEach(function(l){ /* no-op */ });
    lightLine(D.verticals[cur].lines.length); updateAt(99, true);
  }

  function selectV(slug) {
    if (live.indexOf(slug) < 0) return;
    cur = slug; reset();
    elPick.querySelectorAll('.th-v').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-thv') === slug);
    });
  }

  /* events */
  elPick.addEventListener('click', function (e) {
    var b = e.target.closest('[data-thv]'); if (b) selectV(b.getAttribute('data-thv'));
  });
  elTx.addEventListener('click', function (e) {
    var b = e.target.closest('[data-linebtn]'); if (!b) return;
    emitPlay(); hardStop();
    var n = +b.getAttribute('data-linebtn');
    var line = D.verticals[cur].lines[n - 1];
    lightLine(n); var el = pair[actEl]; el.src = line.audio; el.muted = false; el.play().catch(function(){});
  });
  if (bPlay) bPlay.addEventListener('click', function () { playing ? hardStop() : play(); });
  if (bSkip) bSkip.addEventListener('click', skip);
  if (bReplay) bReplay.addEventListener('click', function () { reset(); play(); });

  /* init */
  renderPicker(); renderTranscript(); renderBoard();
})();
