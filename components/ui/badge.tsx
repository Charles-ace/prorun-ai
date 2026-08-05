"use client";

import { cn } from "@/lib/format";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "blue" | "accent";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-white/10 bg-white/5 text-ink-muted",
    green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    red: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    blue: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    accent: "border-lime-300/30 bg-lime-300/10 text-lime-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ChangePill({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
        up ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300",
        className,
      )}
    >
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function motionItem({ index = 0 }: { index?: number } = {}) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: index * 0.06, ease: [0.21, 0.47, 0.32, 0.98] as const },
  };
}

export { motion };