"use client";

import { useWallet } from "@/components/wallet/wallet-provider";
import { Wallet } from "lucide-react";
import { useState } from "react";

export function WalletConnectButton() {
  const { isConnected, address, chainId, connect, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-ink">{address.slice(0, 6)}...{address.slice(-4)}</span>
          {chainId && <span className="text-[10px] text-ink-muted">Chain {chainId}</span>}
        </div>
        <button
          onClick={disconnect}
          className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-ink-muted transition hover:border-rose-400/30 hover:text-rose-300"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-ink-muted transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-50"
      >
        <Wallet size={14} />
        {connecting ? "Connecting..." : "Connect MetaMask"}
      </button>
      {error && <p className="text-[10px] text-rose-400">{error}</p>}
    </div>
  );
}
