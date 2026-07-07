/* ava-webcall.js — browser demo call via Retell Web SDK. DORMANT until /api/web-call
   is configured (RETELL_API_KEY + RETELL_AVA_WEB_AGENT_ID) and a [data-webcall] flips to "on".
   Loads retell-client-js-sdk from jsDelivr on demand. 3-minute client backstop. */
(function () {
  "use strict";
  var client = null, timer = null;
  var orb = document.querySelector('[data-orb]');

  async function load() {
    var m = await import('https://cdn.jsdelivr.net/npm/retell-client-js-sdk/+esm');
    return m.RetellWebClient;
  }

  window.AVA_startWebCall = async function (statusEl) {
    function say(t) { if (statusEl) statusEl.textContent = t; }
    try {
      say('Connecting AVA in your browser…');
      var resp = await fetch('/api/web-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!resp.ok) { say('Browser call unavailable right now — use the phone call above.'); return; }
      var data = await resp.json();
      var RetellWebClient = await load();
      client = new RetellWebClient();

      client.on('call_started', function () { say('🎙 You\'re on with AVA — talk.'); });
      client.on('agent_start_talking', function () { if (orb) orb.style.transform = 'scale(1.5)'; });
      client.on('agent_stop_talking', function () { if (orb) orb.style.transform = 'scale(1)'; });
      client.on('update', function (u) {
        if (u && u.transcript && u.transcript.length && statusEl) {
          var last = u.transcript[u.transcript.length - 1];
          statusEl.textContent = (last.role === 'agent' ? 'AVA: ' : 'You: ') + last.content;
        }
      });
      client.on('call_ended', function () { cleanup(); say('Call ended. Want AVA on your real line? Book below.'); });
      client.on('error', function () { cleanup(); say('Call error — try the phone call above.'); });

      await client.startCall({ accessToken: data.access_token });
      timer = setTimeout(function () { try { client.stopCall(); } catch (e) {} }, 3 * 60 * 1000);
    } catch (e) {
      say('Browser call unavailable — use the phone call above.');
      cleanup();
    }
  };

  function cleanup() { clearTimeout(timer); if (orb) orb.style.transform = 'scale(1)'; }
})();
