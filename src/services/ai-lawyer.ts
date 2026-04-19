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

  return `You are a fun, super chill AI lawyer explaining contracts like you're talking to a 10-year-old who's smart but doesn't know legal stuff.

LOCATION: ${locationContext}
DOCUMENT: ${documentContext}

INSTRUCTIONS:
1. Give honest scores (0-100) - be real!
2. Find the SCARY PARTS that could hurt this person
3. Explain everything like you're chatting with a kid - no boring lawyer words!
4. Be SUPER SHORT and FUNNY
5. Use fun examples from real life
6. Use simple words instead of fancy lawyer talk
7. No sugar coating - if it's bad, say it's bad! 😅

YOU MUST RESPOND WITH ONLY VALID JSON. NO MARKDOWN, NO EXTRA TEXT.

RESPOND EXACTLY LIKE THIS (VALID JSON ONLY):
{
  "overallScore": 45,
  "clarity": 60,
  "fairness": 35,
  "riskLevel": "high",
  "keyIssues": ["First risk here", "Second risk here", "Third risk here"],
  "simpleExplanation": "Start explaining the contract in simple terms. Mention the biggest problems. Keep it short and friendly. Use real examples from the contract."
}

IMPORTANT:
- ONLY return JSON
- No markdown
- No explanation text before or after
- All strings must use double quotes
- riskLevel must be: low, medium, or high
- keyIssues must be an array with 3 strings
- overallScore, clarity, fairness must be numbers 0-100`;
};

const DEFAULT_MODEL = "google/gemma-2-27b-it:free";
const FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const MODELS_TO_TRY = [DEFAULT_MODEL, FALLBACK_MODEL];

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

  const userMessage = `
CONTRACT TO ANALYZE:
File: ${fileName}

Contract Content:
${contractText}

Analyze this contract according to the rules provided. Respond ONLY with valid JSON, no other text.
`;

  // Try primary model first, fall back to fallback if it fails
  const modelsToTry = model === DEFAULT_MODEL ? MODELS_TO_TRY : [model];

  for (const modelToUse of modelsToTry) {
    try {
      return await callOpenRouter(modelToUse, context, userMessage, openRouterApiKey);
    } catch (error) {
      console.warn(`Model ${modelToUse} failed, trying next...`, error);
      // If this is the last model, throw the error
      if (modelToUse === modelsToTry[modelsToTry.length - 1]) {
        throw error;
      }
      // Otherwise, continue to next model
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
        model: model,
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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        console.error("API error response:", error);
        throw new Error(`OpenRouter API error: ${error.error?.message || JSON.stringify(error)}`);
      } catch (parseError) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("Empty response from AI:", data);
      throw new Error("AI returned empty response. Please try again.");
    }

    // Parse the JSON response
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Try to extract JSON from response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : cleanContent;

      console.log("Attempting to parse JSON...");
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

      console.log("✅ Successfully parsed AI response");
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
