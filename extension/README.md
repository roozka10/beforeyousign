# beforeyousign: terms checker (Chrome extension)

Signing up for a website? This little orb reads the site's **Terms** and **Privacy Policy** and pops up with a plain-words verdict: *you're good 👍*, *kinda sus 👀* or *bad, think twice 🚩*, plus the worst stuff it found.

## How it works
- `content.js` spots sign-up pages (password/email field + "sign up / create account / agree to terms"), finds the Terms + Privacy links, and shows the pop-up.
- `background.js` downloads those pages and sends their text to the app's `/api/ai` route (`task: "terms"`).
- The OpenRouter key lives **only on the server** (`OPENROUTER_API_KEY` on Vercel). It's never in the extension, since anyone can unzip an extension and read it.
- Each site's verdict is cached for 7 days to save AI requests.

## Install (dev)
1. Chrome → `chrome://extensions` → turn on **Developer mode**
2. **Load unpacked** → pick this `extension/` folder
3. Visit any sign-up page, or click the toolbar icon → **Is this site bad or nah?**

Using a local dev server? Set `API_BASE` in `config.js` to `http://localhost:8080`.

## Publish
Zip the folder contents (`cd extension && zip -r ../beforeyousign-extension.zip .`) and upload to the Chrome Web Store dashboard.
