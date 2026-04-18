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

  return `You are an expert AI lawyer assistant. Your job is to analyze contracts in a fun, easy-to-understand way for non-lawyers.

USER CONTEXT:
- Location: ${locationContext}
- Document Type: ${documentContext}
${context?.mainConcern ? `- Main Concern: ${context.mainConcern}` : ""}

IMPORTANT RULES:
1. Always give honest, real ratings (0-100)
2. Focus ONLY on the most important things that could hurt the person
3. Explain everything like you're talking to a friend, not a lawyer
4. Keep explanations SHORT and fun
5. Give specific examples from the contract
6. Apply laws and regulations relevant to ${locationContext}
7. Be direct about real risks - don't sugarcoat
8. Reference their specific concerns if applicable

ANALYSIS FORMAT:
You MUST respond in this exact JSON format (no markdown, pure JSON):
{
  "overallScore": <number 0-100>,
  "clarity": <number 0-100>,
  "fairness": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "keyIssues": [
    "<specific issue in 1-2 sentences, fun but serious>"
  ],
  "simpleExplanation": "<2-3 paragraph explanation of the contract's main points and biggest red flags in super simple terms>"
}`;
};

const DEFAULT_MODEL = "openrouter/elephant-alpha";

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
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("Empty response from AI:", data);
      throw new Error("AI returned empty response. Please try again.");
    }

    // Parse the JSON response
    try {
      // Try to extract JSON from response (in case AI added extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;

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

      // Clamp scores to 0-100
      analysis.overallScore = Math.max(0, Math.min(100, analysis.overallScore));
      analysis.clarity = Math.max(0, Math.min(100, analysis.clarity));
      analysis.fairness = Math.max(0, Math.min(100, analysis.fairness));

      // Ensure at least 3 key issues
      while (analysis.keyIssues.length < 3) {
        analysis.keyIssues.push("Review the contract carefully");
      }
      analysis.keyIssues = analysis.keyIssues.slice(0, 3);

      return analysis;
    } catch (e) {
      console.error("Raw response:", content);
      console.error("Parse error:", e);
      throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : "Invalid format"}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error during contract analysis");
  }
}
