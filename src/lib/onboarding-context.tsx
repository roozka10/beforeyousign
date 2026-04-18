import React, { createContext, useContext, useState, ReactNode } from "react";

export interface OnboardingData {
  location: string;
  documentType: string;
  exitTerms: string;
  controlBalance: string;
  mainConcern: string;
}

interface OnboardingContextType {
  data: OnboardingData | null;
  saveOnboardingData: (data: OnboardingData) => void;
  clearOnboardingData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData | null>(null);

  const saveOnboardingData = (newData: OnboardingData) => {
    setData(newData);
    // Don't log sensitive data in production
    if (process.env.NODE_ENV === "development") {
      console.log("Onboarding data saved (dev only)");
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
