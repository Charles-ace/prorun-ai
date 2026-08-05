"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, Cpu, Loader2, ScanLine, Wallet } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { cn } from "@/lib/format";
import { getSamplePortfolio, getWalletPortfolio } from "@/lib/sample-data";
import { shortAddress } from "@/lib/format";

type Mode = "demo" | "wallet" | "manual";

const QUICK_TOKENS = ["BTC", "ETH", "SOL", "LINK", "SUI", "DOGE", "USDC", "USDT"];

export function PortfolioGate({
  title = "Connect a portfolio",
  subtitle = "Prorun analyzes your holdings to build a live risk profile.",
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const { setPortfolio } = usePortfolio();
  const [mode, setMode] = useState<Mode>("manual");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"demo" | "wallet" | "manual" | null>(null);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Record<string, string>>({ BTC: "0.5", ETH: "5", USDC: "2000" });

  const loadDemo = async () => {
    setBusy("demo");
    setLoading(true);
    try {
      const p = await getSamplePortfolio();
      setPortfolio(p);
    } finally {
      setBusy(null);
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    const addr = address.trim();
    if (!/^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(addr)) {
      setError("Enter a valid EVM (0x…) or Solana address.");
      return;
    }
    setBusy("wallet");
    setLoading(true);
    setError("");
    try {
      const p = await getWalletPortfolio(addr);
      setPortfolio(p);
    } finally {
      setBusy(null);
      setLoading(false);
    }
  };

  const loadManual = async () => {
    const holdings: Record<string, number> = {};
    let any = false;
    for (const [sym, val] of Object.entries(rows)) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) {
        holdings[sym] = n;
        any = true;
      }
    }
    if (!any) {
      setError("Enter at least one holding amount.");
      return;
    }
    setBusy("manual");
    setLoading(true);
    setError("");
    try {
      const { buildPortfolio } = await import("@/lib/market-data");
      const p = await buildPortfolio(holdings, { label: "My Portfolio", source: "manual" });
      setPortfolio(p);
    } finally {
      setBusy(null);
      setLoading(false);
    }
  };

  const tokenInputs = useMemo(() => Object.keys(rows), [rows]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass relative mx-auto w-full max-w-2xl overflow-hidden p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-emerald-500/10 blur-[80px]" />

      <div className="relative text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 shadow-glow">
          <ScanLine size={26} className="text-[#06130d]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">{subtitle}</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {(
          [
            { key: "demo", label: "Load Demo Portfolio", icon: Boxes },
            { key: "wallet", label: "Connect Wallet", icon: Wallet },
            { key: "manual", label: "Manual Holdings", icon: Cpu },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setMode(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition",
              mode === t.key
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-white/10 bg-white/[0.03] text-ink-muted hover:text-ink",
            )}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 flex flex-col items-center gap-3 py-6">
          <Loader2 size={28} className="animate-spin text-emerald-400" />
          <p className="text-sm text-ink-muted">
            {busy === "demo" && "Fetching demo portfolio…"}
            {busy === "wallet" && "Indexing wallet balances on-chain…"}
            {busy === "manual" && "Pricing your holdings…"}
          </p>
        </div>
      ) : (
        <div className="relative mt-6">
          {mode === "demo" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-ink-muted">
                One click to a realistic multi-asset portfolio with full analysis.
              </p>
              <button
                onClick={loadDemo}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 py-3 text-sm font-bold text-[#06130d] transition hover:brightness-110"
              >
                Analyze Demo Portfolio
              </button>
            </div>
          )}

          {mode === "wallet" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Wallet address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadWallet()}
                  placeholder="0x… or Solana address"
                  className="ring-focus rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-faint focus:border-emerald-400/40 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-faint">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Demo data mode — deterministic portfolio derived from address
              </div>
              <button
                onClick={loadWallet}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 py-3 text-sm font-bold text-[#06130d] transition hover:brightness-110"
              >
                Fetch & Analyze Wallet
              </button>
            </div>
          )}

          {mode === "manual" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_TOKENS.map((sym) => (
                  <button
                    key={sym}
                    onClick={() =>
                      setRows((prev) =>
                        sym in prev
                          ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== sym))
                          : { ...prev, [sym]: "" },
                      )
                    }
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold transition",
                      sym in rows
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-ink-faint hover:text-ink",
                    )}
                  >
                    {sym}
                  </button>
                ))}
              </div>
              {tokenInputs.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {tokenInputs.map((sym) => (
                    <div key={sym} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                      <span className="w-12 font-mono text-xs font-semibold text-ink-muted">{sym}</span>
                      <input
                        value={rows[sym]}
                        onChange={(e) => setRows((p) => ({ ...p, [sym]: e.target.value }))}
                        placeholder="amount"
                        className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-ink-faint"
                      />
                      <button
                        onClick={() => setRows((p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== sym)))}
                        className="text-ink-faint hover:text-rose-400"
                        aria-label={`remove ${sym}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={loadManual}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 py-3 text-sm font-bold text-[#06130d] transition hover:brightness-110"
              >
                Build & Analyze Portfolio
              </button>
            </div>
          )}

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-center text-sm text-rose-400">
              {error}
            </motion.p>
          )}

          {!compact && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-ink-faint">
              {["Live pricing", "Risk scoring", "AI narrative", "No account needed"].map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export { shortAddress };