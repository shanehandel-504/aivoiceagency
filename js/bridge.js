/* bridge.js — THE BRIDGE global behavior: nav burger + dropdowns, footer
   accordions, sticky mobile call bar, scroll reveal. Vanilla JS, no deps.
   Every hook null-guards so any page can carry any subset of the blocks. */
(function () {
  'use strict';

  var mqMobile = window.matchMedia('(max-width: 820px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     THEME — single shared owner (sun/moon toggle in the nav).
     Light-twin tokens live in bridge.css (site-wide chrome) +
     guide.css (homepage backstage tokens). Injected here so EVERY
     stamped page carries the same header. An early inline script on
     token pages sets data-theme pre-paint to avoid a flash.
     ============================================================ */
  var THEME_KEY = 'bs-theme';
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function applyTheme(t) {
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    if (metaTheme) metaTheme.setAttribute('content', t === 'light' ? '#F4F6FA' : '#0A0A0F');
    var b = document.querySelector('.bs-theme');
    if (b) {
      b.textContent = t === 'light' ? '☀' : '☾';
      b.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      b.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    }
  }
  (function mountTheme() {
    var navEl = document.querySelector('.bnav');
    if (!navEl || document.querySelector('.bs-theme')) return;
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var btn = document.createElement('button');
    btn.className = 'bs-theme';
    btn.type = 'button';
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next); /* instant — no transition by design */
    });
    var burgerEl = navEl.querySelector('.bnav-burger');
    navEl.insertBefore(btn, burgerEl || null);
    applyTheme(saved === 'light' || document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  })();

  /* ---------- nav: burger + dropdown groups ---------- */
  var nav = document.querySelector('.bnav');
  if (nav) {
    var burger = nav.querySelector('.bnav-burger');
    var menu = nav.querySelector('.bnav-menu');
    var groups = [].slice.call(nav.querySelectorAll('.bnav-group'));

    function closeGroups(except) {
      groups.forEach(function (g) {
        if (g !== except) {
          g.classList.remove('open');
          var b = g.querySelector('.bnav-top');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
    }
    function closeMenu() {
      if (!menu) return;
      menu.classList.remove('open');
      if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.textContent = 'MENU'; }
      document.body.style.overflow = '';       /* B1: scroll-lock ALWAYS released */
      closeGroups(null);
    }
    function menuOpen() { return menu && menu.classList.contains('open'); }

    if (burger && menu) {
      burger.addEventListener('click', function (e) {
        e.stopPropagation();                    /* don't let the outside-tap handler re-close it */
        var open = menu.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
        burger.textContent = open ? 'CLOSE' : 'MENU';
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
    groups.forEach(function (g) {
      var btn = g.querySelector('.bnav-top');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = g.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        closeGroups(open ? g : null);
      });
    });
    /* Esc closes overlay + groups */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeGroups(null); closeMenu(); }
    });
    /* B1: tap OUTSIDE the nav (incl. the overlay's own backdrop) closes it */
    document.addEventListener('click', function (e) {
      if (menuOpen() && (e.target === menu || !nav.contains(e.target))) { closeMenu(); return; }
      if (!nav.contains(e.target)) closeGroups(null);
    });
    /* a tap on any real link closes the mobile overlay */
    if (menu) menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    /* B1: crossing to desktop must never leave the body scroll-locked */
    function onMq() { if (!mqMobile.matches) closeMenu(); }
    if (mqMobile.addEventListener) mqMobile.addEventListener('change', onMq);
    else if (mqMobile.addListener) mqMobile.addListener(onMq);
  }

  /* ---------- footer: columns are accordions on mobile, open on desktop ---------- */
  var cols = [].slice.call(document.querySelectorAll('.bfoot-col'));
  if (cols.length) {
    var lastMobile = null;
    function syncCols() {
      if (mqMobile.matches === lastMobile) return;
      lastMobile = mqMobile.matches;
      cols.forEach(function (d) { d.open = !mqMobile.matches; });
    }
    syncCols();
    if (mqMobile.addEventListener) mqMobile.addEventListener('change', syncCols);
    else if (mqMobile.addListener) mqMobile.addListener(syncCols);
    window.addEventListener('resize', syncCols, { passive: true });
  }

  /* ---------- sticky mobile call bar ---------- */
  var bar = document.querySelector('.bcallbar');
  if (bar) {
    document.body.classList.add('bcallbar-on');
    var suppressed = 0;
    function paintBar() {
      var show = mqMobile.matches && window.scrollY > 480 && suppressed === 0;
      bar.classList.toggle('show', show);
    }
    window.addEventListener('scroll', paintBar, { passive: true });
    paintBar();
    /* no double-CTA fights: hide while a form / contact section / booking iframe is on screen */
    if ('IntersectionObserver' in window) {
      var hot = [].slice.call(document.querySelectorAll('form, #contact, .shell, .phone-cta-module'));
      if (hot.length) {
        var vis = [];
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            var i = vis.indexOf(en.target);
            if (en.isIntersecting && i < 0) vis.push(en.target);
            else if (!en.isIntersecting && i > -1) vis.splice(i, 1);
          });
          suppressed = vis.length;
          paintBar();
        }, { threshold: 0.15 });
        hot.forEach(function (el) { io.observe(el); });
      }
    }
  }

  /* ---------- scroll reveal (Phase 4 motion pack) ----------
     Interior pages only — the homepage runs its own glow-gated reveal system.
     Class is added by JS so no-JS visitors always see content. */
  if (!reduce && 'IntersectionObserver' in window && !document.querySelector('.pod')) {
    var targets = [].slice.call(document.querySelectorAll(
      'main > section, main > .section, .cross-links > a, .bfoot-grid > *'));
    if (targets.length) {
      targets.forEach(function (el) { el.classList.add('brv'); });
      var seen = 0;
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var delay = Math.min(2, seen++ % 3) * 80;
          (function (el) {
            setTimeout(function () { el.classList.add('brv-in'); }, delay);
          })(en.target);
          rio.unobserve(en.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
      targets.forEach(function (el) { rio.observe(el); });
      /* safety: anything still hidden after 4s becomes visible no matter what */
      setTimeout(function () {
        targets.forEach(function (el) { el.classList.add('brv-in'); });
      }, 4000);
    }
  }
})();

/* 4B.9 — scroll progress hairline (site-wide, transform only) */
(function () {
  'use strict';
  var wrap = document.createElement('div');
  wrap.className = 'bprogress';
  wrap.setAttribute('aria-hidden', 'true');
  var bar = document.createElement('i');
  wrap.appendChild(bar);
  document.body.appendChild(wrap);
  var ticking = false;
  function paint() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }, { passive: true });
  paint();
})();

/* P0 · AVA pulse ring layer (RUN 3). RUN 1.9's @property/conic ring froze on headed
   Chrome — the conic paint tile is GPU-cached, so the registered angle advanced while
   the gradient never repainted. The ring is now a transform-spun conic inside a masked
   window (.ava-lap in bridge.css); it's injected here, once per .ava-pulse, on load so
   it never competes with the LCP paint (glow-gate parity). No-JS visitors simply get no
   decorative ring — zero-cost, zero-risk, zero layout shift. */
(function () {
  'use strict';
  function mountLaps() {
    var btns = document.querySelectorAll('.ava-pulse');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.getAttribute('data-lap') === '1') continue; /* idempotent — safe to re-run */
      b.setAttribute('data-lap', '1');
      var lap = document.createElement('i');
      lap.className = 'ava-lap';
      lap.setAttribute('aria-hidden', 'true');
      b.insertBefore(lap, b.firstChild);
    }
  }
  if (document.readyState === 'complete') mountLaps();
  else window.addEventListener('load', mountLaps);
})();
