/* tools/video-kit/templates/kit.js
   The shared engine for every template in this folder.

   The contract every template keeps (bin/render.py drives it, one frame at a time):
     setBrand(brand, jobBase)   brand/<id>.json, plus the file URL of the job folder
     setData(data)              the job's data.json ({} for a card that needs none)
     render(t)                  draw the frame at t seconds

   render(t) is pure: the same t gives the same pixels. No timers, no Date, no Math.random.
   The page never moves on its own, so a frame can be re-rendered alone and still match.

   URL query: ?brand=ava|aic picks the brand. Any other key overrides the same value from
   data.json, for a card rendered without a job (cover.html?color=%23B026FF). */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var root = document.documentElement;

  var VK = window.VK = {
    brand: {},        // brand/<id>.json
    brandId: '',      // 'ava' | 'aic'
    base: '',         // file URL of the job folder, ends with '/'
    q: function (k) { var v = Q.get(k); return (v === null || v === '') ? undefined : v; },
    clamp: function (x) { return Math.min(1, Math.max(0, x)); },
    // ease-out cubic, clamped. The only easing in the kit.
    ease: function (x) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3); },
    esc: function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
    $: function (sel, from) { return (from || document).querySelector(sel); },
    // first value that is set and not empty
    pick: function () { for (var i = 0; i < arguments.length; i++) { var x = arguments[i]; if (x !== undefined && x !== null && x !== '') return x; } return ''; },
    // a fixed number in [0,1) for a whole-number index. Stands in for Math.random.
    rnd: function (i, seed) { var x = Math.sin(i * 12.9898 + (seed || 0) * 78.233) * 43758.5453; return x - Math.floor(x); },
    brandUrl: function (file) { return new URL('../brand/' + file, location.href).href; },
    jobUrl: function (path) { return /^(file:|https?:|data:)/.test(path) ? path : new URL(path, VK.base || location.href).href; }
  };

  function applyBrand() {
    VK.brandId = String(VK.q('brand') || VK.brand.id || VK.brandId || 'ava').toLowerCase();
    root.dataset.brand = VK.brandId;
    if (VK.brand.accent) root.style.setProperty('--accent', VK.brand.accent);
  }
  applyBrand();

  window.setBrand = function (brand, jobBase) {
    VK.brand = brand || {};
    if (jobBase) VK.base = jobBase;
    applyBrand();
  };
  // data.json may name the brand when the URL does not
  VK.useData = function (d) { if (d && d.brand && !VK.q('brand') && !VK.brand.id) { VK.brandId = String(d.brand).toLowerCase(); root.dataset.brand = VK.brandId; } };

  /* ---- COVER -------------------------------------------------------------------------------
     One bright color field, one line, one object. The phone shakes in bursts with the ring.
     cfg: color, headline, img (job-relative plate, optional), tag, size, still,
          shake {until, period, on, deg, px}
     HEADLINE is one string. Text up to the first colon is set small above the rest:
     "BUSINESS OWNERS: THIS COULD BE YOUR PHONE."                                              */
  var NBAR = 9;
  VK.cover = function (host) {
    host.classList.add('vk-cover');
    host.innerHTML = '<div class="obj"></div><div class="t"><div class="e"></div><div class="h"></div></div><div class="mk"></div><div class="d"></div>';
    var obj = VK.$('.obj', host), e = VK.$('.e', host), h = VK.$('.h', host), mk = VK.$('.mk', host), d = VK.$('.d', host);
    var cfg = {}, fitted = false, bars = null;

    // The video-01 headline is four lines at 188px and ends at y932. That is the approved cover and
    // it is left alone. Only a longer headline steps down in size, until it ends above y940.
    function fit() {
      var size = cfg.size || 188;
      h.style.fontSize = size + 'px';
      while (size > 96 && h.getBoundingClientRect().bottom - host.getBoundingClientRect().top > 940) { size -= 4; h.style.fontSize = size + 'px'; }
      fitted = true;
    }
    return {
      set: function (c) {
        cfg = c || {}; fitted = false;
        host.style.setProperty('--cover', cfg.color);
        var m = /^([^:]{1,40}:)\s+(\S.*)$/.exec(cfg.headline || '');
        e.textContent = m ? m[1] : '';
        e.style.display = m ? 'block' : 'none';
        h.textContent = m ? m[2] : (cfg.headline || '');
        if (cfg.img) {
          obj.innerHTML = '<img class="plate" alt="" src="' + VK.esc(VK.jobUrl(cfg.img)) + '">';
          bars = null;
        } else {
          var b = ''; for (var i = 0; i < NBAR; i++) b += '<i></i>';
          obj.innerHTML = '<div class="phone"><div class="scr"><div class="ear"></div><div class="lab">INCOMING CALL</div><div class="bars">' + b + '</div><div class="key"></div></div></div>';
          bars = obj.querySelectorAll('.bars i');
        }
        var lg = VK.brand.logo || {};
        if (!lg.coverMark) mk.innerHTML = '';
        else if (lg.coverMarkOnVoid) mk.innerHTML = '<div class="mbox"><img alt="" src="' + VK.brandUrl(lg.coverMark) + '"></div>';
        else mk.innerHTML = '<img class="m" alt="" src="' + VK.brandUrl(lg.coverMark) + '">';
        d.textContent = cfg.tag || '';
      },
      render: function (t) {
        if (!fitted) fit();
        var s = cfg.shake || {};
        var until = s.until === undefined ? 1.2 : s.until, period = s.period || 0.4, on = s.on === undefined ? 0.28 : s.on;
        var deg = s.deg === undefined ? 1.6 : s.deg, px = s.px === undefined ? 6 : s.px;
        var f = Math.floor(t * 30);
        var burst = !cfg.still && t >= 0 && t < until && (t % period) < on;
        var r = burst ? ((f % 2) ? deg : -deg) : 0, dx = burst ? ((f % 2) ? px : -px) : 0;
        obj.style.transform = 'translateX(' + dx + 'px) rotate(' + r + 'deg)';
        if (bars) for (var i = 0; i < NBAR; i++) bars[i].style.height = (burst ? 50 + Math.round(VK.rnd(f * NBAR + i, 3) * 170) : 26) + 'px';
      }
    };
  };

  /* ---- SELL END CARD -----------------------------------------------------------------------
     BOOKED. slams from 1.28 to 1 in 0.14 s under a two-frame green flash; the boom lands on it.
     Then the lines arrive at +0.35, +0.6, +0.75, +0.8, +0.85 s and the lockup at +0.95 s.
     render(k): k is seconds since the slam. k < 0 hides the card.                              */
  VK.endSell = function (host, flash) {
    host.classList.add('vk-end', 'vk-sell');
    host.innerHTML = '<div class="bk"></div><div class="l1"></div><div class="rule"></div><div class="l3"></div><div class="l5"></div><div class="l4"></div><img class="lk" alt="">';
    if (flash) flash.classList.add('vk-flash');
    var el = {}; ['bk', 'l1', 'rule', 'l3', 'l5', 'l4', 'lk'].forEach(function (k) { el[k] = VK.$('.' + k, host); });
    return {
      set: function (c) {
        c = c || {};
        el.bk.textContent = c.slam; el.l1.textContent = c.line1; el.l3.textContent = c.line2;
        el.l5.textContent = c.line3; el.l4.textContent = c.tag;
        if (c.lockup) el.lk.src = VK.brandUrl(c.lockup); else el.lk.style.visibility = 'hidden';
      },
      render: function (k) {
        if (k < 0) { host.style.display = 'none'; if (flash) flash.style.display = 'none'; return; }
        host.style.display = 'block';
        el.bk.style.transform = 'scale(' + (1.28 - 0.28 * VK.ease(k / 0.14)).toFixed(4) + ')';
        el.l1.style.opacity = VK.clamp((k - 0.35) / 0.2);
        el.rule.style.opacity = VK.clamp((k - 0.6) / 0.2);
        el.l3.style.opacity = VK.clamp((k - 0.75) / 0.2);
        el.l5.style.opacity = VK.clamp((k - 0.8) / 0.2);
        el.l4.style.opacity = VK.clamp((k - 0.85) / 0.2);
        el.lk.style.opacity = VK.clamp((k - 0.95) / 0.25);
        if (flash) { flash.style.display = k < 2 / 30 ? 'block' : 'none'; flash.style.opacity = k < 1 / 30 ? 0.9 : 0.35; }
      }
    };
  };

  /* ---- REACH END CARD ----------------------------------------------------------------------
     The quiet one: the lockup and one line. No price, no number, no feature list.
     The DEMO SCENARIO tag shows only when the film carries produced call audio.               */
  VK.endReach = function (host) {
    host.classList.add('vk-end', 'vk-reach');
    host.innerHTML = '<img class="lk" alt=""><div class="ln"></div><div class="dm"></div>';
    var lk = VK.$('.lk', host), ln = VK.$('.ln', host), dm = VK.$('.dm', host);
    return {
      set: function (c) {
        c = c || {};
        if (c.lockup) lk.src = VK.brandUrl(c.lockup); else lk.style.visibility = 'hidden';
        ln.textContent = c.line || '';
        dm.textContent = c.tag || ''; dm.style.display = c.tag ? 'block' : 'none';
      },
      render: function (k) {
        if (k < 0) { host.style.display = 'none'; return; }
        host.style.display = 'block';
        var a = VK.ease(k / 0.25), b = VK.ease((k - 0.2) / 0.25);
        lk.style.opacity = a; lk.style.transform = 'translateY(' + ((1 - a) * 18).toFixed(2) + 'px)';
        ln.style.opacity = b; ln.style.transform = 'translateY(' + ((1 - b) * 18).toFixed(2) + 'px)';
        dm.style.opacity = VK.clamp((k - 0.45) / 0.2);
      }
    };
  };
})();
