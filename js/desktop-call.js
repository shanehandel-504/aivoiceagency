/* desktop-call.js · aivoiceagency.ai · DESKTOP-CALL v1 (2026-10-28)

   On a phone every call button dials the line exactly as it always has: this
   file decides once per page load and, on a phone or a tablet, stops before it
   touches anything. On a desktop or laptop the same buttons start the call in
   the browser, in place, with the mic. No form, no number typed.

   One click: the orienting line appears under the button -> the browser asks
   for the mic while n8n hands out a one-time puzzle -> a worker solves it ->
   n8n checks it and its limits, reads what answers the line, and creates the
   web call -> Retell's own client joins it. The page holds no secret; the
   Retell key stays in n8n.

   Cost guard: a call ends itself at 5 minutes (here, and again in n8n), and one
   browser gets 3 browser calls a day. The counter lives in localStorage; when
   storage is blocked the guard steps aside, never the button.

   Only SITE differs between this file and aichauffeur.ai/assets/desktop-call.js. */
(function () {
  'use strict';
  var ua = navigator.userAgent || '';
  var canDial = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || navigator.maxTouchPoints > 1;
  if (canDial || !window.fetch || !window.Promise || !document.addEventListener) return;

  var SITE = {
    webhook: 'https://circulant.app.n8n.cloud/webhook/5b8e2f0c71d94a36be0f1c8a92d47e53',
    ours: function (d) { return d === '4142408930'; },
    number: function (d) { return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6); },
    extra: function () { return {}; },
    orient: 'Talking to AVA in your browser. Allow the mic and talk like a customer would.',
    fallback: 'Your browser blocked the mic. Call from your phone instead.',
    ink: '#EEF0F4', panel: '#12121A', line: '#23232E'
  };
  var SDK = 'https://cdn.jsdelivr.net/npm/retell-client-js-sdk@3.0.2/+esm';
  var CAP_MS = 300000, PER_DAY = 3, STORE = 'dc_calls';

  var state = 'idle', act = null, saved = null, client = null, run = 0;
  var t0 = 0, tick = 0, cut = 0, noteFor = null, noteKind = '';

  /* ── THE DAILY GUARD ─────────────────────────────────────────────────── */
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function used() {
    try { var o = JSON.parse(localStorage.getItem(STORE) || 'null'); return o && o.d === today() ? (o.n | 0) : 0; }
    catch (e) { return 0; }
  }
  function spend() { try { localStorage.setItem(STORE, JSON.stringify({ d: today(), n: used() + 1 })); } catch (e) {} }

  /* ── THE LINE UNDER THE BUTTON ───────────────────────────────────────────
     One element for the life of the page, so a screen reader hears each line
     as it changes. It floats (absolute, or fixed under a fixed or sticky
     ancestor), so it never pushes the page around: zero layout shift. */
  var style = document.createElement('style');
  style.textContent =
    '.dc-note{position:absolute;z-index:1100;box-sizing:border-box;width:max-content;' +
    'max-width:min(360px,calc(100vw - 32px));margin:0;padding:12px 16px;background:' + SITE.panel + ';' +
    'color:' + SITE.ink + ';border:1px solid ' + SITE.line + ';border-radius:0;box-shadow:none;' +
    'font-family:inherit;font-size:16px;font-weight:400;line-height:1.5;letter-spacing:0;' +
    'text-align:left;text-transform:none;text-wrap:pretty;white-space:normal}' +
    '.dc-note[hidden]{display:none}' +
    '.dc-note .dc-num{display:block;margin-top:4px;font-weight:600;font-variant-numeric:tabular-nums}' +
    '.dc-live{white-space:nowrap}.dc-time{margin-left:.5em;font-size:.85em;font-variant-numeric:tabular-nums}';
  document.head.appendChild(style);
  var note = document.createElement('div');
  note.className = 'dc-note';
  note.setAttribute('role', 'status');
  note.hidden = true;
  document.body.appendChild(note);

  function show(a, text, d) {
    noteFor = a;
    noteKind = d ? 'fallback' : 'orient';
    note.textContent = '';
    var p = document.createElement('span');
    p.textContent = text;
    note.appendChild(p);
    if (d) {
      var n = document.createElement('span');
      n.className = 'dc-num';
      n.textContent = SITE.number(d);
      note.appendChild(n);
    }
    note.hidden = false;
    place();
  }
  function hide() { note.hidden = true; note.textContent = ''; noteFor = null; noteKind = ''; }

  function anchored(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      var p = getComputedStyle(el).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  }
  function place() {
    if (note.hidden || !noteFor) return;
    var r = noteFor.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var gone = !r.width && !r.height, fixed = gone || anchored(noteFor);
    note.style.position = fixed ? 'fixed' : 'absolute';
    var w = note.offsetWidth, h = note.offsetHeight;
    var left = gone ? 16 : Math.min(Math.max(16, r.left), Math.max(16, vw - 16 - w));
    var top = gone ? vh - 16 - h : r.bottom + 8;
    // A bar at the foot of the screen: the line sits just above it instead.
    if (fixed && !gone && r.top > vh / 2) top = r.top - 8 - h;
    if (!fixed) { top += window.pageYOffset; left += window.pageXOffset; }
    note.style.left = Math.round(left) + 'px';
    note.style.top = Math.round(top) + 'px';
  }

  /* ── THE BUTTON ──────────────────────────────────────────────────────────
     Live, the pressed button reads End call with a small timer. Same element,
     same classes, so the same colour; its box is held at the size it had. */
  function wear(a) {
    var r = a.getBoundingClientRect(), cs = getComputedStyle(a);
    saved = { a: a, html: a.innerHTML, label: a.getAttribute('aria-label'), w: a.style.minWidth, h: a.style.minHeight };
    if (cs.display !== 'inline') {
      var px = function (k) { return parseFloat(cs[k]) || 0; };
      var inner = cs.boxSizing === 'border-box' ? 0 : 1;
      a.style.minWidth = (r.width - inner * (px('paddingLeft') + px('paddingRight') + px('borderLeftWidth') + px('borderRightWidth'))) + 'px';
      a.style.minHeight = (r.height - inner * (px('paddingTop') + px('paddingBottom') + px('borderTopWidth') + px('borderBottomWidth'))) + 'px';
    }
    var icon = a.querySelector('svg');
    a.innerHTML = (icon ? icon.outerHTML : '') + '<span class="dc-live">End call<span class="dc-time">0:00</span></span>';
    a.setAttribute('aria-label', 'End call');
  }
  function unwear() {
    if (!saved) return;
    var a = saved.a;
    a.innerHTML = saved.html;
    if (saved.label == null) a.removeAttribute('aria-label'); else a.setAttribute('aria-label', saved.label);
    a.style.minWidth = saved.w;
    a.style.minHeight = saved.h;
    saved = null;
  }
  function seen(a) {
    var r = a.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }
  // A drawer that closes on the press can take the pressed button with it. The
  // End call face then moves to a call button the visitor can still see.
  function adopt() {
    if (!act || seen(act)) return;
    var all = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < all.length; i++) {
      if (all[i] !== act && SITE.ours(digits(all[i])) && seen(all[i])) {
        unwear(); act = all[i]; wear(act); noteFor = act; return;
      }
    }
  }
  function paint() {
    adopt();
    var s = Math.floor((Date.now() - t0) / 1000);
    var el = act && act.querySelector('.dc-time');
    if (el) el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    place();
  }

  /* ── THE PUZZLE ──────────────────────────────────────────────────────────
     n8n will not create a call until this browser finds a counter where
     SHA-256("nonce:counter") starts with `bits` zero bits: about a million
     hashes at 20, a fraction of a second on a desktop, in a worker so the page
     keeps painting. Each nonce is single use and expires in three minutes. */
  function powSolve(nonce, bits, start, limit) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var W = new Int32Array(64), msg = new Uint8Array(64);
    var prefix = nonce + ':', plen = prefix.length, shift = 32 - bits;
    for (var i = 0; i < plen; i++) msg[i] = prefix.charCodeAt(i);
    for (var n = start; n < start + limit; n++) {
      var s = String(n), len = plen + s.length, t;
      for (t = 0; t < s.length; t++) msg[plen + t] = s.charCodeAt(t);
      for (t = 0; t < 16; t++) W[t] = 0;
      for (t = 0; t < len; t++) W[t >> 2] |= msg[t] << (24 - ((t & 3) << 3));
      W[len >> 2] |= 0x80 << (24 - ((len & 3) << 3));
      W[15] = len << 3;
      for (t = 16; t < 64; t++) {
        var x = W[t - 15], y = W[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      var a = 0x6a09e667, b = 0xbb67ae85 | 0, c = 0x3c6ef372, d = 0xa54ff53a | 0,
        e = 0x510e527f, f = 0x9b05688c | 0, g = 0x1f83d9ab, h = 0x5be0cd19;
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + W[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      if ((((a + 0x6a09e667) | 0) >>> shift) === 0) return n;
    }
    return -1;
  }
  function solve(nonce, bits) {
    return new Promise(function (resolve) {
      var worker = null, url = null, done = false;
      var finish = function (n) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (worker) worker.terminate();
        if (url) URL.revokeObjectURL(url);
        resolve(n);
      };
      var timer = setTimeout(function () { finish(-1); }, 30000);
      var slices = function () {
        var at = 0;
        (function step() {
          if (done) return;
          var n = powSolve(nonce, bits, at, 20000);
          if (n >= 0) return finish(n);
          at += 20000;
          setTimeout(step, 0);
        })();
      };
      try {
        var src = powSolve.toString() + '\nonmessage = function (e) { postMessage(powSolve(e.data[0], e.data[1], 0, 4294967295)); };';
        url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
        worker = new Worker(url);
        worker.onmessage = function (e) { finish(e.data); };
        worker.onerror = function () { worker.terminate(); worker = null; slices(); };
        worker.postMessage([nonce, bits]);
      } catch (e) { worker = null; slices(); }
    });
  }
  // Form-encoded on purpose: a simple request, so the browser sends no preflight.
  function post(fields) {
    return fetch(SITE.webhook, { method: 'POST', cache: 'no-store', credentials: 'omit', body: new URLSearchParams(fields) });
  }
  function within(p, ms) {
    return Promise.race([p, new Promise(function (_, no) { setTimeout(function () { no(new Error('timeout')); }, ms); })]);
  }
  async function proof() {
    var r = await within(post({ step: 'challenge' }), 10000);
    if (!r.ok) return null;
    var c = await r.json();
    if (!/^[0-9a-f]{32}$/.test(String(c.nonce)) || !(c.bits >= 1 && c.bits <= 24)) return null;
    var n = await solve(c.nonce, c.bits);
    return n < 0 ? null : { nonce: c.nonce, counter: n };
  }

  // Retell's own browser client, pinned, fetched on the first press only.
  var sdk = null;
  function loadSdk() { return sdk || (sdk = import(SDK).catch(function (e) { sdk = null; throw e; })); }

  /* ── ONE CALL ─────────────────────────────────────────────────────────── */
  function digits(a) { return (a.getAttribute('href') || '').replace(/[^0-9]/g, '').slice(-10); }

  async function start(a) {
    var mine = ++run, d = digits(a);
    if (used() >= PER_DAY) { fail(a, d); return; }
    state = 'connecting';
    act = a;
    a.setAttribute('aria-busy', 'true');
    show(a, SITE.orient, '');
    var lib = loadSdk(), pass = proof();
    lib.catch(function () {});
    pass.catch(function () {});
    try {
      var probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach(function (t) { t.stop(); });
    } catch (e) { if (mine === run) fail(a, d); return; }
    try {
      var p = await within(pass, 30000);
      if (mine !== run) return;
      if (!p) throw new Error('proof');
      var ask = { step: 'call', nonce: p.nonce, counter: String(p.counter), page: location.pathname };
      var more = SITE.extra();
      for (var k in more) ask[k] = more[k];
      var r = await within(post(ask), 15000);
      if (!r.ok) throw new Error('refused');
      var j = await r.json();
      if (mine !== run) return;
      if (!j.access_token) throw new Error('token');
      spend();
      var mod = await within(lib, 15000);
      if (mine !== run) return;
      client = new mod.RetellWebClient();
      client.on('call_started', function () { if (mine === run) live(); });
      client.on('call_ended', function () { if (mine === run) done(); });
      client.on('error', function () { if (mine !== run) return; if (state === 'live') done(); else fail(a, d); });
      await client.startCall({ callId: j.call_id, accessToken: j.access_token, transport: j.transport, iceServers: j.ice_servers, url: j.url });
      if (mine === run) live();
    } catch (e) { if (mine === run) fail(a, d); }
  }
  function live() {
    if (state === 'live' || !act) return;
    state = 'live';
    act.removeAttribute('aria-busy');
    wear(act);
    t0 = Date.now();
    tick = setInterval(paint, 1000);
    cut = setTimeout(hang, CAP_MS);
    place();
  }
  function hang() {
    if (client) { try { client.stopCall(); } catch (e) {} }
    done();
  }
  function done() {
    run++;
    clearInterval(tick);
    clearTimeout(cut);
    tick = cut = 0;
    var c = client;
    client = null;
    if (c) { try { c.removeAllListeners(); c.stopCall(); } catch (e) {} }
    unwear();
    if (act) act.removeAttribute('aria-busy');
    act = null;
    state = 'idle';
    hide();
  }
  function fail(a, d) {
    done();
    show(a, SITE.fallback, d);
  }

  /* ── THE PRESS ───────────────────────────────────────────────────────────
     Capture phase, so it runs before any handler on the button itself. The
     first press is left to travel on: the site's trackers count it as the call
     tap it is. A press while a call is starting or live ends that call and
     stops here, so it is never counted as a second call. */
  document.addEventListener('click', function (e) {
    if (e.button) return;
    if (noteKind === 'fallback' && !note.contains(e.target)) hide();
    var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (!a || !SITE.ours(digits(a))) return;
    e.preventDefault();
    if (state !== 'idle') {
      e.stopPropagation();
      if (a === act || (saved && a === saved.a)) hang();
      return;
    }
    start(a);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && noteKind === 'fallback') hide(); });
  window.addEventListener('resize', place);
  // Some browsers hold the agent's audio until a tap; any tap during a call lets it play.
  document.addEventListener('pointerdown', function () { if (client) client.startAudioPlayback().catch(function () {}); });
  // Leaving the page hangs up, so an abandoned tab never keeps the line open.
  window.addEventListener('pagehide', function () { if (client) hang(); });

  // A page that still carries the desktop QR pop-up: the browser call replaces it.
  var qr = document.getElementById('call-qr');
  if (qr) qr.showModal = function () {};
  var renamed = document.querySelectorAll('a[data-event="qr_open_hero"]');
  for (var i = 0; i < renamed.length; i++) renamed[i].setAttribute('data-event', 'tel_tap_hero');
})();
