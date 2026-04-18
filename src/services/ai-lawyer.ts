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

const DEFAULT_MODEL = "deepseek/deepseek-r1-distill:free";

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
    const content = data.choices[0].message.content;

    // Parse the JSON response
    try {
      const analysis = JSON.parse(content) as ContractAnalysis;
      return analysis;
    } catch (e) {
      console.error("Raw response:", content);
      throw new Error("Failed to parse AI response. Invalid JSON returned.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error during contract analysis");
  }
}
