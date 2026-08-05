// Sample / demo datasets and deterministic wallet simulation.
import type { Asset, Portfolio, Trade } from "@/lib/types";
import { ASSET_CATALOG, buildPortfolio, getMarketQuotes } from "@/lib/market-data";
import { isoNow } from "@/lib/format";

/** Demo holdings used for the "Try demo portfolio" experience. */
export const SAMPLE_HOLDINGS: Record<string, number> = {
  BTC: 0.42,
  ETH: 5.8,
  SOL: 64,
  LINK: 340,
  UNI: 900,
  DOGE: 12000,
  USDC: 2600,
  SUI: 150,
};

export async function getSamplePortfolio(): Promise<Portfolio> {
  return buildPortfolio(SAMPLE_HOLDINGS, {
    label: "Demo Portfolio",
    source: "manual",
  });
}

/** Deterministic pseudo portfolio derived from a wallet address string. */
export async function getWalletPortfolio(address: string): Promise<Portfolio> {
  const seed = [...address].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  // mulberry32 PRNG seeded from the address for stable per-wallet results.
  let s = seed >>> 0;
  const rng = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const pick = () => {
    const idx = Math.floor(rng() * ASSET_CATALOG.length);
    return ASSET_CATALOG[idx];
  };

  const holdings: Record<string, number> = {};
  const count = 4 + Math.floor(rng() * 6);
  const baseValue = 15000 + rng() * 85000;
  for (let i = 0; i < count; i++) {
    const meta = pick();
    const w = 0.06 + rng() * 0.3;
    holdings[meta.symbol] = (holdings[meta.symbol] || 0) + (baseValue * w) / meta.seedPrice;
  }
  if (!holdings.USDC && !holdings.USDT && rng() > 0.4) {
    holdings.USDC = (baseValue * (0.05 + rng() * 0.12)) / 1;
  }

  return buildPortfolio(holdings, {
    label: `Wallet ${address.slice(0, 6).toUpperCase()}…${address.slice(-4)}`,
    source: "wallet",
    address,
  });
}

/** Demo trade log for the psychology analyzer. */
export const SAMPLE_TRADES: Trade[] = [
  { id: "T1", date: isoDaysAgo(42), side: "buy", asset: "SOL", sizeUsd: 1200, pnlUsd: 312, rr: 2.1, exitReason: "Target hit", heldHours: 42 },
  { id: "T2", date: isoDaysAgo(41), side: "buy", asset: "SUI", sizeUsd: 900, pnlUsd: -128, rr: 0.9, exitReason: "Stopped out", heldHours: 18 },
  { id: "T3", date: isoDaysAgo(40), side: "buy", asset: "DOGE", sizeUsd: 1500, pnlUsd: -410, rr: 0.7, exitReason: "Stopped out", heldHours: 9 },
  { id: "T4", date: isoDaysAgo(40.2), side: "buy", asset: "LINK", sizeUsd: 1800, pnlUsd: -520, rr: 0.6, exitReason: "Stopped out", heldHours: 6 },
  { id: "T5", date: isoDaysAgo(38), side: "buy", asset: "BTC", sizeUsd: 2200, pnlUsd: 204, rr: 1.6, exitReason: "Scaled out", heldHours: 30 },
  { id: "T6", date: isoDaysAgo(36), side: "sell", asset: "ETH", sizeUsd: 1000, pnlUsd: 145, rr: 2.4, exitReason: "Target hit", heldHours: 55 },
  { id: "T7", date: isoDaysAgo(34), side: "buy", asset: "SUI", sizeUsd: 2400, pnlUsd: -680, rr: 0.8, exitReason: "Stopped out", heldHours: 12 },
  { id: "T8", date: isoDaysAgo(33), side: "buy", asset: "SOL", sizeUsd: 2600, pnlUsd: -610, rr: 0.7, exitReason: "Stopped out", heldHours: 8 },
  { id: "T9", date: isoDaysAgo(31), side: "buy", asset: "DOGE", sizeUsd: 2000, pnlUsd: 385, rr: 2.2, exitReason: "Target hit", heldHours: 40 },
  { id: "T10", date: isoDaysAgo(29), side: "buy", asset: "ETH", sizeUsd: 1400, pnlUsd: 172, rr: 1.9, exitReason: "Target hit", heldHours: 26 },
  { id: "T11", date: isoDaysAgo(27), side: "sell", asset: "LINK", sizeUsd: 1100, pnlUsd: -150, rr: 0.8, exitReason: "Stopped out", heldHours: 14 },
  { id: "T12", date: isoDaysAgo(25), side: "buy", asset: "BTC", sizeUsd: 900, pnlUsd: 96, rr: 1.5, exitReason: "Scaled out", heldHours: 33 },
  { id: "T13", date: isoDaysAgo(22), side: "buy", asset: "SUI", sizeUsd: 3100, pnlUsd: -830, rr: 0.6, exitReason: "Stopped out", heldHours: 5 },
  { id: "T14", date: isoDaysAgo(21), side: "buy", asset: "SOL", sizeUsd: 3400, pnlUsd: -760, rr: 0.7, exitReason: "Stopped out", heldHours: 7 },
  { id: "T15", date: isoDaysAgo(20), side: "buy", asset: "AVAX", sizeUsd: 2900, pnlUsd: 410, rr: 1.8, exitReason: "Target hit", heldHours: 28 },
  { id: "T16", date: isoDaysAgo(17), side: "buy", asset: "ETH", sizeUsd: 1600, pnlUsd: 98, rr: 1.2, exitReason: "Scaled out", heldHours: 22 },
  { id: "T17", date: isoDaysAgo(14), side: "sell", asset: "BTC", sizeUsd: 1300, pnlUsd: 211, rr: 2.0, exitReason: "Target hit", heldHours: 44 },
  { id: "T18", date: isoDaysAgo(12), side: "buy", asset: "DOGE", sizeUsd: 1500, pnlUsd: -255, rr: 0.9, exitReason: "Stopped out", heldHours: 16 },
  { id: "T19", date: isoDaysAgo(9), side: "buy", asset: "LINK", sizeUsd: 1800, pnlUsd: -340, rr: 0.8, exitReason: "Stopped out", heldHours: 11 },
  { id: "T20", date: isoDaysAgo(7), side: "buy", asset: "SUI", sizeUsd: 2200, pnlUsd: -505, rr: 0.6, exitReason: "Stopped out", heldHours: 6 },
  { id: "T21", date: isoDaysAgo(5), side: "buy", asset: "SOL", sizeUsd: 1700, pnlUsd: 262, rr: 1.9, exitReason: "Target hit", heldHours: 31 },
  { id: "T22", date: isoDaysAgo(3), side: "buy", asset: "ETH", sizeUsd: 1200, pnlUsd: 84, rr: 1.4, exitReason: "Scaled out", heldHours: 20 },
  { id: "T23", date: isoDaysAgo(2), side: "buy", asset: "ARB", sizeUsd: 950, pnlUsd: -118, rr: 0.9, exitReason: "Stopped out", heldHours: 13 },
  { id: "T24", date: isoDaysAgo(0.6), side: "buy", asset: "BTC", sizeUsd: 1450, pnlUsd: 133, rr: 1.7, exitReason: "Scaled out", heldHours: 24 },
];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

/** Build a performance curve from a portfolio over the last N days. */
export function buildPerformanceCurve(portfolio: Portfolio, days = 30) {
  const base = portfolio.totalValue;
  const points: { date: string; value: number }[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const drift =
      (Math.sin(i * 0.9) * 0.02 + Math.cos(i * 0.4) * 0.012) * base * 0.5;
    const growth = (i / days) * base * 0.12;
    const daily =
      portfolio.assets.reduce(
        (s, a) => s + a.allocation * (a.change24h / 100) * (i % 3 === 0 ? 1 : 0.3),
        0,
      ) * base;
    points.push({
      date: d.toISOString().slice(0, 10),
      value: Math.round(base - growth + drift + daily),
    });
  }
  return points;
}

/** Simple market sentiment label generator. */
export async function buildMarketBriefFor(daysAgo = 0) {
  const quotes = await getMarketQuotes();
  const btc = quotes.find((q) => q.symbol === "BTC")!;
  const eth = quotes.find((q) => q.symbol === "ETH")!;
  const total = quotes.reduce((s, q) => s + (q.change24h > 0 ? 1 : 0), 0);
  const breadth = total / quotes.length;
  const gIndex = quotes.reduce((s, q) => s + q.change24h, 0) / quotes.length;
  const score = Math.round(Math.min(100, Math.max(0, 50 + gIndex * 3 + (breadth - 0.5) * 40)));

  const sentiment =
    score >= 70
      ? { label: "Greed", summary: "Markets are extended. Momentum is strong but pullback risk is building." }
      : score >= 55
        ? { label: "Neutral-Positive", summary: "Broad uptrend intact with healthy rotation across majors." }
        : score >= 40
          ? { label: "Neutral", summary: "Mixed momentum. Range-bound behaviour with sector rotation." }
          : { label: "Fear", summary: "Risk-off tone. Expect choppy conditions and fragile rallies." };

  return { quotes, btc, eth, breadth, gIndex, sentiment, score };
}

export function currentDateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}