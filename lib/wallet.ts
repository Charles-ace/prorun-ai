// Real wallet integration layer.
// EVM wallets (MetaMask, Coinbase, OKX) connect through the injected
// EIP-1193 provider; balances are read via eth_call / eth_getBalance routed
// through the wallet itself — no API keys required. Solana connects through
// Phantom and reads balances from a public RPC. A "Demo" provider remains as
// an offline fallback for reviewers without wallets installed.
//
// OKX network support: X Layer (chain 196, OKB gas) is a first-class target —
// WOKB / USDC / USDT are indexed and OKX Wallet connects straight onto X Layer.
import { ASSET_MAP } from "@/lib/market-data";

export type WalletProviderId = "metamask" | "coinbase" | "okx" | "generic" | "phantom" | "demo";

export interface WalletProviderMeta {
  id: WalletProviderId;
  name: string;
  type: "EVM" | "Solana" | "Demo";
  detail: string;
  color: string;
}

export interface AvailableProvider extends WalletProviderMeta {
  installed: boolean;
}

export interface ConnectedWallet {
  address: string;
  chain: string;
  chainId: number;
  providerId: WalletProviderId;
  connectedAt: string;
  holdings: Record<string, number>;
}

export interface EVMHoldingsResult {
  holdings: Record<string, number>;
  chain: string;
  chainId: number;
}

export const WALLET_PROVIDERS: WalletProviderMeta[] = [
  { id: "metamask", name: "MetaMask", type: "EVM", detail: "Injected provider", color: "#f6851b" },
  { id: "coinbase", name: "Coinbase Wallet", type: "EVM", detail: "Browser extension", color: "#1652f0" },
  { id: "okx", name: "OKX Wallet", type: "EVM", detail: "Connects on X Layer · OKB · chain 196", color: "#17b90f" },
  { id: "generic", name: "Any EVM Wallet", type: "EVM", detail: "window.ethereum — Rabby, Trust, Brave, etc.", color: "#a78bfa" },
  { id: "phantom", name: "Phantom", type: "Solana", detail: "Solana browser wallet", color: "#9945ff" },
  { id: "demo", name: "Demo Wallet", type: "Demo", detail: "Simulated — no wallet needed", color: "#34d399" },
];

interface EIP1193Provider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isOkxWallet?: boolean;
  providers?: EIP1193Provider[];
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
}

interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toBase58(): string } }>;
}

type AnyWindow = Record<string, unknown>;

function windowOrNull(): AnyWindow | null {
  if (typeof window === "undefined") return null;
  return window as unknown as AnyWindow;
}

function providerList(): EIP1193Provider[] {
  const w = windowOrNull();
  if (!w) return [];
  const ethereum = w.ethereum as EIP1193Provider | undefined;
  const providers = (ethereum as EIP1193Provider & { providers?: EIP1193Provider[] })?.providers;
  if (Array.isArray(providers) && providers.length) return providers;
  if (ethereum) return [ethereum];
  return [];
}

export function detectProviders(): AvailableProvider[] {
  const w = windowOrNull();
  const list = providerList();
  // Any injected ethereum object means an EVM wallet is present.
  const hasEVM = list.length > 0 || !!w?.ethereum;
  const metamask = list.find((p) => p.isMetaMask) ?? null;
  const coinbase =
    (w?.coinbaseWalletExtension as EIP1193Provider | undefined) ?? list.find((p) => p.isCoinbaseWallet) ?? null;
  const okx =
    (w?.okxwallet as EIP1193Provider | undefined) ?? list.find((p) => p.isOkxWallet) ?? null;
  const solanaWindow = w?.solana as SolanaProvider | undefined;
  const phantomWindow = (w?.phantom as { solana?: SolanaProvider } | undefined)?.solana;
  const phantom = phantomWindow ?? solanaWindow ?? null;

  return WALLET_PROVIDERS.map((p) => ({
    ...p,
    // Every EVM row stays clickable when ANY ethereum provider exists —
    // getEVMProvider falls back to window.ethereum for unknown wallets.
    installed:
      p.id === "metamask" ? hasEVM
      : p.id === "coinbase" ? hasEVM
      : p.id === "okx" ? hasEVM
      : p.id === "generic" ? hasEVM
      : p.id === "phantom" ? !!phantom
      : true,
  }));
}

export function getEVMProvider(id: WalletProviderId): EIP1193Provider | null {
  const w = windowOrNull();
  if (!w) return null;
  const list = providerList();
  const fallback = list[0] ?? (w.ethereum as EIP1193Provider | undefined) ?? null;
  if (id === "generic") return fallback;
  if (id === "metamask") {
    const meta = list.find((p) => p.isMetaMask);
    return meta ?? fallback;
  }
  if (id === "coinbase") return (w.coinbaseWalletExtension as EIP1193Provider) ?? fallback;
  if (id === "okx") return (w.okxwallet as EIP1193Provider) ?? fallback;
  return fallback;
}

export function getSolanaProvider(): SolanaProvider | null {
  const w = windowOrNull();
  if (!w) return null;
  const phantom = (w.phantom as { solana?: SolanaProvider } | undefined)?.solana;
  return phantom ?? (w.solana as SolanaProvider | undefined) ?? null;
}

// ---- OKX X Layer network definition ----

export const X_LAYER = {
  chainId: 196,
  chainIdHex: "0xc4",
  name: "OKX X Layer",
  rpc: "https://rpc.xlayer.tech",
  explorer: "https://www.okx.com/explorer/xlayer",
  currency: "OKB",
};

/** Adds / switches the wallet to OKX X Layer. Best-effort; returns false if rejected. */
export async function ensureXLayer(provider: EIP1193Provider): Promise<boolean> {
  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: X_LAYER.chainIdHex,
          chainName: X_LAYER.name,
          nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
          rpcUrls: [X_LAYER.rpc],
          blockExplorerUrls: [X_LAYER.explorer],
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

// ---- On-chain balance reading ----

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  196: "OKX X Layer",
  42161: "Arbitrum One",
  8453: "Base",
  10: "Optimism",
  137: "Polygon",
  56: "BNB Chain",
};

const NATIVE_SYMBOL: Record<number, string> = {
  1: "ETH",
  196: "OKB",
  42161: "ETH",
  8453: "ETH",
  10: "ETH",
  137: "MATIC",
  56: "BNB",
};

// ERC-20s Prorun can price (every symbol here exists in the analysis catalog).
// Multiple contracts may map to one symbol (e.g. bridged + wrapped USDT).
interface ERC20Meta {
  addrs: string[];
}
const ERC20_TOKENS: Record<number, Record<string, ERC20Meta>> = {
  1: {
    USDC: { addrs: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"] },
    USDT: { addrs: ["0xdAC17F958D2ee523a2206206994597C13D831ec7"] },
    DAI: { addrs: ["0x6B175474E89094C44Da98b954EedeAC495271d0F"] },
    LINK: { addrs: ["0x514910771AF9Ca656af840dff83E8264EcF986CA"] },
    UNI: { addrs: ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"] },
    ETH: { addrs: ["0xC02aaA39b223FE8D0A0e4C504E27aD9083C756Cc2"] }, // WETH
  },
  196: {
    // X Layer — addresses from the official okx/xlayer-tokenlist + OKLink explorer.
    OKB: { addrs: ["0xe538905cf8410324e03A5A23C1c177a474D59b2b"] }, // WOKB
    USDC: { addrs: ["0x74b7F16337b8972027F6196A17a631ac6DdE26d22"] },
    USDT: {
      addrs: [
        "0x779Ded0c9e1022225f8E0630b35a9b54bE713736", // USD₮0
        "0x1e4a5963abfd975d8c9021ce480b42188849d41d", // Tether USDT
      ],
    },
    ETH: { addrs: ["0x5A77f1443D16ee5761d310e38b62f77f726bC71c"] }, // WETH
  },
  42161: {
    USDC: { addrs: ["0xaf88d065e77c8cC2239327C5EDb3A432268e5831"] },
    USDT: { addrs: ["0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"] },
    LINK: { addrs: ["0xf97f4df75117a78c1A5A0dBb814Ab92458339b9d"] },
  },
  8453: {
    USDC: { addrs: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"] },
    DAI: { addrs: ["0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"] },
    ETH: { addrs: ["0x4200000000000000000000000000000000000006"] }, // WETH
  },
  10: {
    USDC: { addrs: ["0x0b2C639c533813f4Aa9D7837CAf62656d097Ff85"] },
    USDT: { addrs: ["0x94b008aA00579c1307B0EF2c499aD98a59058e58"] },
    DAI: { addrs: ["0xDA10009cBd5D07dd0CeCc66161FC93D7c90048f1"] },
    LINK: { addrs: ["0x350a791BFC2c21F9Ed5d10980Dad2e2638ffa7A6"] },
  },
  137: {
    USDC: { addrs: ["0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"] },
    USDT: { addrs: ["0xc2132D05D31c914a87C6611C10748AEb04B58e8F"] },
    LINK: { addrs: ["0x53E0bca35eC356BD1411ddF6c4bDEdDAd3FaBad39"] },
  },
  56: {
    USDT: { addrs: ["0x55d398326f99059fF775485246999027B3197955"] },
    USDC: { addrs: ["0x8AC76a51cc950d9822D68b835E1Ad97B32Cd580d"] },
  },
};

const BALANCE_OF = "0x70a08231";
const DECIMALS = "0x313ce567";

function encodeAddress(address: string): string {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

async function evmCall(provider: EIP1193Provider, to: string, data: string): Promise<bigint> {
  const res = await provider.request({
    method: "eth_call",
    params: [{ to, data }, "latest"],
  });
  return BigInt(String(res ?? "0x0"));
}

async function tokenDecimals(provider: EIP1193Provider, addr: string): Promise<number> {
  try {
    return Number(await evmCall(provider, addr, DECIMALS));
  } catch {
    return 18;
  }
}

/** Reads native + supported ERC-20 balances through the wallet's provider. */
export async function fetchEVMHoldings(
  provider: EIP1193Provider,
  address: string,
  chainIdHex?: string,
): Promise<EVMHoldingsResult> {
  let chainId = 1;
  try {
    chainId = Number(chainIdHex ?? (await provider.request({ method: "eth_chainId" })));
  } catch {
    chainId = 1;
  }

  const holdings: Record<string, number> = {};

  const nativeSymbol = NATIVE_SYMBOL[chainId];
  if (nativeSymbol && ASSET_MAP[nativeSymbol]) {
    try {
      const res = await provider.request({ method: "eth_getBalance", params: [address, "latest"] });
      const wei = BigInt(String(res ?? "0x0"));
      const amt = Number(wei) / 1e18;
      if (amt > 0.0001) holdings[nativeSymbol] = amt;
    } catch {
      /* native balance unavailable */
    }
  }

  const tokens = ERC20_TOKENS[chainId] ?? {};
  const data = `${BALANCE_OF}${encodeAddress(address)}`;
  const checks: Promise<[string, number] | null>[] = [];

  for (const [symbol, meta] of Object.entries(tokens)) {
    if (!ASSET_MAP[symbol]) continue;
    for (const addr of meta.addrs) {
      checks.push(
        (async (): Promise<[string, number] | null> => {
          try {
            const [raw, decimals] = await Promise.all([
              evmCall(provider, addr, data),
              tokenDecimals(provider, addr),
            ]);
            const amount = Number(raw) / 10 ** decimals;
            return amount > 0 ? [symbol, amount] : null;
          } catch {
            return null; // token missing / unreadable on this chain — skip
          }
        })(),
      );
    }
  }

  const settled = await Promise.allSettled(checks);
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value) {
      const [symbol, amount] = s.value;
      holdings[symbol] = (holdings[symbol] ?? 0) + amount;
    }
  }

  return { holdings, chain: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`, chainId };
}

// ---- Solana (Phantom + public RPC) ----

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const SPL_TOKENS: Record<string, { symbol: string; mint: string; decimals: number }> = {
  USDC: { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  USDT: { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
};

async function solanaRpc(method: string, params: unknown[]): Promise<{ value?: unknown }> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = (await res.json()) as { error?: { message?: string }; result?: unknown };
  if (data.error) throw new Error(data.error.message ?? "Solana RPC error");
  return { value: data.result };
}

type ParsedTokenAccount = {
  account?: {
    data?: {
      parsed?: {
        info?: { mint?: string; tokenAmount?: { uiAmount?: number } };
      };
    };
  };
};

export async function fetchSolanaHoldings(address: string): Promise<EVMHoldingsResult> {
  const holdings: Record<string, number> = {};

  try {
    const lamports = (await solanaRpc("getBalance", [address])).value as { value?: number } | undefined;
    const sol = Number(lamports?.value ?? 0) / 1e9;
    if (sol > 0.001) holdings.SOL = sol;
  } catch {
    /* balance unavailable */
  }

  try {
    const accounts = (await solanaRpc("getParsedTokenAccountsByOwner", [
      address,
      { programId: "TokenkegQfeZyiNwAeECaP9yA80cDhTo31owtjvcKwgDC" },
      { encoding: "jsonParsed" },
    ])).value as ParsedTokenAccount[] | undefined;
    for (const acc of accounts ?? []) {
      const info = acc.account?.data?.parsed?.info;
      if (!info) continue;
      const entry = Object.values(SPL_TOKENS).find((t) => t.mint === info.mint);
      if (!entry) continue;
      const amount = Number(info.tokenAmount?.uiAmount ?? 0);
      if (amount > 0) holdings[entry.symbol] = (holdings[entry.symbol] ?? 0) + amount;
    }
  } catch {
    /* SPL list unavailable */
  }

  for (const key of Object.keys(holdings)) {
    if (!ASSET_MAP[key]) delete holdings[key];
  }

  return { holdings, chain: "Solana Mainnet", chainId: 101 };
}

// ---- Demo fallback ----

const HEX = "0123456789abcdef";

export function mockAddress(
  providerId: WalletProviderId,
  salt: number,
): { address: string; chain: string; chainId: number } {
  if (providerId === "phantom") {
    const base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let out = "";
    let s = salt >>> 0;
    for (let i = 0; i < 44; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      out += base58[s % base58.length];
    }
    return { address: out, chain: "Solana Mainnet", chainId: 101 };
  }
  let s = (salt * 2654435761) >>> 0;
  let hex = "";
  for (let i = 0; i < 40; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    hex += HEX[s % 16];
  }
  return {
    address: `0x${hex}`,
    chain: providerId === "okx" ? "OKX X Layer" : "Ethereum Mainnet",
    chainId: providerId === "okx" ? 196 : 1,
  };
}

const DEMO_HOLDINGS: Record<string, Record<string, number>> = {
  metamask: { BTC: 0.42, ETH: 5.8, USDC: 2000, LINK: 240 },
  coinbase: { BTC: 0.25, ETH: 2.4, SOL: 120, USDC: 4500 },
  okx: { OKB: 140, ETH: 1.8, USDC: 3200, BTC: 0.12 },
  phantom: { SOL: 82, USDC: 1500 },
  demo: { BTC: 0.42, ETH: 5.8, SOL: 64, LINK: 340, USDC: 2600, SUI: 150, DOGE: 12000 },
};

export function demoWallet(providerId: WalletProviderId, salt: number): ConnectedWallet {
  const { address, chain, chainId } = mockAddress(providerId, salt);
  return {
    address,
    chain,
    chainId,
    providerId,
    connectedAt: new Date().toISOString(),
    holdings: { ...(DEMO_HOLDINGS[providerId] ?? DEMO_HOLDINGS.demo) },
  };
}

export function shortAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
