// A "problem" is one Gen Z comment the AI leaves on a document.
// key_issues in Supabase is text[], so each problem is stored as a small
// JSON string. Older rows hold plain strings; decodeProblem handles both.

export type Severity = "high" | "medium" | "low";

export interface Problem {
  /** Casual, human callout, e.g. "they can drop your pay with 2 weeks notice 😬" */
  comment: string;
  /** Short exact snippet from the document that the comment is about */
  quote?: string;
  severity: Severity;
}

const SEVERITIES: Severity[] = ["high", "medium", "low"];

export function normalizeSeverity(value: unknown): Severity {
  return SEVERITIES.includes(value as Severity) ? (value as Severity) : "medium";
}

export function encodeProblem(p: Problem): string {
  return JSON.stringify({ c: p.comment, q: p.quote ?? "", s: p.severity });
}

export function decodeProblem(raw: string): Problem {
  if (typeof raw === "string" && raw.startsWith("{")) {
    try {
      const o = JSON.parse(raw) as { c?: unknown; q?: unknown; s?: unknown };
      if (typeof o.c === "string") {
        return {
          comment: o.c,
          quote: typeof o.q === "string" && o.q ? o.q : undefined,
          severity: normalizeSeverity(o.s),
        };
      }
    } catch {
      /* fall through to plain string */
    }
  }
  return { comment: String(raw ?? ""), severity: "medium" };
}

export const SEVERITY_META: Record<Severity, { emoji: string; label: string }> = {
  high: { emoji: "🚩", label: "big deal" },
  medium: { emoji: "👀", label: "watch out" },
  low: { emoji: "🤏", label: "small thing" },
};
