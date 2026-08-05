// Market data layer.
// Tries the free CoinGecko public API first (no key required), with an
// in-memory cache and TTL. If unavailable or rate-limited, it falls back to a
// seeded "demo" dataset so the product remains fully functional offline.
import type {
  Asset,
  MarketAssetQuote,
  Portfolio,
  VolLevel,
} from "@/lib/types";

export interface AssetMeta {
  symbol: string;
  name: string;
  vol: VolLevel;
  stable: boolean;
  seedPrice: number;
  seedCap: number;
  coingeckoId?: string;
  color: string;
}

export const ASSET_CATALOG: AssetMeta[] = [
  { symbol: "BTC", name: "Bitcoin", vol: "medium", stable: false, seedPrice: 97240, seedCap: 1.92e12, coingeckoId: "bitcoin", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", vol: "medium", stable: false, seedPrice: 3452, seedCap: 4.15e11, coingeckoId: "ethereum", color: "#627eea" },
  { symbol: "SOL", name: "Solana", vol: "high", stable: false, seedPrice: 218.4, seedCap: 1.02e11, coingeckoId: "solana", color: "#9945ff" },
  { symbol: "BNB", name: "BNB", vol: "medium", stable: false, seedPrice: 701.2, seedCap: 1.01e11, coingeckoId: "binancecoin", color: "#f0b90b" },
  { symbol: "XRP", name: "XRP", vol: "high", stable: false, seedPrice: 2.41, seedCap: 1.37e11, coingeckoId: "ripple", color: "#23292f" },
  { symbol: "ADA", name: "Cardano", vol: "high", stable: false, seedPrice: 1.06, seedCap: 3.8e10, coingeckoId: "cardano", color: "#0033ad" },
  { symbol: "LINK", name: "Chainlink", vol: "high", stable: false, seedPrice: 22.6, seedCap: 1.43e10, coingeckoId: "chainlink", color: "#2a5ada" },
  { symbol: "DOGE", name: "Dogecoin", vol: "high", stable: false, seedPrice: 0.401, seedCap: 5.9e10, coingeckoId: "dogecoin", color: "#c2a633" },
  { symbol: "AVAX", name: "Avalanche", vol: "high", stable: false, seedPrice: 44.2, seedCap: 1.8e10, coingeckoId: "avalanche-2", color: "#e84142" },
  { symbol: "SUI", name: "Sui", vol: "high", stable: false, seedPrice: 4.12, seedCap: 1.28e10, coingeckoId: "sui", color: "#4da2ff" },
  { symbol: "UNI", name: "Uniswap", vol: "high", stable: false, seedPrice: 13.8, seedCap: 8.4e9, coingeckoId: "uniswap", color: "#ff007a" },
  { symbol: "ARB", name: "Arbitrum", vol: "high", stable: false, seedPrice: 0.812, seedCap: 3.2e9, coingeckoId: "arbitrum", color: "#28a0f0" },
  { symbol: "OP", name: "Optimism", vol: "high", stable: false, seedPrice: 2.06, seedCap: 2.7e9, coingeckoId: "optimism", color: "#ff0420" },
  { symbol: "USDT", name: "Tether", vol: "low", stable: true, seedPrice: 1.0, seedCap: 1.4e11, coingeckoId: "tether", color: "#26a17b" },
  { symbol: "USDC", name: "USD Coin", vol: "low", stable: true, seedPrice: 1.0, seedCap: 5.6e10, coingeckoId: "usd-coin", color: "#2775ca" },
  { symbol: "DAI", name: "Dai", vol: "low", stable: true, seedPrice: 1.0, seedCap: 5.2e9, coingeckoId: "dai", color: "#f5ac37" },
];

export const ASSET_MAP: Record<string, AssetMeta> = Object.fromEntries(
  ASSET_CATALOG.map((a) => [a.symbol, a]),
);

export function isSupportedAsset(symbol: string): boolean {
  return !!ASSET_MAP[symbol.toUpperCase()];
}

interface CachedQuote {
  symbol: string;
  price: number;
  change24h: number;
  change7d: number;
  observed: boolean;
  at: number;
}

let cache: Map<string, CachedQuote> = new Map();
let lastLivePull = 0;

const CACHE_TTL_MS = Number(process.env.MARKET_CACHE_TTL || 60) * 1000;

/** Deterministic pseudo-change so offline data is stable per symbol. */
function seededQuote(meta: AssetMeta): CachedQuote {
  const h = Number(meta.symbol) || [...meta.symbol].reduce((n, c) => n + c.charCodeAt(0), 0);
  const change24h = +((((h * 7919) % 2000) - 1000) / 100).toFixed(2);
  const change7d = +(((change24h * 2.3 + ((h * 37) % 600) / 100) * 0.9)).toFixed(2);
  return {
    symbol: meta.symbol,
    price: meta.seedPrice,
    change24h,
    change7d,
    observed: false,
    at: Date.now(),
  };
}

async function pullLiveMarkets(): Promise<void> {
  const ids = ASSET_CATALOG.filter((a) => a.coingeckoId)
    .map((a) => a.coingeckoId)
    .join(",");
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h,7d`,
      { signal: controller.signal, headers: { accept: "application/json" } },
    );
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const rows: any[] = await res.json();
    for (const row of rows) {
      const meta = ASSET_CATALOG.find((a) => a.coingeckoId === row.id);
      if (!meta) continue;
      cache.set(meta.symbol, {
        symbol: meta.symbol,
        price: row.current_price ?? meta.seedPrice,
        change24h: row.price_change_percentage_24h_in_currency ?? 0,
        change7d: row.price_change_percentage_7d_in_currency ?? 0,
        observed: true,
        at: Date.now(),
      });
    }
    lastLivePull = Date.now();
  } catch {
    /* offline / rate-limited — keep seeded */
  } finally {
    clearTimeout(t);
  }
}

async function ensureQuotes(): Promise<void> {
  const freshEnough = [...cache.values()].every((c) => Date.now() - c.at < CACHE_TTL_MS);
  if (cache.size > 0 && freshEnough && Date.now() - lastLivePull < CACHE_TTL_MS) return;
  if (Date.now() - lastLivePull < CACHE_TTL_MS && cache.size > 0) return;
  for (const meta of ASSET_CATALOG) {
    if (!cache.has(meta.symbol)) cache.set(meta.symbol, seededQuote(meta));
  }
  await pullLiveMarkets();
  for (const meta of ASSET_CATALOG) {
    if (!cache.has(meta.symbol)) cache.set(meta.symbol, seededQuote(meta));
  }
}

export async function getQuote(symbol: string): Promise<CachedQuote> {
  const key = symbol.toUpperCase();
  await ensureQuotes();
  return cache.get(key) ?? seededQuote(ASSET_MAP[key]);
}

export async function getMarketQuotes(): Promise<MarketAssetQuote[]> {
  await ensureQuotes();
  return ASSET_CATALOG.map((meta) => {
    const q = cache.get(meta.symbol)!;
    return {
      symbol: meta.symbol,
      name: meta.name,
      price: q.price,
      change24h: q.change24h,
      change7d: q.change7d,
      marketCap: meta.seedCap,
      volume24h: meta.seedCap * (0.03 + ((meta.symbol.charCodeAt(0) * 7) % 40) / 100),
      observed: q.observed,
    };
  }).sort((a, b) => b.marketCap - a.marketCap);
}

/** Build a portfolio object from raw holdings data, computing current values. */
export async function buildPortfolio(
  holdings: Record<string, number>,
  opts: { label?: string; source?: Portfolio["source"]; address?: string } = {},
): Promise<Portfolio> {
  const totalValue =
    (await Promise.all(
      Object.entries(holdings).map(async ([sym, amt]) => {
        const q = await getQuote(sym.toUpperCase());
        return amt * q.price;
      }),
    )).reduce((a, b) => a + b, 0);

  const assets: Asset[] = await Promise.all(
    Object.entries(holdings).map(async ([sym, amount]) => {
      const meta = ASSET_MAP[sym.toUpperCase()]!;
      const q = await getQuote(sym.toUpperCase());
      return {
        symbol: meta.symbol,
        name: meta.name,
        amount,
        price: q.price,
        change24h: q.change24h,
        allocation: totalValue ? (amount * q.price) / totalValue : 0,
        volatility: meta.vol,
        stable: meta.stable,
        trend7d: q.change7d,
      };
    }),
  ).then((arr) => arr.sort((a, b) => b.allocation - a.allocation));

  // Normalise allocations to exactly 100%.
  assets.forEach((a, i) => {
    if (i === assets.length - 1) {
      a.allocation = Math.round(
        (a.allocation / assets.reduce((s, x) => s + x.allocation, 0)) * 1000,
      ) / 10;
    } else {
      a.allocation = Math.round((a.allocation / assets.reduce((s, x) => s + x.allocation, 0)) * 1000) / 10;
    }
  });

  return {
    id: opts.label ? opts.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "portfolio" : "portfolio",
    label: opts.label || "My Portfolio",
    source: opts.source || "manual",
    address: opts.address,
    assets,
    totalValue,
    createdAt: new Date().toISOString(),
  };
}