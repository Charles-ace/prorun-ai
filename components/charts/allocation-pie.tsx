"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { useState } from "react";
import { ASSET_MAP } from "@/lib/market-data";
import { formatPct, formatUsd } from "@/lib/format";
import type { Asset } from "@/lib/types";

const FALLBACK_COLORS = [
  "#34d399", "#fbbf24", "#60a5fa", "#a78bfa", "#fb7185",
  "#f472b6", "#38bdf8", "#4ade80", "#facc15", "#c084fc",
];

interface Props { assets: Asset[]; }

export function AllocationPie({ assets }: Props) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const data = assets.map((a) => ({
    name: a.symbol,
    value: a.allocation,
    color: ASSET_MAP[a.symbol]?.color ?? FALLBACK_COLORS[assets.indexOf(a) % FALLBACK_COLORS.length],
  }));

  const renderActive = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 8) * cos;
    const sy = cy + (outerRadius + 8) * sin;
    const mx = cx + (outerRadius + 22) * cos;
    const my = cy + (outerRadius + 22) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 14;
    const ey = my;
    return (
      <g>
        <text x={ex} y={ey} dy={-4} textAnchor={ex > cx ? "start" : "end"} fill="#e7ebf3" fontSize={12} fontWeight={600}>
          {payload.name} · {formatPct(payload.value)}
        </text>
        <text x={ex} y={ey} dy={14} textAnchor={ex > cx ? "start" : "end"} fill="#9aa3b8" fontSize={10}>
          share of holdings
        </text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      </g>
    );
  };

  return (
    <div className="relative h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={78}
            outerRadius={112}
            paddingAngle={2}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={1}
            activeIndex={activeIndex}
            activeShape={activeIndex >= 0 ? renderActive : undefined}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} opacity={activeIndex === -1 || activeIndex === i ? 1 : 0.45} />
            ))}
          </Pie>
          <Tooltip
            content={({ payload }) => {
              const p = payload?.[0]?.payload as any;
              if (!p) return null;
              return (
                <div className="rounded-lg border border-white/10 bg-[#0c0e14]/95 px-3 py-2 text-xs shadow-xl">
                  <span className="font-semibold text-ink">{p.name}</span>
                  <span className="tabular ml-2 text-ink-muted">{formatPct(p.value)}</span>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] uppercase tracking-widest text-ink-faint">Allocation</span>
        <span className="tabular mt-0.5 text-2xl font-semibold text-ink">{formatUsd(assets.reduce((s, a) => s + a.amount * a.price, 0))}</span>
      </div>
    </div>
  );
}

export function AllocationLegend({ assets }: Props) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {assets.map((a, i) => {
        const color = ASSET_MAP[a.symbol]?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
        return (
          <div key={a.symbol} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2">
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
              {a.symbol}
            </span>
            <span className="tabular text-xs font-semibold text-ink">{formatPct(a.allocation)}</span>
          </div>
        );
      })}
    </div>
  );
}