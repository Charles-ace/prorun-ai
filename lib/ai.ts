// AI service layer.
// If a compatible LLM endpoint is configured (AI_API_KEY), narrative fields
// are generated with the model. Otherwise Prorun's deterministic analysis
// engines (risk, market, psychology) produce the output so the product works
// fully offline. Analysis is authoritative regardless of provider.
import type { Asset, MarketAssetQuote, Portfolio, Trade } from "@/lib/types";
import { analyzePortfolio } from "@/lib/analysis-engine";
import { analyzeTrading } from "@/lib/psychology";
import { buildMarketBriefFor, buildPerformanceCurve } from "@/lib/sample-data";
import { isoNow } from "@/lib/format";

const DISCLAIMER = "Prorun AI provides analysis and education, not financial advice.";

const AI_API_KEY = process.env.AI_API_KEY;
const AI_URL = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

async function callLLM(system: string, user: string): Promise<string | null> {
  if (!AI_API_KEY) return null;
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_tokens: 700,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function nl2(x: string): string {
  return x.split(/\n+/).filter(Boolean).join("\n").trim();
}

// ---------- Risk report ----------
export async function generateRiskReport(portfolio: Portfolio) {
  const base = analyzePortfolio(portfolio);
  const llm = await callLLM(
    `You are Prorun AI, a crypto risk analyst. Write exactly three short paragraphs: (1) a 2-sentence summary referencing the numeric risk score, (2) the top two risks with concrete percentages, (3) three actionable recommendations. Use plain text separated by blank lines. End with: "${DISCLAIMER}"`,
    `Portfolio value $${Math.round(portfolio.totalValue)}. Assets: ${portfolio.assets
      .map((a) => `${a.symbol} ${a.amount} @ $${a.price} (${a.allocation}%)`)
      .join("; ")}. Engine risk score: ${base.score}/100.` +
      ` Top risks: ${base.topRisks.map((r) => r.title).join("; ")}.`,
  );
  return { ...base, summary: llm ? nl2(llm) : base.summary };
}

export interface MarketReport {
  generatedAt: string;
  quotes: MarketAssetQuote[];
  btc: { trend: string; momentum: number; drivers: string[] };
  eth: { trend: string; momentum: number; drivers: string[] };
  sentiment: { label: string; score: number; summary: string };
  majorRisks: string[];
  events: string[];
  recommendation: string;
  aiSummary: string;
}

const changeTxt = (c: number) => `${c >= 0 ? "+" : ""}${c.toFixed(2)}%`;

export async function generateMarketBrief(): Promise<MarketReport> {
  const m = await buildMarketBriefFor();

  const btcTrend =
    m.btc.change24h >= 2.5
      ? "Positive, accelerating"
      : m.btc.change24h >= 0
        ? "Positive but slowing"
        : m.btc.change24h >= -2.5
          ? "Slight pullback"
          : "Corrective";
  const btcMomentum = Math.min(100, Math.max(0, Math.round(50 + m.btc.change24h * 5)));
  const ethTrend =
    m.eth.change24h >= 2.5 ? "Positive momentum" : m.eth.change24h >= 0 ? "Steady" : "Corrective";
  const ethMomentum = Math.min(100, Math.max(0, Math.round(50 + m.eth.change24h * 5)));

  const majorRisks = [
    `Heightened volatility: BTC moved ${changeTxt(m.btc.change24h)} in 24h — unstable positioning across majors.`,
    "Macro event risk: upcoming FOMC and CPI prints could widen spreads sharply.",
    "Leverage reset risk: perp funding remains elevated, raising liquidation cascades.",
  ];

  const events = [
    "Fed FOMC policy decision (this week)",
    "US CPI release (in 2 days)",
    "BTC spot-ETF net flow data (daily 4pm ET)",
    "Layer-2 mainnet upgrades in progress",
  ];

  const recommendation =
    m.score >= 65
      ? "Risk-off bias: avoid aggressive leverage until volatility decreases. Trim high-beta positions into strength and keep dry powder."
      : m.score >= 45
        ? "Neutral stance: prefer spot over leverage and tighten stops on high-volatility holdings."
        : "Risk-on lean: trend is intact. Scale in gradually and trail stops under support.";

  const localSummary = `Market overview: BTC momentum is ${btcTrend.toLowerCase()} (${changeTxt(m.btc.change24h)} in 24h) while ETH is ${ethTrend.toLowerCase()} (${changeTxt(m.eth.change24h)}). Broad sentiment reads ${m.sentiment.label} (${m.score}/100). ${m.sentiment.summary} ${DISCLAIMER}`;

  const llm = await callLLM(
    `You are Prorun AI market desk. In 3 concise lines summarise: BTC and ETH momentum, the dominant macro risk, and one risk-adjusted stance. Add the disclaimer line: "${DISCLAIMER}". Plain text only.`,
    `BTC ${btcTrend} ${changeTxt(m.btc.change24h)} · ETH ${ethTrend} ${changeTxt(m.eth.change24h)} · sentiment ${m.sentiment.label} ${m.score}/100`,
  );

  return {
    generatedAt: isoNow(),
    quotes: m.quotes,
    btc: { trend: btcTrend, momentum: btcMomentum, drivers: [] },
    eth: { trend: ethTrend, momentum: ethMomentum, drivers: [] },
    sentiment: { label: m.sentiment.label, score: m.score, summary: m.sentiment.summary },
    majorRisks,
    events,
    recommendation,
    aiSummary: llm ? nl2(llm) : localSummary,
  };
}

// ---------- Psychology ----------
export async function generatePsychologyReport(trades: Trade[]) {
  const base = analyzeTrading(trades);
  const llm = await callLLM(
    `You are Prorun AI, a trading psychologist. In 2 short paragraphs, interpret this trade log's behavioural patterns and give one priority change. End with: "${DISCLAIMER}"`,
    `Patterns found: ${base.patterns.map((p) => p.title).join("; ")}. Stats: win rate ${base.metrics.winRate}%, profit factor ${base.metrics.profitFactor}, avg R ${base.metrics.avgRr}, ${base.metrics.totalTrades} trades. Biggest opportunity: ${base.biggestOpportunity}.`,
  );
  return { ...base, summary: llm ? nl2(llm) : base.summary };
}