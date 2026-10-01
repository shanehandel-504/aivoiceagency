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

   rev c (Shane, 6 PM): five calls (live transfer added, Owner voice),
   every call ends with "a text and an email" (audio v3, additive),
   the player rests READY (empty ticket, 0:00) instead of finished,
   and a finished call offers the strategy call before the next one.
   Vanilla JS, no deps.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-calls]');
  if (!root) return;
  var CALLS = [{"id":"limousine","tab":"Limousine","biz":"Lakeshore Black Car","shows":"This call shows the whole trip taken, the trip sheet going to dispatch, and a text and an email reaching the caller, who is told dispatch will confirm.","dur":66.443,"ping":58.971,"details":9,"lines":[["a","Lakeshore Black Car, this is AVA."],["c","Hi, I need a car to O'Hare tomorrow morning. Early. My ride just canceled on me, and my flight's at seven."],["a","Seven AM out of O'Hare. Which airline?"],["c","United."],["a","A 4:30 pickup gets you there with time. How many passengers and bags?"],["c","Two of us. Three bags... no, four. My wife doesn't pack light."],["a","Then I'll put you in an SUV. What's the pickup address?"],["c","1840 Ridge Road, Wilmette."],["a","And your name and best cell?"],["c","Paul Hendricks. 847-555-0136."],["a","The SUV to O'Hare is $145, all in. Want me to send it to dispatch?"],["c","Yes. Send it."],["a","Paul Hendricks, 1840 Ridge Road, 4:30 AM tomorrow, SUV to O'Hare, United, $145. Your information has been received, and dispatch will get with you to confirm. I'm sending you a text and an email right now. The email has your trip details."],["c","Got it. That was easier than the first guy."],["a","Dispatch will be in touch. Safe travels, Paul."]],"t":[[3.9,5.986],[6.206,11.198],[11.498,14.22],[14.44,14.949],[15.249,19.208],[19.428,23.329],[23.629,26.836],[27.056,29.046],[29.346,30.959],[31.179,35.484],[35.784,41.166],[40.986,41.946],[42.246,58.571],[60.341,62.729],[63.029,65.743]],"fields":[["Drop-off","O'Hare, 7:00 AM flight",1],["Airline","United",3],["Pickup time","Tomorrow 4:30 AM",4],["Passengers","2, with 4 bags",5],["Vehicle","SUV",6],["Pickup","1840 Ridge Road, Wilmette",7],["Passenger","Paul Hendricks, 847-555-0136",9],["Rate quoted","$145 all in",10],["Trip sheet","Sent to dispatch",12],["CRM","Reservation written",12],["Text","Received, dispatch will confirm","ping"],["Email","Trip details sent","ping"]],"booked":{"label":"Sent to dispatch","big":"Tomorrow 4:30 AM","small":"SUV to O'Hare, $145 all in"},"peaks":[0.228,0.228,0.228,0.228,0.0,0.0,0.228,0.228,0.228,0.228,0.281,0.555,0.783,0.631,0.565,0.493,0.773,0.672,0.557,0.589,0.942,0.555,0.609,0.52,0.444,0.784,0.302,0.489,0.518,0.457,0.454,0.488,0.408,0.471,0.182,0.691,0.64,0.638,0.465,0.144,0.509,0.646,0.3,0.445,0.542,0.034,0.894,0.529,0.691,0.634,0.546,0.4,0.046,0.569,0.445,0.43,0.401,0.123,0.448,0.406,0.51,0.675,0.049,0.529,0.454,0.367,0.231,0.653,0.778,0.421,0.036,0.688,0.752,0.604,0.944,0.473,0.074,0.737,0.671,0.445,0.122,0.66,0.383,0.465,0.537,0.439,0.451,0.357,0.617,0.442,0.512,0.516,0.472,0.113,0.539,0.512,0.52,0.448,0.463,0.202,0.641,0.559,0.526,0.395,0.518,0.378,0.316,0.544,0.952,0.537,0.647,0.558,0.581,0.38,0.461,0.47,0.296,0.923,0.442,0.577,0.811,0.596,0.545,0.582,0.052,0.503,0.044,0.527,0.526,0.192,1.0,0.35,0.469,0.515,0.472,0.092,0.575,0.692,0.439,0.458,0.302,0.716,0.392,0.568,0.581,0.254,0.596,0.323,0.506,0.416,0.404,0.187,0.759,0.549,0.545,0.4,0.601,0.519,0.604,0.585,0.39,0.377,0.287,0.667,0.761,0.361,0.551,0.694,0.411,0.496,0.397,0.405,0.598,0.571,0.373,0.21,0.085,0.311,0.196,0.398,0.067,0.594,0.494,0.057,0.629,0.432,0.451,0.565,0.372,0.592,0.892,0.56,0.492,0.388,0.525,0.428,0.296,0.196,0.001,0.001],"bk":null},{"id":"plumbing","tab":"Plumbing","biz":"Miller Plumbing","shows":"This call shows the visit landing on the calendar and a text and an email reaching the customer before the call ends.","dur":69.681,"ping":63.97,"details":11,"lines":[["a","Miller Plumbing, this is AVA."],["c","Hi, yeah, sorry, I know it's late... our water heater's leaking. There's water all over the basement floor."],["a","Water on the basement floor. Is the water to the heater shut off?"],["c","I... I don't know. There's a valve on top?"],["a","That's the one. Turn it all the way off."],["c","Okay... okay, it's slowing down. Of course this happens the week my in-laws are here."],["a","It always does. What's your name?"],["c","Dan Whitfield."],["a","And the address, Dan?"],["c","412 Birch Lane. Basement door's around back."],["a","I'll note that for the plumber. Best number to reach you?"],["c","This one. 414-555-0148."],["a","The visit fee is $89, and I have a plumber at 7 AM tomorrow. Does that work?"],["c","Yes. Please."],["a","Dan Whitfield, 412 Birch Lane, 7 AM tomorrow, $89 visit fee. You're on the schedule. I'm sending you a text and an email right now. The email has the visit details and our company info."],["c","Just got it."],["a","Put some towels down, and get some sleep."]],"t":[[3.9,5.737],[5.957,12.702],[13.002,16.57],[16.79,19.888],[20.188,22.474],[22.694,28.062],[28.362,30.72],[30.94,31.817],[32.117,33.341],[33.561,36.23],[36.53,39.025],[38.845,43.187],[43.487,48.805],[49.025,50.158],[50.458,63.57],[65.34,66.599],[66.899,68.981]],"fields":[["Problem","Water heater leaking, basement",1],["Shutoff","Valve closed on the call",5],["Customer","Dan Whitfield",7],["Address","412 Birch Lane",9],["Note","Basement door around back",9],["Callback","414-555-0148",11],["Fee quoted","$89 visit fee",12],["Calendar","Tomorrow 7:00 AM",14],["Text","Confirmation sent","ping"],["Email","Visit details + company info","ping"]],"booked":{"label":"Booked","big":"Tomorrow 7:00 AM","small":"Water heater leak, $89 visit fee"},"peaks":[0.2,0.2,0.2,0.2,0.0,0.2,0.2,0.2,0.2,0.2,0.246,0.557,0.442,0.371,0.473,0.685,0.124,0.41,0.432,0.619,0.355,0.604,0.714,0.811,0.712,0.235,0.471,0.479,0.232,0.255,0.193,0.654,0.401,0.575,0.625,0.297,0.226,0.389,0.453,0.537,0.337,0.264,0.028,0.698,0.497,0.445,0.362,0.208,0.554,0.245,0.151,0.571,0.486,0.452,0.531,0.712,0.504,0.083,0.861,0.696,0.299,0.415,0.84,0.496,0.127,0.702,0.204,0.79,0.198,0.645,0.7,0.18,0.167,0.285,0.338,0.659,0.369,0.357,0.243,0.312,0.281,0.464,0.531,0.341,0.281,0.156,0.379,0.39,0.125,0.809,0.356,0.084,0.795,0.734,0.434,0.187,0.522,0.638,0.629,0.381,0.816,0.574,0.623,0.54,1.0,0.653,0.536,0.299,0.042,0.659,0.45,0.719,0.424,0.126,0.563,0.549,0.436,0.799,0.97,0.753,0.25,0.589,0.605,0.504,0.141,0.538,0.532,0.668,0.403,0.422,0.379,0.777,0.413,0.533,0.435,0.498,0.34,0.261,0.641,0.489,0.835,0.721,0.493,0.24,0.12,0.6,0.54,0.235,0.513,0.398,0.394,0.276,0.132,0.558,0.47,0.405,0.252,0.636,0.49,0.388,0.36,0.184,0.236,0.7,0.56,0.194,0.848,0.439,0.343,0.505,0.354,0.367,0.295,0.074,0.56,0.448,0.584,0.334,0.512,0.648,0.273,0.236,0.072,0.272,0.238,0.349,0.055,0.534,0.059,0.821,0.844,0.011,0.308,0.352,0.331,0.227,0.257,0.137,0.001,0.001],"bk":null},{"id":"heating","tab":"Heating and cooling","biz":"Northside Heating and Cooling","shows":"This call shows a priority note going to the technician, the customer record being saved, and a text and an email going out.","dur":69.299,"ping":63.881,"details":9,"lines":[["a","Northside Heating and Cooling, this is AVA."],["c","Yeah, hi. Our AC just quit. It's blowing, but it's warm air, and it's already 85 in the house."],["a","85 inside. Is anyone home who shouldn't be in that heat... little kids, anyone older?"],["c","My mother-in-law. She's 81. She won't say it's bothering her, but..."],["a","Then we get someone out today. What's your name?"],["c","Marcus Reyes."],["a","And the address, Marcus?"],["c","2206 Sycamore Drive."],["a","Best number to reach you?"],["c","414-555-0172."],["a","The visit fee is $99. I have a technician at 4 o'clock this afternoon."],["c","Four today? Yes. Take it. Honestly, I figured you'd say next week."],["a","Not with her in the house. Marcus Reyes, 2206 Sycamore Drive, 4 o'clock today, $99 visit fee. It's on the calendar, and the technician knows she's there. I'm sending you a text and an email right now. The email has the visit details."],["c","There it is."],["a","Get her a cold drink and sit tight."]],"t":[[3.9,6.315],[6.535,14.152],[14.452,20.734],[20.954,25.567],[25.867,28.16],[28.38,29.137],[29.437,30.744],[30.964,32.807],[33.107,34.235],[34.455,38.256],[38.556,43.41],[43.23,47.453],[47.753,63.481],[65.251,66.382],[66.682,68.599]],"fields":[["Problem","AC blowing warm air, 85 inside",1],["Priority","81-year-old in the home",3],["Customer","Marcus Reyes",5],["Address","2206 Sycamore Drive",7],["Callback","414-555-0172",9],["Fee quoted","$99 visit fee",10],["Calendar","Today 4:00 PM",12],["Technician","Priority note sent",12],["Record","Customer saved",12],["Text","Confirmation sent","ping"],["Email","Visit details sent","ping"]],"booked":{"label":"Booked","big":"Today 4:00 PM","small":"AC repair visit, $99 visit fee"},"peaks":[0.199,0.199,0.199,0.199,0.0,0.199,0.199,0.199,0.199,0.199,0.245,0.548,0.603,0.423,0.396,0.422,0.555,0.51,0.069,0.574,0.504,0.61,0.058,0.659,0.339,0.432,0.447,0.493,0.567,0.422,0.532,0.623,0.478,0.505,0.473,0.411,0.403,0.529,0.644,0.682,0.445,0.288,0.291,0.41,0.392,0.322,0.603,0.728,0.403,0.33,0.417,0.486,0.305,0.223,0.46,0.47,0.277,0.458,0.455,0.395,0.322,0.467,0.157,0.072,0.281,0.258,0.276,0.019,0.387,0.39,0.406,0.19,0.17,0.129,0.605,0.595,0.489,0.474,0.361,0.53,0.437,0.022,0.672,0.571,0.192,0.564,0.586,0.346,0.165,0.56,0.414,0.437,0.552,0.44,0.354,0.672,0.527,0.465,0.236,0.458,0.499,0.394,0.033,0.611,0.528,0.315,0.084,0.398,0.384,0.342,0.138,0.531,0.477,0.619,0.407,0.367,0.292,0.104,1.0,0.469,0.597,0.499,0.378,0.294,0.366,0.482,0.268,0.583,0.146,0.898,0.351,0.557,0.494,0.407,0.385,0.451,0.257,0.194,0.52,0.461,0.527,0.387,0.1,0.705,0.504,0.332,0.247,0.482,0.468,0.401,0.433,0.382,0.395,0.576,0.356,0.518,0.347,0.408,0.415,0.394,0.228,0.149,0.741,0.462,0.704,0.344,0.336,0.423,0.308,0.345,0.044,0.918,0.422,0.529,0.874,0.421,0.373,0.283,0.541,0.465,0.481,0.296,0.212,0.049,0.272,0.277,0.349,0.028,0.293,0.484,0.264,0.104,0.519,0.427,0.468,0.294,0.311,0.231,0.001,0.001],"bk":null},{"id":"dental","tab":"Dental","biz":"Lakeview Dental","shows":"This call shows a new patient landing on the doctor's schedule, with a text and the new patient form by email before the visit.","dur":69.014,"ping":61.916,"details":7,"lines":[["a","Lakeview Dental, this is AVA."],["c","Hi. I'm not a patient there, but I've got a tooth that's killing me. Back left, on the bottom. It woke me up at three this morning."],["a","Up at three with it, that's miserable. Any swelling in your face or jaw?"],["c","No, no swelling. It just throbs. And I haven't seen a dentist in a while. Like, years. Don't judge."],["a","Nobody here will. What's your name?"],["c","Kyle Brandt."],["a","And the best number for you, Kyle?"],["c","414-555-0193."],["a","The new patient exam with X-rays is $79. I have an opening at 2:30 this afternoon."],["c","Today? Yes. Oh, thank God."],["a","Kyle Brandt, Lakeview Dental at 900 Shoreline Road, 2:30 today, $79 exam fee. You're on the doctor's schedule. I'm sending you a text and an email right now. The email has your new patient form."],["c","Got it. Okay. Good."],["a","Bring your insurance card if you have one. We've got you."]],"t":[[3.9,5.877],[6.097,15.591],[15.891,20.875],[21.095,29.796],[30.096,32.42],[32.64,33.463],[33.763,35.522],[35.742,39.728],[40.028,45.722],[45.542,48.149],[48.449,61.516],[63.286,65.189],[65.489,68.314]],"fields":[["Reason","Toothache, lower left, woke at 3 AM",1],["Swelling","None",3],["Patient","Kyle Brandt, new patient",5],["Callback","414-555-0193",7],["Fee quoted","$79 exam with X-rays",8],["Schedule","Today 2:30 PM",10],["Text","Confirmation sent","ping"],["Email","New patient form sent","ping"]],"booked":{"label":"Booked","big":"Today 2:30 PM","small":"New patient exam, $79"},"peaks":[0.223,0.223,0.223,0.223,0.0,0.223,0.223,0.223,0.223,0.223,0.274,0.797,0.623,0.382,0.635,0.62,0.573,0.565,0.618,0.349,0.338,0.114,0.78,0.676,0.474,0.604,0.538,0.627,0.574,0.47,0.304,0.737,0.63,0.373,1.0,0.691,0.466,0.722,0.587,0.428,0.609,0.844,0.433,0.618,0.528,0.018,0.508,0.168,0.461,0.459,0.145,0.21,0.319,0.35,0.146,0.968,0.638,0.414,0.562,0.417,0.154,0.683,0.345,0.658,0.517,0.113,0.345,0.328,0.429,0.02,0.353,0.427,0.105,0.446,0.418,0.541,0.648,0.417,0.454,0.06,0.395,0.143,0.375,0.088,0.547,0.442,0.109,0.67,0.648,0.383,0.334,0.607,0.34,0.406,0.802,0.721,0.648,0.346,0.66,0.728,0.549,0.382,0.355,0.534,0.594,0.53,0.332,0.744,0.858,0.601,0.044,0.509,0.552,0.594,0.443,0.02,0.555,0.495,0.517,0.914,0.493,0.556,0.59,0.359,0.251,0.936,0.594,0.406,0.653,0.552,0.474,0.246,0.959,0.133,0.651,0.141,0.451,0.094,0.787,0.171,0.601,0.669,0.463,0.506,0.685,0.611,0.674,0.485,0.353,0.419,0.375,0.243,0.398,0.496,0.508,0.321,0.636,0.498,0.34,0.33,0.161,0.716,0.64,0.402,0.285,0.605,0.596,0.486,0.671,0.399,0.329,0.276,0.135,0.556,0.543,0.426,0.27,0.226,0.023,0.303,0.128,0.389,0.04,0.821,0.34,0.931,0.761,0.72,0.7,0.593,0.517,0.544,0.379,0.359,0.409,0.501,0.791,0.305,0.001,0.001],"bk":null},{"id":"transfer","tab":"Live transfer","biz":"Brightline Electric","shows":"This call shows a live transfer: AVA checks it is safe, takes the details, briefs the owner, and puts the caller through.","dur":60.39,"ping":51.759,"details":7,"lines":[["a","Brightline Electric, this is AVA."],["c","Hey, it's Tony at Rosa's Kitchen. Half our kitchen just lost power, and it's Friday night. We're packed."],["a","Half the kitchen is out. Any burning smell, sparks, or smoke?"],["c","No, nothing like that. The breakers just won't reset."],["a","Okay. Leave those breakers off. This is one Mike wants to hear about right away. What's the address there, Tony?"],["c","410 Water Street."],["a","And the best number for you?"],["c","414-555-0188."],["a","I'm getting Mike, the owner, on the line now. Stay with me."],["a","Mike, I have Tony at Rosa's Kitchen, 410 Water Street. Half the kitchen lost power, the breakers won't reset, no smell or sparks. They're full tonight. Connecting you now."],["o","Tony, it's Mike. I'm 20 minutes out. Keep those breakers off, and I'll see you there."],["c","Thank you. Seriously."]],"t":[[3.9,5.913],[6.133,12.245],[12.545,16.595],[16.815,19.964],[20.264,26.505],[26.725,27.923],[28.223,29.648],[29.868,33.482],[33.782,37.153],[40.353,51.359],[53.129,57.936],[58.156,59.69]],"fields":[["Customer","Tony, Rosa's Kitchen",1],["Problem","Half the kitchen lost power",1],["Safety","No smell, sparks or smoke",3],["Priority","Commercial, owner wants it now",4],["Address","410 Water Street",5],["Callback","414-555-0188",7],["Transfer","Owner briefed, caller put through",9],["Text + email","Call details to the owner","ping"]],"booked":{"label":"Connected to the owner","big":"Mike on the line","small":"Rosa's Kitchen, power out"},"peaks":[0.195,0.195,0.195,0.195,0.0,0.0,0.195,0.195,0.195,0.195,0.195,0.24,0.102,0.602,0.561,0.481,0.234,0.719,0.578,0.231,0.436,0.415,0.426,0.415,0.464,0.371,0.476,0.113,0.532,0.5,0.39,0.384,0.434,0.486,0.4,0.415,0.372,0.062,0.4,0.472,0.329,0.32,0.377,0.342,0.365,0.32,0.012,0.842,0.534,0.544,0.457,0.488,0.367,0.377,0.315,0.158,0.389,0.264,0.409,0.593,0.057,0.496,0.528,0.365,0.267,0.366,0.04,0.81,0.368,0.462,0.5,0.563,0.518,0.368,0.069,0.532,0.633,0.613,0.369,0.419,0.418,0.394,0.176,0.66,0.591,0.431,0.393,0.265,0.406,0.433,0.458,0.312,0.054,0.698,0.46,0.608,0.398,0.387,0.027,0.425,0.366,0.394,0.504,0.502,0.535,0.371,0.074,0.412,0.375,0.391,0.247,0.057,0.87,0.583,0.359,0.621,0.556,0.351,0.321,0.163,0.361,0.641,0.208,0.005,0.122,0.122,0.122,0.122,0.116,0.122,0.122,0.122,0.001,0.632,0.557,1.0,0.417,0.362,0.44,0.368,0.291,0.156,0.433,0.317,0.338,0.152,0.023,0.553,0.368,0.415,0.331,0.338,0.341,0.446,0.473,0.332,0.417,0.381,0.342,0.339,0.31,0.406,0.134,0.589,0.422,0.252,0.153,0.616,0.34,0.321,0.002,0.265,0.139,0.34,0.082,0.001,0.607,0.357,0.479,0.122,0.526,0.42,0.455,0.355,0.384,0.412,0.445,0.402,0.276,0.311,0.355,0.279,0.307,0.406,0.07,0.365,0.413,0.137,0.001,0.001],"bk":10}];
  var PICKUP = 3.6;
  var q = function (s) { return root.querySelector(s); };
  var el = {
    tabs: q('[data-tabs]'), shows: q('[data-shows]'), play: q('[data-play]'), label: q('[data-playlabel]'),
    biz: q('[data-biz]'), clock: q('[data-clock]'), wave: q('[data-wave]'), cv: q('[data-wave] canvas'),
    chapters: q('[data-chapters]'), script: q('[data-script]'), fields: q('[data-fields]'), status: q('[data-status]'),
    booked: q('[data-booked]'), blab: q('[data-blab]'), bbig: q('[data-bbig]'), bsmall: q('[data-bsmall]'), err: q('[data-err]'),
    call: q('[data-callpane]'), ticket: q('[data-ticketpane]'), next: q('[data-next]'), nextName: q('[data-nextname]'),
    after: q('[data-after]')
  };
  var WHO = { a: 'AVA', c: 'Caller', o: 'Owner' };
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
    var bookedT = c.bk != null ? L[c.bk].s + 0.3 : L[L.length - 1].e + 0.1;   /* a transfer is "done" when the owner picks up */
    return { L: L, F: F, total: c.dur, bookedT: bookedT, detailsT: L[c.details].e, peaks: c.peaks };
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
      var bh = Math.max(2, amp * (h - 8)), done = x <= t;
      g2.globalAlpha = done ? 1 : 0.38;                                  /* not-yet-heard bars: quiet, but visible at rest */
      g2.fillStyle = done ? (act === 'a' ? col.a : (act === 'c' || act === 'o') ? col.c : col.n) : col.n;
      g2.fillRect(i * step + 1, (h - bh) / 2, Math.max(2, step - 2), bh);
    }
    g2.globalAlpha = 1;
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
    var focus = t >= tl.bookedT ? (el.after && !el.after.hidden ? el.after : el.booked) : lastRow;
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
    var done = t >= tl.bookedT, ready = t === 0 && !playing;
    el.booked.classList.toggle('on', done);
    el.blab.textContent = done ? c.booked.label : ready ? 'Waiting for the call' : t < PICKUP ? 'Ringing' : 'AVA is on the call';
    el.status.textContent = done ? 'complete' : ready ? 'fills in as AVA talks' : on + ' of ' + tl.F.length + ' lines';
    el.clock.textContent = fmt(Math.min(t, tl.total)) + ' / ' + fmt(tl.total);
    var ch = el.chapters.children, marks = [PICKUP, tl.detailsT, tl.bookedT];
    for (i = 0; i < ch.length; i++) ch[i].classList.toggle('on', t >= marks[i]);
    el.wave.setAttribute('aria-valuenow', Math.round(t));
    el.wave.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(tl.total));
    el.play.classList.toggle('on', playing);
    el.play.setAttribute('aria-pressed', String(playing));
    el.label.textContent = playing ? 'Pause' : (t > 0 && t < tl.total) ? 'Resume the call' : finished ? 'Play it again' : 'Play the sample call';
    if (el.after) el.after.hidden = !(finished && !playing);
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
    player.src = '/audio/samples/v3/' + c.id + (m4a ? '.m4a' : '.mp3') + V;
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
      a.className = 'cx-who'; a.textContent = WHO[l.who] || 'Caller'; b.className = 'cx-say'; b.textContent = l.text;
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
    t = 0;                                 /* rest state: READY. Empty ticket, 0:00. The HTML still ships the finished call for no-JS readers. */
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
    limo: 'limousine', limousine: 'limousine', 'black-car': 'limousine', chauffeur: 'limousine', transportation: 'limousine',
    electrical: 'transfer', electrician: 'transfer', transfer: 'transfer', 'live-transfer': 'transfer' };
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
