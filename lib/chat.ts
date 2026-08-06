// Agentic chat engine for the AI Assistant.
// With OPENROUTER_API_KEY configured the assistant uses REAL LLM tool-calling
// (OpenAI-compatible tools param): it decides which tools to run, executes
// them, and answers grounded in their output. Offline, the deterministic
// router "calls" the same tools and formats answers from the results.
import type { ChatContext, ChatMessage } from "@/lib/types";
import { TOOLS, TOOL_MAP, runTool } from "@/lib/tools";
import { callOpenRouter, type OpenRouterMessage } from "@/lib/openrouter";

const DISCLAIMER = "Prorun AI provides analysis and education, not financial advice.";

export interface AssistantResult {
  reply: string;
  toolCalls: string[];
}

const fmtUsd = (v: number) =>
  "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0));
const pct = (v: number) => `${v.toFixed(1)}%`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function buildAssistantReply(
  question: string,
  ctx: ChatContext,
  history: ChatMessage[],
): Promise<AssistantResult> {
  if (process.env.OPENROUTER_API_KEY) {
    const llm = await agenticLLM(question, ctx, history);
    if (llm) return llm;
  }
  return deterministicAgent(question, ctx);
}

// ---------- LLM path: real tool-calling ----------

async function chatCompletion(
  messages: OpenRouterMessage[],
  tools?: unknown[],
): Promise<{
  content: string | null;
  toolCalls: { id: string; name: string; args: string }[] | null;
} | null> {
  try {
    const result = await callOpenRouter(messages, { tools, toolChoice: tools ? "auto" : "none" });
    const toolCalls = result.toolCalls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      args: tc.function.arguments,
    })) ?? null;
    return { content: result.content, toolCalls };
  } catch (err) {
    console.error("Chat completion failed:", err);
    return null;
  }
}

async function agenticLLM(
  question: string,
  ctx: ChatContext,
  history: ChatMessage[],
): Promise<AssistantResult | null> {
  const tools = TOOLS.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: `You are Prorun AI, a professional crypto risk assistant embedded in a portfolio dashboard.
You are an agent with tools. Run tools whenever the answer depends on the user's portfolio, risk report, market prices or their wallet — then answer strictly from the tool output. Never invent numbers.
Portfolio context: value ${fmtUsd(ctx.portfolioValue ?? 0)}, risk score ${ctx.riskScore ?? 0}/100, stable % ${pct(ctx.stablePct ?? 0)}, 24h change ${pct(ctx.portfolioChange24h ?? 0)}, top holdings ${(ctx.topAllocations ?? []).map((a) => `${a.symbol} ${pct(a.pct ?? 0)}`).join(", ")}, market sentiment ${ctx.marketSentiment ?? "unknown"}, BTC ${ctx.btcTrend ?? "unknown"}, ETH ${ctx.ethTrend ?? "unknown"}${ctx.wallet ? `, wallet ${ctx.wallet.address} on chain ${ctx.wallet.chainId}` : ""}.
Keep answers under 6 lines unless the user asks for detail. Always close with: ${DISCLAIMER}`,
    },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: question },
  ];

  const first = await chatCompletion(messages, tools);
  if (!first) return null;

  const toolCalls = first.toolCalls?.map((tc) => tc.name) ?? [];
  if (!first.toolCalls || !first.toolCalls.length) {
    return { reply: first.content ?? "No answer generated.", toolCalls: [] };
  }

  const toolMessages: OpenRouterMessage[] = [];
  for (const tc of first.toolCalls) {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.args || "{}") as Record<string, unknown>;
    } catch {
      args = {};
    }
    const output = await runTool(tc.name, args, ctx);
    toolMessages.push({ role: "tool", tool_call_id: tc.id, content: output });
  }

  const second = await chatCompletion([...messages, first as unknown as OpenRouterMessage, ...toolMessages]);
  return {
    reply: second?.content?.trim() || "I ran the analysis but could not summarize the results.",
    toolCalls,
  };
}

// ---------- Offline path: deterministic tool router ----------

function routeIntent(q: string): string | null {
  if (/(how risky|risk score|my risk|am i safe|risk level|analy.?ze)/.test(q)) return "run_risk_analysis";
  if (/(market|btc|bitcoin|sentiment|trend|brief)/.test(q)) return "get_market_brief";
  if (/(price of|quote|how much is|live price)/.test(q)) return "get_market_quotes";
  if (/(wallet|on.?chain|scan|balance|holdings)/.test(q)) return "scan_wallet_balances";
  if (/(portfolio|what do i hold|my positions|allocation|net worth)/.test(q)) return "get_portfolio_snapshot";
  return null;
}

async function deterministicAgent(question: string, ctx: ChatContext): Promise<AssistantResult> {
  const intent = routeIntent(question.toLowerCase());
  if (intent) {
    const args: Record<string, unknown> =
      intent === "scan_wallet_balances" && ctx.wallet
        ? { address: ctx.wallet.address, chainId: ctx.wallet.chainId }
        : intent === "get_market_quotes"
          ? { symbols: extractSymbols(question) }
          : {};
    const out = await runTool(intent, args, ctx);
    return { reply: `${templateFor(intent, out, ctx)}\n\n${DISCLAIMER}`, toolCalls: [intent] };
  }
  return { reply: deterministicReply(question, ctx), toolCalls: [] };
}

function extractSymbols(q: string): string[] {
  return ["BTC", "ETH", "OKB", "SOL", "USDC", "USDT", "LINK", "BNB", "XRP", "ADA", "DOGE", "SUI"]
    .filter((s) => new RegExp(`\\b${s}\\b`, "i").test(q));
}

function templateFor(intent: string, out: string, ctx: ChatContext): string {
  switch (intent) {
    case "run_risk_analysis": {
      const p = ctx.portfolio;
      return p
        ? `Here's your fresh analysis — ${out}\n\nKey guardrail: keep the largest position under 25% and stable protection at 10-20%.`
        : out;
    }
    case "get_market_brief":
      return `Market check (fresh): ${out}`;
    case "get_market_quotes":
      return `Live quotes: ${out}`;
    case "scan_wallet_balances":
      return ctx.wallet
        ? `${out} The portfolio above is rebuilt from these on-chain balances.`
        : "I can't scan your wallet — connect one first, then ask me again.";
    case "get_portfolio_snapshot":
      return `Snapshot: ${out}`;
    default:
      return out;
  }
}

// ---------- Legacy deterministic reply (no tool needed) ----------

function topToken(ctx: ChatContext): string {
  return ctx.topAllocations[0]?.symbol ?? "your largest holding";
}

function deterministicReply(question: string, ctx: ChatContext): string {
  const q = question.toLowerCase();

  if (/(increase|add to|more|allocate).*(eth|ethereum)/.test(q)) {
    const eth = ctx.topAllocations.find((a) => a.symbol === "ETH");
    const ethPct = eth?.pct ?? 0;
    const answer =
      ethPct > 35
        ? `ETH is already ${pct(ethPct)} of your portfolio. Adding more would deepen concentration risk — I'd hold off and diversify instead.`
        : `ETH momentum is ${ctx.ethTrend.toLowerCase()}. At ${pct(ethPct)} of your portfolio, a modest increase is acceptable only if it stays under 35% total and you keep your stable buffer above 10%.`;
    return `${answer}\n\n${DISCLAIMER}`;
  }

  if (/(loss|losing|lost|blew|drawdown|down)/.test(q)) {
    return `Your portfolio is down ${pct(-ctx.portfolioChange24h)} over 24h at a risk score of ${ctx.riskScore}/100.\n\nLosses compound fastest when concentration and leverage combine. The single most effective fix is shrinking your largest position (${topToken(ctx)} at ${pct(ctx.topAllocations[0]?.pct ?? 0)}) and widening the stable reserve to 10-20%.\n\n${DISCLAIMER}`;
  }

  if (/(stable|usdc|usdt|hold cash|liquidity)/.test(q)) {
    return `You currently hold ${pct(ctx.stablePct)} in stable assets. Prorun recommends 10-20% as a liquidity buffer — enough to absorb drawdowns and buy dips without selling into weakness.\n\n${DISCLAIMER}`;
  }

  if (/(leverage|margin|position size)/.test(q)) {
    const advise =
      ctx.riskScore >= 60
        ? "Your risk score is elevated — I'd avoid increasing leverage entirely until volatility cools."
        : "Your risk profile can tolerate some leverage, but keep per-trade risk under 1% and total margin exposure below 25% of net value.";
    return `${advise}\n\nGiven BTC is ${ctx.btcTrend.toLowerCase()}, prefer spot entries while momentum is uncertain.\n\n${DISCLAIMER}`;
  }

  if (/(sell|exit|reduce|trim)/.test(q)) {
    return `Given ${topToken(ctx)} at ${pct(ctx.topAllocations[0]?.pct ?? 0)}, a sensible first move is trimming that position toward a 20-25% cap and converting proceeds into stable reserves.\n\n${DISCLAIMER}`;
  }

  if (/(diversif|correlat|spread)/.test(q)) {
    return `Your portfolio leans on ${topToken(ctx)} (${pct(ctx.topAllocations[0]?.pct ?? 0)}). Adding uncorrelated assets with lower volatility — and lifting stable reserves above ${pct(ctx.stablePct)} — would materially lower your risk score from ${ctx.riskScore}/100.\n\n${DISCLAIMER}`;
  }

  if (/(hello|hi\b|hey|help|what can you)/.test(q)) {
    return `I'm Prorun — your crypto risk assistant and agent. I can run real analysis on demand:\n\n- "How risky is my portfolio?" (runs the risk engine)\n- "Scan my wallet" (reads on-chain balances)\n- "Market brief" (fresh BTC/ETH data)\n- "Should I increase my ETH allocation?"\n- "Explain my losses this month"\n- "How much liquidity should I hold?"\n\n${DISCLAIMER}`;
  }

  return `${pick([
    `Here's my read: with a risk score of ${ctx.riskScore}/100, ${pct(ctx.stablePct)} stable protection, and ${topToken(ctx)} leading at ${pct(ctx.topAllocations[0]?.pct ?? 0)}, the priority is balancing concentration and liquidity before chasing more upside.`,
    `Based on your data — ${topToken(ctx)} at ${pct(ctx.topAllocations[0]?.pct ?? 0)} and ${pct(ctx.stablePct)} stable reserves at ${ctx.riskScore}/100 risk — I'd focus on reducing concentration and keeping a 10-20% liquidity buffer.`,
  ])}\n\n${DISCLAIMER}`;
}

export { DISCLAIMER };
