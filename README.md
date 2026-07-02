# Car Adviser

An AI-powered used-car buying adviser for the Indian market. Describe what you need in plain English — the app extracts your preferences, scores every car in the dataset, and ranks the best matches with explainable reasons.

## What I built and why

A second-hand car recommendation engine where **the LLM never invents car facts**. The core insight: people describe what they want in messy natural language ("something safe for my family, highway trips, under 10 lakh"), but car comparison is fundamentally a structured data problem. So I split the job in two:

1. **Preference extraction** — An LLM (Gemini) reads the buyer's free-text description and returns a structured `Preferences` object (budget, use cases, seat count, mileage/safety priorities, brand preferences). If no API key is set, the LLM fails, or quota is exhausted, a deterministic keyword/regex fallback extracts the same fields. The app works fully offline.

2. **Deterministic scoring** — A pure function scores every car in a ~40-car curated dataset across 6 weighted dimensions (budget 0.30, use case 0.25, seats 0.15, mileage 0.10, safety 0.10, brand 0.10). Weights auto-adjust when users flag mileage or safety as priorities (2× boost, then normalize). Scores are 0–100 with a per-dimension breakdown. Every number displayed comes from the dataset — never from the LLM.

3. **Templated reasons** — Human-readable explanations ("₹9.99L — within your ₹10L budget", "5-star NCAP safety rating") are assembled from computed values only, highest signal first, capped at 4.

4. **Compare view** — Side-by-side comparison table (2–3 cars) with best-value cell highlighting (lowest price, highest mileage, etc.). All-equal rows are intentionally not highlighted.

5. **Shortlists** — Save and reload car comparisons via a local SQLite database (Prisma). Fully optional — every database call is try/caught so a missing or broken DB never blocks the recommendation flow.

**What I deliberately cut:** user accounts/auth, real-time pricing APIs, car images, server-side caching, filter controls after search, multi-page flows. The goal was a single-page experience that proves the architecture (LLM extracts → deterministic scores → explainable results) end to end.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Server components for the API route, client components for the interactive UI. File-based routing keeps it simple. |
| Language | TypeScript (strict, no `any` in core logic) | Catches shape mismatches between Preferences, ScoreCard, and the dataset at compile time. |
| Styling | Tailwind CSS 4 | Utility-first means no CSS files to manage; responsive layout with minimal code. |
| Validation | Zod 4 | Validates the LLM's JSON output against the Preferences schema — partial/malformed responses get safe defaults via `.default()`. |
| LLM | Google Gemini 2.0 Flash via `@google/generative-ai` | Fast, cheap, supports `responseMimeType: "application/json"` for structured output. Swappable — only `provider.ts` touches the SDK. |
| Database | SQLite via Prisma 5 (local file, optional) | Zero-config persistence for shortlists. Prisma gives typed queries. Guarded so the app works without it. |
| Testing | Vitest | Fast, TypeScript-native, compatible with the Next.js ecosystem. |
| Linting | ESLint 9 | Catches unused imports and enforces consistent style. |

## What I delegated to AI tools vs. did manually

**Built with Claude Code** — the entire codebase was developed phase-by-phase through iterative conversation with review gates between phases. Here's the split:

| Delegated to AI | Did manually |
|-----------------|--------------|
| Scaffolding boilerplate (Next.js setup, Tailwind config, ESLint) | Architecture decisions — LLM-extracts-then-deterministic-scores was my call, not the AI's |
| Writing the 40-car dataset with realistic depreciation curves | Scoring formula design — the 6-dimension weights, budget breakpoints (0%→1.0, 10%→0.7, 33%→0.0), and priority boost mechanics |
| Component code (IntakeForm, ResultCard, CompareView, etc.) | Deciding what to cut — no auth, no images, no filters, no multi-page |
| Prisma schema + API routes + error guarding | Review and QA — I tested every phase in the browser before approving the next |
| SVG score ring, highlight logic, responsive layout | Bug diagnosis — caught dead code, Prisma version incompatibilities, env loading issues |

**Where AI tools helped most:** Boilerplate velocity. The tedious parts — wiring up fetch calls, building responsive grid layouts, writing Prisma CRUD routes with proper error boundaries, curating 40 realistic used-car entries — were done in minutes instead of hours. The dataset work especially: hand-writing 40 cars with realistic km-driven, owner-count, depreciation-adjusted prices, and accurate pros/cons would have taken a full day.

**Where they got in the way:** Dependency version mismatches. Claude initially used Prisma 7 (which has breaking schema changes), and Zod 4's import path (`zod/v4`) needed manual correction. The AI also occasionally wrote dead code that duplicated existing logic (two different `comparedCars` variables computing the same thing). Every phase needed a review pass to catch these.

**Google Gemini** — used at runtime (optionally) to extract buyer preferences from free-text input. The deterministic fallback means the app works identically without it.

## If I had another 4 hours

- **Hard seat filter** — exclude cars that don't meet the seat requirement instead of soft-scoring them
- **Filter controls** — post-search filters for fuel type, transmission, body type, year range
- **Image placeholders** — car silhouettes or brand logos on result cards
- **Saved search history** — persist past queries and let users re-run or refine them
- **Share comparison** — generate a shareable link for a compare view
- **Mobile-first redesign** — bottom sheet for compare, swipe cards for results
- **Expanded dataset** — add luxury segment (BMW, Mercedes, Audi), more variants per model
- **Real-time price estimates** — integrate with a pricing API for market-adjusted values

## Run instructions

```bash
# Install dependencies
npm install

# (Optional) Set up Gemini API key for LLM-powered extraction
cp .env.local.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
# The app works without it — falls back to keyword extraction.

# Set up the database (SQLite, local file)
npx prisma generate
npx prisma db push

# Start development server
npm run dev
# Open http://localhost:3000

# Run tests
npm test

# Type check
npx tsc --noEmit

# Production build
npm run build
```

## Dataset disclaimer

> **The car dataset is an approximate, representative sample** — not live or scraped data. Prices, specifications, and mileage figures are ballpark estimates for illustration purposes. Do not use them for actual purchase decisions. The dataset contains ~40 hand-curated Indian market cars with depreciated used-car pricing.
