import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StoredContractResult {
  id: string;
  fileName: string;
  overallScore: number;
  clarity: number;
  fairness: number;
  riskLevel: "low" | "medium" | "high";
  keyIssues: string[];
  simpleExplanation: string;
  userLocation: string;
  documentType?: string;
  mainConcern?: string;
  createdAt: string;
  contractText: string; // Store for reference
}

export async function saveContractResult(
  result: Omit<StoredContractResult, "id" | "createdAt">
): Promise<StoredContractResult> {
  const { data, error } = await supabase
    .from("contract_results")
    .insert([
      {
        file_name: result.fileName,
        overall_score: result.overallScore,
        clarity: result.clarity,
        fairness: result.fairness,
        risk_level: result.riskLevel,
        key_issues: result.keyIssues,
        simple_explanation: result.simpleExplanation,
        user_location: result.userLocation,
        document_type: result.documentType,
        main_concern: result.mainConcern,
        contract_text: result.contractText,
      },
    ])
    .select();

  if (error) {
    throw new Error(`Failed to save contract result: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from save operation");
  }

  const row = data[0];
  return {
    id: row.id,
    fileName: row.file_name,
    overallScore: row.overall_score,
    clarity: row.clarity,
    fairness: row.fairness,
    riskLevel: row.risk_level,
    keyIssues: row.key_issues,
    simpleExplanation: row.simple_explanation,
    userLocation: row.user_location,
    documentType: row.document_type,
    mainConcern: row.main_concern,
    createdAt: row.created_at,
    contractText: row.contract_text,
  };
}

export async function getContractResults(): Promise<StoredContractResult[]> {
  const { data, error } = await supabase
    .from("contract_results")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contract results: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    fileName: row.file_name,
    overallScore: row.overall_score,
    clarity: row.clarity,
    fairness: row.fairness,
    riskLevel: row.risk_level,
    keyIssues: row.key_issues,
    simpleExplanation: row.simple_explanation,
    userLocation: row.user_location,
    documentType: row.document_type,
    mainConcern: row.main_concern,
    createdAt: row.created_at,
    contractText: row.contract_text,
  }));
}

export async function getContractResult(id: string): Promise<StoredContractResult | null> {
  const { data, error } = await supabase
    .from("contract_results")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch contract result: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    fileName: data.file_name,
    overallScore: data.overall_score,
    clarity: data.clarity,
    fairness: data.fairness,
    riskLevel: data.risk_level,
    keyIssues: data.key_issues,
    simpleExplanation: data.simple_explanation,
    userLocation: data.user_location,
    documentType: data.document_type,
    mainConcern: data.main_concern,
    createdAt: data.created_at,
    contractText: data.contract_text,
  };
}

export async function deleteContractResult(id: string): Promise<void> {
  const { error } = await supabase
    .from("contract_results")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete contract result: ${error.message}`);
  }
}
