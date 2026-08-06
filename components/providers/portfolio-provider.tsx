"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ChatMessage,
  MarketBrief,
  Portfolio,
  PsychologyReport,
  RiskReport,
  Trade,
} from "@/lib/types";
import { analyzePortfolio } from "@/lib/analysis-engine";
import { analyzeTrading } from "@/lib/psychology";
import { buildMarketBriefFor, buildPerformanceCurve } from "@/lib/sample-data";
import { uid } from "@/lib/format";

interface PortfolioState {
  portfolio: Portfolio | null;
  riskReport: RiskReport | null;
  marketBrief: MarketBrief | null;
  psychology: PsychologyReport | null;
  conversations: Record<string, ChatMessage[]>;
  analyzing: boolean;
  generatingMarket: boolean;
  generatingPsychology: boolean;
  sendingMessage: boolean;
  setPortfolio: (p: Portfolio) => void;
  clearPortfolio: () => void;
  runAnalysis: (portfolio?: Portfolio) => Promise<RiskReport>;
  ensureMarket: () => Promise<MarketBrief>;
  runPsychology: (trades: Trade[]) => Promise<PsychologyReport>;
  sendMessage: (question: string, conversationId: string) => Promise<string>;
  messagesFor: (id: string) => ChatMessage[];
  resetConversation: (id: string) => void;
  performance: () => { date: string; value: number }[];
  portfolioChange24h: () => number;
}

const Ctx = createContext<PortfolioState | null>(null);

const KEYS = {
  portfolio: "prorun.portfolio.v1",
  report: "prorun.riskReport.v1",
  psych: "prorun.psychology.v1",
  conv: "prorun.conversations.v1",
};

function load<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable */
  }
}

async function post<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolioState] = useState<Portfolio | null>(() => load(KEYS.portfolio));
  const [riskReport, setRiskReport] = useState<RiskReport | null>(() => load(KEYS.report));
  const [marketBrief, setMarketBrief] = useState<MarketBrief | null>(null);
  const [psychology, setPsychology] = useState<PsychologyReport | null>(() => load(KEYS.psych));
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(
    () => load(KEYS.conv) ?? {},
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingMarket, setGeneratingMarket] = useState(false);
  const [generatingPsychology, setGeneratingPsychology] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [walletInfo] = useState<{ address: string; chainId: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("prorun.wallet.v1");
      if (raw) {
        const w = JSON.parse(raw) as { address?: string; chainId?: number };
        return w.address && w.chainId ? { address: w.address, chainId: w.chainId } : null;
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  useEffect(() => {
    if (portfolio) save(KEYS.portfolio, portfolio);
  }, [portfolio]);
  useEffect(() => {
    if (riskReport) save(KEYS.report, riskReport);
  }, [riskReport]);
  useEffect(() => {
    if (psychology) save(KEYS.psych, psychology);
  }, [psychology]);
  useEffect(() => {
    save(KEYS.conv, conversations);
  }, [conversations]);

  const setPortfolio = useCallback((p: Portfolio) => {
    setPortfolioState(p);
    setRiskReport(null);
  }, []);

  const clearPortfolio = useCallback(() => {
    setPortfolioState(null);
    setRiskReport(null);
  }, []);

  const runAnalysis = useCallback(
    async (portfolioArg?: Portfolio) => {
      const target = portfolioArg ?? portfolio;
      if (!target) throw new Error("no portfolio");
      setAnalyzing(true);
      try {
        const server = await post<RiskReport>("/api/analyze", {
          portfolio: target,
        });
        const result = server ?? analyzePortfolio(target);
        setRiskReport(result);
        return result;
      } finally {
        setAnalyzing(false);
      }
    },
    [portfolio],
  );

  const ensureMarket = useCallback(async () => {
    if (marketBrief) return marketBrief;
    setGeneratingMarket(true);
    try {
      const server = await fetch("/api/market").then((r) => (r.ok ? r.json() : null));
      const result = server ?? (await buildMarketBriefFor());
      setMarketBrief(result);
      return result;
    } finally {
      setGeneratingMarket(false);
    }
  }, [marketBrief]);

  const runPsychology = useCallback(async (trades: Trade[]) => {
    setGeneratingPsychology(true);
    try {
      const server = await post<PsychologyReport>("/api/psychology", { trades });
      const result = server ?? analyzeTrading(trades);
      setPsychology(result);
      return result;
    } finally {
      setGeneratingPsychology(false);
    }
  }, []);

  const portfolioChange24h = useCallback(() => {
    if (!portfolio) return 0;
    return portfolio.assets.reduce(
      (s, a) => s + a.allocation * (a.change24h / 100),
      0,
    ) * 100;
  }, [portfolio]);

  const performance = useCallback(() => {
    if (!portfolio) return [];
    return buildPerformanceCurve(portfolio, 30);
  }, [portfolio]);

  const contextPayload = useMemo(() => {
    if (!portfolio) return null;
    return {
      portfolioValue: portfolio.totalValue,
      riskScore: riskReport?.score ?? analyzePortfolio(portfolio).score,
      topAllocations: portfolio.assets.slice(0, 5).map((a) => ({ symbol: a.symbol, pct: a.allocation })),
      stablePct: portfolio.assets.filter((a) => a.stable).reduce((s, a) => s + a.allocation, 0),
      portfolioChange24h: portfolioChange24h(),
      marketSentiment: marketBrief?.sentiment.label ?? "Neutral",
      btcTrend: marketBrief?.btc.trend ?? "Neutral",
      ethTrend: marketBrief?.eth.trend ?? "Neutral",
      reportSummary: riskReport?.summary,
      portfolio,
      wallet: walletInfo,
    };
  }, [portfolio, riskReport, marketBrief, portfolioChange24h, walletInfo]);

  const messagesFor = useCallback(
    (id: string) => conversations[id] ?? [],
    [conversations],
  );

  const resetConversation = useCallback((id: string) => {
    setConversations((prev) => ({ ...prev, [id]: [] }));
  }, []);

  const sendMessage = useCallback(
    async (question: string, conversationId: string) => {
      if (!contextPayload) return "Load a portfolio first so I can ground my answers in your data.";
      setSendingMessage(true);
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      };
      const history = messagesFor(conversationId);
      setConversations((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), userMsg],
      }));
      try {
        const server = await post<{ reply: string; toolCalls?: string[] }>("/api/chat", {
          question,
          context: contextPayload,
          history,
        });
        const reply = server?.reply ?? "";
        const msg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
          toolCalls: server?.toolCalls?.length ? server.toolCalls : undefined,
        };
        setConversations((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] ?? []), msg],
        }));
        return reply;
      } finally {
        setSendingMessage(false);
      }
    },
    [contextPayload, messagesFor],
  );

  const value: PortfolioState = {
    portfolio,
    riskReport,
    marketBrief,
    psychology,
    conversations,
    analyzing,
    generatingMarket,
    generatingPsychology,
    sendingMessage,
    setPortfolio,
    clearPortfolio,
    runAnalysis,
    ensureMarket,
    runPsychology,
    sendMessage,
    messagesFor,
    resetConversation,
    performance,
    portfolioChange24h,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}