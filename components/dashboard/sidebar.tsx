"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  LayoutDashboard,
  LineChart,
  Menu,
  ScrollText,
  Settings,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/format";
import { motion } from "framer-motion";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/dashboard/risk", label: "Risk Analysis", icon: Activity },
  { href: "/dashboard/market", label: "Market Intelligence", icon: LineChart },
  { href: "/dashboard/journal", label: "Trading Journal", icon: ScrollText },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: BrainCircuit },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-300 shadow-glow">
        <Zap size={20} className="text-[#06130d]" strokeWidth={2.6} />
      </div>
      {!compact && (
        <div className="leading-none">
          <span className="text-[15px] font-bold tracking-tight text-ink">
            Prorun<span className="txt-gradient"> AI</span>
          </span>
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-ink-faint">
            Risk Analyst
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ open, onClose, mobile }: { open: boolean; onClose: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
        <Link href="/">
          <Logo />
        </Link>
        {mobile && (
          <button onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scroll-slim px-3 py-4">
        {NAV.map((item) => {
          const activeOnHref = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                onClose();
              }}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                activeOnHref ? "text-emerald-300" : "text-ink-muted hover:text-ink",
              )}
            >
              {activeOnHref && (
                <motion.span
                  layoutId={mobile ? "mb-sidebar-ind" : "sidebar-ind"}
                  className="absolute inset-0 rounded-xl bg-emerald-400/[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <item.icon size={18} strokeWidth={activeOnHref ? 2.3 : 1.8} />
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="glass flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-lime-400/10 text-emerald-300">
            <BarChart3 size={16} />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-ink">OKX.AI Hackathon</p>
            <p className="text-[10px] text-ink-muted">Submission build · v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (mobile) return content;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/[0.06] bg-[#07080c]/85 backdrop-blur-2xl lg:block">
      {content}
    </aside>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const current = NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#06070b]/85 px-5 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-lg border border-white/10 p-2 text-ink-muted hover:text-ink lg:hidden"
          aria-label="Menu"
        >
          <Menu size={16} />
        </button>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-ink">{current?.label ?? "Dashboard"}</h1>
          <p className="hidden text-xs text-ink-faint sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink">
          <Activity size={14} className="text-emerald-400" />
          <span className="hidden sm:inline">Markets</span>
          <span className="tabular text-emerald-300">live</span>
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-300 text-sm font-bold text-[#06130d]">
          P
        </div>
      </div>
    </header>
  );
}