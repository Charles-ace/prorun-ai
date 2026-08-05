"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, RefreshCcw, ShieldCheck, Trash2, User } from "lucide-react";
import { usePortfolio } from "@/components/providers/portfolio-provider";
import { GlassCard, CardHeader } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { PortfolioGate } from "@/components/dashboard/portfolio-gate";

export default function SettingsPage() {
  const { portfolio, clearPortfolio } = usePortfolio();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const resetAll = () => {
    clearPortfolio();
    if (typeof window !== "undefined") {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("prorun."))
        .forEach((k) => window.localStorage.removeItem(k));
    }
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Settings</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Workspace Settings</h2>
        <p className="mt-1 text-sm text-ink-muted">Preferences, data and AI provider configuration.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <CardHeader title="Profile" subtitle="Display preferences" icon={<User size={15} />} />
          <label className="text-xs font-medium uppercase tracking-wider text-ink-muted">Display name</label>
          <div className="mt-1.5 flex gap-2">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              placeholder="Trader"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-emerald-400/40 focus:outline-none"
            />
            <button
              onClick={() => setSaved(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 text-sm font-bold text-[#06130d] transition hover:brightness-110"
            >
              Save
            </button>
          </div>
          {saved && <p className="mt-2 text-xs text-emerald-300">Saved.</p>}
          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <p className="text-xs font-semibold text-ink">Current portfolio</p>
            <p className="mt-1 text-xs text-ink-muted">
              {portfolio ? portfolio.label : "None loaded — demo runs without an account."}
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader title="AI Provider" subtitle="Optional LLM enhancement" icon={<KeyRound size={15} />} />
          <p className="text-sm leading-relaxed text-ink-muted">
            Prorun works fully offline with its built-in analysis engine. Add an OpenAI-compatible key in{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">.env.local</code>{" "}
            to generate narrative summaries with a hosted model.
          </p>
          <div className="mt-4 space-y-2">
            <Row k="AI_API_KEY" v={process.env.NEXT_PUBLIC_AI_API_KEY ? "configured" : "not set"} />
            <Row k="AI_MODEL" v={process.env.AI_MODEL || "gpt-4o-mini"} />
            <Row k="Market source" v="CoinGecko (free) + offline fallback" />
            <Row k="Database" v="File-backed demo store · Postgres-ready" />
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-faint">
            <ShieldCheck size={13} className="text-emerald-400" /> Keys stay server-side via environment variables.
          </p>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <CardHeader title="Demo Data" subtitle="Manage stored state" icon={<RefreshCcw size={15} />} />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearPortfolio}
              disabled={!portfolio}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCcw size={15} /> Clear current portfolio
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:brightness-110"
            >
              <Trash2 size={15} /> Reset all demo data
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader title="About" subtitle="Prorun AI · v1.0" icon={<ShieldCheck size={15} />} />
          <p className="text-sm leading-relaxed text-ink-muted">
            Prorun AI is an AI crypto risk analyst agent built for the OKX.AI submission. It combines
            quantitative risk scoring, market intelligence and behavioral analysis with a conversational
            assistant.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="accent">React</Badge>
            <Badge tone="accent">Next.js</Badge>
            <Badge tone="accent">TypeScript</Badge>
            <Badge tone="accent">Tailwind</Badge>
            <Badge tone="accent">Recharts</Badge>
            <Badge tone="accent">Framer Motion</Badge>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <code className="font-mono text-xs text-ink-muted">{k}</code>
      <span className="text-xs text-ink-faint">{v}</span>
    </div>
  );
}