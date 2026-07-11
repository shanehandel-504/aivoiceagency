/* ===== AVA WORK DECK — shared kit JS =============================
   Soft passcode gate (FIFTHGEAR), PWA registration, copy + toast.
   The gate is a speed bump, NOT a security boundary: no real secrets,
   keys, or private numbers ever live behind it. ===================== */
(function () {
  "use strict";
  var PASS = "FIFTHGEAR";
  var KEY = "workDeckUnlocked";

  /* ---- gate submit (unlock persists across the whole /work family) ---- */
  var form = document.getElementById("gateForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("gateInput");
      var err = document.getElementById("gateErr");
      var v = (input && input.value || "").trim().toUpperCase();
      if (v === PASS) {
        try { localStorage.setItem(KEY, "1"); } catch (_) {}
        document.documentElement.classList.add("unlocked");
      } else {
        if (err) err.style.display = "block";
        if (input) { input.value = ""; input.focus(); }
      }
    });
  }

  /* ---- toast ---- */
  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    // force reflow so re-trigger animates
    void toastEl.offsetWidth;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1600);
  }

  /* ---- copy-to-clipboard (clipboard API + execCommand fallback) ---- */
  function copyText(text, label) {
    function done() { toast((label || "Copied") + " ✓"); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else { fallback(); }
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", "");
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
        done();
      } catch (_) { toast("Copy failed — select manually"); }
    }
  }
  window.WorkDeck = { copyText: copyText, toast: toast };

  /* ---- delegated copy: any [data-copy] target copies its own text
          or the text of the selector in data-copy-src ---- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    var src = btn.getAttribute("data-copy-src");
    var text = src ? (document.querySelector(src) || {}).textContent : btn.getAttribute("data-copy");
    if (text != null) copyText(text.trim(), btn.getAttribute("data-copy-label") || "Copied");
  });

  /* ---- PWA: register the /work service worker (scope = /work/ only) ---- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/work/sw.js", { scope: "/work/" }).catch(function () {});
    });
  }
})();
