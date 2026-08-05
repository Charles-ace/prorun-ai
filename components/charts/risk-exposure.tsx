"use client";

import { motion } from "framer-motion";
import { cn, riskColor } from "@/lib/format";
import type { RiskMetric } from "@/lib/types";

export function RiskMetricBars({ metrics }: { metrics: RiskMetric[] }) {
  return (
    <div className="space-y-4">
      {metrics.map((m, i) => (
        <div key={m.label}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-ink-muted">{m.label}</span>
            <span className="tabular font-semibold" style={{ color: riskColor(m.score) }}>
              {m.score}/100
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${m.score}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${riskColor(m.score)}, ${riskColor(m.score)}cc)` }}
            />
          </div>
          <p className="mt-1 text-[11px] leading-snug text-ink-faint">{m.description}</p>
        </div>
      ))}
    </div>
  );
}

export function VolatilityDonut({ data }: { data: { level: string; pct: number }[] }) {
  const colors: Record<string, string> = { high: "#fb7185", medium: "#fbbf24", low: "#34d399" };
  return (
    <div className="flex items-center justify-around gap-2">
      {data.map((d, i) => (
        <motion.div
          key={d.level}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="flex flex-col items-center"
        >
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${colors[d.level]} ${d.pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0b0d13]">
              <span className="tabular text-sm font-bold" style={{ color: colors[d.level] }}>
                {d.pct.toFixed(0)}%
              </span>
            </div>
          </div>
          <span className="mt-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            {d.level}
          </span>
        </motion.div>
      ))}
    </div>
  );
}