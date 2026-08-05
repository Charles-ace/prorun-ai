"use client";

import { motion } from "framer-motion";
import { ASSET_MAP } from "@/lib/market-data";
import { cn, formatUsd } from "@/lib/format";
import { ChangePill } from "@/components/ui/badge";
import type { Asset } from "@/lib/types";

export function HoldingsTable({ assets }: { assets: Asset[] }) {
  return (
    <div className="overflow-x-auto scroll-slim">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-ink-faint">
            <th className="pb-3 font-medium">Asset</th>
            <th className="pb-3 text-right font-medium">Amount</th>
            <th className="pb-3 text-right font-medium">Price</th>
            <th className="pb-3 text-right font-medium">Value</th>
            <th className="pb-3 text-right font-medium">24h</th>
            <th className="pb-3 text-right font-medium">Allocation</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a, i) => {
            const color = ASSET_MAP[a.symbol]?.color ?? "#34d399";
            return (
              <motion.tr
                key={a.symbol}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
              >
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold"
                      style={{ background: `${color}22`, color }}
                    >
                      {a.symbol.slice(0, 4)}
                    </span>
                    <div className="leading-tight">
                      <p className="font-semibold text-ink">{a.symbol}</p>
                      <p className="text-[11px] text-ink-faint">{a.name}</p>
                    </div>
                  </div>
                </td>
                <td className="tabular py-3 text-right text-ink-muted">{a.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td className="tabular py-3 text-right text-ink">{formatUsd(a.price)}</td>
                <td className="tabular py-3 text-right font-semibold text-ink">{formatUsd(a.amount * a.price)}</td>
                <td className="py-3 text-right"><ChangePill value={a.change24h} /></td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, a.allocation * 2)}%`, background: color }}
                      />
                    </div>
                    <span className="tabular w-12 text-right text-xs font-semibold text-ink-muted">
                      {a.allocation.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AllocationBar({ assets }: { assets: Asset[] }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.05]">
      {assets.map((a, i) => {
        const color = ASSET_MAP[a.symbol]?.color ?? ["#34d399", "#fbbf24", "#60a5fa", "#a78bfa", "#fb7185"][i % 5];
        return (
          <motion.div
            key={a.symbol}
            initial={{ width: 0 }}
            whileInView={{ width: `${a.allocation}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.05 }}
            className="h-full"
            style={{ background: color }}
            title={`${a.symbol} ${a.allocation.toFixed(1)}%`}
          />
        );
      })}
    </div>
  );
}