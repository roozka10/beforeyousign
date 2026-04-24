import { analyzeContractWithAI, UserContext, ContractAnalysis } from "@/services/ai-lawyer";

const DEFAULT_MODEL = "google/gemma-2-27b-it:free";

export async function analyzeContractWithContext(
  contractText: string,
  fileName: string,
  userContext: UserContext | null,
  apiKey: string
): Promise<ContractAnalysis> {
  if (!contractText || contractText.trim().length === 0) {
    throw new Error("Contract text is empty. Please upload a valid PDF or document.");
  }

  if (!apiKey) {
    throw new Error("API key is not configured. Please set VITE_OPENROUTER_API_KEY");
  }

  try {
    const context: UserContext | undefined = userContext ?? undefined;

    console.log(`🤖 Analyzing with ${DEFAULT_MODEL}...`);

    // Call AI with user context
    const analysis = await analyzeContractWithAI(
      contractText,
      fileName,
      apiKey,
      context,
      DEFAULT_MODEL
    );

    // Validate response
    if (
      !analysis ||
      typeof analysis.overallScore !== "number" ||
      !analysis.riskLevel
    ) {
      throw new Error("AI returned invalid response. Please try again.");
    }

    console.log(`✅ Analysis complete: ${analysis.overallScore}/100`);
    return analysis;
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
}
