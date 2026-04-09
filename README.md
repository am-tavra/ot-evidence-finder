# OT Evidence Finder

Pediatric occupational therapy evidence-based intervention research tool. Searches 6 databases in parallel and synthesizes findings with Claude AI.

**Databases:** PubMed · Semantic Scholar · OpenAlex · ERIC · ClinicalTrials.gov · CrossRef

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd ot-evidence-finder
npm install

# 2. Add your Anthropic API key
cp .env.example .env.local
# Edit .env.local and add your key from https://console.anthropic.com

# 3. Run locally
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

```bash
# Push to GitHub first
git init && git add -A && git commit -m "initial commit"
gh repo create ot-evidence-finder --public --push

# Then deploy
npx vercel

# Add your API key in Vercel dashboard:
# Settings → Environment Variables → ANTHROPIC_API_KEY
```

## Deploy to Railway

```bash
# Push to GitHub, then:
# 1. Go to railway.app → New Project → Deploy from GitHub
# 2. Select ot-evidence-finder repo
# 3. Add environment variable: ANTHROPIC_API_KEY
# Railway auto-detects Next.js and deploys
```

## Project Structure

```
├── app/
│   ├── api/synthesize/route.ts   # Proxies Claude API (keeps key server-side)
│   ├── layout.tsx                # Root layout with fonts
│   └── page.tsx                  # Entry point
├── components/
│   └── OTEvidencePlatform.tsx    # Main app component
├── .env.example                  # API key template
└── package.json
```

## Cost Estimate

The only paid dependency is the Anthropic API. Each synthesis query uses ~2K input tokens + ~1K output tokens with Claude Sonnet, costing roughly **$0.01 per search**. At 100 searches/day that's ~$1/day.

All 6 research database APIs are free and require no keys.

## Features

- **8 clinical domains** (autism, sensory, motor, enuresis, language, ADL, behavioral, feeding)
- **Age filtering** (individual years 3–6 or ranges)
- **Evidence level preference** (systematic review → case series)
- **Real-time fetch status** per database
- **AI synthesis** with ranked interventions, strength ratings, dosage, clinical tips
- **Article bookmarking** (persists in localStorage)
- **PDF export** of synthesis + bookmarked articles
- **Suggested follow-up searches**
