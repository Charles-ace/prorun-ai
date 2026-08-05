// Chat response engine for the AI Assistant.
// Builds grounded, portfolio-aware answers from the user's question plus the
// current portfolio & market context. Used as the deterministic fallback;
// an LLM call is attempted first when AI_API_KEY is configured.
import type { ChatContext, ChatMessage } from "@/lib/types";

const DISCLAIMER = "Prorun AI provides analysis and education, not financial advice.";

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
): Promise<string> {
  if (process.env.AI_API_KEY) {
    const llm = await callChatLLM(question, ctx, history);
    if (llm) return llm;
  }
  return deterministicReply(question, ctx);
}

async function callChatLLM(
  question: string,
  ctx: ChatContext,
  history: ChatMessage[],
): Promise<string | null> {
  try {
    const res = await fetch(process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You are Prorun AI, a professional crypto risk assistant embedded in a portfolio dashboard.
You ground every answer in the user's actual data. Never invent numbers — use the context provided.
Portfolio context: value ${fmtUsd(ctx.portfolioValue)}, risk score ${ctx.riskScore}/100, stable % ${pct(ctx.stablePct)}, 24h change ${pct(ctx.portfolioChange24h)}, top holdings ${ctx.topAllocations.map((a) => `${a.symbol} ${pct(a.pct)}`).join(", ")}, market sentiment ${ctx.marketSentiment}, BTC ${ctx.btcTrend}, ETH ${ctx.ethTrend}.
End short answers (under 6 lines). Always close with: ${DISCLAIMER}`,
          },
          ...history.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: question },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function topToken(ctx: ChatContext): string {
  return ctx.topAllocations[0]?.symbol ?? "your largest holding";
}

function deterministicReply(question: string, ctx: ChatContext): string {
  const q = question.toLowerCase();

  if (/(how risky|risk score|my risk|am i safe|risk level)/.test(q)) {
    const band =
      ctx.riskScore >= 70 ? "high" : ctx.riskScore >= 40 ? "moderate" : "low";
    return `Your portfolio is at ${band} risk with a Prorun score of ${ctx.riskScore}/100.\n\nMain drivers:\n- ${topToken(ctx)} makes up ${pct(ctx.topAllocations[0]?.pct ?? 0)} of your holdings.\n- Stablecoin protection is ${pct(ctx.stablePct)} (target 10-20%).\n- 24h portfolio change: ${pct(ctx.portfolioChange24h)}.\n\nPriorities: reduce concentrated positions, rebuild a liquidity buffer, and avoid leverage while volatility stays elevated.\n\n${DISCLAIMER}`;
  }

  if (/(increase|add to|more|allocate).*(eth|ethereum)/.test(q)) {
    const eth = ctx.topAllocations.find((a) => a.symbol === "ETH");
    const ethPct = eth?.pct ?? 0;
    const answer =
      ethPct > 35
        ? `ETH is already ${pct(ethPct)} of your portfolio. Adding more would deepen concentration risk — I'd hold off and diversify instead.`
        : `ETH momentum is ${ctx.ethTrend.toLowerCase()}. At ${pct(ethPct)} of your portfolio, a modest increase is acceptable only if it stays under 35% total and you keep your stable buffer above 10%.`;
    return `${answer}\n\n${DISCLAIMER}`;
  }

  if (/(biggest|largest|main|top).*(risk|threat|problem)/.test(q) || /what.*risk/.test(q)) {
    return `Your biggest risks right now:\n\n1. Concentration — ${topToken(ctx)} accounts for ${pct(ctx.topAllocations[0]?.pct ?? 0)} of the portfolio.\n2. Liquidity protection — only ${pct(ctx.stablePct)} is in stable assets.\n3. Volatility — BTC trend is ${ctx.btcTrend.toLowerCase()} and broad sentiment is ${ctx.marketSentiment.toLowerCase()}, which feeds drawdown risk.\n\n${DISCLAIMER}`;
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

  if (/(market|btc|bitcoin|trend|sentiment)/.test(q)) {
    return `Market snapshot: BTC trend is ${ctx.btcTrend.toLowerCase()}, ETH is ${ctx.ethTrend.toLowerCase()}, and broad sentiment reads ${ctx.marketSentiment.toLowerCase()}.\n\nAgainst that backdrop, your portfolio at ${ctx.riskScore}/100 risk is positioned to benefit from a strong tape but is exposed if momentum rolls over.\n\n${DISCLAIMER}`;
  }

  if (/(hello|hi\b|hey|help|what can you)/.test(q)) {
    return `I'm Prorun — your crypto risk assistant. I can answer:\n\n- "How risky is my portfolio?"\n- "Should I increase my ETH allocation?"\n- "What are my biggest risks?"\n- "Explain my losses this month"\n- "How much liquidity should I hold?"\n\n${DISCLAIMER}`;
  }

  return `${pick([
    `Here's my read: with a risk score of ${ctx.riskScore}/100, ${pct(ctx.stablePct)} stable protection, and ${topToken(ctx)} leading at ${pct(ctx.topAllocations[0]?.pct ?? 0)}, the priority is balancing concentration and liquidity before chasing more upside.`,
    `Based on your data — ${topToken(ctx)} at ${pct(ctx.topAllocations[0]?.pct ?? 0)} and ${pct(ctx.stablePct)} stable reserves at ${ctx.riskScore}/100 risk — I'd focus on reducing concentration and keeping a 10-20% liquidity buffer.`,
  ])}\n\n${DISCLAIMER}`;
}

export { DISCLAIMER };