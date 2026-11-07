const LABELS = { nah: "you're good 👍", careful: "kinda sus 👀", bad: "bad, think twice 🚩" };
const checkBtn = document.getElementById("check");
const auto = document.getElementById("auto");
const site = document.getElementById("site");

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const host = (() => {
  try {
    const u = new URL(tab?.url || "");
    return /^https?:$/.test(u.protocol) ? u.hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
})();

const { autoCheck = true } = await chrome.storage.local.get("autoCheck");
auto.checked = autoCheck;
auto.addEventListener("change", () => chrome.storage.local.set({ autoCheck: auto.checked }));

if (!host) {
  checkBtn.disabled = true;
  checkBtn.textContent = "open a website first";
} else {
  const key = `verdict:${host}`;
  const { [key]: hit } = await chrome.storage.local.get(key);
  if (hit) {
    site.hidden = false;
    site.append("Last check on ", Object.assign(document.createElement("b"), { textContent: host }), `: ${LABELS[hit.verdict.verdict] || ""}`);
  }
}

checkBtn.addEventListener("click", async () => {
  checkBtn.disabled = true;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "checkNow" });
    window.close();
  } catch {
    // Page was open before the extension was installed: reload once, then it works.
    checkBtn.disabled = false;
    checkBtn.textContent = "refresh the page, then try again 🙏";
  }
});
