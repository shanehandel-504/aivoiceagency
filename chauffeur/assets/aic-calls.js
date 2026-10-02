/* ============================================================
   AI CHAUFFEUR SAMPLE CALLS — /assets/aic-calls.js (Oct 2 2026)
   The #demo instrument on aichauffeur.ai. Same engine as the AVA
   homepage player, wearing Signal v1.6: the recording is the clock;
   every transcript line, trip-sheet row and waveform bar is a pure
   function of audio.currentTime, so scrubbing back un-fills the sheet.
   The HTML ships the finished first call (JS off = whole story).
   Never autoplays; audio loads on the first tap. STATE LAW: the chip's
   word and colour change in the same frame, no transition; green only
   beside the label naming what succeeded. AVA never appears here.
   Vanilla JS, no deps.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('#demo [data-calls]');
  if (!root) return;
  var CALLS = [{"id":"airport","tab":"O'Hare pickup","biz":"Corbel Black Car","shows":"This call shows a rate quoted from the company's own rate sheet, the flight tracked, and the trip booked with a receipt by text and email.","dur":69.253,"ping":65.941,"details":11,"lines":[["a","Corbel Black Car, reservations."],["c","Hi. I land at O'Hare tonight and need a car to Evanston. What's that run?"],["a","A sedan from O'Hare to Evanston is $115, plus tolls and gratuity. Which airline and flight?"],["c","United 1242. It lands at 9:40."],["a","I'll track that flight, so your pickup moves with it. How many passengers and bags?"],["c","Just me. Two bags... actually, three. One's a golf bag."],["a","Golf bag noted for your chauffeur. Inside at baggage claim, with a name sign?"],["c","Inside is good."],["a","And the drop-off address?"],["c","1820 Hinman Avenue, Evanston."],["a","Your name and cell?"],["c","Mark Delaney. 312-555-0148."],["a","Email for the receipt?"],["c","mark@delaneyhq.com"],["a","Mark Delaney, tonight, United 1242, inside at baggage claim to Hinman Avenue, $115 plus tolls and gratuity. You're booked. Trip sheet and receipt are on the way by text and email, and your chauffeur's name and car come by text before you land."],["c","Perfect. Thanks."]],"t":[[3.9,6.078],[6.298,10.611],[10.911,17.626],[17.846,20.825],[21.125,25.301],[25.521,29.498],[29.798,34.033],[34.253,34.977],[35.277,36.63],[36.85,39.174],[39.474,40.381],[40.601,45.138],[45.438,46.471],[46.691,48.962],[49.262,65.541],[67.311,68.553]],"fields":[["Pickup","O'Hare, tonight",1],["Drop-off","Evanston",1,9,"1820 Hinman Ave, Evanston"],["Rate quoted","$115 + tolls, gratuity",2],["Flight","United 1242, lands 9:40 PM",3],["Flight tracking","On, pickup moves with it",4],["Passengers","1, with 3 bags",5],["Chauffeur note","Golf bag",6],["Meet","Inside, baggage claim, name sign",7],["Passenger","Mark Delaney, 312-555-0148",11],["Email","mark@delaneyhq.com",13],["Status","Booked",14],["Text + email","Trip sheet and receipt","ping"],["Chauffeur","Name and car by text before landing","ping"]],"booked":{"label":"Booked","big":"Tonight 9:40 PM","small":"Sedan, O'Hare to Evanston, $115"},"peaks":[0.197,0.197,0.197,0.197,0.0,0.197,0.197,0.197,0.197,0.197,0.243,0.526,0.513,0.316,0.251,0.57,0.376,0.073,0.953,0.149,0.696,0.499,0.607,0.579,0.389,0.674,0.597,0.224,0.392,0.451,0.238,0.701,0.555,0.309,0.409,0.532,0.354,0.449,0.478,0.314,0.353,0.251,0.329,0.498,0.423,0.341,0.18,0.457,0.657,0.427,0.337,0.734,0.628,0.544,0.402,0.406,0.435,0.67,0.596,0.331,0.028,1.0,0.735,0.548,0.509,0.62,0.352,0.281,0.34,0.483,0.43,0.408,0.316,0.521,0.657,0.189,0.539,0.394,0.065,0.617,0.385,0.461,0.618,0.595,0.283,0.024,0.644,0.6,0.498,0.357,0.376,0.061,0.782,0.645,0.447,0.304,0.503,0.292,0.358,0.53,0.468,0.266,0.532,0.544,0.385,0.106,0.483,0.465,0.585,0.558,0.448,0.563,0.378,0.018,0.512,0.477,0.295,0.679,0.432,0.202,0.516,0.44,0.442,0.594,0.604,0.567,0.263,0.367,0.426,0.397,0.098,0.563,0.485,0.362,0.133,0.59,0.704,0.387,0.421,0.301,0.573,0.094,0.323,0.291,0.268,0.17,0.151,0.579,0.459,0.551,0.471,0.468,0.358,0.332,0.616,0.437,0.484,0.326,0.398,0.522,0.199,0.537,0.583,0.323,0.431,0.346,0.383,0.176,0.505,0.701,0.144,0.464,0.517,0.478,0.45,0.493,0.423,0.4,0.426,0.311,0.741,0.458,0.4,0.417,0.38,0.398,0.289,0.389,0.305,0.048,0.269,0.115,0.345,0.034,0.64,0.531,0.539,0.583,0.001,0.001],"bk":null,"chap":null,"ref":"O'Hare pickup"},{"id":"corporate","tab":"Corporate account","biz":"Larkin & Ashe Chauffeur","shows":"This call shows the caller's account pulled up from the CRM, the trip billed to it, a text to the passenger and an email with a calendar invite to the assistant.","dur":62.654,"ping":59.267,"details":9,"lines":[["a","Larkin & Ashe Chauffeur, reservations."],["c","Hi, it's Priya at Dunmore Capital. I need a car for Mr. Whitfield tomorrow morning."],["a","Hi, Priya. I have the Dunmore account up. Picking him up at home in Winnetka?"],["c","Yes, at home. 6:45 AM."],["a","And where's he headed?"],["c","Oak Brook, 900 Commerce Parkway. But first a stop at our office, 150 North Carrow in the Loop, for Ms. Okafor."],["a","Two passengers after the stop. Sedan, or the SUV?"],["c","The SUV. Just laptops."],["a","Billed to the Dunmore account, as usual. Text his cell, and email you?"],["c","Right. The email comes to me, not him."],["a","Mr. Whitfield, tomorrow, 6:45 AM, SUV from Winnetka, a stop at 150 North Carrow for Ms. Okafor, then 900 Commerce Parkway, Oak Brook. You're booked. He gets the text with his chauffeur's details, and you get the email with a calendar invite."],["c","Perfect. That's everything."]],"t":[[3.9,6.428],[6.648,11.603],[11.903,16.161],[16.381,18.861],[19.161,20.276],[20.496,28.368],[28.668,32.409],[32.629,34.44],[34.74,38.946],[39.166,41.501],[41.801,58.867],[60.637,61.954]],"fields":[["Booked by","Priya, assistant",1],["Passenger","Mr. Whitfield",1],["Account","Dunmore Capital, found in CRM",2],["Pickup","Tomorrow 6:45 AM, home, Winnetka",3],["Stop","150 N Carrow, the Loop, for Ms. Okafor",5],["Drop-off","900 Commerce Pkwy, Oak Brook",5],["Passengers","2 after the stop",6],["Vehicle","SUV",7],["Billing","Dunmore account",8],["Status","Booked",10],["Text","Mr. Whitfield, trip and chauffeur","ping"],["Email","Priya, with calendar invite","ping"]],"booked":{"label":"Booked","big":"Tomorrow 6:45 AM","small":"SUV, Winnetka to Oak Brook, one stop"},"peaks":[0.16,0.16,0.16,0.16,0.0,0.0,0.16,0.16,0.16,0.16,0.16,0.197,0.457,0.391,0.476,0.39,0.437,0.376,0.444,0.187,0.061,0.464,0.414,0.323,0.486,0.701,0.337,0.431,0.081,0.559,0.385,0.376,0.198,0.306,0.199,0.289,0.175,0.011,0.402,0.354,0.043,1.0,0.436,0.335,0.244,0.054,0.388,0.417,0.505,0.365,0.426,0.19,0.546,0.024,0.653,0.104,0.333,0.263,0.395,0.342,0.014,0.521,0.419,0.346,0.165,0.427,0.389,0.097,0.537,0.303,0.299,0.376,0.313,0.022,0.44,0.344,0.404,0.486,0.405,0.099,0.386,0.23,0.265,0.359,0.223,0.357,0.179,0.018,0.27,0.354,0.15,0.368,0.434,0.371,0.767,0.349,0.281,0.129,0.388,0.251,0.352,0.41,0.246,0.068,0.488,0.192,0.16,0.488,0.511,0.35,0.019,0.509,0.468,0.413,0.193,0.461,0.247,0.184,0.307,0.44,0.417,0.352,0.304,0.296,0.021,0.492,0.012,0.433,0.416,0.185,0.129,0.483,0.234,0.267,0.266,0.277,0.21,0.18,0.169,0.442,0.466,0.385,0.364,0.439,0.416,0.235,0.733,0.307,0.304,0.314,0.264,0.43,0.379,0.408,0.254,0.345,0.293,0.327,0.707,0.223,0.217,0.419,0.407,0.328,0.313,0.299,0.278,0.378,0.349,0.096,0.419,0.502,0.111,0.108,0.419,0.346,0.265,0.312,0.392,0.271,0.266,0.392,0.369,0.312,0.304,0.243,0.227,0.184,0.001,0.219,0.223,0.28,0.029,0.495,0.47,0.544,0.473,0.335,0.001,0.001],"bk":null,"chap":null,"ref":"corporate account"},{"id":"wedding","tab":"Wedding by the hour","biz":"Tavenner Limousine","shows":"This call shows an hourly quote with the minimum, a change to the hours, and the trip booked with a deposit link by text and the contract by email.","dur":74.899,"ping":70.925,"details":11,"lines":[["a","Tavenner Limousine, reservations."],["c","Hi! I need something big for my sister's wedding on Saturday. What's your hourly, and is there a minimum?"],["a","A 14-passenger Sprinter limo is $165 an hour, five-hour minimum, plus fuel and gratuity. How many in the party?"],["c","Twelve. Maybe eleven."],["a","The Sprinter covers twelve. Start time and first pickup?"],["c","1 PM, at the bride's house. 940 Linden Avenue, Wilmette."],["a","And the second pickup?"],["c","The groomsmen, Alder House Hotel in Evanston. Then church, then the reception at Briar Hall."],["a","Five hours, one to six?"],["c","Make it six. Photos always run long."],["a","Six hours. Name, cell and email?"],["c","Jenna Ruiz. 847-555-0163. jenna@ruizfamily.com"],["a","Jenna, Saturday at 1, Sprinter limo for twelve, six hours, two pickups, church, then Briar Hall. $990, plus fuel and gratuity. You're booked. The deposit link to hold the Sprinter is in your texts, and the contract's in your email."],["c","Got it. Paying the deposit now."]],"t":[[3.9,6.155],[6.375,12.708],[13.008,21.598],[21.818,23.951],[24.251,27.449],[27.669,31.792],[32.092,33.147],[33.367,39.039],[39.339,41.045],[41.265,44.235],[44.535,47.282],[47.502,54.983],[55.283,70.525],[72.295,74.199]],"fields":[["Event","Wedding, Saturday",1],["Rate quoted","$165/hr, 5-hr minimum, + fuel, gratuity",2],["Passengers","12",3],["Vehicle","14-passenger Sprinter limo",4],["Start","1:00 PM",5],["Pickup 1","Bride's house, 940 Linden Ave, Wilmette",5],["Pickup 2","Groomsmen, Alder House Hotel, Evanston",7],["Route","Church, then Briar Hall",7],["Hours","5",8,9,"6"],["Contact","Jenna Ruiz, 847-555-0163",11],["Total quoted","$990 + fuel, gratuity",12],["Status","Booked",12],["Deposit link","Sent by text","ping"],["Contract","PDF by email","ping"]],"booked":{"label":"Booked","big":"Saturday 1:00 PM","small":"Sprinter limo, 6 hours, $990"},"peaks":[0.186,0.186,0.186,0.186,0.0,0.186,0.186,0.186,0.186,0.229,0.551,0.479,0.42,0.167,0.527,0.19,0.074,0.391,0.341,0.502,0.419,0.409,0.519,0.411,0.41,0.614,0.377,0.307,0.578,0.373,0.535,0.296,0.326,0.313,0.531,0.43,0.386,0.349,0.507,0.368,0.467,0.411,0.235,0.379,0.351,0.449,0.256,0.599,0.48,0.371,0.446,0.398,0.537,0.24,0.04,0.449,0.42,0.262,0.485,0.341,0.18,0.295,0.521,0.497,0.517,0.554,0.445,0.455,0.174,0.537,0.618,0.58,0.346,0.236,0.443,0.486,0.757,0.587,0.45,0.576,0.434,0.299,0.636,0.375,0.537,0.491,0.474,0.5,0.244,0.479,0.472,0.66,0.449,0.345,0.404,0.645,0.406,0.625,0.359,0.508,0.435,0.544,0.436,0.394,0.012,0.598,0.492,0.437,0.389,0.109,0.465,0.58,0.384,0.607,0.471,0.417,0.385,0.326,0.048,0.591,0.276,0.081,0.49,0.194,0.536,0.345,0.1,0.416,0.309,0.609,0.404,0.472,0.115,0.757,0.663,0.427,0.293,0.377,0.349,0.401,0.088,0.49,0.782,0.378,0.341,0.534,0.387,0.461,0.419,0.175,0.595,0.576,0.403,0.296,0.425,0.359,0.381,0.288,1.0,0.48,0.263,0.421,0.322,0.411,0.158,0.426,0.484,0.178,0.557,0.424,0.408,0.408,0.356,0.254,0.536,0.622,0.042,0.736,0.483,0.389,0.394,0.383,0.371,0.175,0.702,0.439,0.369,0.258,0.054,0.254,0.26,0.326,0.016,0.51,0.063,0.493,0.476,0.513,0.013,0.001],"bk":null,"chap":null,"ref":"wedding"},{"id":"driver","tab":"Where's my driver","biz":"Ironbridge Livery","shows":"This call shows a caller at the curb: the reservation pulled up, the door and description texted to the chauffeur, and dispatch brought on the line.","dur":58.019,"ping":34.213,"details":7,"lines":[["a","Ironbridge Livery, reservations."],["c","Yeah, I'm outside at Midway, and there's no car. Where's my driver?"],["a","Let's find him. Name on the reservation?"],["c","Brandt. Tom Brandt."],["a","Got you, Mr. Brandt. 6:15 pickup at Midway, going to the Loop. Which door are you at?"],["c","Door three, lower level. No, wait... door two. I walked down."],["a","Door two, lower level. What should your chauffeur look for?"],["c","Gray coat. Black roller bag."],["a","I'm texting your chauffeur your door and your coat right now."],["a","And I'm bringing dispatch on. Stay with me."],["a","Dispatch, Tom Brandt, Midway, lower level, door two. Gray coat, black roller bag, 6:15 pickup. The chauffeur has the text."],["d","Mr. Brandt, this is dispatch. Your chauffeur has your door. Stay right at door two."],["c","Okay. Door two."]],"t":[[3.9,5.925],[6.145,10.549],[10.849,13.153],[13.373,14.745],[15.045,20.173],[20.393,24.678],[24.978,28.405],[28.625,30.408],[30.708,33.813],[35.663,37.785],[40.985,49.893],[50.693,55.991],[56.211,57.319]],"fields":[["Request","Where is my driver",1],["Reservation","Tom Brandt, 6:15 PM, Midway to the Loop",4],["Spot","Lower level, door 2",5],["Look for","Gray coat, black roller bag",7],["Chauffeur","Door and coat sent by text","ping"],["Dispatch","Briefed, caller put through",10]],"booked":{"label":"Connected to dispatch","big":"Dispatch on the line","small":"Tom Brandt, Midway door 2"},"peaks":[0.233,0.233,0.233,0.233,0.203,0.0,0.203,0.233,0.233,0.233,0.233,0.034,0.287,0.778,0.503,0.497,0.341,0.149,0.633,0.394,0.095,0.605,0.497,0.652,0.536,0.517,0.61,0.804,0.625,0.472,0.543,0.155,0.46,0.541,0.537,0.539,0.056,0.51,0.567,0.298,0.048,0.58,0.591,0.65,0.404,0.032,0.609,0.085,0.23,0.79,0.525,0.459,0.93,0.451,0.545,0.255,0.547,0.42,0.428,0.616,0.535,0.408,0.663,0.53,0.48,0.162,0.524,0.427,0.358,0.294,0.498,0.448,0.089,0.518,0.43,0.03,0.695,0.495,0.088,0.444,0.406,0.301,0.699,0.527,0.402,0.005,0.889,0.477,0.319,0.71,0.381,0.159,0.609,0.416,0.455,0.407,0.358,0.247,0.24,0.489,0.444,0.077,0.614,0.423,0.119,0.396,1.0,0.408,0.569,0.536,0.499,0.813,0.575,0.375,0.492,0.372,0.117,0.318,0.315,0.324,0.406,0.04,0.001,0.881,0.71,0.475,0.372,0.252,0.883,0.247,0.013,0.146,0.146,0.146,0.146,0.002,0.146,0.146,0.146,0.146,0.001,0.692,0.524,0.171,0.486,0.586,0.391,0.581,0.463,0.314,0.537,0.497,0.345,0.38,0.309,0.102,0.578,0.497,0.323,0.544,0.478,0.473,0.442,0.48,0.341,0.292,0.132,0.516,0.648,0.55,0.336,0.106,0.286,0.03,0.475,0.598,0.536,0.426,0.437,0.658,0.091,0.197,0.499,0.51,0.49,0.388,0.41,0.065,0.497,0.524,0.523,0.496,0.344,0.649,0.741,0.027,0.436,0.273,0.002,0.001],"bk":11,"chap":"Details taken","ref":"where's my driver"},{"id":"rebook","tab":"Cancel and rebook","biz":"Kestrel Row Car Service","shows":"This call shows a cancellation inside 24 hours handed to dispatch, and the new trip booked on the same call.","dur":55.118,"ping":51.959,"details":7,"lines":[["a","Kestrel Row Car Service, reservations."],["c","Hi, it's Paul Grant. I need to cancel tomorrow's airport run. The meeting moved. But I need Thursday instead."],["a","There you are, Mr. Grant. Tomorrow's inside 24 hours, so dispatch handles that cancel and will call you. Thursday, I can book right now. Same pickup, 3310 North Clark?"],["c","Same place. 5 AM. O'Hare, American 2301."],["a","A sedan with two bags, like tomorrow's?"],["c","Make it the SUV. My partner's coming now. Two of us."],["a","SUV for two. Same cell and email on file?"],["c","Same ones."],["a","Thursday, 5 AM, SUV for two, North Clark to O'Hare, American 2301. You're booked. Tomorrow's cancel is with dispatch now, and your new trip sheet is on the way by text and email."],["c","Perfect. Thanks."]],"t":[[3.9,6.441],[6.661,13.452],[13.752,24.436],[24.656,28.516],[28.816,31.361],[31.581,34.864],[35.164,38.185],[38.405,38.87],[39.17,51.559],[53.329,54.418]],"fields":[["Cancel","Tomorrow's O'Hare run",1],["New trip","Thursday",1],["Caller","Paul Grant, found in CRM",2],["Cancel policy","Inside 24 hours, sent to dispatch",2],["Pickup","5:00 AM, 3310 N Clark",3],["Flight","American 2301, O'Hare",3],["Vehicle","Sedan, 2 bags",4,5,"SUV, 2 bags"],["Passengers","2",5],["Contact","Cell and email on file",7],["Status","Thursday booked",8],["Text + email","New trip sheet","ping"],["Dispatch","Cancel request sent","ping"]],"booked":{"label":"Booked","big":"Thursday 5:00 AM","small":"SUV to O'Hare, cancel with dispatch"},"peaks":[0.221,0.221,0.221,0.221,0.221,0.0,0.0,0.221,0.221,0.221,0.221,0.221,0.0,0.271,0.608,0.491,0.596,0.524,0.578,0.155,0.585,0.571,0.201,0.092,0.602,0.391,0.595,0.513,0.587,0.16,0.642,0.55,0.687,0.516,0.516,0.473,0.437,0.446,0.472,0.473,0.384,0.154,0.081,0.767,0.628,0.819,0.563,0.521,0.555,0.014,0.467,0.644,0.593,0.507,0.458,0.323,0.577,0.394,0.515,0.467,0.58,0.56,0.351,0.552,0.52,0.442,0.475,0.561,0.313,0.62,0.309,0.303,0.167,0.854,0.629,1.0,0.632,0.534,0.451,0.287,0.168,0.584,0.483,0.115,0.648,0.398,0.486,0.46,0.387,0.769,0.519,0.048,0.785,0.665,0.351,0.73,0.655,0.399,0.739,0.498,0.569,0.427,0.47,0.115,0.778,0.597,0.546,0.439,0.633,0.139,0.509,0.318,0.404,0.148,0.562,0.578,0.64,0.435,0.423,0.065,0.675,0.556,0.588,0.546,0.344,0.532,0.194,0.834,0.333,0.357,0.43,0.531,0.013,0.611,0.644,0.57,0.573,0.476,0.183,0.727,0.477,0.015,0.716,0.582,0.297,0.673,0.596,0.459,0.699,0.427,0.44,0.409,0.375,0.549,0.506,0.466,0.438,0.442,0.41,0.437,0.282,0.392,0.457,0.529,0.128,0.55,0.692,0.172,0.042,0.602,0.465,0.49,0.61,0.447,0.428,0.387,0.543,0.443,0.436,0.351,0.465,0.456,0.497,0.535,0.457,0.4,0.189,0.001,0.3,0.298,0.385,0.25,0.023,0.683,0.397,0.071,0.704,0.147,0.001,0.002],"bk":null,"chap":null,"ref":"cancel and rebook"},{"id":"group","tab":"Group job, first quote","biz":"Greyhaven Limousine","shows":"This call shows a group price quoted on the spot while the caller is shopping three companies, and the job booked before the others call back.","dur":69.155,"ping":64.56,"details":11,"lines":[["a","Greyhaven Limousine, reservations."],["c","Hi. Client dinner Thursday, twenty-six people. I'm calling three companies. First one with a number gets it."],["a","Then let's get you a number. Pickup time and place?"],["c","5:30 PM, the Harbor Line Hotel, downtown Milwaukee. Going to Stonecroft Supper Club in Cedarburg."],["a","And the ride back?"],["c","Ten. Make that ten thirty."],["a","Ten thirty. One coach, everyone together?"],["c","One coach. And two display cases."],["a","A 28-passenger minicoach, round trip to Cedarburg, is $1,320, plus gratuity. Want it?"],["c","That was fast. Yes. Book it."],["a","Name, cell and email?"],["c","Renee Vasquez. 414-555-0174. renee@corvaneevents.com"],["a","Renee, Thursday, 5:30, minicoach for twenty-six, Harbor Line to Stonecroft and back at 10:30. $1,320, plus gratuity. You're booked. The quote and contract are in your email, and dispatch already has it."],["c","Done. The other two haven't even called me back."]],"t":[[3.9,6.166],[6.386,12.67],[12.97,15.825],[16.045,22.195],[22.495,23.309],[23.529,25.182],[25.482,28.122],[28.342,30.681],[30.981,37.999],[38.219,40.606],[40.906,42.296],[42.516,49.629],[49.929,64.16],[65.93,68.455]],"fields":[["Trip","Client dinner, Thursday, 26 people",1],["Heads-up","Caller is pricing 3 companies",1],["Pickup","5:30 PM, Harbor Line Hotel, Milwaukee",3],["Drop-off","Stonecroft Supper Club, Cedarburg",3],["Return","10:30 PM",5],["Vehicle","One coach, together",7,8,"28-passenger minicoach"],["Cargo","2 display cases",7],["Rate quoted","$1,320 round trip + gratuity",8],["Contact","Renee Vasquez, 414-555-0174",11],["Status","Booked",12],["Email","Quote and contract PDF","ping"],["Owner alert","Text sent: $1,320 job booked","ping"]],"booked":{"label":"Booked","big":"Thursday 5:30 PM","small":"Minicoach for 26, $1,320, first quote back"},"peaks":[0.238,0.238,0.238,0.238,0.0,0.238,0.238,0.238,0.238,0.238,0.293,0.745,0.571,0.588,0.336,0.72,0.637,0.31,0.611,0.568,0.574,0.488,0.561,0.338,0.534,0.565,0.311,0.066,0.831,0.412,0.653,0.372,0.598,0.501,0.683,0.572,0.281,0.61,0.571,0.691,0.629,0.755,0.732,0.744,0.566,0.105,0.847,0.392,0.532,0.064,0.597,0.52,0.604,0.458,0.755,0.454,0.131,0.527,0.43,0.556,0.647,0.457,0.312,0.5,0.051,0.709,0.53,0.227,0.681,0.041,0.873,0.641,0.418,0.275,0.583,0.218,0.732,0.69,1.0,0.9,0.592,0.075,0.565,0.616,0.65,0.561,0.382,0.441,0.124,0.86,0.539,0.575,0.442,0.476,0.4,0.617,0.465,0.453,0.426,0.451,0.466,0.341,0.339,0.533,0.327,0.599,0.435,0.264,0.633,0.615,0.449,0.923,0.692,0.024,0.632,0.041,0.634,0.275,0.664,0.475,0.699,0.576,0.082,0.671,0.678,0.272,0.472,0.487,0.462,0.667,0.607,0.681,0.361,0.435,0.486,0.577,0.285,0.103,0.682,0.934,0.597,0.625,0.656,0.278,0.446,0.329,0.112,0.704,0.668,0.629,0.754,0.516,0.408,0.464,0.394,0.428,0.442,0.168,0.791,0.537,0.516,0.396,0.38,0.739,0.391,0.305,0.632,0.669,0.495,0.476,0.485,0.325,0.458,0.807,0.185,0.623,0.688,0.573,0.442,0.422,0.379,0.42,0.432,0.75,0.317,0.138,0.324,0.321,0.416,0.093,0.539,0.556,0.038,0.665,0.684,0.582,0.624,0.609,0.001,0.001],"bk":null,"chap":null,"ref":"group of 26"}];
  var PICKUP = 3.6;
  var q = function (s) { return root.querySelector(s); };
  var el = {
    tabs: q('[data-tabs]'), shows: q('[data-shows]'), play: document.getElementById('demo-play-btn'), label: null, glyph: null,
    biz: q('[data-biz]'), clock: q('[data-clock]'), wave: q('[data-wave]'), cv: q('[data-wave] canvas'),
    chapters: q('[data-chapters]'), script: q('[data-script]'), fields: q('[data-fields]'), status: q('[data-status]'),
    booked: q('[data-booked]'), blab: q('[data-blab]'), bbig: q('[data-bbig]'), bsmall: q('[data-bsmall]'), err: q('[data-err]'),
    call: q('[data-callpane]'), ticket: q('[data-ticketpane]'), next: q('[data-next]'), nextName: q('[data-nextname]'),
    after: q('[data-after]')
  };
  var WHO = { a: 'AI Chauffeur', c: 'Caller', d: 'Dispatch', o: 'Dispatch' };
  if (!el.play) return;
  el.label = el.play.querySelector('.play-label'); el.glyph = el.play.querySelector('.play-glyph');
  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" focusable="false"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  var PAUSE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" focusable="false"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  var g2 = el.cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var player = new Audio(); player.preload = 'none';
  var m4a = !!player.canPlayType && player.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '';
  var me = document.currentScript && document.currentScript.src || '', vm = me.match(/[?&]v=([^&#]+)/);
  var V = vm ? '?v=' + vm[1] : '';
  var cur = 0, tl = null, t = 0, playing = false, raf = 0, col = {}, finished = false;
  var follow = false, lastNow = 0;

  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function colors() {
    var cs = getComputedStyle(root);
    var g = function (n, d) { return (cs.getPropertyValue(n) || '').trim() || d; };
    col = { a: g('--signal-blue', '#3D7BFF'), c: g('--ink', '#E8EDF5'), n: g('--neutral', '#8A93A6'), idle: g('--line', '#1B2536') };
  }
  /* Chapter labels sit at their moment on the waveform. When the row is too narrow for all
     three (phones), only the current chapter keeps its words; every tick stays. Measured, not
     guessed, so a long label on a short call can never overprint its neighbour. */
  function fitChapters() {
    var box = el.chapters; if (!box) return;
    box.classList.remove('tight');
    var ch = box.children, prev = null;
    for (var k = 0; k < ch.length; k++) {
      var r = ch[k].getBoundingClientRect();
      if (prev && prev.right + 8 > r.left) { box.classList.add('tight'); return; }
      prev = r;
    }
  }
  var fitQ = 0;
  window.addEventListener('resize', function () { if (fitQ) return; fitQ = requestAnimationFrame(function () { fitQ = 0; fitChapters(); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitChapters);
  function build(c) {
    var L = c.lines.map(function (l, i) { return { who: l[0], text: l[1], s: c.t[i][0], e: c.t[i][1] }; });
    var stagger = {};
    var F = c.fields.map(function (f) {
      var key = String(f[2]), n = stagger[key] = (stagger[key] || 0) + 1;
      var base = f[2] === 'ping' ? c.ping + 0.1 : L[f[2]].e + 0.15;
      var o = { k: f[0], v: f[1], t: base + (n - 1) * 0.4 };
      if (f.length > 4) { o.ft = L[f[3]].e + 0.15; o.fv = f[4]; }   /* a correction: the old value shows, then changes on the word */
      return o;
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
      g2.fillStyle = done ? (act === 'a' ? col.a : (act === 'c' || act === 'o' || act === 'd') ? col.c : col.n) : col.n;
      g2.fillRect(i * step + 1, (h - bh) / 2, Math.max(2, step - 2), bh);
    }
    g2.globalAlpha = 1;
    if (t < tl.total) { g2.fillStyle = col.a; g2.fillRect(Math.min(w - 1, t / tl.total * w), 0, 1, h); }
  }

  /* ---------- guided scroll: the page follows the call until the visitor scrolls ---------- */
  function navBottom() { var n = document.querySelector('nav.top'); return n ? Math.max(0, n.getBoundingClientRect().bottom) : 0; }
  function barTop() { var b = document.querySelector('[data-rail]'); var r = b && b.getBoundingClientRect(); return r && r.height && r.top > 0 && r.top < innerHeight && getComputedStyle(b).visibility !== 'hidden' ? r.top : innerHeight; }
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
    /* the host sets html{scroll-behavior:smooth}; a per-frame smooth scrollTo restarts its own
       animation every frame and creeps forever. Force 'auto' for this one call, then restore. */
    var hs = document.documentElement.style, sb = hs.scrollBehavior;
    hs.scrollBehavior = 'auto'; window.scrollTo(0, y + d * k); hs.scrollBehavior = sb;
  }
  function stopFollow() { follow = false; }
  ['wheel', 'touchmove'].forEach(function (n) { window.addEventListener(n, stopFollow, { passive: true }); });
  window.addEventListener('keydown', function (e) {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(e.key) >= 0 && !el.wave.contains(e.target) && !el.play.contains(e.target)) stopFollow();
  });

  /* ---------- render ---------- */
  var snapScript = false;
  function render(now) {
    var c = CALLS[cur], lis = el.script.children, nowEl = null, lastEl = null, i;
    for (i = 0; i < tl.L.length; i++) {
      var l = tl.L[i], st = t >= l.e ? 'past' : t >= l.s ? 'now' : '';
      lis[i].className = l.who + (st ? ' ' + st : '');
      if (st === 'now') nowEl = lis[i];
      if (st) lastEl = lis[i];
    }
    /* follow the line being spoken; in a silence (hold, a pause) stay on the last line said.
       A seek snaps there even while paused, so the script never shows a different moment than the clock. */
    var target = nowEl || lastEl;
    if (target && (playing || snapScript)) {
      var box = el.script, br = box.getBoundingClientRect(), lr = target.getBoundingClientRect();
      var want = box.scrollTop + (lr.top - br.top) - Math.max(0, (box.clientHeight - lr.height) / 2);
      box.scrollTop = (reduce || snapScript) ? want : box.scrollTop + (want - box.scrollTop) * 0.18;
    } else if (snapScript && !target) el.script.scrollTop = 0;
    snapScript = false;
    var rows = el.fields.children, on = 0;
    for (i = 0; i < tl.F.length; i++) {
      var f = tl.F[i], hit = t >= f.t; rows[i].classList.toggle('on', hit); if (hit) on++;
      if (f.ft != null) {
        var fx = t >= f.ft, dd = rows[i].lastChild, want = fx ? f.fv : f.v;
        if (dd.textContent !== want) dd.textContent = want;
        rows[i].classList.toggle('fixed', fx);
      }
    }
    var done = t >= tl.bookedT, ready = t === 0 && !playing;
    el.booked.classList.toggle('on', done);
    el.blab.textContent = done ? c.booked.label : ready ? 'Waiting for the call' : t < PICKUP ? 'Ringing' : 'AI Chauffeur is on the call';
    /* STATE LAW: word + class in one synchronous write; the chip has transition:none */
    var st = done ? ['is-done', c.booked.label] : ready ? ['is-wait', 'Waiting'] : t < PICKUP ? ['is-ring', 'Ringing'] : ['is-live', on + ' of ' + tl.F.length + ' lines'];
    el.status.className = 'sc-state ' + st[0]; el.status.textContent = st[1];
    el.clock.textContent = fmt(Math.min(t, tl.total)) + ' / ' + fmt(tl.total);
    var ch = el.chapters.children, marks = [PICKUP, tl.detailsT, tl.bookedT];
    var chNow = 0;
    for (i = 0; i < ch.length; i++) { var reached = t >= marks[i]; ch[i].classList.toggle('on', reached); if (reached) chNow = i; }
    for (i = 0; i < ch.length; i++) ch[i].classList.toggle('cur', i === chNow);
    el.wave.setAttribute('aria-valuenow', Math.round(t));
    el.wave.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(tl.total));
    var ps = playing ? 'playing' : 'idle';
    if (el.play.getAttribute('data-state') !== ps) { el.play.setAttribute('data-state', ps); el.glyph.innerHTML = playing ? PAUSE_SVG : PLAY_SVG; }
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
    player.src = '/audio/samples/v1/' + c.id + (m4a ? '.m4a' : '.mp3') + V;
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
    t = Math.max(0, Math.min(tl.total, x)); snapScript = true;
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
      a.className = 'sc-who'; a.textContent = WHO[l.who] || 'Caller'; b.className = 'sc-say'; b.textContent = l.text;
      li.appendChild(a); li.appendChild(b); el.script.appendChild(li);
    });
    tl.F.forEach(function (f) {
      var r = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      r.className = 'sc-row'; dt.textContent = f.k; dd.textContent = f.v; r.appendChild(dt); r.appendChild(dd); el.fields.appendChild(r);
    });
    el.bbig.textContent = c.booked.big; el.bsmall.textContent = c.booked.small;
    [[PICKUP, 'Answered'], [tl.detailsT, c.chap || 'Trip taken'], [tl.bookedT, c.booked.label]].forEach(function (m, k) {
      var d = document.createElement('div'); d.className = 'sc-chap' + (k > 0 ? ' r' : ''); d.style.left = (m[0] / tl.total * 100) + '%'; d.textContent = m[1]; el.chapters.appendChild(d);
    });
    fitChapters();
    if (el.nextName) el.nextName.textContent = (CALLS[(i + 1) % CALLS.length].ref || CALLS[(i + 1) % CALLS.length].tab.toLowerCase());
    el.wave.setAttribute('aria-valuemax', Math.round(tl.total));
    el.script.scrollTop = 0;
    t = 0;                                 /* rest state: READY. Empty ticket, 0:00. The HTML still ships the finished call for no-JS readers. */
    if (autoplay) play(); else render(performance.now());
    /* no hash writes on this host: #demo, #faq … are the section anchors the gates load */
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

  if ('ResizeObserver' in window) new ResizeObserver(function () { if (tl) draw(performance.now()); }).observe(el.wave);
  if ('MutationObserver' in window) new MutationObserver(function () { colors(); if (tl) draw(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* deep link: ?call=<id> picks the call and brings #demo up (the hash stays the section anchor) */
  colors();
  var want = (location.search.match(/[?&]call=([^&#]+)/) || [])[1] || '', idx = -1;
  CALLS.forEach(function (c, i) { if (c.id === want) idx = i; });
  load(idx < 0 ? 0 : idx, false, true);
  if (idx >= 0) { var sec = document.getElementById('demo'); if (sec) requestAnimationFrame(function () { sec.scrollIntoView({ block: 'start' }); }); }
})();
