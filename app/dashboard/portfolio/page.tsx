"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Cpu, ScanSearch, Wallet } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { PortfolioGate } from "@/components/dashboard/portfolio-gate";
import { GlassCard, CardHeader } from "@/components/ui/glass-card";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { AllocationPie, AllocationLegend } from "@/components/charts/allocation-pie";
import { PerformanceArea } from "@/components/charts/performance-area";
import { Badge, ChangePill } from "@/components/ui/badge";
import { formatUsd, shortAddress } from "@/lib/format";

export default function PortfolioPage() {
  const { portfolio, performance } = usePortfolio();
  const router = useRouter();

  if (!portfolio) {
    return (
      <div className="py-6">
        <PageHead title="Portfolio" desc="Connect a wallet, choose an exchange, or enter holdings manually to begin." />
        <PortfolioGate />
      </div>
    );
  }

  const totalValue = portfolio.totalValue;
  const change24h = portfolio.assets.reduce((s, a) => s + a.allocation * a.change24h, 0);
  const stablePct = portfolio.assets.filter((a) => a.stable).reduce((s, a) => s + a.allocation, 0);
  const curve = performance();

  return (
    <div className="space-y-6">
      <PageHead title="Portfolio" desc="Your positions, allocation and live valuation." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Portfolio Value" value={formatUsd(totalValue)} accent />
        <MiniStat label="24h Weighted Change" value={<ChangePill value={change24h} />} />
        <MiniStat label="Stable Protection" value={`${stablePct.toFixed(1)}%`} />
        <MiniStat
          label="Source"
          value={
            <span className="flex items-center gap-1.5">
              {portfolio.source === "wallet" ? <ScanSearch size={13} /> : portfolio.source === "manual" ? <Cpu size={13} /> : <Wallet size={13} />}
              <Badge tone="accent">
                {portfolio.source === "wallet" && shortAddress(portfolio.address ?? "")}
                {portfolio.source !== "wallet" && portfolio.source}
              </Badge>
            </span>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3">
          <CardHeader
            title="Holdings"
            subtitle="Positions by value"
            icon={<Wallet size={15} />}
            right={
              <button
                onClick={() => router.push("/dashboard/risk")}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:brightness-110"
              >
                <Activity size={13} /> Analyze Risk
              </button>
            }
          />
          <HoldingsTable assets={portfolio.assets} />
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <CardHeader title="Allocation" subtitle="Token concentration" icon={<Cpu size={15} />} />
          <AllocationPie assets={portfolio.assets} />
          <AllocationLegend assets={portfolio.assets} />
        </GlassCard>
      </div>

      <GlassCard>
        <CardHeader title="Performance" subtitle="Valuation trend" icon={<Activity size={15} />} />
        <PerformanceArea data={curve} height={240} />
      </GlassCard>
    </div>
  );
}

function PageHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Portfolio</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{desc}</p>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <GlassCard className="flex flex-col justify-between" delay={0}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">{label}</p>
      <div className={`mt-2 text-lg font-bold tracking-tight ${accent ? "txt-gradient" : "text-ink"}`}>{value}</div>
    </GlassCard>
  );
}