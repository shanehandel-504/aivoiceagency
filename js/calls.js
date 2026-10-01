/* ============================================================
   AVA SAMPLE CALLS — js/calls.js (Oct 1 2026, rev b)
   Four recorded sample calls. The recording is the clock: every
   transcript line, ticket row and waveform bar is a pure function
   of audio.currentTime, so scrubbing back un-fills the ticket.
   The HTML ships the finished limousine call (JS off = whole story).
   Never autoplays. Audio loads on the first tap, not on page load.

   rev b (Shane, phone test):
   - the page follows the call: on play it brings the transcript up,
     then eases down as the ticket fills, so nobody has to scroll.
     Any scroll by the visitor hands control straight back.
   - the waveform no longer steals a scroll: vertical swipes pass
     through, a tap seeks, a sideways drag scrubs.
   - the canvas sits out of layout, so it can never widen the page.
   - transcript box scrolls itself again (offset math was wrong).
   - ?trade=plumbing|dental|black-car… and #stage land on the right call.
   - a finished call offers the next one.
   Vanilla JS, no deps.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-calls]');
  if (!root) return;
  var CALLS = [{"id":"limousine","tab":"Limousine","biz":"Lakeshore Black Car","shows":"This call shows the whole trip taken, the trip sheet going to dispatch, and the caller told that dispatch will confirm.","dur":62.314,"ping":55.441,"details":9,"lines":[["a","Lakeshore Black Car, this is AVA."],["c","Hi, I need a car to O'Hare tomorrow morning. Early. My ride just canceled on me, and my flight's at seven."],["a","Seven AM out of O'Hare. Which airline?"],["c","United."],["a","A 4:30 pickup gets you there with time. How many passengers and bags?"],["c","Two of us. Three bags... no, four. My wife doesn't pack light."],["a","Then I'll put you in an SUV. What's the pickup address?"],["c","1840 Ridge Road, Wilmette."],["a","And your name and best cell?"],["c","Paul Hendricks. 847-555-0136."],["a","The SUV to O'Hare is $145, all in. Want me to send it to dispatch?"],["c","Yes. Send it."],["a","Paul Hendricks, 1840 Ridge Road, 4:30 AM tomorrow, SUV to O'Hare, United, $145. Your information has been received, and dispatch will get with you to confirm. A text is on its way."],["c","Got it. That was easier than the first guy."],["a","Dispatch will be in touch. Safe travels, Paul."]],"t":[[3.9,5.986],[6.206,11.198],[11.498,14.22],[14.44,14.949],[15.249,19.208],[19.428,23.329],[23.629,26.836],[27.056,29.046],[29.346,30.959],[31.179,35.484],[35.784,41.166],[40.986,41.946],[42.246,55.041],[56.211,58.6],[58.9,61.614]],"fields":[["Drop-off","O'Hare, 7:00 AM flight",1],["Airline","United",3],["Pickup time","Tomorrow 4:30 AM",4],["Passengers","2, with 4 bags",5],["Vehicle","SUV",6],["Pickup","1840 Ridge Road, Wilmette",7],["Passenger","Paul Hendricks, 847-555-0136",9],["Rate quoted","$145 all in",10],["Trip sheet","Sent to dispatch",12],["CRM","Reservation written",12],["Text","Received, dispatch will confirm","ping"]],"booked":{"label":"Sent to dispatch","big":"Tomorrow 4:30 AM","small":"SUV to O'Hare, $145 all in"},"peaks":[0.211,0.211,0.211,0.211,0.0,0.0,0.211,0.211,0.211,0.211,0.211,0.26,0.725,0.53,0.584,0.524,0.456,0.716,0.622,0.008,0.546,0.873,0.542,0.564,0.481,0.475,0.061,0.726,0.032,0.48,0.464,0.423,0.421,0.452,0.378,0.436,0.054,0.64,0.529,0.593,0.459,0.431,0.027,0.598,0.349,0.167,0.502,0.432,0.006,0.828,0.49,0.64,0.587,0.519,0.37,0.178,0.47,0.527,0.412,0.398,0.371,0.114,0.415,0.342,0.472,0.626,0.062,0.49,0.232,0.421,0.039,0.605,0.535,0.72,0.39,0.358,0.637,0.697,0.875,0.643,0.438,0.069,0.683,0.621,0.412,0.165,0.611,0.517,0.43,0.467,0.498,0.279,0.418,0.027,0.572,0.408,0.474,0.478,0.438,0.066,0.499,0.474,0.039,0.482,0.428,0.366,0.594,0.569,0.487,0.352,0.48,0.416,0.322,0.292,0.387,0.882,0.401,0.599,0.453,0.517,0.538,0.403,0.435,0.404,0.207,0.855,0.315,0.534,0.752,0.552,0.505,0.539,0.225,0.466,0.219,0.327,0.555,0.464,0.221,0.77,0.398,0.462,0.467,0.392,0.026,0.549,0.617,0.462,0.361,0.327,1.0,0.376,0.393,0.501,0.247,0.606,0.511,0.49,0.44,0.395,0.085,0.538,0.419,0.403,0.52,0.347,0.701,0.393,0.431,0.505,0.311,0.322,0.133,0.568,0.48,0.352,0.274,0.288,0.286,0.026,0.549,0.458,0.038,0.584,0.401,0.418,0.523,0.354,0.002,0.826,0.628,0.504,0.457,0.113,0.486,0.397,0.22,0.181,0.001,0.001]},{"id":"plumbing","tab":"Plumbing","biz":"Miller Plumbing","shows":"This call shows the visit landing on the calendar and the text reaching the customer before the call ends.","dur":64.997,"ping":59.885,"details":11,"lines":[["a","Miller Plumbing, this is AVA."],["c","Hi, yeah, sorry, I know it's late... our water heater's leaking. There's water all over the basement floor."],["a","Water on the basement floor. Is the water to the heater shut off?"],["c","I... I don't know. There's a valve on top?"],["a","That's the one. Turn it all the way off."],["c","Okay... okay, it's slowing down. Of course this happens the week my in-laws are here."],["a","It always does. What's your name?"],["c","Dan Whitfield."],["a","And the address, Dan?"],["c","412 Birch Lane. Basement door's around back."],["a","I'll note that for the plumber. Best number to reach you?"],["c","This one. 414-555-0148."],["a","The visit fee is $89, and I have a plumber at 7 AM tomorrow. Does that work?"],["c","Yes. Please."],["a","Dan Whitfield, 412 Birch Lane, 7 AM tomorrow, $89 visit fee. You're on the schedule, and your confirmation text is on its way."],["c","Just got it."],["a","Put some towels down, and get some sleep."]],"t":[[3.9,5.737],[5.957,12.702],[13.002,16.57],[16.79,19.888],[20.188,22.474],[22.694,28.062],[28.362,30.72],[30.94,31.817],[32.117,33.341],[33.561,36.23],[36.53,39.025],[38.845,43.187],[43.487,48.805],[49.025,50.158],[50.458,59.485],[60.655,61.914],[62.214,64.297]],"fields":[["Problem","Water heater leaking, basement",1],["Shutoff","Valve closed on the call",5],["Customer","Dan Whitfield",7],["Address","412 Birch Lane",9],["Note","Basement door around back",9],["Callback","414-555-0148",11],["Fee quoted","$89 visit fee",12],["Calendar","Tomorrow 7:00 AM",14],["Text","Confirmation sent","ping"]],"booked":{"label":"Booked","big":"Tomorrow 7:00 AM","small":"Water heater leak, $89 visit fee"},"peaks":[0.2,0.2,0.2,0.2,0.0,0.0,0.2,0.2,0.2,0.2,0.0,0.246,0.557,0.442,0.271,0.473,0.685,0.244,0.362,0.432,0.366,0.619,0.528,0.604,0.714,0.811,0.712,0.256,0.471,0.479,0.232,0.255,0.178,0.611,0.654,0.54,0.625,0.429,0.297,0.002,0.448,0.453,0.537,0.224,0.264,0.034,0.698,0.497,0.308,0.445,0.289,0.554,0.455,0.002,0.264,0.571,0.37,0.452,0.531,0.712,0.504,0.092,0.861,0.696,0.299,0.415,0.84,0.539,0.492,0.618,0.702,0.042,0.79,0.198,0.645,0.7,0.154,0.18,0.028,0.338,0.659,0.537,0.369,0.357,0.201,0.312,0.047,0.464,0.531,0.341,0.281,0.048,0.379,0.39,0.194,0.809,0.608,0.356,0.795,0.543,0.734,0.366,0.134,0.522,0.638,0.629,0.508,0.816,0.583,0.623,0.54,0.129,1.0,0.653,0.446,0.299,0.007,0.659,0.45,0.719,0.666,0.047,0.563,0.549,0.524,0.799,0.97,0.845,0.619,0.437,0.605,0.438,0.504,0.141,0.538,0.362,0.668,0.461,0.422,0.379,0.442,0.777,0.413,0.533,0.498,0.473,0.34,0.202,0.641,0.564,0.197,0.835,0.139,0.493,0.065,0.637,0.504,0.373,0.029,0.454,0.398,0.39,0.298,0.22,0.554,0.444,0.353,0.295,0.495,0.522,0.376,0.316,0.112,0.649,0.656,0.526,0.777,0.421,0.351,0.291,0.331,0.311,0.34,0.004,0.272,0.073,0.534,0.059,0.82,0.844,0.159,0.281,0.308,0.353,0.312,0.256,0.251,0.138,0.001,0.001]},{"id":"heating","tab":"Heating and cooling","biz":"Northside Heating and Cooling","shows":"This call shows a priority note going to the technician and the customer record being saved.","dur":66.026,"ping":61.209,"details":9,"lines":[["a","Northside Heating and Cooling, this is AVA."],["c","Yeah, hi. Our AC just quit. It's blowing, but it's warm air, and it's already 85 in the house."],["a","85 inside. Is anyone home who shouldn't be in that heat... little kids, anyone older?"],["c","My mother-in-law. She's 81. She won't say it's bothering her, but..."],["a","Then we get someone out today. What's your name?"],["c","Marcus Reyes."],["a","And the address, Marcus?"],["c","2206 Sycamore Drive."],["a","Best number to reach you?"],["c","414-555-0172."],["a","The visit fee is $99. I have a technician at 4 o'clock this afternoon."],["c","Four today? Yes. Take it. Honestly, I figured you'd say next week."],["a","Not with her in the house. Marcus Reyes, 2206 Sycamore Drive, 4 o'clock today, $99 visit fee. It's on the calendar, and the technician knows she's there. Your confirmation text is on its way."],["c","There it is."],["a","Get her a cold drink and sit tight."]],"t":[[3.9,6.315],[6.535,14.152],[14.452,20.734],[20.954,25.567],[25.867,28.16],[28.38,29.137],[29.437,30.744],[30.964,32.807],[33.107,34.235],[34.455,38.256],[38.556,43.41],[43.23,47.453],[47.753,60.809],[61.979,63.11],[63.41,65.326]],"fields":[["Problem","AC blowing warm air, 85 inside",1],["Priority","81-year-old in the home",3],["Customer","Marcus Reyes",5],["Address","2206 Sycamore Drive",7],["Callback","414-555-0172",9],["Fee quoted","$99 visit fee",10],["Calendar","Today 4:00 PM",12],["Technician","Priority note sent",12],["Record","Customer saved",12],["Text","Confirmation sent","ping"]],"booked":{"label":"Booked","big":"Today 4:00 PM","small":"AC repair visit, $99 visit fee"},"peaks":[0.199,0.199,0.199,0.199,0.0,0.0,0.199,0.199,0.199,0.199,0.245,0.326,0.548,0.603,0.423,0.422,0.407,0.555,0.51,0.073,0.574,0.504,0.61,0.058,0.658,0.659,0.432,0.264,0.493,0.14,0.567,0.532,0.623,0.478,0.505,0.473,0.432,0.411,0.383,0.529,0.644,0.682,0.443,0.288,0.291,0.39,0.41,0.322,0.052,0.728,0.35,0.403,0.417,0.413,0.486,0.305,0.037,0.46,0.47,0.183,0.458,0.455,0.39,0.322,0.467,0.173,0.144,0.221,0.281,0.276,0.033,0.387,0.39,0.285,0.406,0.17,0.129,0.057,0.605,0.595,0.489,0.404,0.227,0.53,0.437,0.026,0.672,0.571,0.057,0.564,0.586,0.469,0.199,0.506,0.56,0.437,0.358,0.552,0.354,0.203,0.672,0.527,0.438,0.227,0.458,0.499,0.394,0.022,0.611,0.593,0.399,0.055,0.398,0.347,0.384,0.184,0.153,0.531,0.493,0.619,0.407,0.356,0.226,0.075,1.0,0.35,0.597,0.499,0.468,0.294,0.218,0.482,0.377,0.583,0.169,0.898,0.112,0.557,0.324,0.494,0.407,0.451,0.306,0.16,0.347,0.435,0.473,0.505,0.288,0.103,0.618,0.518,0.462,0.287,0.53,0.443,0.436,0.449,0.434,0.388,0.39,0.497,0.476,0.426,0.403,0.438,0.365,0.343,0.227,0.067,0.783,0.423,0.783,0.353,0.306,0.411,0.291,0.268,0.42,0.48,0.416,0.365,0.328,0.363,0.009,0.271,0.119,0.205,0.294,0.484,0.212,0.027,0.519,0.469,0.376,0.295,0.312,0.231,0.001,0.001]},{"id":"dental","tab":"Dental","biz":"Lakeview Dental","shows":"This call shows a new patient landing on the doctor's schedule, with the new patient form sent before the visit.","dur":67.135,"ping":60.638,"details":7,"lines":[["a","Lakeview Dental, this is AVA."],["c","Hi. I'm not a patient there, but I've got a tooth that's killing me. Back left, on the bottom. It woke me up at three this morning."],["a","Up at three with it, that's miserable. Any swelling in your face or jaw?"],["c","No, no swelling. It just throbs. And I haven't seen a dentist in a while. Like, years. Don't judge."],["a","Nobody here will. What's your name?"],["c","Kyle Brandt."],["a","And the best number for you, Kyle?"],["c","414-555-0193."],["a","The new patient exam with X-rays is $79. I have an opening at 2:30 this afternoon."],["c","Today? Yes. Oh, thank God."],["a","Kyle Brandt, Lakeview Dental at 900 Shoreline Road, 2:30 today, $79 exam fee. You're on the doctor's schedule. Your confirmation text is on its way, with the new patient form."],["c","Got it. Okay. Good."],["a","Bring your insurance card if you have one. We've got you."]],"t":[[3.9,5.877],[6.097,15.591],[15.891,20.875],[21.095,29.796],[30.096,32.42],[32.64,33.42],[33.72,35.479],[35.699,39.684],[39.984,45.678],[45.498,48.105],[48.405,60.238],[61.408,63.31],[63.61,66.435]],"fields":[["Reason","Toothache, lower left, woke at 3 AM",1],["Swelling","None",3],["Patient","Kyle Brandt, new patient",5],["Callback","414-555-0193",7],["Fee quoted","$79 exam with X-rays",8],["Schedule","Today 2:30 PM",10],["Form","New patient form sent","ping"],["Text","Confirmation sent","ping"]],"booked":{"label":"Booked","big":"Today 2:30 PM","small":"New patient exam, $79"},"peaks":[0.223,0.223,0.223,0.223,0.0,0.033,0.223,0.223,0.223,0.223,0.274,0.797,0.653,0.623,0.326,0.635,0.62,0.256,0.565,0.618,0.268,0.338,0.625,0.78,0.527,0.604,0.6,0.627,0.537,0.574,0.47,0.304,0.737,0.63,0.347,1.0,0.691,0.466,0.722,0.587,0.428,0.572,0.844,0.433,0.618,0.528,0.106,0.37,0.508,0.461,0.429,0.459,0.21,0.272,0.35,0.248,0.968,0.638,0.528,0.562,0.417,0.379,0.42,0.683,0.658,0.597,0.462,0.345,0.214,0.429,0.322,0.005,0.353,0.427,0.105,0.446,0.418,0.541,0.648,0.417,0.454,0.13,0.395,0.043,0.375,0.195,0.547,0.442,0.207,0.399,0.67,0.383,0.377,0.186,0.607,0.406,0.195,0.799,0.648,0.154,0.66,0.728,0.715,0.549,0.382,0.267,0.533,0.595,0.531,0.041,0.744,0.858,0.6,0.044,0.508,0.552,0.593,0.444,0.051,0.554,0.494,0.516,0.913,0.492,0.535,0.591,0.365,0.358,0.251,0.935,0.563,0.653,0.299,0.551,0.285,0.959,0.783,0.546,0.651,0.049,0.451,0.094,0.788,0.059,0.72,0.659,0.192,0.757,0.626,0.475,0.706,0.465,0.399,0.393,0.346,0.203,0.407,0.528,0.511,0.053,0.719,0.459,0.339,0.339,0.176,0.678,0.654,0.491,0.463,0.05,0.607,0.426,0.389,0.451,0.455,0.319,0.528,0.339,0.202,0.092,0.303,0.302,0.019,0.822,0.107,0.931,0.338,0.72,0.332,0.592,0.447,0.544,0.379,0.407,0.362,0.501,0.79,0.305,0.001,0.001]}];
  var PICKUP = 3.6;
  var q = function (s) { return root.querySelector(s); };
  var el = {
    tabs: q('[data-tabs]'), shows: q('[data-shows]'), play: q('[data-play]'), label: q('[data-playlabel]'),
    biz: q('[data-biz]'), clock: q('[data-clock]'), wave: q('[data-wave]'), cv: q('[data-wave] canvas'),
    chapters: q('[data-chapters]'), script: q('[data-script]'), fields: q('[data-fields]'), status: q('[data-status]'),
    booked: q('[data-booked]'), blab: q('[data-blab]'), bbig: q('[data-bbig]'), bsmall: q('[data-bsmall]'), err: q('[data-err]'),
    call: q('[data-callpane]'), ticket: q('[data-ticketpane]'), next: q('[data-next]'), nextName: q('[data-nextname]')
  };
  var g2 = el.cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var player = new Audio(); player.preload = 'none';
  var m4a = !!player.canPlayType && player.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '';
  var V = window.__ASSET_V ? '?v=' + window.__ASSET_V : '';
  var cur = 0, tl = null, t = 0, playing = false, raf = 0, col = {}, finished = false;
  var follow = false, lastNow = 0;

  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function colors() {
    var cs = getComputedStyle(root);
    var g = function (n, d) { return (cs.getPropertyValue(n) || '').trim() || d; };
    col = { a: g('--cyan', '#00D4FF'), c: g('--text', '#EEF0F4'), n: g('--neutral', '#8A93A6'), idle: g('--line', 'rgba(255,255,255,.14)') };
  }
  function build(c) {
    var L = c.lines.map(function (l, i) { return { who: l[0], text: l[1], s: c.t[i][0], e: c.t[i][1] }; });
    var stagger = {};
    var F = c.fields.map(function (f) {
      var key = String(f[2]), n = stagger[key] = (stagger[key] || 0) + 1;
      var base = f[2] === 'ping' ? c.ping + 0.1 : L[f[2]].e + 0.15;
      return { k: f[0], v: f[1], t: base + (n - 1) * 0.4 };
    });
    return { L: L, F: F, total: c.dur, bookedT: L[L.length - 1].e + 0.1, detailsT: L[c.details].e, peaks: c.peaks };
  }
  function activeAt(x) {
    if (x < 1.2 || (x >= 2 && x < 3.2)) return 'ring';
    for (var i = 0; i < tl.L.length; i++) if (x >= tl.L[i].s && x < tl.L[i].e) return tl.L[i].who;
    return null;
  }

  /* ---------- waveform (the canvas is absolutely positioned: its pixel size never feeds layout) ---------- */
  function draw(now) {
    var w = el.wave.clientWidth, h = el.wave.clientHeight, dpr = Math.min(3, window.devicePixelRatio || 1);
    if (!w || !h || w > 4000) return;
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (el.cv.width !== pw || el.cv.height !== ph) { el.cv.width = pw; el.cv.height = ph; }
    g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.clearRect(0, 0, w, h);
    var bars = Math.max(40, Math.floor(w / 5)), step = w / bars;
    for (var i = 0; i < bars; i++) {
      var x = (i + 0.5) / bars * tl.total, act = activeAt(x);
      var amp = Math.max(0.05, tl.peaks[Math.min(199, Math.floor(x / tl.total * 200))]);
      if (playing && !reduce && act && Math.abs(x - t) < 1.1) amp *= 0.7 + 0.3 * Math.sin(now / 85 + i * 1.7);
      var bh = Math.max(2, amp * (h - 8));
      g2.fillStyle = x <= t ? (act === 'a' ? col.a : act === 'c' ? col.c : col.n) : col.idle;
      g2.fillRect(i * step + 1, (h - bh) / 2, Math.max(2, step - 2), bh);
    }
    if (t < tl.total) { g2.fillStyle = col.a; g2.fillRect(Math.min(w - 1, t / tl.total * w), 0, 1, h); }
  }

  /* ---------- guided scroll: the page follows the call until the visitor scrolls ---------- */
  function navBottom() { var n = document.querySelector('.bnav'); return n ? Math.max(0, n.getBoundingClientRect().bottom) : 0; }
  function barTop() { var b = document.querySelector('.bs-callbar'); var r = b && b.getBoundingClientRect(); return r && r.height && r.top > 0 ? r.top : innerHeight; }
  function followTarget() {
    var top = navBottom() + 8, bottom = barTop() - 12, y = window.pageYOffset;
    var want = y + el.call.getBoundingClientRect().top - top;          /* transcript pane up under the nav */
    var lastRow = null, rows = el.fields.children;
    for (var i = 0; i < rows.length; i++) if (rows[i].classList.contains('on')) lastRow = rows[i];
    var focus = t >= tl.bookedT ? (el.next && !el.next.hidden ? el.next : el.booked) : lastRow;
    if (focus) {
      var r = focus.getBoundingClientRect();
      if (r.bottom > bottom) want = Math.max(want, y + r.bottom - bottom);   /* ease down only as far as the newest line */
    }
    var max = document.documentElement.scrollHeight - innerHeight;
    return Math.max(0, Math.min(max, want));
  }
  function stepFollow(now) {
    if (!follow) return;
    var y = window.pageYOffset, target = followTarget(), d = target - y;
    if (Math.abs(d) < 1) return;
    var dt = Math.min(0.05, Math.max(0.001, (now - (lastNow || now)) / 1000 || 0.016));
    var k = reduce ? 1 : 1 - Math.pow(0.04, dt);                    /* frame-rate independent ease, ~0.8 s to settle */
    window.scrollTo(0, y + d * k);
  }
  function stopFollow() { follow = false; }
  ['wheel', 'touchmove'].forEach(function (n) { window.addEventListener(n, stopFollow, { passive: true }); });
  window.addEventListener('keydown', function (e) {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(e.key) >= 0 && !el.wave.contains(e.target) && !el.play.contains(e.target)) stopFollow();
  });

  /* ---------- render ---------- */
  function render(now) {
    var c = CALLS[cur], lis = el.script.children, nowEl = null, i;
    for (i = 0; i < tl.L.length; i++) {
      var l = tl.L[i], st = t >= l.e ? 'past' : t >= l.s ? 'now' : '';
      lis[i].className = l.who + (st ? ' ' + st : '');
      if (st === 'now') nowEl = lis[i];
    }
    if (nowEl && playing) {
      var box = el.script, br = box.getBoundingClientRect(), lr = nowEl.getBoundingClientRect();
      var want = box.scrollTop + (lr.top - br.top) - Math.max(0, (box.clientHeight - lr.height) / 2);
      box.scrollTop = reduce ? want : box.scrollTop + (want - box.scrollTop) * 0.18;
    }
    var rows = el.fields.children, on = 0;
    for (i = 0; i < tl.F.length; i++) { var hit = t >= tl.F[i].t; rows[i].classList.toggle('on', hit); if (hit) on++; }
    var done = t >= tl.bookedT;
    el.booked.classList.toggle('on', done);
    el.blab.textContent = done ? c.booked.label : t < PICKUP ? 'Ringing' : 'AVA is on the call';
    el.status.textContent = done ? 'complete' : on + ' of ' + tl.F.length + ' lines';
    el.clock.textContent = fmt(Math.min(t, tl.total)) + ' / ' + fmt(tl.total);
    var ch = el.chapters.children, marks = [PICKUP, tl.detailsT, tl.bookedT];
    for (i = 0; i < ch.length; i++) ch[i].classList.toggle('on', t >= marks[i]);
    el.wave.setAttribute('aria-valuenow', Math.round(t));
    el.wave.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(tl.total));
    el.play.classList.toggle('on', playing);
    el.play.setAttribute('aria-pressed', String(playing));
    el.label.textContent = playing ? 'Pause' : (t > 0 && t < tl.total) ? 'Resume the call' : finished ? 'Play it again' : 'Play the sample call';
    if (el.next) el.next.hidden = !(finished && !playing);
    draw(now || 0);
  }
  function frame(now) {
    if (!playing && !follow) return;
    if (playing && player.readyState > 0 && !player.seeking) t = Math.min(player.currentTime, tl.total);
    render(now);
    stepFollow(now); lastNow = now;
    if (!playing && follow && Math.abs(followTarget() - window.pageYOffset) < 1) follow = false;   /* finish the last glide to the result card */
    raf = requestAnimationFrame(frame);
  }

  /* ---------- audio ---------- */
  function ensure() {
    var c = CALLS[cur];
    if (player.getAttribute('data-id') === c.id) return;
    player.setAttribute('data-id', c.id);
    player.src = '/audio/samples/v2/' + c.id + (m4a ? '.m4a' : '.mp3') + V;
    player.load();
  }
  function setTime(x) {
    var go = function () { try { player.currentTime = Math.min(x, tl.total - 0.05); } catch (e) {} };
    if (player.readyState > 0) go();
    else player.addEventListener('loadedmetadata', function h() { player.removeEventListener('loadedmetadata', h); go(); });
  }
  function play() {
    if (el.err) el.err.hidden = true;
    var fresh = player.getAttribute('data-id') !== CALLS[cur].id;
    ensure();
    if (t >= tl.total - 0.06) { t = 0; el.script.scrollTop = 0; finished = false; }
    if (fresh || Math.abs(player.currentTime - t) > 0.25) setTime(t);
    var p = player.play();
    if (p && p.catch) p.catch(function () {});
    playing = true; follow = true; lastNow = 0;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function pause() { playing = false; follow = false; player.pause(); cancelAnimationFrame(raf); render(performance.now()); }
  function seek(x) {
    t = Math.max(0, Math.min(tl.total, x));
    if (t < tl.total) finished = false;
    if (player.getAttribute('data-id') === CALLS[cur].id) setTime(t);
    render(performance.now());
  }
  function load(i, autoplay, keepHash) {
    cancelAnimationFrame(raf); playing = false; player.pause(); cur = i; finished = false;
    var c = CALLS[i]; tl = build(c);
    [].forEach.call(el.tabs.children, function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); b.tabIndex = j === i ? 0 : -1; });
    el.shows.textContent = c.shows; el.biz.textContent = c.biz;
    el.script.textContent = ''; el.fields.textContent = ''; el.chapters.textContent = '';
    tl.L.forEach(function (l) {
      var li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span');
      a.className = 'cx-who'; a.textContent = l.who === 'a' ? 'AVA' : 'Caller'; b.className = 'cx-say'; b.textContent = l.text;
      li.appendChild(a); li.appendChild(b); el.script.appendChild(li);
    });
    tl.F.forEach(function (f) {
      var r = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      r.className = 'cx-row'; dt.textContent = f.k; dd.textContent = f.v; r.appendChild(dt); r.appendChild(dd); el.fields.appendChild(r);
    });
    el.bbig.textContent = c.booked.big; el.bsmall.textContent = c.booked.small;
    [[PICKUP, 'Answered'], [tl.detailsT, 'Details taken'], [tl.bookedT, c.booked.label]].forEach(function (m, k) {
      var d = document.createElement('div'); d.className = 'cx-chap' + (k > 0 ? ' r' : ''); d.style.left = (m[0] / tl.total * 100) + '%'; d.textContent = m[1]; el.chapters.appendChild(d);
    });
    if (el.nextName) el.nextName.textContent = CALLS[(i + 1) % CALLS.length].tab.toLowerCase();
    el.wave.setAttribute('aria-valuemax', Math.round(tl.total));
    el.script.scrollTop = 0;
    t = tl.total;                          /* rest state: the finished call, ticket full */
    if (autoplay) play(); else render(performance.now());
    if (!keepHash) { try { history.replaceState(null, '', location.pathname + '#' + c.id); } catch (e) {} }
  }

  /* ---------- wiring ---------- */
  [].forEach.call(el.tabs.children, function (b, i) { b.addEventListener('click', function () { load(i, playing); }); });
  el.tabs.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var n = (cur + (e.key === 'ArrowRight' ? 1 : CALLS.length - 1)) % CALLS.length;
    load(n, playing); el.tabs.children[n].focus();
  });
  el.play.addEventListener('click', function () { playing ? pause() : play(); });
  if (el.next) el.next.addEventListener('click', function () { var n = (cur + 1) % CALLS.length; load(n, true); });
  player.addEventListener('ended', function () {
    t = tl.total; playing = false; finished = true; render(performance.now());
    if (follow) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }   /* glide on to the result card, then stop */
  });
  player.addEventListener('pause', function () { if (playing && !player.ended && !player.seeking) { playing = false; follow = false; cancelAnimationFrame(raf); render(performance.now()); } });
  player.addEventListener('error', function () {
    if (!player.getAttribute('src')) return;
    playing = false; follow = false; cancelAnimationFrame(raf); if (el.err) el.err.hidden = false; render(performance.now());
  });

  /* waveform: mouse drags scrub; touch taps seek, sideways drags scrub, vertical swipes scroll the page */
  var drag = null;
  function at(e) { var r = el.wave.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * tl.total); }
  el.wave.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') { drag = { mode: 'scrub' }; try { el.wave.setPointerCapture(e.pointerId); } catch (_) {} at(e); return; }
    drag = { mode: 'pending', x: e.clientX, y: e.clientY };
  });
  el.wave.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (drag.mode === 'pending') {
      var dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
      if (dy > 8 && dy >= dx) { drag = null; return; }
      if (dx > 12 && dx > dy * 1.5) { drag.mode = 'scrub'; try { el.wave.setPointerCapture(e.pointerId); } catch (_) {} }
    }
    if (drag && drag.mode === 'scrub') at(e);
  });
  el.wave.addEventListener('pointerup', function (e) { if (drag && drag.mode === 'pending') at(e); drag = null; });
  el.wave.addEventListener('pointercancel', function () { drag = null; });
  el.wave.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') seek(t + 5); else if (e.key === 'ArrowLeft') seek(t - 5);
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playing ? pause() : play(); }
  });

  /* hero CTA: start the call inside the same tap (iOS needs the gesture); the follow brings the page down */
  [].forEach.call(document.querySelectorAll('[data-watch]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); if (!playing) play(); else { follow = true; } });
  });
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (tl) draw(performance.now()); }).observe(el.wave);
  if ('MutationObserver' in window) new MutationObserver(function () { colors(); if (tl) draw(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* deep links: #limousine · #plumbing · #heating · #dental, and the hub-page pills (?trade=…#stage) */
  var TRADE = { plumbing: 'plumbing', plumber: 'plumbing', hvac: 'heating', heating: 'heating', cooling: 'heating', dental: 'dental', dentist: 'dental', medical: 'dental',
    limo: 'limousine', limousine: 'limousine', 'black-car': 'limousine', chauffeur: 'limousine', transportation: 'limousine' };
  colors();
  var want = (location.hash || '').replace('#', ''), idx = -1, trade = (location.search.match(/[?&]trade=([^&#]+)/) || [])[1];
  if (trade) { try { trade = decodeURIComponent(trade).toLowerCase(); } catch (e) {} if (TRADE[trade]) want = TRADE[trade]; }
  CALLS.forEach(function (c, i) { if (c.id === want) idx = i; });
  load(idx < 0 ? 0 : idx, false, true);
  if (trade || location.hash === '#stage') {               /* old pills point at #stage, which no longer exists: bring the player up */
    var sec = document.getElementById('watch');
    if (sec) requestAnimationFrame(function () { sec.scrollIntoView({ block: 'start' }); });
  }
})();
