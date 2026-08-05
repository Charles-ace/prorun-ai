"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ArrowRightLeft, Loader2, LogOut, Wallet } from "lucide-react";
import { cn, shortAddress } from "@/lib/format";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { buildPortfolio } from "@/lib/market-data";
import {
  WALLET_PROVIDERS,
  X_LAYER,
  detectProviders,
  demoWallet,
  ensureXLayer,
  fetchEVMHoldings,
  fetchSolanaHoldings,
  getEVMProvider,
  getSolanaProvider,
  type AvailableProvider,
  type ConnectedWallet,
  type WalletProviderId,
} from "@/lib/wallet";

const STORAGE_KEY = "prorun.wallet.v1";

export function WalletConnectButton({ variant = "default" }: { variant?: "default" | "ghost" }) {
  const router = useRouter();
  const { setPortfolio } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<WalletProviderId | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<AvailableProvider[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProviders(detectProviders());
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

  const applyPortfolio = useCallback(
    async (w: ConnectedWallet) => {
      const portfolio = await buildPortfolio(w.holdings, {
        label: `${WALLET_PROVIDERS.find((p) => p.id === w.providerId)?.name ?? "Wallet"} · ${shortAddress(w.address)}`,
        source: "wallet",
        address: w.address,
      });
      setPortfolio(portfolio);
      return portfolio;
    },
    [setPortfolio],
  );

  const handleConnect = async (providerId: WalletProviderId) => {
    setConnecting(providerId);
    setError("");
    try {
      let w: ConnectedWallet;

      if (providerId === "demo") {
        w = demoWallet("demo", Math.floor(Math.random() * 1e6));
      } else if (providerId === "phantom") {
        const provider = getSolanaProvider();
        if (!provider) throw new Error("Phantom is not installed. Install the extension to connect.");
        let address: string;
        try {
          const res = await provider.connect({ onlyIfTrusted: false });
          address = res.publicKey.toBase58();
        } catch (e: any) {
          if (e?.code === 4001) throw new Error("Connection rejected.");
          address = provider.publicKey?.toBase58() ?? "";
          if (!address) throw new Error("Phantom connection failed.");
        }
        const r = await fetchSolanaHoldings(address);
        w = { address, chain: r.chain, chainId: r.chainId, providerId, connectedAt: new Date().toISOString(), holdings: r.holdings };
      } else {
        const provider = getEVMProvider(providerId);
        if (!provider) throw new Error(`${WALLET_PROVIDERS.find((p) => p.id === providerId)?.name} is not installed.`);
        let accounts: string[];
        try {
          accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
        } catch (e: any) {
          if (e?.code === 4001) throw new Error("Connection rejected.");
          throw new Error("Wallet did not approve the connection.");
        }
        const address = accounts?.[0];
        if (!address) throw new Error("No account returned by wallet.");
        // OKX Wallet: bring the wallet onto the OKX network (X Layer, chain 196).
        if (providerId === "okx") {
          await ensureXLayer(provider).catch(() => undefined);
        }
        const r = await fetchEVMHoldings(provider, address);
        w = { address, chain: r.chain, chainId: r.chainId, providerId, connectedAt: new Date().toISOString(), holdings: r.holdings };
      }

      setWallet(w);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
      setOpen(false);
      await applyPortfolio(w);
      // Connected, but nothing priceable was found — send them to add assets manually.
      router.push(Object.keys(w.holdings).length ? "/dashboard" : "/dashboard/portfolio");
    } catch (err: any) {
      console.error("Prorun wallet connect failed:", err);
      setError(err?.message ?? "Connection failed — please try again.");
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = () => {
    setWallet(null);
    setOpen(false);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const handleSwitchToXLayer = async () => {
    if (!wallet) return;
    const provider = getEVMProvider(wallet.providerId);
    if (!provider) {
      setError("No EVM provider available for this wallet.");
      return;
    }
    setConnecting(wallet.providerId);
    setError("");
    try {
      await ensureXLayer(provider);
      const r = await fetchEVMHoldings(provider, wallet.address);
      const next: ConnectedWallet = {
        ...wallet,
        chain: r.chain,
        chainId: r.chainId,
        holdings: r.holdings,
      };
      if (!Object.keys(next.holdings).length) throw new Error("No priceable balances found on X Layer.");
      setWallet(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      await applyPortfolio(next);
    } catch (err: any) {
      setError(err?.message ?? "Switch failed — approve the chain change in your wallet.");
    } finally {
      setConnecting(null);
    }
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
          onClick={() => {
            // Re-scan for wallets that injected late (extension just loaded).
            setProviders(detectProviders());
            setOpen(true);
          }}
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
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d14]/95 shadow-2xl backdrop-blur-2xl"
          >
            {wallet ? (
              <AccountPanel
                wallet={wallet}
                connecting={connecting}
                error={error}
                onDisconnect={disconnect}
                onSwitchToXLayer={handleSwitchToXLayer}
                onClose={() => setOpen(false)}
              />
            ) : (
              <ConnectPanel providers={providers} connecting={connecting} onConnect={handleConnect} error={error} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectPanel({
  providers,
  connecting,
  onConnect,
  error,
}: {
  providers: AvailableProvider[];
  connecting: WalletProviderId | null;
  onConnect: (id: WalletProviderId) => void;
  error: string;
}) {
  const installedCount = providers.filter((p) => p.installed && p.id !== "demo").length;
  return (
    <div>
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-sm font-semibold text-ink">Connect a wallet</p>
        <p className="text-[11px] text-ink-faint">
          {installedCount > 0
            ? `${installedCount} wallet${installedCount > 1 ? "s" : ""} detected — balances are read from the chain.`
            : "No wallet extension detected — install one, or use demo mode."}
        </p>
      </div>
      <div className="space-y-1 p-2">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => onConnect(p.id)}
            disabled={!!connecting || (!p.installed && p.id !== "demo")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04] disabled:opacity-50"
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
            ) : p.installed ? (
              <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400" /> Detected
              </span>
            ) : (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
                Not installed
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="border-t border-white/[0.06] px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-[10px] text-ink-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          On-chain read via your wallet — no API keys, no custody of funds
        </p>
        <p className="mt-1 text-[10px] text-ink-faint">
          Tip: on the OKX mobile app? Open this site in the in-app browser, or use a desktop extension.
        </p>
        {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}
      </div>
    </div>
  );
}

function AccountPanel({
  wallet,
  connecting,
  error,
  onDisconnect,
  onSwitchToXLayer,
  onClose,
}: {
  wallet: ConnectedWallet;
  connecting: WalletProviderId | null;
  error: string;
  onDisconnect: () => void;
  onSwitchToXLayer: () => void;
  onClose: () => void;
}) {
  const meta = WALLET_PROVIDERS.find((p) => p.id === wallet.providerId);
  const isEVM = wallet.providerId !== "demo" && wallet.providerId !== "phantom";
  const onXLayer = wallet.chainId === X_LAYER.chainId;
  const total = Object.entries(wallet.holdings).reduce((s, [, v]) => s + v, 0);
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
        <InfoRow k="Wallet" v={meta?.name ?? wallet.providerId} />
        {onXLayer && <InfoRow k="Network" v={`${wallet.chain} · OKB gas`} />}
        {!onXLayer && <InfoRow k="Network" v={wallet.chain} />}
        <InfoRow k="Indexed tokens" v={`${Object.keys(wallet.holdings).length} priceable`} />
        {total > 0 && <InfoRow k="Raw balance" v={total.toFixed(4)} />}
        {isEVM && !onXLayer && (
          <button
            onClick={onSwitchToXLayer}
            disabled={!!connecting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 py-2.5 text-xs font-semibold text-emerald-300 transition hover:brightness-110 disabled:opacity-50"
          >
            {connecting === wallet.providerId ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowRightLeft size={14} />
            )}
            {connecting === wallet.providerId ? "Switching…" : `Switch to OKX ${X_LAYER.name} · OKB`}
          </button>
        )}
        {error && <p className="mt-2 text-[11px] text-rose-400">{error}</p>}
      </div>
      <div className="border-t border-white/[0.06] p-2">
        <button
          onClick={onDisconnect}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 py-2.5 text-sm font-medium text-rose-300 transition hover:brightness-110"
        >
          <LogOut size={15} /> Disconnect
        </button>
      </div>
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