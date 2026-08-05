# Prorun AI — AI Crypto Risk Analyst Agent

> Understand your crypto risk **before the market does.**

Prorun AI is a premium, dark-mode crypto risk intelligence product built for the **OKX.AI submission**. It combines quantitative portfolio risk scoring, daily market intelligence, trading psychology analysis and a grounded conversational AI assistant in one dashboard.

![stack](https://img.shields.io/badge/Next.js-14-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

---

## Features

| Area | What it does |
| --- | --- |
| **Portfolio Risk Scanner** | Wallet / manual holdings → 0–100 risk score, concentration (HHI), volatility exposure, stablecoin protection, drawdown scenarios, actionable recommendations. |
| **AI Market Brief** | Daily report on BTC/ETH momentum, market sentiment gauge, major risks, upcoming events and a risk-adjusted AI stance. |
| **Trading Psychology** | Upload a trade log (CSV) → detects revenge trading, overtrading, sizing up after losses, poor R:R, emotional streaks; produces a discipline score. |
| **AI Assistant** | Chat grounded in your actual portfolio snapshot, latest risk report and live market sentiment. Always ends with the financial disclaimer. |

## Pages

- **Landing** — hero, features, product preview, chat mock
- **Dashboard / Overview** — portfolio value, risk score, 24h change, AI confidence, performance & allocation charts, correlation heatmap
- **Portfolio** — wallet address input (deterministic demo derivation), manual holdings builder, holdings table, allocation pie
- **Risk Analysis** — AI risk report with gauge, sub-scores, prioritized risks, recommendations, drawdown scenarios
- **Market Intelligence** — live daily brief with BTC/ETH momentum, sentiment, events, market table
- **Trading Journal** — CSV upload or demo journal → behavioral analysis with equity curve
- **AI Assistant** — conversational risk Q&A with suggested prompts
- **Settings** — profile, AI provider config, demo data controls

## Tech Stack

- **Frontend:** React 18, Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide
- **Backend:** Next.js API Routes (`/api/analyze`, `/api/market`, `/api/psychology`, `/api/chat`)
- **Data:** File-backed demo store + optional PostgreSQL (`DATABASE_URL`), localStorage persistence for UX state
- **AI:** pluggable LLM via OpenAI-compatible Chat Completions with a fully offline deterministic analysis engine fallback
- **Crypto data:** CoinGecko public API with in-memory cache + seeded offline fallback (works with zero keys)

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Optional configuration (`.env.local`)

```env
AI_API_KEY=sk-...            # OpenAI-compatible key; without it the local engine is used
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
MARKET_CACHE_TTL=60          # CoinGecko cache seconds
DATABASE_URL=postgres://...  # optional Postgres persistence
```

## Build & verify

```bash
npm run typecheck
npm run build
npm start
```

## Project structure

```
app/                      # Next.js App Router (pages + API routes)
  api/{analyze,market,psychology,chat}/route.ts
  dashboard/{overview,portfolio,risk,market,journal,assistant,settings}
components/
  charts/                 # Recharts + custom SVG charts
  dashboard/              # Sidebar, gate flow, holdings table
  providers/              # Portfolio context + state persistence
  ui/                     # GlassCard, RiskGauge, StatCard, badges
lib/
  types.ts                # domain model
  market-data.ts          # CoinGecko + seeded fallback, portfolio builder
  analysis-engine.ts      # deterministic risk scoring
  psychology.ts           # behavioral pattern detection
  ai.ts                   # LLM layer with offline fallback
  chat.ts                 # grounded assistant response engine
```

## Disclaimer

Prorun AI provides analysis and education, **not financial advice**. Always do your own research.

---

Built for the OKX.AI hackathon. © 2026 Prorun AI.
