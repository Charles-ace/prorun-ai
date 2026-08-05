// Wallet connection layer.
// Demo mode: simulates a real Web3 connect flow (provider selection →
// approval → connected account) without requiring browser extensions or a
// node. On connect it derives a deterministic on-chain portfolio so the app
// immediately has real data to analyze.
export interface WalletProviderMeta {
  id: string;
  name: string;
  type: "EVM" | "Solana" | "Multichain";
  detail: string;
  color: string;
}

export interface ConnectedWallet {
  address: string;
  chain: string;
  chainId: number;
  providerId: string;
  balanceUsd: number;
  connectedAt: string;
}

export const WALLET_PROVIDERS: WalletProviderMeta[] = [
  { id: "metamask", name: "MetaMask", type: "EVM", detail: "Browser extension", color: "#f6851b" },
  { id: "walletconnect", name: "WalletConnect", type: "Multichain", detail: "QR / mobile pair", color: "#3b99fc" },
  { id: "coinbase", name: "Coinbase Wallet", type: "EVM", detail: "Browser extension", color: "#1652f0" },
  { id: "solana", name: "Solana", type: "Solana", detail: "Phantom / Backpack", color: "#9945ff" },
  { id: "okx", name: "OKX Wallet", type: "EVM", detail: "Self-custody", color: "#17b90f" },
];

const HEX = "0123456789abcdef";

export function shortAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function mockAddress(providerId: string, salt: number): { address: string; chain: string; chainId: number } {
  if (providerId === "solana") {
    const base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let out = "";
    let s = salt >>> 0;
    for (let i = 0; i < 44; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      out += base58[s % base58.length];
    }
    return { address: out, chain: "Solana", chainId: 101 };
  }
  let s = (salt * 2654435761) >>> 0;
  let hex = "";
  for (let i = 0; i < 40; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    hex += HEX[s % 16];
  }
  return {
    address: `0x${hex}`,
    chain: "Ethereum Mainnet",
    chainId: 1,
  };
}

/** Simulates provider approval then returns a connected wallet. */
export function connectWallet(providerId: string, salt: number): Promise<ConnectedWallet> {
  return new Promise((resolve) => {
    const provider = WALLET_PROVIDERS.find((p) => p.id === providerId);
    setTimeout(() => {
      const { address, chain, chainId } = mockAddress(providerId, salt);
      const base = 8000 + ((salt % 9000));
      resolve({
        address,
        chain: provider?.type === "Solana" ? chain : chain,
        chainId,
        providerId,
        balanceUsd: base,
        connectedAt: new Date().toISOString(),
      });
    }, 1200);
  });
}