"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Loader2, LogOut, Wallet } from "lucide-react";
import { cn, shortAddress } from "@/lib/format";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import {
  WALLET_PROVIDERS,
  connectWallet,
  type ConnectedWallet,
} from "@/lib/wallet";
import { getWalletPortfolio } from "@/lib/sample-data";

const STORAGE_KEY = "prorun.wallet.v1";

export function WalletConnectButton({ variant = "default" }: { variant?: "default" | "ghost" }) {
  const router = useRouter();
  const { setPortfolio } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setWallet(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    setError("");
    try {
      const salt = Math.floor(Math.random() * 1e6);
      const w = await connectWallet(providerId, salt);
      setWallet(w);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(w));

      // Load a deterministic on-chain portfolio for the address and route to the dashboard.
      const portfolio = await getWalletPortfolio(w.address);
      setPortfolio(portfolio);
      setOpen(false);
      router.push("/dashboard");
    } catch {
      setError("Connection failed — please try again.");
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = () => {
    setWallet(null);
    setOpen(false);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div ref={ref} className="relative">
      {wallet ? (
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {wallet.chain}
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-ink transition hover:border-emerald-400/30 hover:text-emerald-300"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400/20 to-lime-400/10 text-[10px] font-bold text-emerald-300">
              {wallet.providerId[0].toUpperCase()}
            </span>
            <span className="tabular font-mono">{shortAddress(wallet.address)}</span>
            <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-xl text-sm font-bold transition",
            variant === "ghost"
              ? "border border-white/10 bg-white/[0.03] px-4 py-2 font-medium text-ink-muted hover:border-emerald-400/30 hover:text-emerald-300"
              : "bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2 text-[#06130d] hover:brightness-110",
          )}
        >
          <Wallet size={16} /> Connect Wallet
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d14]/95 shadow-2xl backdrop-blur-2xl"
          >
            {wallet ? <AccountPanel wallet={wallet} onDisconnect={disconnect} onClose={() => setOpen(false)} /> : <ConnectPanel connecting={connecting} onConnect={handleConnect} error={error} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectPanel({
  connecting,
  onConnect,
  error,
}: {
  connecting: string | null;
  onConnect: (id: string) => void;
  error: string;
}) {
  return (
    <div>
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-sm font-semibold text-ink">Connect a wallet</p>
        <p className="text-[11px] text-ink-faint">Select a provider to sync on-chain holdings.</p>
      </div>
      <div className="space-y-1 p-2">
        {WALLET_PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => onConnect(p.id)}
            disabled={!!connecting}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04] disabled:opacity-60"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold"
              style={{ background: `${p.color}22`, color: p.color }}
            >
              {p.name[0]}
            </span>
            <span className="flex-1 leading-tight">
              <span className="block text-sm font-medium text-ink">{p.name}</span>
              <span className="block text-[11px] text-ink-faint">{p.detail}</span>
            </span>
            {connecting === p.id ? (
              <Loader2 size={15} className="animate-spin text-emerald-300" />
            ) : (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
                {p.type}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="border-t border-white/[0.06] px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-[10px] text-ink-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Demo data mode — deterministic portfolio derived from your address
        </p>
        {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}
      </div>
    </div>
  );
}

function AccountPanel({
  wallet,
  onDisconnect,
  onClose,
}: {
  wallet: ConnectedWallet;
  onDisconnect: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-300 font-bold text-[#06130d]">
            {wallet.providerId[0].toUpperCase()}
          </span>
          <div className="leading-tight">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              Connected <CheckCircle2 size={13} className="text-emerald-400" />
            </p>
            <p className="tabular font-mono text-[11px] text-ink-muted">{shortAddress(wallet.address)}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3">
        <InfoRow k="Wallet" v={WALLET_PROVIDERS.find((p) => p.id === wallet.providerId)?.name ?? wallet.providerId} />
        <InfoRow k="Network" v={wallet.chain} />
        <InfoRow k="Portfolio" v={`$${wallet.balanceUsd.toLocaleString()}`} />
      </div>
      <div className="border-t border-white/[0.06] p-2">
        <button
          onClick={onDisconnect}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 py-2.5 text-sm font-medium text-rose-300 transition hover:brightness-110"
        >
          <LogOut size={15} /> Disconnect
        </button>
      </div>
      {wallet.connectedAt && (
        <p className="px-4 pb-2 text-center text-[10px] text-ink-faint">
          Connected {new Date(wallet.connectedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-ink-faint">{k}</span>
      <span className="font-medium text-ink">{v}</span>
    </div>
  );
}