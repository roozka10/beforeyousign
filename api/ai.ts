import { handleAiRequest } from "../src/server/ai-handler.js";

// The OpenRouter key lives only here, as a Vercel env var (never VITE_*, never in the browser).
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const { status, body: out } = await handleAiRequest(body, process.env.OPENROUTER_API_KEY);
  return Response.json(out, { status, headers: { "Cache-Control": "no-store" } });
}
