import { analyzeContractWithAI, UserContext } from "@/services/ai-lawyer";
import { OnboardingData } from "./onboarding-context";

const DEFAULT_MODEL = "openrouter/elephant-alpha";

export async function analyzeContractWithContext(
  contractText: string,
  fileName: string,
  onboardingData: OnboardingData | null,
  apiKey: string
): Promise<ReturnType<typeof analyzeContractWithAI>> {
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

  // Call AI with user context
  return analyzeContractWithAI(
    contractText,
    fileName,
    apiKey,
    context,
    DEFAULT_MODEL
  );
}
