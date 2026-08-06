"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useCallback, useState } from "react";

interface WalletState {
  address: string | null;
  chainId: number | null;
  providerId: string | null;
  connectedAt: string | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "prorun.wallet.v1";

function loadWallet(): WalletState {
  if (typeof window === "undefined") return { address: null, chainId: null, providerId: null, connectedAt: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WalletState;
  } catch {
    /* ignore */
  }
  return { address: null, chainId: null, providerId: null, connectedAt: null };
}

function saveWallet(state: WalletState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(loadWallet);

  useEffect(() => {
    saveWallet(wallet);
  }, [wallet]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { ethereum?: { on: (event: string, handler: (...args: unknown[]) => void) => void; removeListener: (event: string, handler: (...args: unknown[]) => void) => void } };
    const ethereum = w.ethereum;
    if (!ethereum) return;

    const onAccounts = (args: unknown[]) => {
      const accounts = args as { length: number; [k: number]: string }[];
      if (accounts && accounts[0] && accounts[0].length === 0) {
        setWallet({ address: null, chainId: null, providerId: null, connectedAt: null });
      }
    };
    const onChain = (args: unknown[]) => {
      const chainId = (args as { chainId?: string }[])?.[0]?.chainId;
      if (chainId && wallet.address) {
        setWallet((prev) => (prev ? { ...prev, chainId: Number(chainId) } : prev));
      }
    };

    ethereum.on("accountsChanged", onAccounts as (...args: unknown[]) => void);
    ethereum.on("chainChanged", onChain as (...args: unknown[]) => void);

    return () => {
      ethereum.removeListener("accountsChanged", onAccounts as (...args: unknown[]) => void);
      ethereum.removeListener("chainChanged", onChain as (...args: unknown[]) => void);
    };
  }, [wallet.address]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; isMetaMask?: boolean } };
    const ethereum = w.ethereum;
    if (!ethereum) throw new Error("No wallet detected. Please install MetaMask or another Web3 wallet.");
    if (!ethereum.isMetaMask) {
      console.warn("Non-MetaMask wallet detected, attempting connection...");
    }

    try {
      const accounts = (await ethereum.request({ method: "eth_requestAccounts", params: [] })) as string[];
      if (!accounts || accounts.length === 0) throw new Error("No accounts returned. Please approve the connection in your wallet.");

      const chainId = (await ethereum.request({ method: "eth_chainId", params: [] })) as string;

      setWallet({
        address: accounts[0],
        chainId: Number(chainId),
        providerId: ethereum.isMetaMask ? "metamask" : "other",
        connectedAt: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("User rejected") || err.message.includes("user rejected") || err.message.includes("4001")) {
          throw new Error("Connection rejected. Please approve the connection request in your wallet.");
        }
        if (err.message.includes("already pending") || err.message.includes("32602")) {
          throw new Error("Connection already pending. Please check your wallet.");
        }
        if (err.message.includes("locked") || err.message.includes("Locked")) {
          throw new Error("Wallet is locked. Please unlock your wallet and try again.");
        }
      }
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, chainId: null, providerId: null, connectedAt: null });
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      ...wallet,
      connect,
      disconnect,
      isConnected: !!wallet.address,
    }),
    [wallet, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
