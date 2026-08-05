"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, CornerDownLeft, Sparkles, Wallet } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { PortfolioGate } from "@/components/dashboard/portfolio-gate";
import { SplineScene } from "@/components/spline/spline-scene";
import { cn } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

const CONVERSATION_ID = "assistant";

const SUGGESTIONS = [
  "How risky is my portfolio?",
  "Should I increase my ETH allocation?",
  "What are my biggest risks?",
  "Explain my losses this month.",
  "How much liquidity should I hold?",
];

export default function AssistantPage() {
  const { portfolio, messagesFor, sendMessage, sendingMessage, resetConversation } = usePortfolio();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const messages = messagesFor(CONVERSATION_ID);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const submit = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || sendingMessage || thinking) return;
    setInput("");
    setThinking(true);
    try {
      await sendMessage(q, CONVERSATION_ID);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">AI Assistant</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Prorun Chat</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Ask about your risk, allocations, losses or market conditions — answers are grounded in your data.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => resetConversation(CONVERSATION_ID)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-faint transition hover:text-ink"
          >
            Clear conversation
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            <motion.div
              key="spline-processing"
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: thinking ? 1 : 0.3,
                height: thinking ? 168 : 72,
              }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <SplineScene variant="thinking" processing={thinking} className="h-full w-full" />
              </div>
            </motion.div>
          </AnimatePresence>

          <GlassCard className="flex h-[calc(100vh-220px)] min-h-[480px] flex-col overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/25 to-lime-400/10 text-emerald-300">
              <BrainCircuit size={16} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">Prorun Analyst</p>
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Online · context ready
              </p>
            </div>
          </div>

          <div className="scroll-slim flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && !thinking && (
              <div className="mx-auto max-w-md pt-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-lime-400/10 text-emerald-300">
                  <Sparkles size={24} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">Ask your portfolio anything</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {portfolio
                    ? "I can see your current holdings and risk profile. Try one of the prompts below."
                    : "Load a portfolio first so I can ground my answers in your real data."}
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <Message key={m.id} msg={m} index={i} />
            ))}

            {thinking && (
              <div className="flex items-start gap-2.5">
                <Avatar />
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/[0.06] p-3.5">
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 focus-within:border-emerald-400/40">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                placeholder="Ask about your portfolio…"
                className="max-h-32 w-full resize-none bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              <button
                onClick={() => submit()}
                disabled={!input.trim() || sendingMessage || thinking}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-400 to-lime-300 text-[#06130d] transition hover:brightness-110 disabled:opacity-40"
                aria-label="Send"
              >
                <CornerDownLeft size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-faint">
              Prorun AI provides analysis and education, not financial advice.
            </p>
          </div>
        </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Suggested prompts</p>
            <div className="mt-3 space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  disabled={!portfolio}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-left text-sm text-ink-muted transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </GlassCard>

          {!portfolio && (
            <GlassCard className="p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Wallet size={15} className="text-emerald-300" /> No portfolio loaded
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                Load a portfolio to unlock data-grounded answers.
              </p>
            </GlassCard>
          )}

          <GlassCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">How grounding works</p>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
              <li>• Reads your live portfolio snapshot</li>
              <li>• References your latest risk report</li>
              <li>• Blends in current market sentiment</li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-300 text-[#06130d]">
      <BrainCircuit size={15} />
    </span>
  );
}

function Message({ msg, index }: { msg: ChatMessage; index: number }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-start gap-2.5", isUser && "flex-row-reverse")}
    >
      {!isUser && <Avatar />}
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-gradient-to-r from-emerald-400 to-lime-300 font-medium text-[#06130d]"
            : "rounded-bl-sm border border-white/10 bg-white/[0.04] text-ink-muted",
        )}
      >
        {msg.content}
        <div className={cn("mt-1.5 text-[10px]", isUser ? "text-[#06130d]/60" : "text-ink-faint")}>
          {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </motion.div>
  );
}