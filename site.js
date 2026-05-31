/* ============================================================
   AI Voice Agency — shared site.js
   Mobile menu · hero gate · CTA glow · counters · sticky CTA
   ============================================================ */

if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }

// Land on the hero and HOLD it. A persisted #live-call hash (left in the URL
// after tapping "GET CALLED NOW") used to make the browser smooth-scroll past
// the hero straight to the form on every reload — too fast to read the hero.
// Strip any hash and pin to the top before paint; in-page CTAs smooth-scroll
// on click instead (see the anchor handler below). No auto-scroll on load.
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
window.scrollTo(0, 0);
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

  // Smooth-scroll in-page anchors ("GET CALLED NOW" → live-call form, nav
  // sections, etc.) to their target WITHOUT writing the hash to the URL. That
  // keeps the hero landing clean on every reload — no auto-scroll to the form.
  var NAV_OFFSET = 72; // fixed nav (56px) + breathing room
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href').slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    var y = window.scrollY + target.getBoundingClientRect().top - NAV_OFFSET;
    window.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
  }, false);

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

  // $126K BLEED COUNTER — hero centerpiece animation
  // Count up $0 → $126,000 over ~3s, then slow creep (~$1-3/sec) while visible.
  (function bleedCounter() {
    var module = document.getElementById('bleed-counter');
    if (!module) return;
    var value = document.getElementById('bleed-value');
    var liveDot = module.querySelector('.counter-live-dot');
    if (!value) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FINAL = 126000;
    var formatted = '$' + FINAL.toLocaleString('en-US');

    function format(n) { return '$' + n.toLocaleString('en-US'); }

    function reveal() {
      value.classList.remove('alarm');
      value.classList.add('locked');
      module.classList.add('locked-border');
      if (liveDot) liveDot.classList.add('on');
    }

    if (reduced) {
      value.textContent = formatted;
      reveal();
      startCreep(FINAL);
      return;
    }

    value.classList.add('alarm');
    value.textContent = '$0';

    function startCountUp() {
      var t0 = performance.now();
      var DURATION = 3000;
      function tick(ts) {
        var elapsed = ts - t0;
        var p = Math.min(elapsed / DURATION, 1);
        // easeOutCubic — fast start, settled end so the slam feels intentional
        var eased = 1 - Math.pow(1 - p, 3);
        var current = Math.floor(eased * FINAL);
        value.textContent = format(current);
        if (p < 1) {
          requestAnimationFrame(tick);
          return;
        }
        value.textContent = formatted;
        value.classList.add('slam');
        setTimeout(function() {
          value.classList.remove('alarm');
          value.classList.add('locked');
          module.classList.add('locked-border');
        }, 150);
        setTimeout(function() { value.classList.add('pulse'); }, 350);
        setTimeout(function() {
          if (liveDot) liveDot.classList.add('on');
          startCreep(FINAL);
        }, 900);
      }
      requestAnimationFrame(tick);
    }

    // Slow creep — adds $1-3 every ~1s while the counter is visible. Visibility
    // gate prevents the number from running off-screen when the user scrolls away.
    function startCreep(startVal) {
      var current = startVal;
      var visible = true;
      if ('IntersectionObserver' in window) {
        var visIo = new IntersectionObserver(function(entries) {
          visible = entries[0].isIntersecting;
        }, { threshold: 0.1 });
        visIo.observe(module);
      }
      setInterval(function() {
        if (!visible) return;
        current += Math.floor(Math.random() * 3) + 1;
        value.textContent = format(current);
        value.classList.remove('creep');
        // force reflow so the animation restarts each tick
        void value.offsetWidth;
        value.classList.add('creep');
      }, 1000);
    }

    // Fire only when the counter actually enters viewport.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries, obs) {
        if (entries[0].isIntersecting) {
          startCountUp();
          obs.disconnect();
        }
      }, { threshold: 0.5 });
      io.observe(module);
    } else {
      startCountUp();
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

  // LIVE CALL WIDGET — hero lead-capture form. Picks a role, takes a
  // first name + cell, and POSTs the lead as a JSON body to the configured
  // endpoint. The destination reads `phone` (E.164) to dial the lead, so
  // phone is always sent. The legacy in-browser WebRTC/call-button mechanic
  // is dead and gone; the actual AVA call is placed downstream by whatever
  // automation receives this lead. Flip backends (GHL -> n8n) on one line.
  var AVA_CALL_ENDPOINT = 'https://circulant.app.n8n.cloud/webhook/ava-call'; // n8n webhook (flipped from GHL)
  (function liveCallWidget() {
    var widgets = document.querySelectorAll('[data-live-call-widget]');
    if (!widgets.length) return;

    // Normalize a raw cell value to strict E.164:
    //   strip everything except digits
    //   10 digits             -> prepend "+1"  (5551234567  -> +15551234567)
    //   11 digits leading "1" -> prepend "+"   (15551234567 -> +15551234567)
    //   already starts with "+" then digits -> keep as-is
    //   anything else -> '' (blocks submit; isValidCell rejects it)
    function normalizeCell(raw) {
      var hadPlus = (raw || '').trim().charAt(0) === '+';
      var digits = (raw || '').replace(/\D/g, '');
      if (!digits) return '';
      if (hadPlus) return '+' + digits;
      if (digits.length === 10) return '+1' + digits;
      if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
      return '';
    }

    function isValidCell(e164) {
      return /^\+[1-9]\d{7,14}$/.test(e164);
    }

    widgets.forEach(function(widget) {
      var chips = widget.querySelectorAll('.lcw-chip');
      var nameInput = widget.querySelector('[data-lcw-name]');
      var cellInput = widget.querySelector('[data-lcw-cell]');
      var submitBtn = widget.querySelector('[data-lcw-submit]');
      var submitText = widget.querySelector('.lcw-submit-text');
      var statusEl = widget.querySelector('[data-lcw-status]');
      var metaEl = widget.querySelector('[data-lcw-meta]');
      if (!submitBtn || !submitText || !cellInput) return;

      var defaultMeta = metaEl ? metaEl.textContent : '';
      var idleText = submitText.textContent;
      var selectedRole = '';

      // Initialize selected role from .active chip (markup-driven default)
      chips.forEach(function(chip) {
        if (chip.classList.contains('active')) {
          selectedRole = chip.getAttribute('data-role') || chip.textContent.trim();
        }
        chip.addEventListener('click', function() {
          chips.forEach(function(c) {
            c.classList.remove('active');
            c.setAttribute('aria-checked', 'false');
          });
          chip.classList.add('active');
          chip.setAttribute('aria-checked', 'true');
          selectedRole = chip.getAttribute('data-role') || chip.textContent.trim();
        });
      });

      function setState(state) {
        widget.classList.remove('is-calling', 'is-connected', 'is-failed');
        if (state) widget.classList.add('is-' + state);
      }

      function setStatus(text) {
        if (statusEl) statusEl.textContent = text;
      }

      function resetIdle(delay) {
        setTimeout(function() {
          setState('');
          submitBtn.disabled = false;
          if (nameInput) { nameInput.disabled = false; nameInput.value = ''; }
          cellInput.disabled = false;
          cellInput.value = '';
          submitText.textContent = idleText;
          setStatus('Pick the job. Enter your cell. AVA calls your phone.');
          if (metaEl) {
            metaEl.classList.remove('lcw-error');
            metaEl.textContent = defaultMeta;
          }
        }, delay || 5000);
      }

      function fail(message) {
        setState('failed');
        submitBtn.disabled = false;
        if (nameInput) nameInput.disabled = false;
        cellInput.disabled = false;
        submitText.textContent = '↻ Try again';
        setStatus(message);
        if (metaEl) {
          metaEl.classList.add('lcw-error');
          metaEl.textContent = '// ' + message;
        }
      }

      submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var cell = normalizeCell(cellInput.value);
        if (!isValidCell(cell)) {
          fail('Enter a real mobile number (e.g. +1 305 555 1212).');
          cellInput.focus();
          return;
        }
        if (!selectedRole) {
          fail('Pick a role above first.');
          return;
        }

        var name = nameInput ? (nameInput.value || '').trim() : '';

        // Lock the form, transition to sending
        setState('calling');
        submitBtn.disabled = true;
        if (nameInput) nameInput.disabled = true;
        cellInput.disabled = true;
        submitText.textContent = 'Sending…';
        setStatus('Sending your number to AVA…');
        if (metaEl) metaEl.classList.remove('lcw-error');

        function succeed() {
          setState('connected');
          submitText.textContent = '✓ AVA is calling';
          setStatus('AVA is calling your phone…');
          if (metaEl) {
            metaEl.classList.remove('lcw-error');
            metaEl.textContent = '// Pick up when ' + (name ? name + '\'s' : 'your') + ' phone rings.';
          }
          resetIdle(7000);
        }

        // The destination reads `phone` (E.164) to dial the lead — it must
        // always be present. `first_name` is the first-name field;
        // `selected_role` is the chosen category chip.
        var payload = {
          first_name: name,
          phone: cell,
          source: 'aivoiceagency.ai live demo form',
          selected_role: selectedRole || ''
        };

        // Log the exact JSON payload before sending (URL + body, no secrets).
        if (window.console && console.log) {
          console.log('[AVA] POST ' + AVA_CALL_ENDPOINT + ' body=' + JSON.stringify(payload));
        }

        // Safety net: if the endpoint is still the template placeholder or
        // empty, confirm locally instead of firing a broken request.
        if (!AVA_CALL_ENDPOINT || AVA_CALL_ENDPOINT === 'TODO_SHANE' || AVA_CALL_ENDPOINT === '<<PASTE_ENDPOINT_URL>>') {
          if (window.console && console.info) {
            console.info('[AVA] AVA_CALL_ENDPOINT not set — lead not sent.', payload);
          }
          setTimeout(succeed, 900);
          return;
        }

        // Live path: POST a JSON body (not a query string) so the "+" in the
        // E.164 phone is never URL-encoded into a space.
        fetch(AVA_CALL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function(r) {
          if (r.ok) { setTimeout(succeed, 600); return; }
          // Non-2xx: log status + response body, then show inline retry.
          r.text().then(function(body) {
            if (window.console && console.error) console.error('[AVA] submit failed', r.status, body);
          }, function() {
            if (window.console && console.error) console.error('[AVA] submit failed', r.status, '(body unreadable)');
          });
          fail('Could not reach AVA (' + r.status + '). Tap to try again.');
          resetIdle(5000);
        }, function(err) {
          if (window.console && console.error) console.error('[AVA] network error', err);
          fail('Could not reach AVA. Try again in a moment.');
          resetIdle(5000);
        });
      });

      // Pressing Enter inside the cell input triggers submit
      cellInput.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          submitBtn.click();
        }
      });
      if (nameInput) {
        nameInput.addEventListener('keydown', function(ev) {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            cellInput.focus();
          }
        });
      }
    });
  })();
})();
