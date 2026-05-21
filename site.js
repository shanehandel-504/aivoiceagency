/* ============================================================
   AI Voice Agency — shared site.js
   Mobile menu · hero gate · CTA glow · counters · sticky CTA
   ============================================================ */

if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
window.addEventListener('load', function() { window.scrollTo(0, 0); });

(function() {
  'use strict';

  // Mobile nav toggle
  var menuToggle = document.getElementById('menuToggle');
  var navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('open');
      menuToggle.textContent = navLinks.classList.contains('open') ? 'Close ✕' : 'Menu →';
    });
    navLinks.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        navLinks.classList.remove('open');
        menuToggle.textContent = 'Menu →';
      });
    });
  }

  // Hero line rise + cyan flicker — once per session, motion-safe
  if (!sessionStorage.getItem('avaHeroAnimated')) {
    document.body.classList.add('hero-animate');
    setTimeout(function() {
      var cyan = document.querySelector('.hero-line-cyan');
      if (cyan) cyan.classList.add('flicker');
    }, 700);
    sessionStorage.setItem('avaHeroAnimated', '1');
  }

  // Haptic feedback + visual tap fallback on primary CTAs (PR #27).
  // pointerdown (not click) so iOS Safari fires it; vibrate is feature-
  // detected and silently no-ops on unsupported platforms. Visual fallback
  // (.tap-feedback class) works everywhere via CSS keyframe; if a Signal
  // Stack V2 sits near the button, it gets a one-shot sweep.
  var HAPTIC_SELECTOR = 'a[href*="leadconnectorhq.com"], a[href^="tel:"], .cta-primary, .btn-primary, .btn-ghost, .contact-cta-btn, .demo-phone';
  document.addEventListener('pointerdown', function(e) {
    var btn = e.target.closest(HAPTIC_SELECTOR);
    if (!btn) return;
    if ('vibrate' in navigator) {
      try { navigator.vibrate(15); } catch (_) {}
    }
    btn.classList.add('tap-feedback');
    var nearbyStack = btn.querySelector('.signal-stack-v2') ||
                      (btn.parentElement && btn.parentElement.querySelector('.signal-stack-v2'));
    if (nearbyStack) {
      nearbyStack.classList.add('active-sweep');
      setTimeout(function() { nearbyStack.classList.remove('active-sweep'); }, 600);
    }
    setTimeout(function() { btn.classList.remove('tap-feedback'); }, 220);
  }, { passive: true });

  if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.cta-primary').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--glow-x', x + '%');
        btn.style.setProperty('--glow-y', y + '%');
        btn.style.setProperty('--glow-opacity', '1');
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.setProperty('--glow-opacity', '0');
      });
    });
  }

  // Stats count-up on scroll-into-view (once per session, motion-safe)
  // Supports data-target (required), data-prefix, data-suffix, data-duration
  if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      && !sessionStorage.getItem('avaStatsAnimated')) {
    var stats = document.querySelectorAll('.stat-number');
    if (stats.length && 'IntersectionObserver' in window) {
      var statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-target'), 10);
          var prefix = el.getAttribute('data-prefix') || '';
          var suffix = el.getAttribute('data-suffix') || '';
          var duration = parseInt(el.getAttribute('data-duration'), 10) || 1500;
          var start = null;
          el.textContent = prefix + '0' + suffix;
          function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = prefix + Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = prefix + target + suffix;
          }
          requestAnimationFrame(step);
          statsObserver.unobserve(el);
        });
      }, { threshold: 0.4 });
      stats.forEach(function(s) { statsObserver.observe(s); });
      sessionStorage.setItem('avaStatsAnimated', '1');
    }
  }

  // $126K BLEED COUNTER — smooth count-up from $0 → $126,000 over 3s on
  // first viewport entry, then a slow creep (+$1–3/sec) so the number is
  // visibly alive while the page sits in view.
  (function bleedCounter() {
    var module = document.getElementById('bleed-counter');
    if (!module) return;
    var value = document.getElementById('bleed-value');
    var liveDot = module.querySelector('.counter-live-dot');
    if (!value) return;

    var TARGET = 126000;
    var COUNTUP_MS = 3000;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0;

    function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
    function lockChrome() {
      value.classList.remove('alarm');
      value.classList.add('locked');
      module.classList.add('locked-border');
      if (liveDot) liveDot.classList.add('on');
    }
    function startCreep() {
      setInterval(function() {
        current += 1 + Math.floor(Math.random() * 3); // +$1–3/sec
        value.textContent = fmt(current);
      }, 1000);
    }

    if (reduced) {
      current = TARGET;
      value.textContent = fmt(current);
      lockChrome();
      startCreep();
      return;
    }

    value.textContent = fmt(0);
    lockChrome();

    function runCountup() {
      var start = performance.now();
      function step(ts) {
        var t = Math.min(1, (ts - start) / COUNTUP_MS);
        // easeOutCubic — fast then settle
        var eased = 1 - Math.pow(1 - t, 3);
        current = TARGET * eased;
        value.textContent = fmt(current);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          current = TARGET;
          value.textContent = fmt(current);
          startCreep();
        }
      }
      requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries, obs) {
        if (entries[0].isIntersecting) {
          runCountup();
          obs.disconnect();
        }
      }, { threshold: 0.5 });
      io.observe(module);
    } else {
      runCountup();
    }
  })();

  // Live timestamp on system status badge
  function updateBadge() {
    var badges = document.querySelectorAll('#status-badge');
    if (!badges.length) return;
    var now = new Date();
    var hours = now.getHours();
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var ampm = hours >= 12 ? 'PM' : 'AM';
    var h12 = hours % 12 || 12;
    var tz = 'LOCAL';
    try {
      var resolvedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (resolvedTz.indexOf('Chicago') !== -1) tz = 'CDT';
    } catch (e) {}
    var timeStr = h12 + ':' + minutes + ' ' + ampm + ' ' + tz;
    badges.forEach(function(b) {
      b.textContent = '// SYSTEM ONLINE — CALL LINE ACTIVE — ' + timeStr;
    });
  }
  updateBadge();
  setInterval(updateBadge, 60000);

  // H2 underline draw on scroll-into-view
  if ('IntersectionObserver' in window) {
    var headings = document.querySelectorAll('.section-title');
    if (headings.length) {
      var headingObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            headingObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      headings.forEach(function(h) { headingObserver.observe(h); });
    }
  }

  // HEAR AVA ANSWER — audio sample cards (homepage)
  // Click plays sample; pauses any other playing card; 404 falls back to "Audio coming soon" tag.
  (function audioCards() {
    var cards = document.querySelectorAll('.audio-card[data-src]');
    if (!cards.length) return;
    var current = null;

    function checkExists(src) {
      return fetch(src, { method: 'HEAD' }).then(function(r) {
        return r.ok;
      }).catch(function() {
        return false;
      });
    }

    cards.forEach(function(card) {
      var audio = null;
      card.addEventListener('click', function() {
        var src = card.getAttribute('data-src');

        // Pause whatever's currently playing
        if (current && current.card !== card) {
          current.audio.pause();
          current.audio.currentTime = 0;
          current.card.classList.remove('playing');
          current = null;
        }

        // Toggle off if this card was already playing
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
          card.classList.remove('playing');
          current = null;
          return;
        }

        // Lazily check + load
        if (card.classList.contains('coming-soon')) return;
        if (audio) {
          card.classList.add('playing');
          audio.play().catch(function() {});
          current = { card: card, audio: audio };
          return;
        }

        checkExists(src).then(function(ok) {
          if (!ok) {
            card.classList.add('coming-soon');
            return;
          }
          audio = new Audio(src);
          audio.addEventListener('ended', function() {
            card.classList.remove('playing');
            current = null;
          });
          card.classList.add('playing');
          audio.play().catch(function() {
            card.classList.remove('playing');
            card.classList.add('coming-soon');
          });
          current = { card: card, audio: audio };
        });
      });
    });
  })();

  // Mobile sticky CTA visibility — always-on past 50% of viewport
  var stickyCta = document.getElementById('mobile-cta');
  if (stickyCta) {
    function updateStickyCta() {
      var scrolled = window.scrollY > window.innerHeight * 0.5;
      if (scrolled) stickyCta.classList.add('visible');
      else stickyCta.classList.remove('visible');
    }
    window.addEventListener('scroll', updateStickyCta, { passive: true });
    updateStickyCta();
  }
})();
