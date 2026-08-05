"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn, formatUsd } from "@/lib/format";
import { ChangePill } from "@/components/ui/badge";

export function Sparkline({
  data,
  color = "#34d399",
  height = 44,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const w = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / span) * (height - 6) - 3}`)
    .join(" ");
  const last = data[data.length - 1];
  const up = last >= data[0];
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className={cn("overflow-visible", className)}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={w}
        cy={height - ((last - min) / span) * (height - 6) - 3}
        r={2.6}
        fill={color}
        className={up ? "animate-pulseGlow" : ""}
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  change,
  spark,
  icon,
  delay = 0,
  footer,
}: {
  label: string;
  value: string;
  change?: number;
  spark?: number[];
  icon?: ReactNode;
  delay?: number;
  footer?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="glass glass-hover relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-muted">
            {icon}
            {label}
          </p>
          <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
        </div>
        {spark && <Sparkline data={spark} />}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {typeof change === "number" && <ChangePill value={change} />}
        {footer && <span className="text-xs text-ink-faint">{footer}</span>}
      </div>
    </motion.div>
  );
}

export function UsdValue({ value }: { value: number }) {
  return <span className="tabular">{formatUsd(value)}</span>;
}