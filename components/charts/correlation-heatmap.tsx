"use client";

import { motion } from "framer-motion";
import { ASSET_MAP } from "@/lib/market-data";
import { cn } from "@/lib/format";
import type { Asset } from "@/lib/types";

// Pseudo-correlation model: majors correlate with each other; stables are
// orthogonal; same-segment alts correlate more strongly.
function corr(a: Asset, b: Asset): number {
  if (a.symbol === b.symbol) return 1;
  if (a.stable && b.stable) return 0.9;
  if (a.stable || b.stable) return 0.05;
  const metaA = ASSET_MAP[a.symbol];
  const metaB = ASSET_MAP[b.symbol];
  let base = metaA.vol === metaB.vol ? 0.72 : 0.5;
  if (a.symbol === "BTC" && b.symbol === "ETH") base = 0.82;
  if (a.symbol === "ETH" && b.symbol === "SOL") base = 0.68;
  if (a.symbol === "BTC" && b.symbol === "SOL") base = 0.6;
  if ((a.symbol === "USDT" && b.symbol === "USDC") || (a.symbol === "USDC" && b.symbol === "USDT")) base = 0.96;
  return Math.max(0, Math.min(1, base + (((a.symbol.charCodeAt(0) + b.symbol.charCodeAt(1)) % 10) - 5) / 100));
}

function heatColor(v: number): string {
  if (v < 0.25) return "rgba(52,211,153,0.25)";
  if (v < 0.5) return "rgba(74,222,128,0.32)";
  if (v < 0.7) return "rgba(251,191,36,0.45)";
  if (v < 0.85) return "rgba(251,113,133,0.55)";
  return "rgba(244,63,94,0.75)";
}

export function CorrelationHeatmap({ assets }: { assets: Asset[] }) {
  const top = assets.slice(0, 6);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-ink-faint">
        <span>Pairwise correlation · 0 (independent) → 1 (moves together)</span>
        <span className="tabular">weighted risk drag: {(top.length >= 2 ? top.slice(0, 3).reduce((s, a) => s + a.allocation, 0) * 0.9 : 0).toFixed(0)}%</span>
      </div>
      <div className="overflow-x-auto scroll-slim">
        <div className="min-w-[420px]">
          <div className="grid" style={{ gridTemplateColumns: `36px repeat(${top.length}, 1fr)` }}>
            <div />
            {top.map((a) => (
              <div key={a.symbol} className="pb-2 text-center text-[11px] font-semibold text-ink-muted">
                {a.symbol}
              </div>
            ))}
            {top.map((row, ri) => (
              <div key={row.symbol} className="contents">
                <div className="pr-2 text-right text-[11px] font-semibold text-ink-muted">
                  {row.symbol}
                </div>
                {top.map((col, ci) => {
                  const v = corr(row, col);
                  return (
                    <motion.div
                      key={col.symbol}
                      initial={{ opacity: 0, scale: 0.6 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: (ri * top.length + ci) * 0.012 }}
                      title={`${row.symbol}/${col.symbol} = ${v.toFixed(2)}`}
                      className={cn(
                        "mx-1 mb-1.5 flex h-9 items-center justify-center rounded-md text-[10px] font-semibold tabular",
                      )}
                      style={{ background: heatColor(v), color: v > 0.7 ? "#fff" : "#0a0b0f" }}
                    >
                      {ri <= ci ? v.toFixed(2) : ""}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}