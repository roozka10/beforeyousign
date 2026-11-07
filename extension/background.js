import { API_BASE, CACHE_DAYS } from "./config.js";

const CACHE_MS = CACHE_DAYS * 24 * 60 * 60 * 1000;
const MAX_HTML = 2_000_000;

const siteKey = (host) => `verdict:${host.replace(/^www\./, "")}`;

/** Fetch a terms/privacy page. Runs here because content scripts can't fetch other sites. */
async function fetchPage(url) {
  const u = new URL(url);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad url");
  const res = await fetch(u.href, { credentials: "omit", redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.includes("html") && !type.includes("text")) throw new Error("not a web page");
  const html = await res.text();
  return html.slice(0, MAX_HTML);
}

async function analyze(site, pages) {
  const res = await fetch(`${API_BASE}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: "terms", site, pages }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.verdict) throw new Error(data?.error || "The AI glitched, try again in a sec.");
  return data.verdict;
}

async function getCached(host) {
  const key = siteKey(host);
  const { [key]: hit } = await chrome.storage.local.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case "fetchPage":
        return { html: await fetchPage(msg.url) };
      case "getCached":
        return { hit: await getCached(msg.host) };
      case "analyze": {
        const verdict = await analyze(msg.site, msg.pages);
        const entry = { verdict, links: msg.links, at: Date.now() };
        await chrome.storage.local.set({ [siteKey(msg.host)]: entry });
        return { hit: entry };
      }
      case "settings": {
        const { autoCheck = true, hidden = [] } = await chrome.storage.local.get(["autoCheck", "hidden"]);
        return { autoCheck, hidden };
      }
      case "hideSite": {
        const { hidden = [] } = await chrome.storage.local.get("hidden");
        if (!hidden.includes(msg.host)) hidden.push(msg.host);
        await chrome.storage.local.set({ hidden });
        return { ok: true };
      }
      default:
        throw new Error("unknown message");
    }
  })()
    .then((r) => sendResponse({ ok: true, ...r }))
    .catch((e) => sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  return true; // async response
});
