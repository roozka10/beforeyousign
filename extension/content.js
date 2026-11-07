// beforeyousign: spots sign-up pages, reads the site's terms + privacy policy,
// and shows a little pop-up saying if it's bad or nah.
(() => {
  if (window.top !== window || window.__bysLoaded) return;
  window.__bysLoaded = true;

  const HOST = location.hostname.replace(/^www\./, "");
  const SIGNUP_WORDS = /\b(sign ?up|create (an |your |a free )?account|register|join (now|free|for free|us)|get started|start (your )?free trial|open an account|new account)\b/i;
  const LOGIN_ONLY = /\b(log ?in|sign ?in)\b/i;
  const TERMS_RE = /\b(terms|tos|conditions|user agreement|eula|terms[-_ ]of[-_ ](use|service))\b/i;
  const PRIVACY_RE = /\b(privacy|data policy|cookie policy)\b/i;

  let running = false;
  let checkedThisPage = false;
  let ui = null;

  const send = (msg) =>
    new Promise((resolve, reject) =>
      chrome.runtime.sendMessage(msg, (r) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!r?.ok) return reject(new Error(r?.error || "something broke"));
        resolve(r);
      })
    );

  // ─── Detection ──────────────────────────────────────────────────────────
  const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

  function looksLikeSignup() {
    const pw = [...document.querySelectorAll('input[type="password"]')].filter(visible);
    const email = [...document.querySelectorAll('input[type="email"], input[autocomplete="email"], input[name*="email" i]')].filter(visible);
    if (!pw.length && !email.length) return false;

    const actionText = [...document.querySelectorAll('button, input[type="submit"], [role="button"], h1, h2, h3, legend, label')]
      .filter(visible)
      .map((el) => el.innerText || el.value || "")
      .join(" | ")
      .slice(0, 6000);

    const confirmPw = pw.length >= 2 || document.querySelector('input[autocomplete="new-password"]');
    const agreeBox = [...document.querySelectorAll('input[type="checkbox"]')].some((cb) => {
      const t = (cb.closest("label, div, p")?.innerText || "").slice(0, 300);
      return /agree|accept/i.test(t) && (TERMS_RE.test(t) || PRIVACY_RE.test(t));
    });
    const signupWords = SIGNUP_WORDS.test(actionText) || SIGNUP_WORDS.test(location.pathname.replace(/[-_/]/g, " "));
    const onlyLogin = LOGIN_ONLY.test(actionText) && !SIGNUP_WORDS.test(actionText) && !confirmPw;

    return !onlyLogin && (signupWords || confirmPw || agreeBox);
  }

  function findPolicyLinks() {
    const links = [...document.querySelectorAll("a[href]")]
      .map((a) => ({ a, text: `${a.innerText} ${a.getAttribute("aria-label") || ""}`.trim(), href: a.href }))
      .filter(({ href }) => /^https?:/i.test(href) && !/\.(pdf|zip|png|jpe?g)(\?|$)/i.test(href));

    const pick = (re) => {
      const hits = links.filter(({ text, href }) => re.test(text) || re.test(decodeURIComponent(new URL(href).pathname).replace(/[-_/]/g, " ")));
      // Prefer links on this site, then links with the word in the visible text.
      hits.sort((x, y) => {
        const sx = (new URL(x.href).hostname.endsWith(HOST) ? 2 : 0) + (re.test(x.text) ? 1 : 0);
        const sy = (new URL(y.href).hostname.endsWith(HOST) ? 2 : 0) + (re.test(y.text) ? 1 : 0);
        return sy - sx;
      });
      return hits[0]?.href.split("#")[0];
    };

    const out = [];
    const terms = pick(TERMS_RE);
    const privacy = pick(PRIVACY_RE);
    if (terms) out.push({ kind: "Terms", url: terms });
    if (privacy && privacy !== terms) out.push({ kind: "Privacy", url: privacy });
    if (!out.length) {
      out.push({ kind: "Terms", url: `${location.origin}/terms` }, { kind: "Privacy", url: `${location.origin}/privacy` });
    }
    return out;
  }

  /** Turn fetched HTML into plain text. DOMParser never runs the page's scripts. */
  function htmlToText(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, noscript, svg, nav, header, footer, form, iframe, template").forEach((n) => n.remove());
    const root = doc.querySelector("main, article, [role=main], #content, .content") || doc.body;
    return (root?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function pageText() {
    const root = document.querySelector("main, article, [role=main]") || document.body;
    return (root.innerText || "").replace(/\s+/g, " ").trim();
  }

  // ─── The check ──────────────────────────────────────────────────────────
  async function check({ manual = false } = {}) {
    if (running) return;
    running = true;
    checkedThisPage = true;
    showCard();
    renderLoading("reading their fine print so you don't have to…");

    try {
      if (!manual) {
        const { hit } = await send({ type: "getCached", host: HOST });
        if (hit) return renderVerdict(hit, true);
      }

      const pages = [];
      const links = [];

      // Already on a terms/privacy page? Read this page directly.
      const here = pageText();
      if (manual && (TERMS_RE.test(document.title + location.pathname) || PRIVACY_RE.test(document.title + location.pathname)) && here.length > 1500) {
        pages.push({ url: location.href, text: here });
        links.push({ kind: PRIVACY_RE.test(document.title + location.pathname) ? "Privacy" : "Terms", url: location.href });
      } else {
        for (const link of findPolicyLinks()) {
          renderLoading(`reading their ${link.kind.toLowerCase()} page…`);
          try {
            const { html } = await send({ type: "fetchPage", url: link.url });
            const text = htmlToText(html);
            if (text.length > 400) {
              pages.push({ url: link.url, text: text.slice(0, 14000) });
              links.push(link);
            }
          } catch {
            /* skip this one */
          }
        }
      }

      if (!pages.length) {
        return renderError(
          "couldn't find or open their terms from here 😕",
          "open their Terms or Privacy page, then click the beforeyousign button up top."
        );
      }

      renderLoading("ok thinking about it…");
      const { hit } = await send({ type: "analyze", host: HOST, site: HOST, pages, links });
      renderVerdict(hit, false);
    } catch (e) {
      renderError("my brain glitched 😵", e.message || "try again in a sec");
    } finally {
      running = false;
    }
  }

  // ─── UI (shadow DOM so the site's CSS can't touch it) ───────────────────
  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .wrap { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; font: 14px/1.45 ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", sans-serif; color: #fff; }
  .card { width: 340px; max-width: calc(100vw - 32px); max-height: min(560px, calc(100vh - 40px)); overflow: auto; background: #1f1f1f; border: 1px solid #333; border-radius: 22px; padding: 16px; box-shadow: 0 24px 60px -12px rgba(0,0,0,.6), 0 0 0 1px rgba(225,102,63,.08), 0 0 40px rgba(225,102,63,.18); animation: in .45s cubic-bezier(.2,.9,.3,1.25) both; transform-origin: bottom right; }
  .card.out { animation: out .2s ease-in forwards; }
  @keyframes in { from { opacity: 0; transform: translateY(16px) scale(.9); } }
  @keyframes out { to { opacity: 0; transform: translateY(10px) scale(.95); } }
  .top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .brand { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12px; letter-spacing: .02em; color: #a1a1a1; }
  .brand img { width: 20px; height: 20px; border-radius: 6px; }
  .x { margin-left: auto; width: 28px; height: 28px; border: 0; border-radius: 10px; background: #2a2a2a; color: #bbb; cursor: pointer; font-size: 16px; line-height: 1; }
  .x:hover { background: #333; color: #fff; }
  .x:focus-visible, button:focus-visible, a:focus-visible { outline: 3px solid rgba(225,102,63,.6); outline-offset: 2px; }
  .hero { display: flex; gap: 14px; align-items: center; }
  .orb { position: relative; flex: none; width: 64px; height: 64px; display: grid; place-items: center; animation: bob 2.6s ease-in-out infinite; }
  .orb::before { content: ""; position: absolute; inset: -6px; border-radius: 50%; background: radial-gradient(circle, rgba(225,102,63,.45), transparent 68%); filter: blur(6px); }
  .orb img { position: relative; width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0 6px 10px rgba(0,0,0,.45)); }
  .orb.think::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; background: conic-gradient(transparent 0 60%, #e1663f 85%, #fbc6ad); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px)); animation: spin 1s linear infinite; }
  .orb.think img { animation: tilt 1.2s ease-in-out infinite; }
  .orb .mood { position: absolute; right: -4px; bottom: -2px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; border: 2px solid #1f1f1f; }
  .orb.o img { animation: shake .5s ease-in-out 2; }
  @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes tilt { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
  @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-3px) rotate(-4deg); } 75% { transform: translateX(3px) rotate(4deg); } }
  .label { font-size: 22px; font-weight: 800; letter-spacing: -.01em; line-height: 1.15; }
  .label.nah { color: #4ade80; } .label.careful { color: #fbbf24; } .label.bad { color: #f87171; }
  .head { color: #e5e5e5; margin-top: 2px; }
  .muted { color: #a1a1a1; font-size: 13px; }
  .bar { height: 6px; border-radius: 99px; background: #2c2c2c; overflow: hidden; margin: 14px 0 4px; }
  .bar > i { display: block; height: 100%; border-radius: 99px; width: 0; transition: width .9s cubic-bezier(.2,.8,.2,1); }
  .score { display: flex; justify-content: space-between; font-size: 11px; color: #8a8a8a; }
  ul { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 8px; }
  li { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; background: #262626; border-radius: 14px; animation: in .4s cubic-bezier(.2,.9,.3,1.2) both; }
  li .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; margin-top: 7px; }
  .dot.high { background: #f87171; box-shadow: 0 0 8px rgba(248,113,113,.7); } .dot.medium { background: #fbbf24; } .dot.low { background: #737373; }
  .good { margin-top: 10px; padding: 10px 12px; border-radius: 14px; background: rgba(74,222,128,.08); color: #bbf7d0; font-size: 13px; }
  .foot { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; margin-top: 14px; font-size: 12px; color: #8a8a8a; }
  .foot a { color: #f0956a; text-decoration: none; } .foot a:hover { text-decoration: underline; }
  .linkbtn { background: none; border: 0; padding: 0; color: #8a8a8a; font: inherit; cursor: pointer; text-decoration: underline; }
  .btn { margin-top: 12px; width: 100%; height: 40px; border: 0; border-radius: 12px; background: #e1663f; color: #fff; font: 700 14px/1 inherit; font-family: inherit; cursor: pointer; box-shadow: 0 0 24px rgba(225,102,63,.35); }
  .btn:hover { background: #d0552f; }
  .bubble { width: 56px; height: 56px; border-radius: 50%; border: 0; cursor: pointer; padding: 0; background: #1f1f1f; box-shadow: 0 10px 30px rgba(0,0,0,.5), 0 0 0 2px #e1663f; animation: in .35s cubic-bezier(.2,.9,.3,1.3) both; display: grid; place-items: center; }
  .bubble img { width: 40px; height: 40px; }
  .bubble .badge { position: absolute; top: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #1f1f1f; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  `;

  const LABELS = {
    nah: { text: "you're good 👍", color: "#4ade80", mouth: "smile" },
    careful: { text: "kinda sus 👀", color: "#fbbf24", mouth: "flat" },
    bad: { text: "bad, think twice 🚩", color: "#f87171", mouth: "o" },
  };

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "style") n.setAttribute("style", v);
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const kid of kids) if (kid != null) n.append(kid); // strings become text nodes, never HTML
    return n;
  };

  /** The brand logo, with a little mood badge once there's a verdict. */
  function orb(mood) {
    const o = el("div", { class: `orb ${mood}`, "aria-hidden": "true" }, el("img", { src: chrome.runtime.getURL("icons/icon128.png"), alt: "" }));
    const badge = { smile: ["#4ade80", "✓"], flat: ["#fbbf24", "!"], o: ["#f87171", "✕"] }[mood];
    if (badge) o.append(el("span", { class: "mood", style: `background:${badge[0]};color:#1f1f1f;font-weight:900` }, badge[1]));
    return o;
  }

  function showCard() {
    if (!ui) {
      const host = document.createElement("beforeyousign-popup");
      const root = host.attachShadow({ mode: "closed" });
      root.append(el("style", {}, CSS));
      const wrap = el("div", { class: "wrap" });
      root.append(wrap);
      document.documentElement.append(host);
      ui = { host, wrap, card: null, last: null };
      document.addEventListener("keydown", (e) => e.key === "Escape" && ui?.card && minimize());
    }
    if (!ui.card) {
      ui.wrap.textContent = "";
      ui.card = el("div", { class: "card", role: "dialog", "aria-label": "beforeyousign terms check", "aria-live": "polite" });
      ui.wrap.append(ui.card);
    }
  }

  function topBar() {
    return el(
      "div",
      { class: "top" },
      el("div", { class: "brand" }, el("img", { src: chrome.runtime.getURL("icons/icon48.png"), alt: "" }), "beforeyousign"),
      el("button", { class: "x", "aria-label": "Minimize", title: "Minimize (Esc)", onclick: minimize }, "×")
    );
  }

  function setCard(...kids) {
    showCard();
    ui.card.textContent = "";
    ui.card.append(topBar(), ...kids);
  }

  function renderLoading(text) {
    setCard(el("div", { class: "hero" }, orb("think"), el("div", {}, el("div", { class: "label", style: "font-size:18px" }, "one sec…"), el("div", { class: "muted" }, text))));
  }

  function renderError(title, sub) {
    setCard(
      el("div", { class: "hero" }, orb("flat"), el("div", {}, el("div", { class: "label", style: "font-size:17px" }, title), el("div", { class: "muted" }, sub))),
      el("button", { class: "btn", onclick: () => check({ manual: true }) }, "try again")
    );
  }

  function renderVerdict(hit, fromCache) {
    const v = hit.verdict;
    const L = LABELS[v.verdict] || LABELS.careful;
    ui.last = v.verdict;

    const fill = el("i", { style: `background:${L.color}` });
    const list = el("ul");
    v.points.forEach((p, i) => list.append(el("li", { style: `animation-delay:${120 + i * 70}ms` }, el("span", { class: `dot ${p.severity}`, title: p.severity }), el("span", {}, p.text))));

    const foot = el("div", { class: "foot" });
    (hit.links || []).forEach((l) => foot.append(el("a", { href: l.url, target: "_blank", rel: "noopener noreferrer" }, `read their ${l.kind.toLowerCase()} ↗`)));
    if (fromCache) foot.append(el("button", { class: "linkbtn", onclick: () => check({ manual: true }) }, "re-check"));
    foot.append(el("button", { class: "linkbtn", onclick: hideSite }, "don't show on this site"));

    setCard(
      el("div", { class: "hero" }, orb(L.mouth), el("div", {}, el("div", { class: `label ${v.verdict}` }, L.text), el("div", { class: "head" }, v.headline))),
      el("div", { class: "bar" }, fill),
      el("div", { class: "score" }, el("span", {}, "sketchy"), el("span", {}, `safety ${v.score}/100`), el("span", {}, "chill")),
      v.points.length ? list : el("div", { class: "good" }, "nothing scary jumped out ✨"),
      v.goodStuff ? el("div", { class: "good" }, `✓ ${v.goodStuff}`) : null,
      foot,
      el("div", { class: "muted", style: "margin-top:8px;font-size:11px" }, "AI summary, not legal advice. Double check anything that matters.")
    );
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = `${Math.max(4, v.score)}%`)));
  }

  function minimize() {
    if (!ui?.card) return;
    const card = ui.card;
    card.classList.add("out");
    setTimeout(() => {
      ui.card = null;
      ui.wrap.textContent = "";
      const badgeColor = ui.last ? LABELS[ui.last].color : "#e1663f";
      ui.wrap.append(
        el(
          "button",
          { class: "bubble", "aria-label": "Open beforeyousign terms check", title: "beforeyousign", style: "position:relative", onclick: reopen },
          el("img", { src: chrome.runtime.getURL("icons/icon48.png"), alt: "" }),
          el("span", { class: "badge", style: `background:${badgeColor}` })
        )
      );
    }, 180);
  }

  async function reopen() {
    const { hit } = await send({ type: "getCached", host: HOST }).catch(() => ({}));
    if (hit) {
      ui.card = null;
      showCard();
      renderVerdict(hit, true);
    } else check({ manual: true });
  }

  async function hideSite() {
    await send({ type: "hideSite", host: HOST }).catch(() => {});
    ui?.host.remove();
    ui = null;
  }

  // ─── Wiring ─────────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "checkNow") {
      if (ui && !ui.card) ui.wrap.textContent = "";
      if (ui) ui.card = null;
      check({ manual: true });
      sendResponse({ ok: true });
    }
  });

  async function maybeAutoCheck() {
    if (checkedThisPage || running) return;
    if (!looksLikeSignup()) return;
    const { autoCheck, hidden } = await send({ type: "settings" }).catch(() => ({ autoCheck: false, hidden: [] }));
    if (!autoCheck || hidden.includes(HOST) || checkedThisPage) return;
    check();
  }

  // Sign-up forms often appear late (SPAs, modals), so watch for a bit.
  let timer = 0;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(maybeAutoCheck, 700);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 60_000);
  maybeAutoCheck();
  // SPA route changes
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      checkedThisPage = false;
      maybeAutoCheck();
    }
  }, 1000);
})();
