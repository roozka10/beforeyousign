# beforeyousign AI Lawyer Setup Guide

## Overview
The app uses OpenRouter API to power the AI lawyer that analyzes contracts. The AI acts as a friendly, expert lawyer who explains contracts in simple language.

## What the AI Does

The AI analyzes contracts and provides:
- **Overall Score** (0-100): How safe is this contract?
- **Clarity Rating** (0-100): Can a normal person understand it?
- **Fairness Rating** (0-100): Does it favor one side way too much?
- **Risk Level**: Low, Medium, or High
- **Key Issues** (3): The most important red flags explained simply
- **Simple Explanation**: 2-3 paragraph explanation in easy terms

## Setup Instructions

### 1. Get OpenRouter API Key
- Go to https://openrouter.ai
- Sign up for a free account
- Get your API key from the dashboard

### 2. Choose Your Model
Using Deepseek model:
- `deepseek/deepseek-r1-distill:free` - Deepseek R1 Distill (Free) ✅ **Selected**

### 3. Set Environment Variables on Vercel
Add these environment variables to your Vercel project settings:

```
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_MODEL=deepseek/deepseek-r1-distill:free
VITE_USER_LOCATION=United States
```

Or locally in `.env`:
```
VITE_OPENROUTER_API_KEY=your_api_key_here
VITE_OPENROUTER_MODEL=deepseek/deepseek-r1-distill:free
VITE_USER_LOCATION=United States
```

### 4. Update the UploadPage Component
In `src/pages/UploadPage.tsx`, add this logic to call the AI:

```typescript
import { analyzeContractWithAI } from "@/services/ai-lawyer";

const handleAnalyzeContract = async (contractText: string, fileName: string) => {
  try {
    const analysis = await analyzeContractWithAI(
      contractText,
      fileName,
      import.meta.env.VITE_USER_LOCATION || "United States",
      import.meta.env.VITE_OPENROUTER_API_KEY,
      import.meta.env.VITE_OPENROUTER_MODEL
    );
    
    // Save analysis to state/context
    // Navigate to result page with analysis data
    navigate(`/result/${contractId}`, { state: { analysis } });
  } catch (error) {
    console.error("Analysis failed:", error);
    // Show error toast to user
  }
};
```

## AI Lawyer Prompt Explanation

The system prompt tells the AI to:

### Tone & Style
- ✅ Fun but serious
- ✅ Explain like talking to a friend
- ✅ Keep explanations SHORT
- ✅ Give specific examples
- ✅ Be direct about risks

### Scoring Rules
- **80-100**: Pretty safe, standard terms
- **60-79**: Some sketchy bits but manageable
- **40-59**: Multiple red flags, risky
- **0-39**: Avoid signing unless you have to

### What to Flag
1. Auto-renewal clauses
2. Payment terms clarity
3. Termination/exit clauses
4. Liability limits
5. Jurisdiction choice
6. Hidden obligations in fine print

## Response Format

The AI returns JSON like this:
```json
{
  "overallScore": 38,
  "clarity": 80,
  "fairness": 45,
  "riskLevel": "high",
  "keyIssues": [
    "Auto-renews silently unless you catch a 30-day window",
    "Payment terms not clearly defined",
    "You're locked in for 12 months with hard exit terms"
  ],
  "simpleExplanation": "This contract is pretty risky..."
}
```

## Cost Estimation
- **Deepseek R1 Distill (Free)**: $0 per contract ✅ **No cost!**
- Claude Sonnet: ~$0.50-$2 per contract
- GPT-4 Turbo: ~$1-$5 per contract

## Testing

To test without making API calls, use the mock data in `Result.tsx`:
```typescript
const mockAnalysis: ContractAnalysis = {
  overallScore: 38,
  clarity: 80,
  fairness: 45,
  riskLevel: "high",
  keyIssues: [...],
  simpleExplanation: "..."
};
```

## Troubleshooting

**Q: "Invalid JSON returned"**
A: The AI didn't return valid JSON. Make sure your prompt is clear. Try a different model.

**Q: API rate limits exceeded**
A: OpenRouter has rate limits. Check your usage on the dashboard.

**Q: High costs**
A: Switch to a cheaper model like Llama or `openrouter/auto`.

## Next Steps

1. Get OpenRouter API key
2. Set environment variables
3. Update `UploadPage.tsx` to use `analyzeContractWithAI()`
4. Test with a sample contract
5. Deploy!

---

**Questions?** The AI prompt is designed to be self-explanatory and handles edge cases well. If something doesn't work, check the OpenRouter docs: https://openrouter.ai/docs
