// Where the beforeyousign app is deployed. The extension calls its /api/ai route,
// which holds the OpenRouter key on the server. The key is never inside the extension
// (anyone can unzip an extension and read it).
// For local testing with `npm run dev`, change this to "http://localhost:8080".
export const API_BASE = "https://beforeyousign.vercel.app";

// Remember each site's verdict for a week so we don't spend AI requests twice.
export const CACHE_DAYS = 7;
