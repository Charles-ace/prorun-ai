"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/format";

interface Props {
  data: { date: string; value: number }[];
  height?: number;
}

export function PerformanceArea({ data, height = 260 }: Props) {
  const [range, setRange] = useState<"7D" | "30D" | "90D" | "ALL">("30D");
  const slice = (n: number) => data.slice(Math.max(0, data.length - n));
  const shown =
    range === "7D" ? slice(7) : range === "30D" ? slice(30) : range === "90D" ? slice(90) : data;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {["7D", "30D", "90D", "ALL"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as any)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                range === r
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "text-ink-faint hover:text-ink",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-faint">Portfolio value history</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={shown} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#5b6478", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "#5b6478", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0].value as number;
              return (
                <div className="rounded-lg border border-white/10 bg-[#0c0e14]/95 px-3 py-2 text-xs shadow-xl">
                  <div className="text-ink-faint">{label}</div>
                  <div className="tabular font-semibold text-emerald-300">
                    ${Intl.NumberFormat("en-US").format(v)}
                  </div>
                </div>
              );
            }}
          />
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#perfFill)"
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#34d399" }}
            />
          </motion.g>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}