"use client";

import Link from "next/link";
import { Activity, ArrowRight, BrainCircuit, LineChart, ShieldAlert, Sparkles } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { PortfolioGate } from "@/components/dashboard/portfolio-gate";
import { GlassCard, CardHeader } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { PerformanceArea } from "@/components/charts/performance-area";
import { AllocationBar } from "@/components/dashboard/holdings-table";
import { formatUsd, riskColor } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default function OverviewPage() {
  const { portfolio, riskReport, performance, portfolioChange24h } = usePortfolio();

  if (!portfolio) {
    return (
      <div className="py-10">
        <PageTitle
          eyebrow="Welcome to Prorun AI"
          title="Your AI risk analyst"
          desc="Load a portfolio to generate a live risk profile, market brief and personal AI assistant."
        />
        <PortfolioGate />
      </div>
    );
  }

  const change = portfolioChange24h();
  const report = riskReport;
  const color = riskColor(report?.score ?? 0);
  const curve = performance();

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Overview"
        title={portfolio.label}
        desc="Live risk posture across your holdings, markets and trading behavior."
        right={
          <div className="flex gap-2">
            <Link href="/dashboard/risk" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-emerald-400/30 hover:text-emerald-300">
              <ShieldAlert size={15} /> Risk Report
            </Link>
            <Link href="/dashboard/assistant" className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-3.5 py-2 text-sm font-bold text-[#06130d] transition hover:brightness-110">
              <BrainCircuit size={15} /> Ask AI
            </Link>
          </div>
        }
      />

      {/* top cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Portfolio Value"
          value={formatUsd(portfolio.totalValue)}
          change={change}
          spark={curve.slice(-30).map((p) => p.value)}
          footer="across all assets"
          icon={<Sparkles size={13} className="text-emerald-300" />}
        />
        <StatCard
          label="Risk Score"
          value={`${report ? report.score : "—"}/100`}
          footer={report ? report.scoreLabel : "Run analysis"}
          icon={<Activity size={13} className="text-rose-300" />}
        />
        <StatCard
          label="24h Change"
          value={`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
          change={change}
          footer="portfolio weighted"
          icon={<LineChart size={13} className="text-emerald-300" />}
        />
        <StatCard
          label="AI Confidence"
          value={report ? `${report.confidence}%` : "—"}
          footer={report ? "model confidence" : "Pending portfolio analysis"}
          icon={<BrainCircuit size={13} className="text-lime-300" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader title="Performance" subtitle="Portfolio value over time" icon={<LineChart size={15} />} />
          <PerformanceArea data={curve} />
        </GlassCard>

        <GlassCard>
          <CardHeader title="Risk Score" subtitle="Current exposure" icon={<ShieldAlert size={15} />} />
          <div className="flex justify-center py-2">
            <RiskGauge value={report ? report.score : 0} size={180} label="/ 100" sublabel={report?.scoreLabel} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint">Stable %</p>
              <p className="tabular text-sm font-bold text-ink">
                {portfolio.assets.filter((a) => a.stable).reduce((s, a) => s + a.allocation, 0).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint">Est. vol</p>
              <p className="tabular text-sm font-bold" style={{ color }}>
                {report ? `${report.estimatedDailyVol}%` : "—"}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader
            title="Allocation"
            subtitle="Concentration across position"
            icon={<Activity size={15} />}
            right={<Badge tone="accent">{portfolio.assets.length} assets</Badge>}
          />
          <AllocationBar assets={portfolio.assets} />
          <div className="mt-4 flex flex-wrap gap-2">
            {portfolio.assets.slice(0, 8).map((a) => (
              <span key={a.symbol} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-ink-muted">
                {a.symbol} <span className="tabular font-semibold text-ink">{a.allocation.toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader title="AI Insight" subtitle="Top recommendation" icon={<Sparkles size={15} />} />
          {(report?.recommendations ?? []).slice(0, 3).map((r, i) => (
            <div key={i} className="mb-3 flex gap-2 text-sm text-ink-muted">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] font-bold text-emerald-300">
                {i + 1}
              </span>
              <p className="leading-relaxed">{r}</p>
            </div>
          ))}
          <Link href="/dashboard/risk" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200">
            View full risk report <ArrowRight size={13} />
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}

function PageTitle({ eyebrow, title, desc, right }: { eyebrow: string; title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{title}</h2>
        {desc && <p className="mt-1 text-sm text-ink-muted">{desc}</p>}
      </div>
      {right}
    </div>
  );
}