/* ============================================================
   AVA BACKSTAGE — js/backstage.js  (Run 1 · Wave 0 foundation)
   THE SEQUENCER. State-machine contract — everything binds here:
   reads a script from /data/calls.json and emits CustomEvents on
   #stage:  ava:call-start · ava:agent {id,lane,t,text,state} ·
   ava:chip · ava:booked · ava:freeze · ava:replay.
   DOM contract: data-lane / data-state / data-t.
   Clock = rAF text-node update at 10 Hz. will-change granted by
   .is-live, revoked on freeze. Never autoplays — tap to start.
   Vanilla JS, no deps. Chrome 120+ / Android 12 floor.
   ============================================================ */
(function () {
  'use strict';
  var d = document;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* theme toggle is owned by bridge.js now (shared across every page) */

  /* ---------- [data-event] beacons (no-op if window.va absent) ---------- */
  function beacon(name) { if (window.va) window.va('event', { name: name }); }
  d.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (el) beacon(el.getAttribute('data-event'));
  });

  /* ---------- pricing fit tabs (B3) ---------- */
  var ptabs = d.querySelectorAll('.bs-ptab');
  ptabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      ptabs.forEach(function (t) {
        t.classList.toggle('is-on', t === tab);
        t.setAttribute('aria-pressed', t === tab ? 'true' : 'false');
      });
      var fit = tab.getAttribute('data-fit');
      var match = null;
      d.querySelectorAll('.bs-tier').forEach(function (card) {
        var on = card.getAttribute('data-tier') === fit;
        card.classList.toggle('is-reco', on);
        /* RUN 3 · THE TRANSFER. is-picked carries the page's one solid green
           CTA plus the green left hairline. Toggling every card in the same
           pass means the green is never on two cards, not even for a frame. */
        card.classList.toggle('is-picked', on);
        if (on) match = card;
      });
      /* on mobile the matching card is far below the chips — bring it into view */
      if (match && window.matchMedia('(max-width:900px)').matches) {
        match.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });

  /* RUN 3: selecting a CARD transfers the green too, not just the fit chips.
     The CTA's own click is left alone — tapping the button books, it does not
     merely select. Everything else on the card selects it. */
  d.querySelectorAll('.bs-tier').forEach(function (card) {
    card.addEventListener('click', function (ev) {
      if (ev.target.closest('a,button')) return;          // let real actions through
      var tier = card.getAttribute('data-tier');
      d.querySelectorAll('.bs-tier').forEach(function (c) {
        var on = c === card;
        c.classList.toggle('is-picked', on);
        c.classList.toggle('is-reco', on);
      });
      ptabs.forEach(function (t) {
        var on = t.getAttribute('data-fit') === tier;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
  });

  /* ============================================================
     THE SEQUENCER
     ============================================================ */
  var stage = d.getElementById('stage');
  if (!stage) return;
  var els = {
    clock: stage.querySelector('[data-clock]'),
    clockLabel: stage.querySelector('[data-clock-label]'),
    caller: stage.querySelector('[data-caller]'),
    feed: stage.querySelector('[data-feed]'),
    strip: stage.querySelector('[data-strip]'),
    payoff: stage.querySelector('[data-payoff]'),
    veil: stage.querySelector('[data-veil]'),
    phone: stage.querySelector('[data-phone]'),
    dot: stage.querySelector('[data-dot]'),
    wires: stage.querySelector('[data-wires]'),
    wirepath: stage.querySelector('[data-wirepath]'),
    start: stage.querySelector('[data-start]'),
    floor: stage.querySelector('.bs-floor'),
    announce: stage.querySelector('[data-announce]')
  };
  var pathOK = !reduced && window.CSS && CSS.supports && CSS.supports('offset-path', 'path("M0 0 L10 10")');
  if (!pathOK && els.dot) els.dot.classList.add('no-path'); /* Safari/reduced: dot hidden, wires by opacity */
  var LANES = ['intake', 'triage', 'tools', 'output'];

  var DATA = null, trade = null, agents = [], agentIdx = {};
  var running = false, everStarted = false, paused = false;
  var elapsed = 0, evIdx = 0, raf = 0, lastTick = 0, lastNow = 0, typeTimer = 0;
  var fracs = [], wireBuilt = false; /* offset-distance fraction at each agent orb */

  var clockNode = d.createTextNode('0.0s');
  if (els.clock) { els.clock.textContent = ''; els.clock.appendChild(clockNode); }

  function emit(name, detail) { stage.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  function finalT() { return trade ? trade.events[trade.events.length - 1].t : 0; }
  function orbEl(id) { return stage.querySelector('.bs-card[data-agent="' + id + '"] .orb'); }
  function cardEl(i) { return els.feed && els.feed.querySelector('.bs-card[data-i="' + i + '"]'); }
  function setOrb(id, state) {
    var o = orbEl(id); if (!o) return;
    o.setAttribute('data-state', state);
    var wrap = o.closest('.bs-card');
    if (wrap) { if (state === 'idle') wrap.removeAttribute('data-live'); else wrap.setAttribute('data-live', ''); }
  }
  /* the 4 pill orbs mirror each lane's progress */
  function updatePillOrbs() {
    LANES.forEach(function (lane) {
      var pillOrb = stage.querySelector('[data-pill-lane="' + lane + '"]');
      if (!pillOrb) return;
      var states = agents.filter(function (a) { return a.lane === lane; })
        .map(function (a) { var o = orbEl(a.id); return o ? o.getAttribute('data-state') : 'idle'; });
      var st = 'idle';
      if (states.length && states.every(function (s) { return s === 'done'; })) st = 'done';
      else if (states.some(function (s) { return s !== 'idle'; })) st = 'working';
      pillOrb.setAttribute('data-state', st);
    });
  }

  /* ---------- lazy hydrate (tap or idle) ---------- */
  var hydrating = null;
  function hydrate() {
    if (DATA) return Promise.resolve(DATA);
    if (hydrating) return hydrating;
    var callsUrl = '/data/calls.json' + (window.__ASSET_V ? '?v=' + window.__ASSET_V : ''); /* cache armor */
    hydrating = fetch(callsUrl).then(function (r) { return r.json(); }).then(function (j) {
      DATA = j; agents = j.agents;
      agents.forEach(function (a, i) { agentIdx[a.id] = i; });
      trade = j.trades[0];
      buildWire();
      return j;
    }).catch(function (e) {
      hydrating = null; /* allow retry — never a silent dead button */
      if (window.console) console.warn('backstage: could not load /data/calls.json', e);
      if (els.start) els.start.textContent = '↻ TAP TO RETRY';
    });
    return hydrating;
  }
  if ('requestIdleCallback' in window) requestIdleCallback(function () { hydrate(); }, { timeout: 4000 });
  else setTimeout(hydrate, 3000);

  /* ---------- THE LIVE WIRE: path through the 16 orbs ---------- */
  function buildWire() {
    if (!els.wires || !els.wirepath || !els.floor || !agents.length) return;
    var fr = els.floor.getBoundingClientRect();
    if (!fr.width) { wireBuilt = false; return; } /* hidden/zero-width tab — retry on start */
    var pts = agents.map(function (a) {
      var r = orbEl(a.id).getBoundingClientRect();
      return [r.left + r.width / 2 - fr.left, r.top + r.height / 2 - fr.top];
    });
    var dstr = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    els.wires.setAttribute('viewBox', '0 0 ' + fr.width.toFixed(0) + ' ' + fr.height.toFixed(0));
    els.wirepath.setAttribute('d', dstr);
    if (pathOK) {
      els.dot.style.offsetPath = 'path("' + dstr + '")';
      var total = els.wirepath.getTotalLength(), acc = 0;
      fracs = [0];
      for (var i = 1; i < pts.length; i++) {
        acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        fracs.push(total ? acc / total : 0);
      }
    }
    wireBuilt = true;
  }
  function dotSnap(frac) {
    if (!pathOK) return;
    els.dot.style.transitionDuration = '0ms';
    els.dot.style.offsetDistance = (frac * 100).toFixed(3) + '%';
    void els.dot.offsetWidth;
  }
  function dotTravel(toIdx, ms) { /* METRONOME — linear only */
    if (!pathOK) return;
    els.dot.style.setProperty('--wire-c', 'var(--lane-' + agents[toIdx].lane + ')');
    els.dot.style.transitionProperty = 'offset-distance';
    els.dot.style.transitionTimingFunction = 'linear';
    els.dot.style.transitionDuration = Math.max(0, ms) + 'ms';
    els.dot.style.offsetDistance = (fracs[toIdx] * 100).toFixed(3) + '%';
  }

  /* ---------- caller line self-types ---------- */
  function typeCaller() {
    if (!els.caller) return;
    var full = '“' + trade.callerLine + '”';
    clearInterval(typeTimer);
    if (reduced) { els.caller.textContent = full; return; }
    els.caller.textContent = '';
    var i = 0;
    typeTimer = setInterval(function () {
      i += 1;
      els.caller.textContent = full.slice(0, i);
      if (i >= full.length) clearInterval(typeTimer);
    }, 28);
  }

  /* ---------- render a script into the cards (payloads live in the DOM) ---------- */
  function renderScript() {
    if (els.clockLabel) els.clockLabel.textContent = 'INBOUND · ' + trade.clockLabel + ' · sample data';
    if (els.caller) els.caller.textContent = '“' + trade.callerLine + '”';
    /* mute the role=log feed during the bulk swap so a trade change doesn't
       queue announcements on a screen reader */
    if (els.feed && els.feed.getAttribute('role') === 'log') {
      els.feed.setAttribute('aria-live', 'off');
      setTimeout(function () { els.feed.setAttribute('aria-live', 'polite'); }, 120);
    }
    trade.events.forEach(function (ev, i) {
      if (ev.agent === 'result') return;
      var card = cardEl(i);
      if (!card) return;
      var pay = card.querySelector('.bs-cpay');
      if (pay) pay.textContent = ev.text;
      card.setAttribute('data-chiptext', ev.chip || '');
      card.classList.remove('on', 'final');
      card.removeAttribute('tabindex');
      var slot = card.querySelector('[data-chip]');
      if (slot) { slot.textContent = ''; slot.removeAttribute('data-filled'); slot.classList.remove('ok'); }
    });
    agents.forEach(function (a) { setOrb(a.id, 'idle'); });
    updatePillOrbs();
    fillPayoff();
    fillStrip();
  }
  function fillPayoff() {
    if (!els.payoff || !trade) return;
    var q = function (s) { return els.payoff.querySelector(s); };
    q('[data-p-result]').textContent = trade.payoff.result;
    q('[data-p-when]').textContent = trade.payoff.when;
    q('[data-p-secs]').textContent = trade.payoff.seconds;
    q('[data-p-tag]').textContent = trade.payoff.tag;
  }
  function fillStrip() {
    if (!els.strip || !trade) return;
    var r = els.strip.querySelector('[data-strip-result]');
    var s = els.strip.querySelector('[data-strip-secs]');
    if (r) r.textContent = trade.payoff.result + ' · ' + trade.payoff.when;
    if (s) s.textContent = trade.payoff.seconds;
  }

  /* ---------- event firing ---------- */
  function fire(ev, i) {
    if (ev.agent === 'result') {
      setOrb(agents[agents.length - 1].id, 'done');
      updatePillOrbs();
      emit('ava:agent', { id: agents[agents.length - 1].id, lane: 'output', t: ev.t, text: ev.text, state: 'done' });
      emit('ava:booked', { trade: trade.id, t: ev.t });
      return;
    }
    var card = cardEl(i);
    if (card) {
      card.classList.add('on');           /* HARD-DOCK arrival */
      card.setAttribute('tabindex', '0'); /* fired card is a button that reveals the recap SMS */
      card.setAttribute('role', 'button');
      var nm = card.querySelector('.bs-cname'), py = card.querySelector('.bs-cpay');
      card.setAttribute('aria-label', (nm ? nm.textContent + ': ' : '') + (py ? py.textContent + '. ' : '') + 'Show the recap text message.');
      if (ev.chip) {
        var slot = card.querySelector('[data-chip]');
        if (slot) {
          slot.textContent = ev.chip;
          if (ev.final) slot.classList.add('ok');
          slot.setAttribute('data-filled', '');     /* RECEIPT-POP on the card */
        }
        emit('ava:chip', { text: ev.chip, t: ev.t, final: !!ev.final });
      }
    }
    var k = agentIdx[ev.agent];
    if (k > 0) {
      setOrb(agents[k - 1].id, 'done');
      emit('ava:agent', { id: agents[k - 1].id, lane: agents[k - 1].lane, t: ev.t, text: '', state: 'done' });
    }
    setOrb(ev.agent, 'working'); /* ONE working agent at a time — by construction */
    updatePillOrbs();
    emit('ava:agent', { id: ev.agent, lane: agents[k].lane, t: ev.t, text: ev.text, state: 'working' });
    var nx = trade.events[i + 1];
    if (nx && nx.agent !== 'result') {
      var nk = agentIdx[nx.agent];
      setOrb(nx.agent, 'active');
      emit('ava:agent', { id: nx.agent, lane: agents[nk].lane, t: nx.t, text: '', state: 'active' });
      dotTravel(nk, (nx.t - ev.t) * 1000);
    }
  }

  /* ---------- clock loop (10 Hz text-node update) ----------
     elapsed accumulates per-frame deltas (capped) so a hidden tab
     never batch-fires the whole script on return. */
  function tick(now) {
    if (!running || paused) return;
    if (lastNow) elapsed += Math.min((now - lastNow) / 1000, 0.25);
    lastNow = now;
    if (now - lastTick >= 100) {
      lastTick = now;
      clockNode.data = Math.min(elapsed, finalT()).toFixed(1) + 's';
    }
    var evs = trade.events;
    while (evIdx < evs.length && elapsed >= evs[evIdx].t) { fire(evs[evIdx], evIdx); evIdx += 1; }
    if (evIdx >= evs.length) { freeze(); return; }
    raf = requestAnimationFrame(tick);
  }

  var payoffRaf = 0;
  function freeze() {
    running = false;
    cancelAnimationFrame(raf);
    clockNode.data = finalT().toFixed(1) + 's'; /* stops dead — no ease */
    if (els.feed) markFinal();
    fillStrip();
    stage.classList.remove('is-running');
    stage.classList.remove('is-live'); /* revoke will-change */
    stage.classList.add('is-frozen');
    payoffRaf = requestAnimationFrame(function () { els.payoff.classList.add('in'); });
    /* announce the outcome — the payoff text is static in the DOM, so a class
       toggle alone never reaches a screen reader; write it into a live region */
    if (els.announce && trade) {
      els.announce.textContent = trade.payoff.result + ' — ' + trade.payoff.when +
        '. ' + trade.payoff.seconds + ' seconds. Sample call.';
    }
    emit('ava:freeze', { trade: trade.id, seconds: finalT() });
    /* payoff holds, no auto-restart. "review the call" (B4) collapses it into
       the sticky strip — the page never locks scroll in any state. */
  }
  function markFinal() {
    var last = cardEl(agents.length - 1);
    if (last) last.classList.add('final');
  }

  /* B4 · "review the call" — un-dim, keep the outcome pinned, scroll freely */
  function review() {
    beacon('review_tap_theater');
    els.payoff.classList.remove('in');
    stage.classList.add('is-reviewed');
    if (els.strip) {
      els.strip.hidden = false;
      /* focus was inside the payoff we just hid — move it to the strip */
      var f = els.strip.querySelector('a,button');
      if (f) f.focus();
    }
  }

  function resetStage() {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(payoffRaf);
    clearInterval(typeTimer);
    running = false; paused = false; evIdx = 0; elapsed = 0;
    agents.forEach(function (a) { setOrb(a.id, 'idle'); });
    updatePillOrbs();
    if (els.feed) els.feed.querySelectorAll('.bs-card').forEach(function (c) {
      c.classList.remove('on', 'final');
      c.removeAttribute('tabindex'); c.removeAttribute('role'); c.removeAttribute('aria-label');
      var slot = c.querySelector('[data-chip]');
      if (slot) { slot.textContent = ''; slot.removeAttribute('data-filled'); slot.classList.remove('ok'); }
    });
    if (els.announce) els.announce.textContent = '';
    els.payoff.classList.remove('in');
    els.phone.classList.remove('in');
    if (els.strip) els.strip.hidden = true;
    stage.classList.remove('is-frozen', 'is-running', 'is-live', 'is-reviewed', 'bs-skip');
    clockNode.data = '0.0s';
    dotSnap(0);
  }

  function resolveInstant() { /* reduced-motion path renders the resolved state */
    trade.events.forEach(function (ev, i) { fire(ev, i); });
    elapsed = finalT();
    freeze();
  }

  function start() {
    if (running) return;
    hydrate().then(function () {
      if (!DATA || running) return;
      if (stage.classList.contains('is-frozen')) resetStage();
      everStarted = true;
      if (!wireBuilt) buildWire(); /* retry — first build may have hit a zero-width tab */
      if (reduced) { typeCaller(); emit('ava:call-start', { trade: trade.id }); resolveInstant(); return; }
      running = true; paused = false; evIdx = 0; elapsed = 0;
      stage.classList.add('is-running', 'is-live'); /* will-change granted by .is-live */
      if (d.activeElement === els.start) stage.focus({ preventScroll: true }); /* start btn hides — keep focus */
      typeCaller();
      dotSnap(0);
      setOrb(agents[0].id, 'active');
      dotTravel(0, trade.events[0].t * 1000); /* first event lands < 400ms after tap */
      lastNow = 0; lastTick = 0;
      emit('ava:call-start', { trade: trade.id });
      raf = requestAnimationFrame(tick);
    });
  }

  function replay() {
    beacon('replay_tap_theater');
    els.veil.classList.add('on');
    emit('ava:replay', { trade: trade.id });
    setTimeout(function () {
      resetStage();
      els.veil.classList.remove('on');
      start();
    }, 180);
  }

  /* ---------- pause offscreen (IntersectionObserver removes .is-live) ---------- */
  var visNow = true;
  var io = new IntersectionObserver(function (entries) {
    var vis = entries[entries.length - 1].isIntersecting; /* newest entry wins */
    visNow = vis;
    if (!running) return;
    if (!vis && !paused) {
      paused = true;
      cancelAnimationFrame(raf);
      stage.classList.remove('is-live');
      if (pathOK) dotSnap(parseFloat(getComputedStyle(els.dot).offsetDistance) / 100 || 0);
    } else if (vis && paused) {
      paused = false;
      stage.classList.add('is-live');
      lastNow = 0; lastTick = 0;
      if (evIdx > 0 && evIdx < trade.events.length && trade.events[evIdx].agent !== 'result') {
        dotTravel(agentIdx[trade.events[evIdx].agent], (trade.events[evIdx].t - elapsed) * 1000);
      }
      raf = requestAnimationFrame(tick);
    }
  }, { threshold: 0.12 });
  io.observe(stage);

  /* ---------- party trick: tap a fired card → recap SMS ---------- */
  var smsOpener = null;
  function peekSms(card) {
    if (!card || !card.classList.contains('on') || !trade) return;
    els.phone.querySelector('[data-ph-msg]').textContent = trade.sms;
    els.phone.querySelector('[data-ph-time]').textContent = trade.smsTime;
    els.phone.classList.add('in');
    els.phone.setAttribute('tabindex', '-1');
    smsOpener = card;
    els.phone.focus({ preventScroll: true }); /* SR reads the recap; Esc/tap dismisses */
    beacon('sms_peek_theater');
  }
  function closeSms() {
    if (!els.phone.classList.contains('in')) return;
    els.phone.classList.remove('in');
    if (smsOpener) { smsOpener.focus(); smsOpener = null; }
  }
  if (els.feed) {
    els.feed.addEventListener('click', function (e) { peekSms(e.target.closest('.bs-card')); });
    els.feed.addEventListener('keydown', function (e) { /* keyboard path for fired cards */
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.bs-card');
      if (card) { e.preventDefault(); peekSms(card); }
    });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSms(); });
  d.addEventListener('click', function (e) {
    if (els.phone.classList.contains('in') &&
        !e.target.closest('[data-phone]') && !e.target.closest('[data-feed]')) {
      closeSms();
    }
  });

  /* ---------- trade swap ---------- */
  d.querySelectorAll('.bs-trade').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hydrate().then(function () {
        if (!DATA) return;
        var tr = null;
        DATA.trades.forEach(function (x) { if (x.id === btn.getAttribute('data-trade')) tr = x; });
        if (!tr) return;
        d.querySelectorAll('.bs-trade').forEach(function (b) {
          b.classList.toggle('is-on', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        trade = tr;
        resetStage();
        renderScript();
        /* live swap mid-session; never autoplays cold or while offscreen */
        if (everStarted && visNow) start();
      });
    });
  });

  /* RUN 3 · ?trade= deep-link from a hub demo pill — preselect the matching chip
     (same path as a manual tap, minus the tap beacon). Never autostarts: the
     tap-to-start law stands on every engine. */
  (function preselectTrade() {
    try {
      var q = (new URLSearchParams(location.search).get('trade') || '').replace(/[^a-z-]/gi, '');
      if (!q) return;
      var chip = d.querySelector('.bs-trade[data-trade="' + q + '"]');
      if (!chip) return;
      hydrate().then(function () {
        if (!DATA) return;
        var tr = null;
        DATA.trades.forEach(function (x) { if (x.id === q) tr = x; });
        if (!tr) return;
        d.querySelectorAll('.bs-trade').forEach(function (b) {
          b.classList.toggle('is-on', b === chip);
          b.setAttribute('aria-pressed', b === chip ? 'true' : 'false');
        });
        trade = tr;
        resetStage();
        renderScript();
        /* re-honor #stage after the async hydrate settles layout */
        if (location.hash === '#stage') { var s = d.getElementById('stage'); if (s) s.scrollIntoView(); }
      });
    } catch (e) {}
  })();

  /* ---------- wiring ---------- */
  if (els.start) els.start.addEventListener('click', start);
  d.querySelectorAll('[data-watch]').forEach(function (a) {
    a.addEventListener('click', function () { start(); });
  });
  stage.querySelectorAll('[data-replay]').forEach(function (b) { b.addEventListener('click', replay); });
  stage.querySelectorAll('[data-review]').forEach(function (b) { b.addEventListener('click', review); });

  var rsz = 0;
  addEventListener('resize', function () {
    clearTimeout(rsz);
    rsz = setTimeout(function () {
      if (!DATA) return;
      buildWire();
      if (running && evIdx > 0) {
        var lastAg = trade.events[Math.min(evIdx, trade.events.length - 1) - 1];
        if (lastAg && lastAg.agent !== 'result') dotSnap(fracs[agentIdx[lastAg.agent]] || 0);
        /* re-issue the in-flight leg the snap just killed */
        if (!paused && evIdx < trade.events.length && trade.events[evIdx].agent !== 'result') {
          dotTravel(agentIdx[trade.events[evIdx].agent], (trade.events[evIdx].t - elapsed) * 1000);
        }
      }
    }, 200);
  });

  /* test/OG hook — drives the stage to its resolved payoff frame */
  window.__backstage = {
    start: start,
    hydrate: hydrate,
    skipToPayoff: function () {
      return hydrate().then(function () {
        resetStage();
        stage.classList.add('bs-skip');
        trade.events.forEach(function (ev, i) { fire(ev, i); });
        elapsed = finalT();
        freeze();
        els.payoff.classList.add('in');
      });
    }
  };
})();

/* ============================================================
   HEAR AVA — audio clip player (Run 1.6, self-contained).
   Native <audio preload="none">, never autoplay, one plays at a
   time. Independent of the theater IIFE above.
   ============================================================ */
(function () {
  'use strict';
  var clips = [].slice.call(document.querySelectorAll('[data-clip]'));
  if (!clips.length) return;
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  var players = [];

  /* RUN 3: one clip is open at a time. The tabs and the compact records both
     select; opening one pauses whatever was playing so two calls never talk
     over each other. All three transcripts stay in the DOM either way. */
  var tabs = [].slice.call(document.querySelectorAll('.bs-cliptab'));
  function openClip(i) {
    clips.forEach(function (c, n) {
      var on = n === i;
      c.classList.toggle('is-open', on);
      if (!on) { var a = c.querySelector('[data-audio]'); if (a && !a.paused) a.pause(); }
    });
    tabs.forEach(function (t, n) {
      t.classList.toggle('is-on', n === i);
      t.setAttribute('aria-selected', n === i ? 'true' : 'false');
    });
  }
  tabs.forEach(function (t, i) { t.addEventListener('click', function () { openClip(i); }); });
  clips.forEach(function (c, i) {
    c.addEventListener('click', function (ev) {
      if (c.classList.contains('is-open')) return;
      if (ev.target.closest('a,button,input,summary')) return;
      openClip(i);
    });
  });
  clips.forEach(function (clip) {
    var audio = clip.querySelector('[data-audio]');
    var btn = clip.querySelector('[data-play]');
    var scrub = clip.querySelector('[data-scrub]');
    var time = clip.querySelector('[data-time]');
    if (!audio || !btn || !scrub || !time) return;
    var dur = 0;
    function paint() {
      var cur = audio.currentTime || 0;
      time.textContent = fmt(cur) + ' / ' + fmt(dur || audio.duration || 0);
      if (dur && !scrub.matches(':active')) scrub.value = (cur / dur * 100).toFixed(1);
    }
    audio.addEventListener('loadedmetadata', function () { dur = audio.duration; paint(); });
    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('ended', function () { stop(); audio.currentTime = 0; paint(); }); /* rewind so paint() lands on 0:00 */
    scrub.addEventListener('input', function () { if (dur) { audio.currentTime = scrub.value / 100 * dur; paint(); } });
    function play() {
      players.forEach(function (p) { if (p.stop !== stop) p.stop(); }); /* one at a time */
      audio.play().catch(function () {});
      clip.classList.add('is-playing'); btn.textContent = '⏸';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Play', 'Pause'));
    }
    function stop() {
      if (!audio.paused) audio.pause();
      clip.classList.remove('is-playing'); btn.textContent = '▶';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Pause', 'Play'));
    }
    btn.addEventListener('click', function () { audio.paused ? play() : stop(); });
    players.push({ stop: stop });
  });
})();
