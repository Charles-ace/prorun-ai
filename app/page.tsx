"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  LineChart,
  Lock,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/dashboard/sidebar";
import { RiskGauge } from "@/components/ui/risk-gauge";

const features = [
  {
    icon: Activity,
    title: "Portfolio Risk Analysis",
    text: "Quantified risk scores, concentration, volatility and drawdown scenarios — computed from your real holdings.",
    tag: "Risk Scanner",
  },
  {
    icon: LineChart,
    title: "Market Intelligence",
    text: "A daily AI market brief tracking BTC & ETH momentum, sentiment, macro events and risk alert.",
    tag: "Daily Brief",
  },
  {
    icon: ScrollText,
    title: "Trading Psychology",
    text: "Upload your history and let AI surface revenge trading, overtrading and sizing tilt before they cost you.",
    tag: "Trading Journal",
  },
  {
    icon: BrainCircuit,
    title: "AI Crypto Assistant",
    text: "Ask anything about your risk, allocation and losses. Answers grounded in your actual portfolio data.",
    tag: "AI Chat",
  },
];

const steps = [
  { n: "01", title: "Connect or enter holdings", text: "Wallet address, exchange portfolio or manual positions — in seconds." },
  { n: "02", title: "AI analyzes your risk", text: "Concentration, volatility, protection and drawdown are scored instantly." },
  { n: "03", title: "Act on clear intelligence", text: "Get actionable recommendations and a personal analyst you can talk to." },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06070b] text-ink">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
        <div className="absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/[0.09] blur-[130px]" />
        <div className="absolute top-1/3 right-[-10%] h-[360px] w-[440px] rounded-full bg-lime-400/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[460px] rounded-full bg-emerald-600/[0.05] blur-[120px]" />
      </div>

      {/* nav */}
      <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
          <a href="#features" className="transition hover:text-ink">Features</a>
          <a href="#how" className="transition hover:text-ink">How it works</a>
          <a href="#assistant" className="transition hover:text-ink">AI Assistant</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-ink-muted transition hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2 text-sm font-bold text-[#06130d] shadow-glow transition hover:brightness-110"
          >
            Launch App
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-14 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
            >
              <Sparkles size={13} />
              AI-powered crypto risk intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl"
            >
              Understand your crypto risk{" "}
              <span className="txt-gradient text-shadow-glow">before the market does.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mt-5 max-w-lg text-lg text-ink-muted"
            >
              AI-powered portfolio analysis and trading intelligence. Get a quantified
              risk score, market briefs, and a personal analyst that knows your positions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/dashboard/portfolio"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-6 py-3.5 text-sm font-bold text-[#06130d] shadow-glow transition hover:brightness-110"
              >
                Analyze Portfolio
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/dashboard/assistant"
                className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-ink backdrop-blur transition hover:border-emerald-400/30 hover:text-emerald-300"
              >
                <BrainCircuit size={16} />
                Try AI Assistant
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.34 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint"
            >
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> No account required</span>
              <span className="flex items-center gap-1.5"><Lock size={14} className="text-emerald-400" /> Read-only analysis</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-400" /> Live market pricing</span>
            </motion.div>
          </div>

          {/* mock dashboard */}
          <HeroPreview />
        </div>
      </section>

      {/* features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Everything you need</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            A complete AI risk department
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            From instantaneous risk scoring to behavioral trading analysis, Prorun AI turns
            raw holdings into decisions you can trust.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass glass-hover group p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-lime-400/10 text-emerald-300 transition group-hover:from-emerald-400/30">
                  <f.icon size={20} />
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="glass p-8 sm:p-10">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink">From holdings to clarity in three steps</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <span className="txt-gradient text-4xl font-extrabold">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* assistant */}
      <section id="assistant" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Always-on analyst</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Ask your portfolio questions. Get honest answers.
            </h2>
            <p className="mt-4 text-ink-muted">
              Prorun AI grounds every reply in your actual allocations, risk score and live
              market conditions — never generic advice.
            </p>
            <div className="mt-6 space-y-3">
              {["How risky is my portfolio right now?", "Should I increase my ETH allocation?", "What are my biggest risks?", "Explain my losses this month."].map((q, i) => (
                <motion.div
                  key={q}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-muted"
                >
                  <BrainCircuit size={16} className="text-emerald-400" />
                  {q}
                </motion.div>
              ))}
            </div>
            <Link
              href="/dashboard/assistant"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-5 py-3 text-sm font-bold text-[#06130d] transition hover:brightness-110"
            >
              Open AI Assistant <ArrowRight size={16} />
            </Link>
          </div>
          <ChatMock />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass relative overflow-hidden p-10 sm:p-14"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent" />
          <Zap size={28} className="mx-auto text-emerald-300" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Know your risk before the market moves.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-muted">
            Join the demo — build a portfolio and get your AI risk report in seconds.
          </p>
          <Link
            href="/dashboard"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-7 py-3.5 text-sm font-bold text-[#06130d] shadow-glow transition hover:brightness-110"
          >
            Analyze Portfolio <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-ink-faint sm:flex-row">
          <Logo />
          <p>Prorun AI provides analysis and education, not financial advice.</p>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="/dashboard/risk" className="hover:text-ink">Risk Report</a>
            <span>© 2026 Prorun AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-lime-400/10 blur-2xl" />
      <div className="glass animate-float relative p-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            Prorun Dashboard
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="glass p-4">
            <p className="text-[10px] uppercase tracking-wider text-ink-faint">Portfolio Value</p>
            <p className="tabular mt-1 text-lg font-bold text-ink">$48,230</p>
            <p className="tabular text-[11px] text-emerald-300">+6.4% 24h</p>
          </div>
          <div className="glass flex flex-col items-center justify-center p-2">
            <RiskGauge value={72} size={104} />
          </div>
        </div>
        <div className="mt-3 space-y-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-rose-300">
            <Activity size={14} /> Main risk detected
          </p>
          <p className="text-xs text-ink-muted">
            58% ETH-related exposure · only 5% stable protection. High concentration risk.
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <BrainCircuit size={16} className="text-emerald-300" />
          <p className="text-[11px] text-ink-muted">
            <span className="text-ink">AI:</span> Reduce concentrated positions & rebuild liquidity before volatility returns.
          </p>
        </div>
      </div>
      <div className="glass animate-float absolute -right-4 -top-6 hidden p-3 sm:block" style={{ animationDelay: "1.2s" }}>
        <div className="flex items-center gap-2 text-xs">
          <Wallet size={14} className="text-emerald-300" />
          <span className="text-ink-muted">Wallet synced</span>
        </div>
      </div>
    </motion.div>
  );
}

function ChatMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="glass relative p-5"
    >
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-medium text-[#06130d]">
            Should I increase my ETH allocation?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-ink-muted">
            ETH is only <span className="text-ink">12%</span> of your portfolio. A modest increase is fine — but keep it
            under 35% and hold your stable buffer above 10% given current vol.
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-medium text-[#06130d]">
            Explain my losses this month.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-ink-muted">
            Your losses cluster after 2-3 consecutive losers — a tilt signal. Shrink size 50% after two losses to protect
            the account.
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <input
          readOnly
          placeholder="Ask your portfolio anything…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <ArrowRight size={16} className="text-emerald-300" />
      </div>
    </motion.div>
  );
}