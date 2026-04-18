# Complete Deployment Guide - beforeyousign

Deploy your app to GitHub and Vercel in 5 minutes.

## Part 1: Create GitHub Repo (2 minutes)

### 1. Initialize Git locally (if not already)
```bash
cd /Users/anwar/Desktop/"All my apps"/documentcheck

# Check if git repo exists
git status

# If not, initialize:
git init
git add .
git commit -m "Initial commit: beforeyousign AI lawyer"
```

### 2. Create repo on GitHub
1. Go to https://github.com/new
2. Enter:
   - **Repository name**: `beforeyousign`
   - **Description**: "AI-powered contract analyzer. Understand contracts before you sign."
   - **Public** (so Vercel can access it)
   - Click **"Create repository"**
3. GitHub will show you commands to push

### 3. Push your code to GitHub
```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/beforeyousign.git

# Rename branch to main if needed
git branch -M main

# Push code
git push -u origin main
```

## Part 2: Deploy to Vercel (3 minutes)

### 1. Go to Vercel
- https://vercel.com/dashboard
- Click **"Add New..."** → **"Project"**

### 2. Import from GitHub
1. Click **"Import Git Repository"**
2. Paste: `https://github.com/YOUR_USERNAME/beforeyousign`
3. Click **"Continue"**

### 3. Configure Project
- **Project name**: `beforeyousign`
- **Framework**: Vite
- **Root directory**: `./` (default)
- Click **"Continue"**

### 4. Add Environment Variables
Click **"Environment Variables"** and add these:

```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_OPENROUTER_API_KEY = your_openrouter_api_key
VITE_OPENROUTER_MODEL = deepseek/deepseek-r1-distill:free
```

**Where to find these:**

- **Supabase URL & Key**: 
  - Go to https://supabase.com/dashboard
  - Click your project
  - Settings → API
  - Copy "URL" and "anon public"

- **OpenRouter API Key**:
  - Go to https://openrouter.ai
  - Click your username (top right)
  - API keys
  - Copy your key

### 5. Deploy
- Click **"Deploy"**
- Wait 2-3 minutes
- You'll get a URL like: `https://beforeyousign.vercel.app`

## Part 3: Setup Supabase (Complete if not done)

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Click **"Start your project"**
3. Create project:
   - Name: `beforeyousign`
   - Region: closest to you
   - **Save the password!**

### 2. Create Database Table
1. Go to **SQL Editor** in Supabase
2. Click **"New Query"**
3. Copy this SQL:

```sql
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

CREATE INDEX idx_contract_results_created_at ON contract_results(created_at DESC);

ALTER TABLE contract_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON contract_results
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON contract_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON contract_results
  FOR DELETE USING (true);
```

4. Click **"Run"**
5. Should see: "✓ Success"

### 3. Get Your Keys
1. Click **Settings** (bottom left)
2. Click **API**
3. Copy:
   - **URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

## Part 4: Get OpenRouter API Key (1 minute)

1. Go to https://openrouter.ai
2. Sign up if needed
3. Click your username → **API keys**
4. Copy your key → `VITE_OPENROUTER_API_KEY`

## Quick Command Reference

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/beforeyousign.git
git branch -M main
git push -u origin main

# View current config
git config --list
git remote -v
```

## Verify Everything Works

1. **Open your Vercel URL** (check dashboard)
2. **Complete onboarding** - pick location, document type, etc.
3. **Go to dashboard** - should say "No contracts yet"
4. **Check Supabase** - go to your project, data browser, `contract_results` table should be empty
5. **Done!** ✅

## When You Upload Your First Contract

The flow will be:
1. Upload contract file
2. AI analyzes with Deepseek
3. Onboarding data sent as context
4. Results saved to Supabase
5. Dashboard refreshes and shows the result
6. Click result to view full analysis

## Troubleshooting

### Git push rejected
```bash
# If branch names don't match:
git branch -M main
git push -u origin main
```

### Vercel build fails
- Check environment variables are added
- Check package.json has supabase dependency
- Check `.env.example` format

### Contract not saving
- Check browser console for errors
- Verify Supabase URL is correct
- Verify table exists: `SELECT * FROM contract_results;` in SQL Editor

### 404 on Vercel
- Vercel still deploying? Wait 2-3 minutes
- Check deployment status on Vercel dashboard

## Your New URLs

After deployment:

- **Live App**: https://beforeyousign.vercel.app
- **GitHub**: https://github.com/YOUR_USERNAME/beforeyousign
- **Vercel**: https://vercel.com/dashboard/projects

## Next Steps

1. Follow steps above
2. Test on Vercel URL
3. Share with users!
4. Monitor contracts on dashboard
5. View analysis results

---

**Done! You now have beforeyousign deployed and live.** 🚀

Any issues? Check the browser console (F12) for error messages.
