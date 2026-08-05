export type VolLevel = "low" | "medium" | "high";

export interface Asset {
  symbol: string;
  name: string;
  amount: number;
  price: number;
  change24h: number;
  allocation: number;
  volatility: VolLevel;
  stable: boolean;
  trend7d: number;
}

export interface Portfolio {
  id: string;
  label: string;
  source: "wallet" | "exchange" | "manual";
  address?: string;
  assets: Asset[];
  totalValue: number;
  createdAt: string;
  note?: string;
}

export interface RiskMetric {
  label: string;
  value: number; // 0-100 where higher = more risk
  score: number; // good (0) -> bad (100)
  description: string;
}

export interface RiskItem {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface DrawdownScenario {
  label: string;
  shock: number; // market -%
  impact: number; // portfolio $ loss
  impactPct: number;
  survivalNote: string;
}

export interface RiskReport {
  id: string;
  portfolioId: string;
  score: number; // 0-100, higher = riskier
  scoreLabel: string;
  generatedAt: string;
  summary: string;
  metrics: RiskMetric[];
  concentration: { token: string; pct: number }[];
  volatilityBreakdown: { level: VolLevel; pct: number }[];
  topRisks: RiskItem[];
  recommendations: string[];
  drawdownScenarios: DrawdownScenario[];
  estimatedDailyVol: number;
  confidence: number; // 0-100
}

export interface MarketAssetQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  observed?: boolean;
}

export interface MarketBrief {
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

export interface Trade {
  id: string;
  date: string; // ISO
  side: "buy" | "sell";
  asset: string;
  sizeUsd: number;
  pnlUsd: number;
  rr: number; // risk/reward multiple
  exitReason: string;
  heldHours: number;
}

export interface Pattern {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  stat?: string;
}

export interface PsychologyReport {
  id: string;
  generatedAt: string;
  disciplineScore: number; // 0-100, higher = more disciplined
  traitLabel: string;
  summary: string;
  patterns: Pattern[];
  metrics: {
    winRate: number;
    totalTrades: number;
    netPnl: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    avgRr: number;
    maxDrawdown: number;
    avgTradesPerDay: number;
  };
  recommendations: string[];
  biggestOpportunity: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestions?: string[];
}

export interface ChatContext {
  portfolioValue: number;
  riskScore: number;
  topAllocations: { symbol: string; pct: number }[];
  stablePct: number;
  portfolioChange24h: number;
  marketSentiment: string;
  btcTrend: string;
  ethTrend: string;
  reportSummary?: string;
}