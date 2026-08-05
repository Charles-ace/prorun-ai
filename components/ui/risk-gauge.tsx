"use client";

import { motion, useInView } from "framer-motion";
import { riskColor } from "@/lib/format";
import { useEffect, useRef, useState } from "react";

export function RiskGauge({
  value,
  size = 180,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = riskColor(value);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1100;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setProgress(ease(t) * value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  const pct = (progress / 100) * c;

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c}
          animate={{ strokeDashoffset: c - pct }}
          transition={{ duration: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="tabular font-semibold leading-none tracking-tight"
          style={{ fontSize: size / 4.6, color }}
        >
          {Math.round(progress)}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-widest text-ink-muted">
          {label ?? "/ 100"}
        </span>
        {sublabel && (
          <span className="mt-0.5 text-xs font-semibold" style={{ color }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}