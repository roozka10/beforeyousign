export interface ContractAnalysis {
  overallScore: number;
  clarity: number;
  fairness: number;
  riskLevel: "low" | "medium" | "high";
  keyIssues: string[];
  simpleExplanation: string;
}

export interface UserContext {
  location: string;
  documentType?: string;
  exitTerms?: string;
  controlBalance?: string;
  mainConcern?: string;
}

const getAILawyerPrompt = (context?: UserContext): string => {
  let locationContext = "United States";
  let documentContext = "this contract";

  if (context?.location) {
    locationContext = context.location;
    if (context.documentType) {
      const docTypeMap: Record<string, string> = {
        freelance: "freelance contract",
        job: "job offer",
        nda: "NDA",
        random: "contract"
      };
      documentContext = docTypeMap[context.documentType] || "this contract";
    }
  }

  return `Explain this contract in plain, simple language. Be brief and direct.

LOCATION: ${locationContext}
DOCUMENT: ${documentContext}

Return only one valid JSON object with exactly these fields:
{"overallScore":0,"clarity":0,"fairness":0,"riskLevel":"low","keyIssues":["","",""],"simpleExplanation":""}

Use scores from 0 to 100. Set riskLevel to low, medium, or high. Give exactly 3 short key issues (one sentence each). Keep simpleExplanation to 2 short sentences. Do not include markdown or text outside the JSON.`;
};

const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it:free";
const FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning:free";
const MODELS_TO_TRY = [DEFAULT_MODEL, FALLBACK_MODEL];
const MAX_CONTRACT_CHARS = 24_000;

function extractMessageText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const msg = message as Record<string, unknown>;
  const chunks: string[] = [];

  const collect = (value: unknown) => {
    if (!value) return;
    if (typeof value === "string") {
      if (value.trim()) chunks.push(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) collect(item);
      return;
    }
    if (typeof value === "object") {
      const part = value as Record<string, unknown>;
      collect(part.text);
      collect(part.content);
      collect(part.summary);
    }
  };

  collect(msg.content);

  return chunks.join("\n").trim();
}

export async function analyzeContractWithAI(
  contractText: string,
  fileName: string,
  openRouterApiKey: string,
  context?: UserContext,
  model: string = DEFAULT_MODEL
): Promise<ContractAnalysis> {
  if (!openRouterApiKey) {
    throw new Error("OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to your environment.");
  }

  const clippedContract =
    contractText.length > MAX_CONTRACT_CHARS
      ? `${contractText.slice(0, MAX_CONTRACT_CHARS)}\n\n[Contract truncated for analysis]`
      : contractText;

  const userMessage = `
CONTRACT TO ANALYZE:
File: ${fileName}

Contract Content:
${clippedContract}

Analyze this contract according to the rules provided. Respond ONLY with valid JSON, no other text.
`;

  // Try primary model first, fall back to fallback if it fails
  const modelsToTry = model === DEFAULT_MODEL ? MODELS_TO_TRY : [model];

  for (const [index, modelToUse] of modelsToTry.entries()) {
    try {
      return await callOpenRouter(modelToUse, context, userMessage, openRouterApiKey);
    } catch (error) {
      if (index === modelsToTry.length - 1) {
        throw error;
      }
      console.warn(
        `Model ${modelToUse} failed; trying ${modelsToTry[index + 1]} next.`,
        error
      );
    }
  }

  throw new Error("All models failed");
}

async function callOpenRouter(
  model: string,
  context: UserContext | undefined,
  userMessage: string,
  openRouterApiKey: string
): Promise<ContractAnalysis> {

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: getAILawyerPrompt(context),
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const errorMessage =
        error &&
        typeof error === "object" &&
        "error" in error &&
        error.error &&
        typeof error.error === "object" &&
        "message" in error.error &&
        typeof error.error.message === "string"
          ? error.error.message
          : null;
      throw new Error(
        errorMessage
          ? `OpenRouter API error: ${errorMessage}`
          : `OpenRouter API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const choice = Array.isArray(data.choices) ? data.choices[0] : undefined;
    const content = extractMessageText(choice?.message);
    const finishReason =
      choice && typeof choice.finish_reason === "string"
        ? choice.finish_reason
        : "unknown";

    if (!content) {
      console.error("AI returned an empty message", { model, finishReason });
      throw new Error(
        finishReason === "length"
          ? "AI response was cut off before it could finish. Please try again."
          : "AI returned an empty response. The model may be temporarily unavailable; please try again."
      );
    }

    if (finishReason === "length") {
      throw new Error(
        "AI response was cut off before it could finish. Please try again."
      );
    }

    // Parse the JSON response
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Try to extract JSON from response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : cleanContent;

      const analysis = JSON.parse(jsonStr) as ContractAnalysis;

      // Validate required fields
      if (
        typeof analysis.overallScore !== "number" ||
        typeof analysis.clarity !== "number" ||
        typeof analysis.fairness !== "number" ||
        !analysis.riskLevel ||
        !Array.isArray(analysis.keyIssues) ||
        !analysis.simpleExplanation
      ) {
        throw new Error("AI response missing required fields");
      }

      // Validate riskLevel
      if (!["low", "medium", "high"].includes(analysis.riskLevel)) {
        analysis.riskLevel = "medium";
      }

      // Clamp scores to 0-100
      analysis.overallScore = Math.max(0, Math.min(100, Math.round(analysis.overallScore)));
      analysis.clarity = Math.max(0, Math.min(100, Math.round(analysis.clarity)));
      analysis.fairness = Math.max(0, Math.min(100, Math.round(analysis.fairness)));

      // Ensure exactly 3 key issues
      if (!Array.isArray(analysis.keyIssues)) {
        analysis.keyIssues = [];
      }
      while (analysis.keyIssues.length < 3) {
        analysis.keyIssues.push("Review the contract terms carefully");
      }
      analysis.keyIssues = analysis.keyIssues.slice(0, 3).map(issue =>
        typeof issue === "string" ? issue : String(issue)
      );

      // Ensure explanation is a string
      if (typeof analysis.simpleExplanation !== "string") {
        analysis.simpleExplanation = "This contract needs careful review. Please consult with a legal professional.";
      }

      return analysis;
    } catch (e) {
      console.error("Raw response:", content);
      console.error("Parse error:", e);

      // If parsing fails, return a safe default
      if (e instanceof SyntaxError) {
        throw new Error(`Invalid JSON response from AI. Please try again. Error: ${e.message}`);
      }
      throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : "Invalid format"}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error during contract analysis");
  }
}
