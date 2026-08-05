// Trading psychology / behaviour analysis engine.
// Detects revenge trading, overtrading, size escalation after losses,
// poor risk/reward management and emotional streaks from a trade log.
import type { Pattern, PsychologyReport, Trade } from "@/lib/types";
import { isoNow, uid } from "@/lib/format";

interface Normalized {
  t: number; // epoch ms
  pnl: number;
  size: number;
  rr: number;
  asset: string;
  heldHours: number;
  side: string;
}

function norm(trades: Trade[]): Normalized[] {
  return [...trades]
    .map((t) => ({
      t: new Date(t.date).getTime(),
      pnl: t.pnlUsd,
      size: t.sizeUsd,
      rr: t.rr,
      asset: t.asset,
      heldHours: t.heldHours,
      side: t.side,
    }))
    .sort((a, b) => a.t - b.t);
}

function safeRound(v: number, d = 1): number {
  return Math.round(v * 10 ** d) / 10 ** d;
}

export function analyzeTrading(trades: Trade[]): PsychologyReport {
  const list = norm(trades);

  const wins = list.filter((t) => t.pnl > 0);
  const losses = list.filter((t) => t.pnl <= 0);
  const winRate = list.length ? (wins.length / list.length) * 100 : 0;
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const avgRr = list.length ? list.reduce((s, t) => s + t.rr, 0) / list.length : 0;
  const netPnl = list.reduce((s, t) => s + t.pnl, 0);

  // Cumulative equity curve for drawdown.
  let peak = 0;
  let maxDD = 0;
  let cum = 0;
  for (const t of list) {
    cum += t.pnl;
    peak = Math.max(peak, cum);
    maxDD = Math.max(maxDD, peak - cum);
  }

  const dayWindow = 24 * 3600 * 1000;
  const first = list.length ? list[0].t : 0;
  const last = list.length ? list[list.length - 1].t : 0;
  const spanDays = Math.max(1, (last - first) / dayWindow);
  const avgTradesPerDay = list.length / spanDays;

  // ---- Pattern detection ----

  // Revenge trading: more trades + bigger size in the hours after a loss.
  let revengeCount = 0;
  let afterLossSizeRatio = 0;
  const sizeAfterLoss: number[] = [];
  const sizeNormal: number[] = [];
  list.forEach((t, i) => {
    if (i === 0) return;
    const prev = list[i - 1];
    const gap = t.t - prev.t;
    if (prev.pnl <= 0) {
      sizeAfterLoss.push(t.size);
      if (gap < 6 * 3600 * 1000) revengeCount++;
      if (gap < 12 * 3600 * 1000) revengeCount += 0.5;
    } else {
      sizeNormal.push(t.size);
    }
  });
  const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const avgAfter = mean(sizeAfterLoss);
  const avgNorm = mean(sizeNormal);
  afterLossSizeRatio = avgNorm > 0 ? avgAfter / avgNorm : 1;

  // Consecutive-loss streak behaviour: size grows after 2+ losses.
  let streakEscalation = false;
  let maxLossStreak = 0;
  {
    let streak = 0;
    let lastSize = 0;
    let escalations = 0;
    for (const t of list) {
      if (t.pnl <= 0) {
        streak++;
        if (streak >= 2 && t.size > lastSize * 1.2 && lastSize > 0) {
          streakEscalation = true;
          escalations++;
        }
        maxLossStreak = Math.max(maxLossStreak, streak);
      } else {
        streak = 0;
      }
      lastSize = t.size;
    }
    streakEscalation = escalations >= 1 || (streakEscalation && maxLossStreak >= 3);
  }

  const overtrading = avgTradesPerDay > 6 || list.length > 60;
  const poorRr = avgRr < 1.2 || (avgLoss > avgWin && avgLoss > 0);
  const cutLossesLate = losses.some((t) => t.heldHours > 72);
  const cuttingWinners = wins.length > 0 && avgRr < 1.0;

  const patterns: Pattern[] = [];

  if (streakEscalation) {
    patterns.push({
      title: "Increasing size after losses",
      detail: `Position size grows after consecutive losses (${maxLossStreak}+ loss streak observed). This is the classic tilt signal that compounds drawdowns.`,
      severity: "high",
      stat: `${maxLossStreak}-loss streak detected`,
    });
  }
  if (revengeCount >= 2 || afterLossSizeRatio > 1.2) {
    patterns.push({
      title: "Revenge trading pattern",
      detail: `${Math.round(revengeCount)} rapid re-entries within hours of a loss, with size ${safeRound((afterLossSizeRatio - 1) * 100)}% above your normal average.`,
      severity: "high",
      stat: `Size ${safeRound(afterLossSizeRatio * 100)}% of normal`,
    });
  }
  if (overtrading) {
    patterns.push({
      title: "Overtrading",
      detail: `Averaging ${safeRound(avgTradesPerDay)} trades/day. Excessive frequency raises fees and decision noise faster than edge.`,
      severity: "medium",
      stat: `${safeRound(avgTradesPerDay)} trades/day`,
    });
  }
  if (poorRr) {
    patterns.push({
      title: "Poor risk/reward execution",
      detail: `Average R multiple is ${safeRound(avgRr)} with average loss (${avgLoss < 0 ? "" : "$" + safeRound(avgLoss)}) ${avgLoss >= avgWin ? "exceeding" : "approaching"} average win ($${safeRound(avgWin)}).`,
      severity: "medium",
      stat: `R multiple ${safeRound(avgRr)}`,
    });
  }
  if (cutLossesLate) {
    patterns.push({
      title: "Late loss cutting",
      detail: "Several losers were held for 3+ days, indicating hope-based management rather than predefined invalidation.",
      severity: "medium",
    });
  }
  if (cuttingWinners) {
    patterns.push({
      title: "Cutting winners early",
      detail: "Winners are exited below a 1R target on average, capping upside while losers run.",
      severity: "low",
    });
  }
  if (winRate < 40 && profitFactor < 1) {
    patterns.push({
      title: "Negative expectancy",
      detail: `Win rate ${safeRound(winRate)}% with profit factor ${safeRound(profitFactor, 2)} means the current method is losing money on average.`,
      severity: "high",
      stat: `PF ${safeRound(profitFactor, 2)}`,
    });
  }
  if (patterns.length === 0) {
    patterns.push({
      title: "Consistent execution",
      detail: "No strong behavioural red flags detected. Win rate and risk management are within healthy bands.",
      severity: "low",
    });
  }

  // Discipline score (100 = ideal).
  let discipline = 100;
  if (streakEscalation) discipline -= 25;
  if (revengeCount >= 2) discipline -= 20;
  if (overtrading) discipline -= 10;
  if (poorRr) discipline -= 15;
  if (cutLossesLate) discipline -= 8;
  discipline = Math.max(5, Math.min(98, Math.round(discipline)));
  const traitLabel =
    discipline >= 80
      ? "Disciplined"
      : discipline >= 55
        ? "Developing"
        : "Emotional";

  const recommendations: string[] = [];
  if (streakEscalation)
    recommendations.push("Reduce position size by 50% after 2 consecutive losses — hard stop, no exceptions.");
  if (revengeCount >= 2)
    recommendations.push("Introduce a 24h cooldown after any losing day; journal the impulse before re-entering.");
  if (overtrading)
    recommendations.push("Cap at 3 setups per day. Quality > quantity — filter for A+ only.");
  if (poorRr)
    recommendations.push("Set a fixed 1:2.5 risk/reward on every trade and move to break-even at 1R.");
  if (cutLossesLate)
    recommendations.push("Define invalidation levels before entry and enforce stops at 1R max.");
  if (recommendations.length === 0)
    recommendations.push("Maintain the current discipline — log emotions weekly to keep patterns visible.");

  const biggestOpportunity = streakEscalation
    ? "Risk consistency"
    : poorRr
      ? "Risk/reward discipline"
      : overtrading
        ? "Trade selection"
        : avgRr < 1.5
          ? "Riding winners further"
          : "Capital efficiency";

  const summary = `Across ${list.length} trades ($${Math.abs(netPnl) >= 1000 ? (netPnl / 1000).toFixed(1) + "k" : Math.round(netPnl)} net), your biggest behavioural edge${netPnl < 0 ? " gap" : ""} is ${biggestOpportunity.toLowerCase()}. ${patterns[0]?.detail ?? ""}`;

  return {
    id: uid(),
    generatedAt: isoNow(),
    disciplineScore: discipline,
    traitLabel,
    summary,
    patterns,
    metrics: {
      winRate: safeRound(winRate),
      totalTrades: list.length,
      netPnl,
      profitFactor: safeRound(profitFactor, 2),
      avgWin: safeRound(avgWin),
      avgLoss: safeRound(avgLoss),
      avgRr: safeRound(avgRr),
      maxDrawdown: safeRound(maxDD),
      avgTradesPerDay: safeRound(avgTradesPerDay),
    },
    recommendations,
    biggestOpportunity,
  };
}