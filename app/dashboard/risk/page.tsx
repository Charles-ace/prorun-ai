"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BrainCircuit, CheckCircle2, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { PortfolioGate } from "@/components/dashboard/portfolio-gate";
import { GlassCard, CardHeader } from "@/components/ui/glass-card";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { RiskMetricBars, VolatilityDonut } from "@/components/charts/risk-exposure";
import { AllocationBar } from "@/components/dashboard/holdings-table";
import { Badge } from "@/components/ui/badge";
import { formatUsd, riskColor } from "@/lib/format";
import type { Asset, RiskItem } from "@/lib/types";

export default function RiskPage() {
  const { portfolio, riskReport, runAnalysis, analyzing } = usePortfolio();
  const [error, setError] = useState<string | null>(null);

  if (!portfolio) {
    return (
      <div className="py-6">
        <PageHead desc="Load a portfolio to compute its risk score." />
        <PortfolioGate title="Analyze your portfolio risk" subtitle="Prorun will quantify concentration, volatility, protection and drawdown." />
      </div>
    );
  }

  const report = riskReport;

  const handleRun = async () => {
    setError(null);
    try {
      await runAnalysis();
    } catch {
      setError("Analysis failed — please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Risk Analysis</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Portfolio Risk Report</h2>
          <p className="mt-1 text-sm text-ink-muted">AI-quantified exposure for {portfolio.label}.</p>
        </div>
        {report ? (
          <button
            onClick={handleRun}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2 text-sm font-bold text-[#06130d] transition hover:brightness-110"
          >
            <Sparkles size={15} /> Re-run Analysis
          </button>
        ) : null}
      </div>

      {!report ? (
        <GlassCard className="max-w-2xl">
          <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 shadow-glow">
              <BrainCircuit size={28} className="text-[#06130d]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-ink">Run your AI risk analysis</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              Prorun analyzes {portfolio.assets.length} assets across concentration, volatility,
              stable protection and drawdown to generate a 0-100 risk score with recommendations.
            </p>
            <button
              onClick={handleRun}
              disabled={analyzing}
              className="mt-7 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-6 py-3 text-sm font-bold text-[#06130d] transition hover:brightness-110 disabled:opacity-70"
            >
              {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {analyzing ? "Analyzing…" : "Generate Risk Report"}
            </button>
            {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
          </div>
        </GlassCard>
      ) : (
        <RiskReportView report={report} assets={portfolio.assets} />
      )}
    </div>
  );
}

function PageHead({ desc }: { desc: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Risk Analysis</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Portfolio Risk Report</h2>
      <p className="mt-1 text-sm text-ink-muted">{desc}</p>
    </div>
  );
}

function RiskReportView({ report, assets }: { report: NonNullable<ReturnType<typeof usePortfolio>["riskReport"]>; assets: Asset[] }) {
  if (!report) return null;
  const severityTone: Record<RiskItem["severity"], "red" | "amber" | "green"> = {
    high: "red",
    medium: "amber",
    low: "green",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* score + summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard delay={0}>
          <CardHeader title="Risk Score" subtitle="0 = safest · 100 = riskiest" icon={<TrendingUp size={15} />} />
          <div className="flex justify-center py-2">
            <RiskGauge value={report.score} size={200} label="/ 100" sublabel={report.scoreLabel} />
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-center">
            <Badge tone={report.score >= 70 ? "red" : report.score >= 40 ? "amber" : "green"}>
              {report.scoreLabel}
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-ink-faint">
              <BrainCircuit size={12} className="text-emerald-300" /> Confidence {report.confidence}%
            </span>
          </div>
        </GlassCard>

        <GlassCard delay={0.1} className="lg:col-span-2">
          <CardHeader title="AI Summary" subtitle="Generated analysis" icon={<Sparkles size={15} />} />
          <div className="whitespace-pre-line rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-ink-muted">
            {report.summary}
          </div>
          <AllocationBar assets={assets} />
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {assets.slice(0, 8).map((a) => (
              <span key={a.symbol} className="rounded-md border border-white/10 px-2 py-0.5 text-ink-faint">
                {a.symbol} {a.allocation.toFixed(0)}%
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* metrics + risks */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard delay={0.15}>
          <CardHeader title="Risk Factors" subtitle="Sub-scores" icon={<TrendingUp size={15} />} />
          <RiskMetricBars metrics={report.metrics} />
        </GlassCard>

        <GlassCard delay={0.2} className="lg:col-span-2">
          <CardHeader title="Main Risks" subtitle="Prioritized findings" icon={<AlertTriangle size={15} />} />
          <div className="space-y-3">
            {report.topRisks.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2">
                  <Badge tone={severityTone[r.severity]}>
                    {r.severity === "high" ? "High" : r.severity === "medium" ? "Medium" : "Low"}
                  </Badge>
                  <h4 className="text-sm font-semibold text-ink">{r.title}</h4>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{r.detail}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* recommendations + volatility + drawdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard delay={0.25}>
          <CardHeader title="Recommendations" subtitle="Prioritized actions" icon={<CheckCircle2 size={15} />} />
          <div className="space-y-3">
            {report.recommendations.map((r, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] font-bold text-emerald-300">
                  {i + 1}
                </span>
                <p className="leading-relaxed text-ink-muted">{r}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.3}>
          <CardHeader title="Volatility Exposure" subtitle="By asset class" icon={<Sparkles size={15} />} />
          <VolatilityDonut data={report.volatilityBreakdown} />
          <p className="mt-4 text-center text-sm text-ink-muted">
            Estimated daily portfolio volatility{" "}
            <span className="tabular font-bold" style={{ color: riskColor(report.score) }}>
              ±{report.estimatedDailyVol}%
            </span>
          </p>
        </GlassCard>

        <GlassCard delay={0.35}>
          <CardHeader title="Drawdown Scenarios" subtitle="Modelled market shocks" icon={<AlertTriangle size={15} />} />
          <div className="space-y-2.5">
            {report.drawdownScenarios.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-ink">{d.label}</p>
                  <p className="text-[11px] text-ink-faint">{d.survivalNote}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-bold text-rose-300">
                    {d.impactPct.toFixed(1)}%
                  </p>
                  <p className="tabular text-[11px] text-ink-faint">
                    {formatUsd(Math.abs(d.impact))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <p className="text-center text-[11px] text-ink-faint">
        Prorun AI provides analysis and education, not financial advice.
      </p>
    </motion.div>
  );
}