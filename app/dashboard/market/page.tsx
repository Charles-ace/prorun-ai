"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarClock, LineChart, RefreshCw, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { GlassCard, CardHeader } from "@/components/ui/glass-card";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { Badge, ChangePill } from "@/components/ui/badge";
import { formatUsd, riskColor } from "@/lib/format";
import { ASSET_MAP } from "@/lib/market-data";
import type { MarketBrief } from "@/lib/types";

const SENTIMENT_COLOR: Record<string, string> = {
  Greed: "#fb7185",
  "Neutral-Positive": "#fbbf24",
  Neutral: "#60a5fa",
  Fear: "#34d399",
};

export default function MarketPage() {
  const { marketBrief, ensureMarket, generatingMarket } = usePortfolio();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!marketBrief && !generatingMarket) {
      setLoading(true);
      ensureMarket().finally(() => setLoading(false));
    }
  }, [marketBrief, generatingMarket, ensureMarket]);

  const refresh = () => {
    setLoading(true);
    ensureMarket().finally(() => setLoading(false));
  };

  if (loading && !marketBrief) {
    return (
      <div className="py-24 text-center">
        <RefreshCw size={26} className="mx-auto animate-spin text-emerald-400" />
        <p className="mt-4 text-sm text-ink-muted">Fetching today's market intelligence…</p>
      </div>
    );
  }

  if (!marketBrief) {
    return (
      <div className="py-24 text-center text-sm text-ink-muted">
        Market data unavailable — check connectivity and try again.
      </div>
    );
  }

  return <MarketView brief={marketBrief} onRefresh={refresh} refreshing={loading} />;
}

function MarketView({ brief, onRefresh, refreshing }: { brief: MarketBrief; onRefresh: () => void; refreshing: boolean }) {
  const sentimentColor = SENTIMENT_COLOR[brief.sentiment.label] ?? "#60a5fa";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Market Intelligence</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Today's Market Brief</h2>
          <p className="mt-1 text-sm text-ink-muted">AI-generated daily market report · {new Date(brief.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* headline cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <CardHeader title="BTC Trend" subtitle="Bitcoin momentum" icon={<TrendingUp size={15} />} />
          <BtcCard card={brief.btc} quote={brief.quotes.find((q) => q.symbol === "BTC")!} />
        </GlassCard>
        <GlassCard>
          <CardHeader title="ETH Trend" subtitle="Ethereum momentum" icon={<TrendingUp size={15} />} />
          <BtcCard card={brief.eth} quote={brief.quotes.find((q) => q.symbol === "ETH")!} />
        </GlassCard>
        <GlassCard>
          <CardHeader title="Market Sentiment" subtitle="Broad risk mood" icon={<Sparkles size={15} />} />
          <div className="flex flex-col items-center">
            <RiskGauge value={brief.sentiment.score} size={150} label="greed" sublabel={brief.sentiment.label} />
            <p className="mt-3 text-center text-sm text-ink-muted">{brief.sentiment.summary}</p>
          </div>
        </GlassCard>
      </div>

      {/* AI summary */}
      <GlassCard className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[70px]" />
        <CardHeader title="AI Summary" subtitle="Risk desk read" icon={<Sparkles size={15} />} />
        <div className="whitespace-pre-line rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-ink-muted">
          {brief.aiSummary}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <CardHeader title="Major Risks" subtitle="Watchlist" icon={<ShieldAlert size={15} />} />
          <div className="space-y-2.5">
            {brief.majorRisks.map((r, i) => (
              <div key={i} className="flex gap-2 rounded-lg border border-rose-400/15 bg-rose-400/[0.05] px-3 py-2.5 text-sm text-ink-muted">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-300" />
                <span className="leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader title="Important Events" subtitle="This week" icon={<CalendarClock size={15} />} />
          <div className="space-y-2.5">
            {brief.events.map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-ink-muted">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-[10px] font-bold text-emerald-300">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{e}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader title="AI Recommendation" subtitle="Risk-adjusted stance" icon={<LineChart size={15} />} />
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4 text-sm leading-relaxed text-ink">
            {brief.recommendation}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: sentimentColor }} />
            Sentiment {brief.sentiment.label} · {brief.sentiment.score}/100
          </div>
        </GlassCard>
      </div>

      {/* market table */}
      <GlassCard>
        <CardHeader title="Market Overview" subtitle="Top assets by market cap" icon={<LineChart size={15} />} />
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="pb-3 font-medium">Asset</th>
                <th className="pb-3 text-right font-medium">Price</th>
                <th className="pb-3 text-right font-medium">24h</th>
                <th className="pb-3 text-right font-medium">7d</th>
                <th className="pb-3 text-right font-medium">Market Cap</th>
                <th className="pb-3 text-right font-medium">Volume 24h</th>
              </tr>
            </thead>
            <tbody>
              {brief.quotes.map((q, i) => {
                const color = ASSET_MAP[q.symbol]?.color ?? "#34d399";
                return (
                  <motion.tr key={q.symbol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-bold" style={{ background: `${color}22`, color }}>
                          {q.symbol.slice(0, 4)}
                        </span>
                        <div className="leading-tight">
                          <p className="font-semibold text-ink">{q.name}</p>
                          <p className="font-mono text-[10px] text-ink-faint">{q.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="tabular py-3 text-right font-semibold text-ink">{formatUsd(q.price)}</td>
                    <td className="py-3 text-right"><ChangePill value={q.change24h} /></td>
                    <td className="tabular py-3 text-right text-ink-muted">{q.change7d >= 0 ? "+" : ""}{q.change7d.toFixed(2)}%</td>
                    <td className="tabular py-3 text-right text-ink-muted">${(q.marketCap / 1e9).toFixed(1)}B</td>
                    <td className="tabular py-3 text-right text-ink-muted">${(q.volume24h / 1e9).toFixed(2)}B</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <p className="text-center text-[11px] text-ink-faint">Prorun AI provides analysis and education, not financial advice.</p>
    </div>
  );
}

function BtcCard({ card, quote }: { card: MarketBrief["btc"]; quote: MarketBrief["quotes"][number] }) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight text-ink">{quote.symbol}</p>
          <p className="tabular text-sm text-ink-muted">{formatUsd(quote.price)}</p>
        </div>
        <ChangePill value={quote.change24h} />
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-ink-muted">Momentum</span>
          <span className="tabular font-semibold text-ink">{card.momentum}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${card.momentum}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300"
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink">
          <Badge tone={quote.change24h >= 0 ? "green" : "red"}>{card.trend}</Badge>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          24h move {quote.change24h >= 0 ? "+" : ""}{quote.change24h.toFixed(2)}% · 7d {quote.change7d >= 0 ? "+" : ""}{quote.change7d.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}