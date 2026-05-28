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

  // LIVE CALL WIDGET — hero centerpiece. Mock state machine in v1
  // (idle → calling → connected → idle reset). Real Retell wiring lands
  // in a followup push via a /api/call endpoint; widget reads the
  // endpoint URL from data-call-endpoint and POSTs { role, name, cell }.
  // When data-call-endpoint is absent the widget runs in mock mode.
  (function liveCallWidget() {
    var widgets = document.querySelectorAll('[data-live-call-widget]');
    if (!widgets.length) return;

    function normalizeCell(raw) {
      var digits = (raw || '').replace(/[^\d+]/g, '');
      if (!digits) return '';
      if (digits.charAt(0) === '+') return digits;
      if (digits.length === 10) return '+1' + digits;
      if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
      return digits;
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

      var endpoint = widget.getAttribute('data-call-endpoint') || '';
      var retellEndpoint = widget.getAttribute('data-retell-endpoint') || '';
      var retellAgent = widget.getAttribute('data-retell-agent') || '';
      var defaultMeta = metaEl ? metaEl.textContent : '';
      var idleText = submitText.textContent;
      var selectedRole = '';
      var retellClient = null;
      var inLiveCall = false;

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
          if (nameInput) nameInput.disabled = false;
          cellInput.disabled = false;
          submitText.textContent = idleText;
          setStatus('Pick the job. Drop your cell. AVA calls you.');
          if (metaEl) {
            metaEl.classList.remove('lcw-error');
            metaEl.textContent = defaultMeta;
          }
        }, delay || 4500);
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

      function endLiveCall() {
        if (retellClient) {
          try { retellClient.stopCall(); } catch (e) {}
          retellClient = null;
        }
        inLiveCall = false;
      }

      // Retell web call (browser WebRTC). Talk to AVA in-page — no phone,
      // no SIP, no Twilio. Needs a server-minted access token from the
      // worker at data-retell-endpoint; the public key never starts a call.
      function handleLiveCall() {
        // Toggle: a live call is in progress → hang up.
        if (inLiveCall) {
          endLiveCall();
          setState('');
          submitBtn.disabled = false;
          submitText.textContent = idleText;
          setStatus('Call ended. Talk to AVA again anytime.');
          if (metaEl) { metaEl.style.display = ''; metaEl.classList.remove('lcw-error'); metaEl.textContent = defaultMeta; }
          return;
        }

        var Client = window.RetellWebClient;
        if (!Client) {
          fail('Voice engine still loading — give it a second and try again.');
          return;
        }

        setState('calling');
        submitBtn.disabled = true;
        if (nameInput) nameInput.disabled = true;
        cellInput.disabled = true;
        submitText.textContent = 'Connecting…';
        setStatus('Requesting microphone…');
        // Hide the demo-mode meta line the moment a real call begins.
        if (metaEl) { metaEl.classList.remove('lcw-error'); metaEl.style.display = 'none'; }

        navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
          // Release this permission-probe stream; the SDK opens its own.
          stream.getTracks().forEach(function(t) { t.stop(); });
          return fetch(retellEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: retellAgent })
          });
        }).then(function(r) {
          if (!r.ok) throw new Error('Token request failed (' + r.status + ').');
          return r.json();
        }).then(function(data) {
          if (!data || !data.access_token) throw new Error('No access token returned.');
          retellClient = new Client();
          retellClient.on('call_started', function() {
            inLiveCall = true;
            setState('connected');
            submitBtn.disabled = false;
            submitText.textContent = 'End call';
            setStatus('Connected — start talking to AVA.');
          });
          retellClient.on('call_ended', function() {
            endLiveCall();
            setState('');
            submitBtn.disabled = false;
            submitText.textContent = idleText;
            setStatus('Call ended. Talk to AVA again anytime.');
            if (metaEl) { metaEl.style.display = ''; metaEl.textContent = defaultMeta; }
          });
          retellClient.on('error', function(err) {
            endLiveCall();
            fail('Call error: ' + ((err && err.message) || 'something went wrong') + '.');
          });
          return retellClient.startCall({ accessToken: data.access_token });
        }).catch(function(err) {
          endLiveCall();
          var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
          fail(denied
            ? 'Microphone blocked — allow mic access to talk to AVA.'
            : ((err && err.message) || 'Could not start the call. Try again.'));
        });
      }

      submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (retellEndpoint && retellAgent) { handleLiveCall(); return; }
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

        // Lock the form, transition to calling
        setState('calling');
        submitBtn.disabled = true;
        if (nameInput) nameInput.disabled = true;
        cellInput.disabled = true;
        submitText.textContent = 'Calling your phone…';
        setStatus('Connecting to AVA — pick up when it rings.');
        if (metaEl) {
          metaEl.classList.remove('lcw-error');
          metaEl.textContent = '// Demo mode — real call wiring lands next push.';
        }

        // Real-backend path (next push): POST to data-call-endpoint
        if (endpoint) {
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: selectedRole, name: name, cell: cell })
          }).then(function(r) {
            if (!r.ok) throw new Error('Call failed (' + r.status + ').');
            return r.json().catch(function() { return {}; });
          }).then(function() {
            setTimeout(function() {
              setState('connected');
              submitText.textContent = 'AVA is calling…';
              setStatus('Your phone should be ringing now.');
              resetIdle(6000);
            }, 1400);
          }).catch(function(err) {
            fail((err && err.message) || 'Call failed. Try again in a moment.');
            resetIdle(5000);
          });
          return;
        }

        // Mock path (v1): fake the two-step state transition
        setTimeout(function() {
          setState('connected');
          submitText.textContent = 'AVA is calling…';
          setStatus('Demo mode: your phone won’t actually ring yet — real call wiring next push.');
          resetIdle(5000);
        }, 1800);
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
