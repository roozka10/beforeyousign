import { analyzeContractWithAI, UserContext, ContractAnalysis } from "@/services/ai-lawyer";
import { OnboardingData } from "./onboarding-context";

const DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free";

export async function analyzeContractWithContext(
  contractText: string,
  fileName: string,
  onboardingData: OnboardingData | null,
  apiKey: string
): Promise<ContractAnalysis> {
  if (!contractText || contractText.trim().length === 0) {
    throw new Error("Contract text is empty. Please upload a valid PDF or document.");
  }

  if (!apiKey) {
    throw new Error("API key is not configured. Please set VITE_OPENROUTER_API_KEY");
  }

  try {
    // Convert onboarding data to user context
    const context: UserContext | undefined = onboardingData
      ? {
          location: onboardingData.location,
          documentType: onboardingData.documentType,
          exitTerms: onboardingData.exitTerms,
          controlBalance: onboardingData.controlBalance,
          mainConcern: onboardingData.mainConcern,
        }
      : undefined;

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
