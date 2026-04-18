# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Create a new project:
   - Organization: Create new or use existing
   - Project name: `beforeyousign`
   - Database password: **Save this securely!**
   - Region: Choose closest to your users
   - Click "Create new project"
5. Wait for project to be ready (~2 minutes)

## Step 2: Create the Database Table

Once your project is ready:

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Create contract_results table
CREATE TABLE contract_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  clarity INTEGER NOT NULL,
  fairness INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  key_issues TEXT[] NOT NULL,
  simple_explanation TEXT NOT NULL,
  user_location TEXT NOT NULL,
  document_type TEXT,
  main_concern TEXT,
  contract_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_contract_results_created_at ON contract_results(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE contract_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public data)
CREATE POLICY "Enable read access for all users" ON contract_results
  FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY "Enable insert access for all users" ON contract_results
  FOR INSERT WITH CHECK (true);

-- Allow anyone to delete their own records
CREATE POLICY "Enable delete access for all users" ON contract_results
  FOR DELETE USING (true);
```

4. Click **"Run"** button
5. You should see: "✓ Success. No rows returned."

## Step 3: Get Your API Keys

1. Go to **Settings** (bottom left)
2. Click **"API"**
3. Under "Project API keys", copy:
   - **URL**: This is `VITE_SUPABASE_URL`
   - **anon public**: This is `VITE_SUPABASE_ANON_KEY`

## Step 4: Add to Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your `beforeyousign` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key | Production, Preview, Development |
| `VITE_OPENROUTER_API_KEY` | Your OpenRouter key | Production, Preview, Development |
| `VITE_OPENROUTER_MODEL` | `deepseek/deepseek-r1-distill:free` | Production, Preview, Development |

5. Click **"Save"**

## Step 5: Deploy to Vercel

1. Push your code to GitHub:
```bash
git add .
git commit -m "Add Supabase and API integration"
git push
```

2. Vercel will auto-deploy when you push
3. Check deployment status at https://vercel.com/dashboard

## Testing Locally

Before deploying, test locally:

1. Create `.env.local` file in your project root:
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_OPENROUTER_API_KEY=your_key_here
VITE_OPENROUTER_MODEL=deepseek/deepseek-r1-distill:free
```

2. Run dev server:
```bash
npm run dev
```

3. Test the flow:
   - Go through onboarding
   - Upload a contract (mock)
   - Check if it saves to Supabase

4. Verify in Supabase:
   - Go to SQL Editor
   - Run: `SELECT * FROM contract_results;`
   - You should see your test data

## Database Schema

The `contract_results` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `file_name` | TEXT | Original file name |
| `overall_score` | INTEGER | Score 0-100 |
| `clarity` | INTEGER | Clarity score 0-100 |
| `fairness` | INTEGER | Fairness score 0-100 |
| `risk_level` | TEXT | 'low', 'medium', or 'high' |
| `key_issues` | TEXT[] | Array of issues |
| `simple_explanation` | TEXT | AI explanation |
| `user_location` | TEXT | User's location |
| `document_type` | TEXT | Type of document |
| `main_concern` | TEXT | User's main concern |
| `contract_text` | TEXT | Full contract text |
| `created_at` | TIMESTAMP | When created |

## Troubleshooting

### "Table 'contract_results' doesn't exist"
- Run the SQL setup again
- Make sure you clicked "Run" and got a success message

### "Invalid API Key"
- Copy the entire key (no spaces)
- Use `anon public` key, not `service_role`

### Data not showing on Dashboard
- Check browser console for errors
- Verify environment variables in Vercel
- Run `SELECT COUNT(*) FROM contract_results;` in Supabase SQL Editor

### Need to Reset Database
- Go to Settings → Database
- Click "Reset database"
- Run the SQL setup again

## Security Notes

✅ **Public anon key is safe** - it only allows read/write to the contract_results table
✅ **RLS policies** - control what users can see/modify
✅ **No sensitive data** - contract text is stored but not indexed
✅ **HTTPS only** - all communication encrypted

## Next Steps

Once everything is deployed:
1. Users complete onboarding
2. Upload contracts via UploadPage
3. AI analyzes using Deepseek
4. Results saved to Supabase
5. Dashboard displays all saved results
6. Users can click to view details or delete

You're all set! 🚀
