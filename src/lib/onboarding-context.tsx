import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "./supabase";

export interface OnboardingData {
  location: string;
  documentType: string;
  exitTerms: string;
  controlBalance: string;
  mainConcern: string;
}

interface OnboardingContextType {
  data: OnboardingData | null;
  saveOnboardingData: (data: OnboardingData) => Promise<void>;
  clearOnboardingData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData | null>(null);

  const saveOnboardingData = async (newData: OnboardingData) => {
    try {
      const userId = localStorage.getItem("bys_user_id");
      if (!userId) throw new Error("No user ID found");

      // Save to Supabase users table
      const { error } = await supabase
        .from("users")
        .update({
          location: newData.location,
          main_concern: newData.mainConcern,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      setData(newData);
      localStorage.setItem("bys_user_profile", JSON.stringify(newData));
    } catch (err) {
      console.error("Failed to save onboarding data:", err);
      throw err;
    }
  };

  const clearOnboardingData = () => {
    setData(null);
  };

  return (
    <OnboardingContext.Provider value={{ data, saveOnboardingData, clearOnboardingData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};
