// Deterministic portfolio risk engine.
// Computes a 0-100 risk score from concentration, volatility exposure,
// stablecoin protection, drawdown potential and market instability.
// Produces structured metrics, narrative risks, recommendations and
// drawdown scenarios. This runs offline; the AI service layer may layer a
// natural-language pass on top when an LLM key is configured.
import type {
  Asset,
  DrawdownScenario,
  Portfolio,
  RiskItem,
  RiskMetric,
  RiskReport,
  VolLevel,
} from "@/lib/types";
import { isoNow, uid } from "@/lib/format";

const VOL_WEIGHT: Record<VolLevel, number> = { low: 8, medium: 22, high: 40 };

export function portfolioSummaryAssets(portfolio: Portfolio) {
  return portfolio.assets;
}

function allocationsByValue(assets: Asset[]): number[] {
  const sum = assets.reduce((s, a) => s + a.allocation, 0);
  return assets.map((a) => a.allocation / (sum || 1));
}

/** Herfindahl-Hirschman Index concentration (0..1). */
function hhi(weights: number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}

function safeRound(v: number, d = 1): number {
  return Math.round(v * 10 ** d) / 10 ** d;
}

export function analyzePortfolio(portfolio: Portfolio): RiskReport {
  const assets = [...portfolio.assets].sort((a, b) => b.allocation - a.allocation);
  const weights = allocationsByValue(assets);
  const n = assets.length || 1;

  const totalValue =
    assets.reduce((s, a) => s + a.amount * a.price, 0) || portfolio.totalValue;

  // 1. Concentration score (0-100)
  const h = hhi(weights);
  const concentrationScore = Math.min(
    100,
    Math.round((h * 100 * 0.75 + (n <= 2 ? 25 : n <= 4 ? 10 : 0)) * 0.9),
  );

  const topHolding = assets[0];
  const top3 = weights.slice(0, 3).reduce((s, w) => s + w, 0);

  // 2. Volatility exposure
  const volExposure = assets.reduce((s, a) => s + a.allocation * VOL_WEIGHT[a.volatility], 0);
  const volatilityScore = Math.min(100, Math.round((volExposure / 40) * 100));

  // 3. Stablecoin protection
  const stablePct = assets.filter((a) => a.stable).reduce((s, a) => s + a.allocation, 0);
  const missing = Math.max(0, 20 - stablePct);
  const protectionScore = Math.min(100, Math.round(missing * (100 / 20)));

  // 4. Drawdown potential = weighted volatility without stabilisers
  const riskyVol = assets
    .filter((a) => !a.stable)
    .reduce((s, a) => s + a.allocation * VOL_WEIGHT[a.volatility], 0);
  const drawdownScore = Math.min(100, Math.round((riskyVol / 40) * 100));

  // 5. Instability / short-term momentum (freshness of 24h moves)
  const avgAbsMove =
    assets.reduce((s, a) => s + a.allocation * Math.abs(a.change24h), 0) / 100;
  const instabilityScore = Math.min(100, Math.round((avgAbsMove / 12) * 100));

  const score = safeRound(
    concentrationScore * 0.28 +
      volatilityScore * 0.3 +
      protectionScore * 0.18 +
      drawdownScore * 0.14 +
      instabilityScore * 0.1,
  );

  const scoreLabel =
    score < 40 ? "Low Risk" : score < 70 ? "Moderate Risk" : "High Risk";

  // ---- Drawdown scenarios ----
  const shockTables = [
    { label: "Mild pullback", shock: -5, volMult: { high: 1.6, medium: 1.1, low: 0.15 } },
    { label: "Broad correction", shock: -12, volMult: { high: 2.5, medium: 1.6, low: 0.2 } },
    { label: "Severe drawdown", shock: -25, volMult: { high: 3.6, medium: 2.3, low: 0.3 } },
    { label: "Crypto crash", shock: -45, volMult: { high: 5.2, medium: 3.3, low: 0.4 } },
  ];
  const drawdownScenarios: DrawdownScenario[] = shockTables.map((st) => {
    const impactPct = assets.reduce(
      (s, a) =>
        s + a.allocation * (a.stable ? 0.02 : st.shock * st.volMult[a.volatility]),
      0,
    );
    const capped = Math.max(-95, Math.min(0, impactPct));
    const impact = totalValue * (capped / 100);
    const stableCover = Math.max(0, stablePct - Math.abs(capped) * 0.12);
    return {
      label: st.label,
      shock: st.shock,
      impact,
      impactPct: safeRound(capped),
      survivalNote:
        stableCover >= 10
          ? "Durable — liquidity cover holds."
          : stableCover >= 3
            ? "Thin buffer — consider adding stable reserves."
            : "Fragile — very limited stable shielding.",
    };
  });

  const worst = Math.min(...drawdownScenarios.map((d) => d.impactPct));
  const estimatedDailyVol = safeRound(volExposure / 6, 1);

  // ---- Vol breakdown ----
  const volatilityBreakdown = (["high", "medium", "low"] as VolLevel[]).map((lv) => ({
    level: lv,
    pct:
      safeRound(
        assets.filter((a) => a.volatility === lv).reduce((s, a) => s + a.allocation, 0),
      ),
  }));

  const concentration = assets.slice(0, 3).map((a) => ({
    token: a.symbol,
    pct: safeRound(a.allocation),
  }));

  // ---- Metrics ----
  const metrics: RiskMetric[] = [
    {
      label: "Concentration",
      value: concentrationScore,
      score: concentrationScore,
      description: `Top asset is ${topHolding?.symbol ?? "—"} at ${safeRound(topHolding?.allocation ?? 0)}% · HHI ${safeRound(h * 100)}`,
    },
    {
      label: "Volatility Exposure",
      value: volatilityScore,
      score: volatilityScore,
      description: `${safeRound(assets.filter((a) => a.volatility === "high").reduce((s, a) => s + a.allocation, 0))}% in high-volatility assets`,
    },
    {
      label: "Stable Protection",
      value: protectionScore,
      score: protectionScore,
      description: `${safeRound(stablePct)}% held in stable assets (target 10-20%)`,
    },
    {
      label: "Drawdown Potential",
      value: drawdownScore,
      score: drawdownScore,
      description: worst === 0 ? "No modelled downside" : `Est. ${Math.abs(Math.round(worst))}% loss in a severe crash`,
    },
  ];

  // ---- Top risks narrative ----
  const topRisks: RiskItem[] = [];
  if (topHolding && topHolding.allocation > 35) {
    topRisks.push({
      title: `${topHolding.symbol} concentration`,
      detail: `Your portfolio has ${safeRound(topHolding.allocation)}% exposure to ${topHolding.name}-related assets. A sharp move in ${topHolding.symbol} alone could move your whole account.`,
      severity: "high",
    });
  } else if (topHolding && topHolding.allocation > 20) {
    topRisks.push({
      title: `Dominated by ${topHolding.symbol}`,
      detail: `${safeRound(topHolding.allocation)}% sits in a single asset. Consider trimming toward a cap of 20-25% per position.`,
      severity: "medium",
    });
  }
  if (volatilityScore > 60) {
    topRisks.push({
      title: "High volatility exposure",
      detail: `${safeRound(assets.filter((a) => a.volatility === "high").reduce((s, a) => s + a.allocation, 0))}% of holdings are high-volatility assets, amplifying daily swings.`,
      severity: "high",
    });
  }
  if (stablePct < 10) {
    topRisks.push({
      title: "Low stablecoin protection",
      detail: `Only ${safeRound(stablePct)}% of portfolio is in stable assets. With thin liquidity cover, drawdowns force sales into weakness.`,
      severity: "high",
    });
  } else if (stablePct < 20) {
    topRisks.push({
      title: "Thin liquidity buffer",
      detail: `${safeRound(stablePct)}% stable reserves is below the recommended 10-20% band for opportunistic buying.`,
      severity: "medium",
    });
  }
  if (top3 > 85) {
    topRisks.push({
      title: "Top-3 cluster risk",
      detail: `Your three largest positions total ${safeRound(top3 * 100)}%. The portfolio is effectively an index of three tokens.`,
      severity: "medium",
    });
  }
  if (avgAbsMove > 8) {
    topRisks.push({
      title: "Heightened short-term instability",
      detail: `Weighted 24h price movement is ${safeRound(avgAbsMove)}%, above normal. Momentum is currently volatile.`,
      severity: "low",
    });
  }
  if (topRisks.length === 0) {
    topRisks.push({
      title: "Well-balanced structure",
      detail: "No single risk dominates at current levels — concentration and volatility remain within healthy bounds.",
      severity: "low",
    });
  }

  // ---- Recommendations ----
  const recommendations: string[] = [];
  if (topHolding && topHolding.allocation > 35)
    recommendations.push(`Reduce concentrated positions: trim ${topHolding.symbol} toward a 20-25% cap and rotate into uncorrelated assets.`);
  if (stablePct < 10)
    recommendations.push("Maintain 10-20% liquidity: add USDC/USDT reserves to fund entries and absorb volatility.");
  if (riskyVol > 30)
    recommendations.push("Avoid increasing leverage while volatility exposure stays elevated.");
  if (n <= 3)
    recommendations.push("Add 2-4 uncorrelated assets to lower the concentration score.");
  if (top3 > 85)
    recommendations.push("Diversify the top cluster into at least two more independent sectors.");
  if (recommendations.length === 0)
    recommendations.push("Hold the current structure — reduce allocation drift by rebalancing quarterly.");
  recommendations.push("Review allocations after any major macro event or 15%+ single-asset move.");

  const summary =
    score >= 70
      ? `Your portfolio is carrying elevated risk at ${score}/100. Concentration and volatility exposure dominate. Immediate rebalancing toward stable reserves and lower per-asset caps is advised.`
      : score >= 40
        ? `Your portfolio is moderately risky at ${score}/100. The structure is workable but has room to improve protection and diversification before the next volatility cycle.`
        : `Your portfolio is well positioned at ${score}/100. Concentration and volatility are under control with a healthy stable reserve. Stay disciplined and rebalance on drift.`;

  return {
    id: uid(),
    portfolioId: portfolio.id,
    score,
    scoreLabel,
    generatedAt: isoNow(),
    summary,
    metrics,
    concentration,
    volatilityBreakdown,
    topRisks,
    recommendations,
    drawdownScenarios,
    estimatedDailyVol,
    confidence: safeRound(
      60 + Math.min(40, n * 6 + (portfolio.source === "wallet" ? 10 : 0)),
    ),
  };
}

export function volatilityLabelColor(v: VolLevel): string {
  return v === "high" ? "#fb7185" : v === "medium" ? "#fbbf24" : "#34d399";
}