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

  /* ---------- theme (sun/moon in header; light twins in guide.css) ---------- */
  var THEME_KEY = 'bs-theme';
  var metaTheme = d.querySelector('meta[name="theme-color"]');
  function applyTheme(t) {
    if (t === 'light') d.documentElement.setAttribute('data-theme', 'light');
    else d.documentElement.removeAttribute('data-theme');
    if (metaTheme) metaTheme.setAttribute('content', t === 'light' ? '#F4F6FA' : '#0A0A0F');
    var b = d.querySelector('.bs-theme');
    if (b) {
      b.textContent = t === 'light' ? '☀' : '☾';
      b.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }
  function mountToggle() {
    var nav = d.querySelector('.bnav');
    if (!nav || d.querySelector('.bs-theme')) return;
    var btn = d.createElement('button');
    btn.className = 'bs-theme';
    btn.type = 'button';
    btn.addEventListener('click', function () {
      var next = d.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next); /* instant — no transition by design */
    });
    nav.insertBefore(btn, nav.querySelector('.bnav-burger'));
    applyTheme(d.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  }
  mountToggle();

  /* ---------- [data-event] beacons (no-op if window.va absent) ---------- */
  function beacon(name) { if (window.va) window.va('event', { name: name }); }
  d.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (el) beacon(el.getAttribute('data-event'));
  });

  /* ---------- pricing fit tabs ---------- */
  var ptabs = d.querySelectorAll('.bs-ptab');
  ptabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      ptabs.forEach(function (t) {
        t.classList.toggle('is-on', t === tab);
        t.setAttribute('aria-pressed', t === tab ? 'true' : 'false');
      });
      d.querySelectorAll('.bs-tier').forEach(function (card) {
        card.classList.toggle('is-reco', card.getAttribute('data-tier') === tab.getAttribute('data-fit'));
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
    log: stage.querySelector('[data-log]'),
    chips: stage.querySelector('[data-chips]'),
    payoff: stage.querySelector('[data-payoff]'),
    veil: stage.querySelector('[data-veil]'),
    phone: stage.querySelector('[data-phone]'),
    dot: stage.querySelector('[data-dot]'),
    wires: stage.querySelector('[data-wires]'),
    wirepath: stage.querySelector('[data-wirepath]'),
    start: stage.querySelector('[data-start]'),
    floor: stage.querySelector('.bs-floor')
  };
  var pathOK = !reduced && window.CSS && CSS.supports && CSS.supports('offset-path', 'path("M0 0 L10 10")');
  if (!pathOK && els.dot) els.dot.classList.add('no-path'); /* Safari/reduced: dot hidden, wires by opacity */

  var DATA = null, trade = null, agents = [], agentIdx = {};
  var running = false, everStarted = false, paused = false;
  var elapsed = 0, evIdx = 0, raf = 0, lastTick = 0, lastNow = 0, typeTimer = 0;
  var fracs = [], wireBuilt = false; /* offset-distance fraction at each agent orb */

  var clockNode = d.createTextNode('0.0s');
  if (els.clock) { els.clock.textContent = ''; els.clock.appendChild(clockNode); }

  function emit(name, detail) { stage.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  function finalT() { return trade ? trade.events[trade.events.length - 1].t : 0; }
  function orbEl(id) { return stage.querySelector('[data-agent="' + id + '"] .orb'); }
  function setOrb(id, state) {
    var o = orbEl(id); if (!o) return;
    o.setAttribute('data-state', state);
    var wrap = o.closest('.bs-agent');
    if (wrap) { if (state === 'idle') wrap.removeAttribute('data-live'); else wrap.setAttribute('data-live', ''); }
  }

  /* ---------- lazy hydrate (tap or idle) ---------- */
  var hydrating = null;
  function hydrate() {
    if (DATA) return Promise.resolve(DATA);
    if (hydrating) return hydrating;
    hydrating = fetch('/data/calls.json').then(function (r) { return r.json(); }).then(function (j) {
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

  /* ---------- render a script into the DOM (log text lives in DOM) ---------- */
  function renderScript() {
    if (els.clockLabel) els.clockLabel.textContent = 'INBOUND · ' + trade.clockLabel + ' · sample data';
    if (els.caller) els.caller.textContent = '“' + trade.callerLine + '”';
    if (els.log) {
      /* mute the role=log live region during the bulk rewrite so a trade
         swap doesn't queue 17 announcements on a screen reader */
      var region = els.log.parentElement;
      if (region && region.getAttribute('role') === 'log') {
        region.setAttribute('aria-live', 'off');
        setTimeout(function () { region.setAttribute('aria-live', 'polite'); }, 120);
      }
      els.log.textContent = '';
      trade.events.forEach(function (ev, i) {
        var li = d.createElement('li');
        li.setAttribute('data-i', i);
        li.setAttribute('data-t', ev.t);
        var name = ev.agent === 'result' ? 'RESULT' : agents[agentIdx[ev.agent]].name;
        li.innerHTML = '<span class="bs-lt">' + ev.t.toFixed(1) + '</span><b>' + name +
          '</b><span class="bs-ltx"></span>';
        li.querySelector('.bs-ltx').textContent = ev.text;
        els.log.appendChild(li);
      });
    }
    fillPayoff();
  }
  function fillPayoff() {
    if (!els.payoff || !trade) return;
    var q = function (s) { return els.payoff.querySelector(s); };
    q('[data-p-result]').textContent = trade.payoff.result;
    q('[data-p-when]').textContent = trade.payoff.when;
    q('[data-p-secs]').textContent = trade.payoff.seconds;
    q('[data-p-tag]').textContent = trade.payoff.tag;
  }

  /* ---------- chips (RECEIPT-POP; never move after landing) ---------- */
  function popChip(ev) {
    if (!els.chips) return;
    var c = d.createElement('span');
    c.className = 'bs-chip' + (ev.final ? ' ok' : '');
    c.textContent = ev.chip;
    els.chips.appendChild(c);
    emit('ava:chip', { text: ev.chip, t: ev.t, final: !!ev.final });
  }

  /* ---------- event firing ---------- */
  function fire(ev, i) {
    var li = els.log && els.log.querySelector('li[data-i="' + i + '"]');
    if (li) { li.classList.add('on'); li.setAttribute('tabindex', '0'); }
    if (ev.chip) popChip(ev);
    if (ev.agent === 'result') {
      if (li) li.classList.add('final');
      setOrb(agents[agents.length - 1].id, 'done');
      emit('ava:agent', { id: agents[agents.length - 1].id, lane: 'output', t: ev.t, text: ev.text, state: 'done' });
      emit('ava:booked', { trade: trade.id, t: ev.t });
      return;
    }
    var k = agentIdx[ev.agent];
    if (k > 0) {
      setOrb(agents[k - 1].id, 'done');
      emit('ava:agent', { id: agents[k - 1].id, lane: agents[k - 1].lane, t: ev.t, text: '', state: 'done' });
    }
    setOrb(ev.agent, 'working'); /* ONE working agent at a time — by construction */
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
    stage.classList.remove('is-running');
    stage.classList.remove('is-live'); /* revoke will-change */
    stage.classList.add('is-frozen');
    payoffRaf = requestAnimationFrame(function () { els.payoff.classList.add('in'); });
    emit('ava:freeze', { trade: trade.id, seconds: finalT() });
    /* payoff holds >=7s, no auto-restart — nothing scheduled here by design */
  }

  function resetStage() {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(payoffRaf);
    clearInterval(typeTimer);
    running = false; paused = false; evIdx = 0; elapsed = 0;
    agents.forEach(function (a) { setOrb(a.id, 'idle'); });
    if (els.log) els.log.querySelectorAll('li').forEach(function (li) {
      li.classList.remove('on', 'final');
      li.removeAttribute('tabindex');
    });
    if (els.chips) els.chips.textContent = '';
    els.payoff.classList.remove('in');
    els.phone.classList.remove('in');
    stage.classList.remove('is-frozen', 'is-running', 'is-live', 'bs-skip');
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

  /* ---------- party trick: tap a completed log line → recap SMS ---------- */
  function peekSms(li) {
    if (!li || !li.classList.contains('on') || !trade) return;
    els.phone.querySelector('[data-ph-msg]').textContent = trade.sms;
    els.phone.querySelector('[data-ph-time]').textContent = trade.smsTime;
    els.phone.classList.add('in');
    beacon('sms_peek_theater');
  }
  if (els.log) {
    els.log.addEventListener('click', function (e) { peekSms(e.target.closest('li')); });
    els.log.addEventListener('keydown', function (e) { /* keyboard path for fired lines */
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var li = e.target.closest('li');
      if (li) { e.preventDefault(); peekSms(li); }
    });
  }
  d.addEventListener('click', function (e) {
    if (els.phone.classList.contains('in') &&
        !e.target.closest('[data-phone]') && !e.target.closest('[data-log]')) {
      els.phone.classList.remove('in');
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

  /* ---------- wiring ---------- */
  if (els.start) els.start.addEventListener('click', start);
  d.querySelectorAll('[data-watch]').forEach(function (a) {
    a.addEventListener('click', function () { start(); });
  });
  var replayBtn = stage.querySelector('[data-replay]');
  if (replayBtn) replayBtn.addEventListener('click', replay);

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
