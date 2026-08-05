"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, FileUp, Loader2, ScrollText, Sparkles, Wand2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { GlassCard, CardHeader } from "@/components/ui/glass-card";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { Badge } from "@/components/ui/badge";
import { formatUsd, riskColor } from "@/lib/format";
import { SAMPLE_TRADES } from "@/lib/sample-data";
import { PerformanceArea } from "@/components/charts/performance-area";
import type { PsychologyReport, Trade } from "@/lib/types";

const CSV_TEMPLATE = `date,side,asset,sizeUsd,pnlUsd,rr,exitReason,heldHours
2026-01-04,buy,SOL,1200,312,2.1,Target hit,42
2026-01-05,buy,SUI,900,-128,0.9,Stopped out,18`;

export default function JournalPage() {
  const { psychology, runPsychology, generatingPsychology } = usePortfolio();
  const [raw, setRaw] = useState("");
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [error, setError] = useState("");

  const parsedTrades = useMemo(() => {
    const lines = raw.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines[0].toLowerCase();
    const cols = header.split(",").map((c) => c.trim());
    const idx = (name: string) => cols.findIndex((c) => c.includes(name));
    const out: Trade[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((c) => c.trim());
      const get = (name: string) => {
        const k = idx(name);
        return k >= 0 ? row[k] : undefined;
      };
      const date = get("date");
      const side = (get("side") ?? "buy") as Trade["side"];
      const asset = get("asset");
      if (!date || !asset) continue;
      out.push({
        id: `csv-${i}`,
        date: new Date(date).toISOString(),
        side: side === "sell" ? "sell" : "buy",
        asset: asset.toUpperCase(),
        sizeUsd: parseFloat(get("size") ?? "0") || 0,
        pnlUsd: parseFloat(get("pnl") ?? "0") || 0,
        rr: parseFloat(get("rr") ?? "0") || 0,
        exitReason: get("exit") ?? "Manual",
        heldHours: parseFloat(get("held") ?? "0") || 0,
      });
    }
    return out;
  }, [raw]);

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(f);
  };

  const analyze = (ts: Trade[]) => {
    if (!ts.length) {
      setError("No valid trades found. Paste history or load the demo journal.");
      return;
    }
    setError("");
    setTrades(ts);
    runPsychology(ts);
  };

  const showReport = psychology && trades;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Trading Journal</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">AI Psychology Analyzer</h2>
        <p className="mt-1 text-sm text-ink-muted">Upload trading history to detect revenge trading, overtrading and sizing tilt.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <CardHeader title="Upload Trading History" subtitle="CSV or paste below" icon={<FileUp size={15} />} />
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center transition hover:border-emerald-400/30">
              <FileUp size={22} className="text-emerald-300" />
              <span className="mt-2 text-sm font-medium text-ink-muted">Drop a CSV or click to browse</span>
              <span className="mt-1 text-[11px] text-ink-faint">date, side, asset, sizeUsd, pnlUsd, rr, exitReason, heldHours</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={CSV_TEMPLATE}
              spellCheck={false}
              className="scroll-slim h-40 w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-emerald-400/40 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => analyze(SAMPLE_TRADES)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-emerald-400/30 hover:text-emerald-300"
              >
                <Wand2 size={15} /> Load Demo Journal
              </button>
              <button
                onClick={() => analyze(parsedTrades)}
                disabled={generatingPsychology}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-[#06130d] transition hover:brightness-110 disabled:opacity-70 sm:flex-none"
              >
                {generatingPsychology ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {generatingPsychology ? "Analyzing behavior…" : "Analyze Trading Behavior"}
              </button>
            </div>
            {parsedTrades.length > 0 && !trades && (
              <p className="text-xs text-emerald-300">{parsedTrades.length} trades parsed — ready to analyze.</p>
            )}
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader title="What Prorun detects" subtitle="Behavioral patterns" icon={<BrainCircuit size={15} />} />
          <div className="space-y-2.5">
            {[
              { t: "Revenge trading", d: "Re-entering quickly after losses, often with larger size." },
              { t: "Overtrading", d: "Trade frequency beyond the edge of your strategy." },
              { t: "Increasing size after losses", d: "The classic tilt signal that compounds drawdowns." },
              { t: "Poor risk/reward", d: "Average loss exceeding average win over time." },
              { t: "Emotional patterns", d: "Streak-driven deviations from your plan." },
            ].map((p, i) => (
              <motion.div
                key={p.t}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <p className="text-sm font-semibold text-ink">{p.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{p.d}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {showReport && <ReportView report={psychology} trades={trades} />}
    </div>
  );
}

function ReportView({ report, trades }: { report: PsychologyReport; trades: Trade[] }) {
  const color = riskColor(100 - report.disciplineScore);
  const equity = trades
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce<{ date: string; value: number }[]>((acc, t, i) => {
      const prev = acc[i - 1]?.value ?? 0;
      acc.push({ date: t.date.slice(0, 10), value: +(prev + t.pnlUsd).toFixed(2) });
      return acc;
    }, []);

  const m = report.metrics;
  const metricCards = [
    { label: "Win Rate", value: `${m.winRate}%` },
    { label: "Net PnL", value: formatUsd(m.netPnl), tone: m.netPnl >= 0 ? "green" : "red" },
    { label: "Profit Factor", value: m.profitFactor.toFixed(2) },
    { label: "Avg R", value: `R${m.avgRr.toFixed(2)}` },
    { label: "Avg Win", value: formatUsd(m.avgWin) },
    { label: "Avg Loss", value: formatUsd(m.avgLoss), tone: "red" },
    { label: "Max Drawdown", value: formatUsd(m.maxDrawdown), tone: "red" },
    { label: "Trades/Day", value: m.avgTradesPerDay.toFixed(1) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <CardHeader title="Discipline Score" subtitle="0 = emotional · 100 = disciplined" icon={<BrainCircuit size={15} />} />
          <div className="flex justify-center py-2">
            <RiskGauge value={report.disciplineScore} size={180} label="discipline" sublabel={report.traitLabel} />
          </div>
          <p className="text-center text-xs text-ink-faint">{report.summary}</p>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <CardHeader title="Patterns Detected" subtitle="AI behavioural findings" icon={<Sparkles size={15} />} />
          <div className="grid gap-3 sm:grid-cols-2">
            {report.patterns.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2">
                  <Badge tone={p.severity === "high" ? "red" : p.severity === "medium" ? "amber" : "green"}>
                    {p.severity}
                  </Badge>
                  <p className="text-sm font-semibold text-ink">{p.title}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{p.detail}</p>
                {p.stat && <p className="tabular mt-2 text-[11px] font-semibold" style={{ color }}>{p.stat}</p>}
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader title="Equity Curve" subtitle="Cumulative PnL from your log" icon={<ScrollText size={15} />} />
          <PerformanceArea data={equity} height={220} />
        </GlassCard>
        <GlassCard>
          <CardHeader title="Key Metrics" subtitle="From trade history" icon={<ScrollText size={15} />} />
          <div className="grid grid-cols-2 gap-2">
            {metricCards.map((mc) => (
              <div key={mc.label} className="rounded-lg bg-white/[0.03] p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-ink-faint">{mc.label}</p>
                <p className={`tabular mt-0.5 text-sm font-bold ${mc.tone === "red" ? "text-rose-300" : mc.tone === "green" ? "text-emerald-300" : "text-ink"}`}>
                  {mc.value}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <CardHeader title="Recommendations" subtitle="Behavioural changes ranked by impact" icon={<Sparkles size={15} />} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.recommendations.map((r, i) => (
            <div key={i} className="flex gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] font-bold text-emerald-300">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-ink-muted">{r}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
          <Sparkles size={16} className="text-emerald-300" />
          <p className="text-sm text-ink">
            Biggest improvement opportunity:{" "}
            <span className="font-bold txt-gradient">{report.biggestOpportunity}</span>
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}