"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Activity, BrainCircuit, Wallet } from "lucide-react";
import { RiskGauge } from "@/components/ui/risk-gauge";

const SPARK = Array.from({ length: 28 }, (_, i) => ({
  t: i,
  v: 100 + Math.sin(i / 3.2) * 14 + Math.cos(i / 1.7) * 8 + i * 1.15,
}));

const INSIGHTS = [
  "Concentration risk high: 58% of your value sits in ETH-linked assets.",
  "Stable buffer is under 10% — rebuild liquidity before volatility returns.",
  "BTC momentum cooling. Consider trimming leverage on the next pop.",
];

function useTyping() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    const full = INSIGHTS[idx % INSIGHTS.length];
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setText(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(id);
        window.setTimeout(() => setIdx((x) => x + 1), 2800);
      }
    }, 26);
    return () => window.clearInterval(id);
  }, [idx]);
  return text;
}

export function LivePreview() {
  const [value, setValue] = useState(48230);
  const typing = useTyping();

  useEffect(() => {
    const id = window.setInterval(() => {
      setValue((v) => Math.max(44000, v + Math.round((Math.random() - 0.5) * 150)));
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/15 to-cyan-400/10 blur-2xl" />

      <div className="glass animate-float relative p-5">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live preview
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="glass p-4">
            <p className="text-[10px] uppercase tracking-wider text-ink-faint">Portfolio Value</p>
            <p className="tabular mt-1 text-lg font-bold text-ink">
              ${value.toLocaleString("en-US")}
            </p>
            <p className="tabular flex items-center gap-1 text-[11px] font-medium text-emerald-300">
              <Activity size={11} /> +6.4% 24h · ticking live
            </p>
            <div className="mt-2 h-14">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARK} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#34d399" strokeWidth={1.6} fill="url(#sparkFill)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass flex flex-col items-center justify-center gap-1.5 p-2">
            <RiskGauge value={72} size={104} />
            <p className="text-[10px] uppercase tracking-wider text-ink-faint">AI risk score</p>
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-rose-300">
            <Activity size={14} /> Main risk detected
          </p>
          <p className="text-xs text-ink-muted">
            {typing}
            <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-emerald-300 align-middle" />
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <BrainCircuit size={16} className="text-emerald-300" />
          <p className="text-[11px] text-ink-muted">
            <span className="font-medium text-ink">AI:</span> Reduce concentrated positions and rebuild the stable buffer — the engine recomputes every 2s.
          </p>
        </div>
      </div>

      <div className="glass animate-float absolute -right-4 -top-6 hidden p-3 sm:block" style={{ animationDelay: "1.2s" }}>
        <div className="flex items-center gap-2 text-xs">
          <Wallet size={14} className="text-emerald-300" />
          <span className="text-ink-muted">OKB · X Layer connected</span>
        </div>
      </div>
    </motion.div>
  );
}
