/**
 * Server-only. Runs inside the Vercel function (api/ai.ts) and the Vite dev server.
 * Holds the OpenRouter key, builds every prompt itself, and only does the three
 * jobs the app needs, so nobody can use /api/ai as a free general chatbot.
 */
import {
  AI_MODELS,
  MAX_CONTRACT_CHARS,
  MAX_HISTORY_TURNS,
  MAX_QUESTION_CHARS,
  buildAnalyzeUserMessage,
  extractMessageText,
  getAILawyerPrompt,
  getFollowUpPrompt,
  normalizeAnalysis,
  parseJsonObject,
  type ChatTurn,
} from "../services/ai-lawyer.js";
import {
  MAX_TERMS_CHARS,
  buildTermsUserMessage,
  getTermsPrompt,
  normalizeTermsVerdict,
} from "../services/terms-check.js";
import { normalizeSeverity, type Problem } from "../lib/problems.js";

export interface AiResult {
  status: number;
  body: Record<string, unknown>;
}

type Message = { role: "system" | "user" | "assistant"; content: string };

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "");
const fail = (status: number, error: string): AiResult => ({ status, body: { error } });

class ProviderError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Message[],
  opts: { temperature: number; maxTokens: number }
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://www.beforeyousign.lol",
      "X-Title": "beforeyousign",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      // Nemotron "thinks" by default and burns the whole token budget on hidden
      // reasoning, which came back as an empty, cut-off reply. Off = ~1.5s answers.
      reasoning: { enabled: false },
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { message?: unknown } } | null;
    const msg = data?.error?.message;
    throw new ProviderError(typeof msg === "string" ? msg : `${res.status} ${res.statusText}`, res.status);
  }
  const data = (await res.json()) as { choices?: { message?: unknown; finish_reason?: string }[] };
  const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined;
  const content = extractMessageText(choice?.message);
  if (!content) throw new ProviderError("empty response", 502);
  if (choice?.finish_reason === "length") throw new ProviderError("response cut off", 502);
  return content;
}

/** Try each model until one gives a reply that passes `check`. */
async function withFallback<T>(
  apiKey: string,
  messages: Message[],
  opts: { temperature: number; maxTokens: number },
  check: (content: string) => T
): Promise<T> {
  let last: unknown;
  for (const model of AI_MODELS) {
    try {
      return check(await callOpenRouter(apiKey, model, messages, opts));
    } catch (e) {
      last = e;
      console.warn(`[ai] ${model} failed:`, e instanceof Error ? e.message : e);
      // A bad key won't work on any model, so stop early.
      if (e instanceof ProviderError && (e.status === 401 || e.status === 403)) break;
    }
  }
  throw last;
}

function friendlyError(e: unknown): AiResult {
  if (e instanceof ProviderError) {
    if (e.status === 401 || e.status === 403) return fail(500, "The AI key on the server is wrong or expired.");
    if (e.status === 429) return fail(429, "The AI is getting too many requests right now. Wait a minute and try again.");
    if (e.status === 402) return fail(402, "The AI is out of credits for today. Try again tomorrow.");
  }
  return fail(502, "The AI glitched. Try again in a sec.");
}

export async function handleAiRequest(input: unknown, apiKey: string | undefined): Promise<AiResult> {
  if (!apiKey) return fail(500, "AI isn't set up yet: OPENROUTER_API_KEY is missing on the server.");
  if (!input || typeof input !== "object") return fail(400, "Bad request");
  const body = input as Record<string, unknown>;

  try {
    switch (body.task) {
      case "analyze": {
        const text = str(body.text, MAX_CONTRACT_CHARS + 1000);
        if (!text.trim()) return fail(400, "That file looks empty.");
        const messages: Message[] = [
          { role: "system", content: getAILawyerPrompt({ location: str(body.location, 80) || "United States" }) },
          { role: "user", content: buildAnalyzeUserMessage(text, str(body.fileName, 200) || "document") },
        ];
        const content = await withFallback(apiKey, messages, { temperature: 0.3, maxTokens: 3000 }, (c) => {
          normalizeAnalysis(parseJsonObject(c)); // throws → next model
          return c;
        });
        return { status: 200, body: { content } };
      }

      case "ask": {
        const question = str(body.question, MAX_QUESTION_CHARS).trim();
        if (!question) return fail(400, "Ask something first 👀");
        const a = (body.analysis ?? {}) as Record<string, unknown>;
        const problems: Problem[] = (Array.isArray(a.problems) ? a.problems : [])
          .slice(0, 10)
          .map((p) => ({
            comment: str((p as Record<string, unknown>)?.comment, 300),
            severity: normalizeSeverity((p as Record<string, unknown>)?.severity),
          }))
          .filter((p) => p.comment);
        const history: ChatTurn[] = (Array.isArray(body.history) ? body.history : [])
          .slice(-MAX_HISTORY_TURNS)
          .filter((t): t is ChatTurn => !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
          .map((t) => ({ role: t.role, content: t.content.slice(0, 1500) }));
        const messages: Message[] = [
          {
            role: "system",
            content: getFollowUpPrompt(str(body.documentText, MAX_CONTRACT_CHARS), {
              documentType: str(a.documentType, 60) || "document",
              vibeCheck: str(a.vibeCheck, 300),
              problems,
            }),
          },
          ...history,
          { role: "user", content: question },
        ];
        const content = await withFallback(apiKey, messages, { temperature: 0.4, maxTokens: 400 }, (c) => c);
        return { status: 200, body: { content } };
      }

      case "terms": {
        const site = str(body.site, 120) || "this site";
        const pages = (Array.isArray(body.pages) ? body.pages : [])
          .slice(0, 3)
          .map((p) => ({ url: str(p?.url, 300), text: str(p?.text, MAX_TERMS_CHARS) }))
          .filter((p) => p.text.trim().length > 200);
        if (!pages.length) return fail(400, "Couldn't find any terms text to read.");
        const messages: Message[] = [
          { role: "system", content: getTermsPrompt(site) },
          { role: "user", content: buildTermsUserMessage(site, pages) },
        ];
        const verdict = await withFallback(apiKey, messages, { temperature: 0.3, maxTokens: 1200 }, (c) =>
          normalizeTermsVerdict(parseJsonObject(c))
        );
        return { status: 200, body: { verdict } };
      }

      default:
        return fail(400, "Unknown task");
    }
  } catch (e) {
    return friendlyError(e);
  }
}
