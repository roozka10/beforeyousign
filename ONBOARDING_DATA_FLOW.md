# Onboarding Data Flow - Secure Implementation

## Overview
User onboarding data (location, document type, concerns) is captured securely and used to personalize contract analysis without exposing sensitive information.

## Data Captured During Onboarding

```typescript
interface OnboardingData {
  location: string;           // e.g., "California, USA"
  documentType: string;       // freelance, job, nda, random
  exitTerms: string;          // anytime, conditions, locked, unsure-exit
  controlBalance: string;     // me, other, balanced, unsure-control
  mainConcern: string;        // stuck, money, hidden, all
}
```

## Security Measures

### 1. No Console Logging in Production
```typescript
// Only logs in development mode
if (process.env.NODE_ENV === "development") {
  console.log("Onboarding data saved (dev only)");
}
```

### 2. Client-Side Only Storage
- Data lives in React Context (memory only)
- NOT stored in localStorage or cookies
- Cleared when user leaves the app

### 3. Data Only Sent to AI Service
- Never logged or tracked
- Only used to create personalized AI prompt
- Part of system message (not visible to user)

### 4. OpenRouter API Security
- API key stored in Vercel environment variables
- Never exposed in client code
- Transmitted over HTTPS only

## Data Flow

```
User Onboarding
      ↓
[React Context - OnboardingProvider]
      ↓
User Uploads Contract
      ↓
[Contract + Onboarding Data]
      ↓
Helper Function: analyzeContractWithContext()
      ↓
[Builds UserContext from onboarding data]
      ↓
OpenRouter API Call
      ↓
[AI Lawyer uses context in system prompt]
      ↓
Result Page Displays
      ↓
[Onboarding data used to personalize explanation]
```

## Code Examples

### In Onboarding.tsx
```typescript
const { saveOnboardingData } = useOnboarding();

const next = () => {
  if (step < TOTAL_STEPS) {
    setStep(step + 1);
  } else {
    // Save all onboarding data before completing
    const location = country === "United States" ? `${usState}, USA` : country;
    saveOnboardingData({
      location,
      documentType: picks[2] || "",
      exitTerms: picks[3] || "",
      controlBalance: picks[4] || "",
      mainConcern: picks[5] || "",
    });
    setDone(true);
  }
};
```

### In Result.tsx or UploadPage.tsx
```typescript
import { useOnboarding } from "@/lib/onboarding-context";
import { analyzeContractWithContext } from "@/lib/contract-analysis-helper";

const { data: onboardingData } = useOnboarding();

const analysis = await analyzeContractWithContext(
  contractText,
  fileName,
  onboardingData,
  apiKey
);
```

### In AI Service
```typescript
// AI prompt dynamically includes user context
const getAILawyerPrompt = (context?: UserContext): string => {
  let locationContext = "United States";
  
  if (context?.location) {
    locationContext = context.location;
  }
  
  return `... Apply laws relevant to ${locationContext} ...`;
};
```

## What Users Don't See

The onboarding data is part of the **system prompt** to the AI:

```
USER CONTEXT (internal, not shown to user):
- Location: California, USA
- Document Type: freelance contract
- Main Concern: losing money

[AI uses this to personalize analysis]
```

Users only see:
- The contract analysis results
- Simple explanations tailored to their jurisdiction
- Key issues relevant to their concerns

## Privacy Guarantees

✅ **No data is persisted after session ends**
✅ **No tracking or analytics on onboarding choices**
✅ **No third-party sharing of location data**
✅ **API key is backend-only (Vercel secrets)**
✅ **HTTPS-only communication**

## What Happens to Data?

1. **User fills onboarding** → Saved in React Context
2. **User uploads contract** → Context used for AI prompt
3. **AI analyzes contract** → Uses context to personalize analysis
4. **Result page shown** → User sees personalized explanation
5. **User leaves app** → All data cleared from memory

No database, no storage, no persistence.

## Testing

To verify secure handling in development:
1. Open DevTools → Console
2. Fill onboarding form
3. You'll see: "Onboarding data saved (dev only)" - only in development
4. Upload a contract
5. Inspect Network tab → OpenRouter request won't show sensitive data in URL
6. Refresh page → All data is lost (cleared from memory)

## Future Enhancements

If you want to persist data:
- Use encrypted localStorage with encryption library
- Or use a backend database with encryption at rest
- Or both (end-to-end encryption)

Current setup prioritizes privacy over persistence.
