import { analyzeContractWithAI, type UserContext, type ContractAnalysis } from "@/services/ai-lawyer";

export async function analyzeContractWithContext(
  contractText: string,
  fileName: string,
  userContext: UserContext | null
): Promise<ContractAnalysis> {
  if (!contractText || contractText.trim().length === 0) {
    throw new Error("That file looks empty, try a different one.");
  }
  const analysis = await analyzeContractWithAI(contractText, fileName, userContext ?? undefined);
  if (!analysis || typeof analysis.overallScore !== "number" || !analysis.riskLevel) {
    throw new Error("AI returned invalid response. Please try again.");
  }
  return analysis;
}
