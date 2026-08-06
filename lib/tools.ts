// Agent tool registry for the AI Assistant.
// Each tool runs REAL analysis (risk engine, market data, on-chain scans)
// and returns readable results that the assistant cites in its answer.
import type { ChatContext } from "@/lib/types";
import { analyzePortfolio } from "@/lib/analysis-engine";
import { getMarketQuotes } from "@/lib/market-data";
import { buildMarketBriefFor } from "@/lib/sample-data";
import { publicClientForChain, readEVMHoldings } from "@/lib/wallet";

export interface ToolDefinition {
  name: string;
  label: string;
  description: string;
  parameters: Record<string, unknown>;
  run(args: Record<string, unknown>, ctx: ChatContext): Promise<string>;
}

const usd = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export const TOOLS: ToolDefinition[] = [
  {
    name: "get_portfolio_snapshot",
    label: "Portfolio snapshot",
    description:
      "Current portfolio overview: total value, top allocations with percentages, stablecoin protection, 24h change and risk score.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async run(_args, ctx) {
      const p = ctx.portfolio;
      if (!p) return "No portfolio loaded. The user needs to connect a wallet or add holdings first.";
      const top = p.assets
        .slice()
        .sort((a, b) => b.price * b.amount - a.price * a.amount)
        .slice(0, 5)
        .map((a) => `${a.symbol} ${a.allocation.toFixed(1)}%`)
        .join(", ");
      return `Portfolio value ${usd(p.totalValue)}. Top allocations: ${top}. Stablecoin protection ${ctx.stablePct.toFixed(1)}%. 24h change ${pct(ctx.portfolioChange24h)}. Risk score ${ctx.riskScore}/100.`;
    },
  },
  {
    name: "run_risk_analysis",
    label: "Re-ran risk analysis",
    description:
      "Runs the full Prorun risk engine on the user's portfolio and returns the quantified score, risk breakdown, top risks and recommendations.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async run(_args, ctx) {
      const p = ctx.portfolio;
      if (!p) return "No portfolio loaded. The user needs a portfolio to analyze.";
      const r = analyzePortfolio(p);
      const topRisks = r.topRisks.map((x) => `${x.title} (${x.severity})`).join("; ") || "none";
      return `Risk score ${r.score}/100 (${r.scoreLabel}). Estimated daily volatility ${(r.estimatedDailyVol * 100).toFixed(1)}%. Top risks: ${topRisks}. Recommendations: ${r.recommendations.join("; ")}.`;
    },
  },
  {
    name: "get_market_quotes",
    label: "Fetched live quotes",
    description:
      "Live market quotes for crypto assets. Optional symbols argument filters the list (e.g. BTC, ETH, OKB).",
    parameters: {
      type: "object",
      properties: {
        symbols: { type: "array", items: { type: "string" }, description: "Optional asset symbols to filter by" },
      },
      additionalProperties: false,
    },
    async run(args, _ctx) {
      const quotes = await getMarketQuotes();
      const wanted = Array.isArray(args.symbols)
        ? (args.symbols as string[]).map((s) => s.toUpperCase())
        : [];
      const rows = quotes
        .filter((q) => (wanted.length ? wanted.includes(q.symbol) : q.symbol === "BTC" || q.symbol === "ETH" || q.symbol === "OKB"))
        .map((q) => `${q.symbol} ${usd(q.price)} (${pct(q.change24h)} 24h${q.observed ? ", live" : ", seeded"})`);
      return rows.length ? rows.join(" · ") : `No quotes for ${wanted.join(", ") || "requested symbols"}.`;
    },
  },
  {
    name: "get_market_brief",
    label: "Checked market conditions",
    description:
      "The daily AI market brief: BTC and ETH trend with 24h change, broad sentiment score, key risks and a risk-adjusted stance.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async run(_args, _ctx) {
      const m = await buildMarketBriefFor();
      const btcTrend = m.btc.change24h >= 1 ? "up" : m.btc.change24h <= -1 ? "down" : "flat";
      const ethTrend = m.eth.change24h >= 1 ? "up" : m.eth.change24h <= -1 ? "down" : "flat";
      const stance =
        m.score >= 65 ? "aggressive" : m.score >= 45 ? "balanced" : m.score >= 30 ? "defensive" : "risk-off";
      return `BTC trend ${btcTrend} (${pct(m.btc.change24h)}) · ETH ${ethTrend} (${pct(m.eth.change24h)}) · sentiment ${m.sentiment.label} (${m.score}/100). ${m.sentiment.summary} Stance: ${stance}`;
    },
  },
  {
    name: "scan_wallet_balances",
    label: "Scanned on-chain balances",
    description:
      "Reads the connected wallet's on-chain balances (native + supported tokens) for the given address and chain id, without API keys.",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address to scan" },
        chainId: { type: "number", description: "Chain id the wallet is on" },
      },
      required: ["address", "chainId"],
      additionalProperties: false,
    },
    async run(args, _ctx) {
      const address = String(args.address ?? "");
      const chainId = Number(args.chainId ?? 1);
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return "Invalid wallet address.";
      try {
        const r = await readEVMHoldings(publicClientForChain(chainId), address, chainId);
        if (!Object.keys(r.holdings).length) {
          return `No priceable balances found on ${r.chain} for this address.`;
        }
        const lines = Object.entries(r.holdings)
          .map(([sym, amt]) => `${amt >= 100 ? amt.toFixed(0) : amt.toFixed(4)} ${sym}`)
          .join(", ");
        return `On-chain scan of ${r.chain}: ${lines}.`;
      } catch (err) {
        return `On-chain scan failed: ${err instanceof Error ? err.message : "network error"}.`;
      }
    },
  },
];

export const TOOL_MAP: Record<string, ToolDefinition> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t]),
);

export async function runTool(name: string, args: Record<string, unknown>, ctx: ChatContext): Promise<string> {
  const tool = TOOL_MAP[name];
  if (!tool) return `Unknown tool: ${name}`;
  try {
    return await tool.run(args, ctx);
  } catch (err) {
    return `Tool ${name} failed: ${err instanceof Error ? err.message : "error"}`;
  }
}
