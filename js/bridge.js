/* bridge.js — THE BRIDGE global behavior: nav burger + dropdowns, footer
   accordions, sticky mobile call bar, scroll reveal. Vanilla JS, no deps.
   Every hook null-guards so any page can carry any subset of the blocks. */
(function () {
  'use strict';

  var mqMobile = window.matchMedia('(max-width: 820px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      if (burger) burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      closeGroups(null);
    }

    if (burger && menu) {
      burger.addEventListener('click', function () {
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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeGroups(null); closeMenu(); }
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) closeGroups(null);
    });
    /* a tap on any real link closes the mobile overlay */
    if (menu) menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
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
