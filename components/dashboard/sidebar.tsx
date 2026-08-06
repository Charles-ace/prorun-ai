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
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  ScrollText,
  Settings,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/format";
import { motion } from "framer-motion";
import { LogoMark } from "@/components/brand/logo-mark";
import { WalletConnectButton } from "@/components/wallet/wallet-connect";

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
    <div className="flex items-center gap-2.5">
      <LogoMark size={36} className={compact ? "scale-90" : ""} />
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

export function Sidebar({
  open,
  onClose,
  mobile,
  collapsed,
  onToggleCollapse,
}: {
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isCollapsed = !mobile && !!collapsed;

  const content = (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-white/[0.06]", isCollapsed ? "justify-center px-0" : "justify-between px-5")}>
        <Link href="/">
          {isCollapsed ? <LogoMark size={32} /> : <Logo />}
        </Link>
        {mobile && (
          <button onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1 overflow-y-auto scroll-slim py-4", isCollapsed ? "px-2" : "px-3")}>
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
              title={item.label}
              aria-label={item.label}
              className={cn(
                "group relative flex w-full items-center rounded-xl text-sm font-medium transition-colors",
                isCollapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5",
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
              <span className={cn("relative z-10 flex items-center", !isCollapsed && "gap-3")}>
                <item.icon size={18} strokeWidth={activeOnHref ? 2.3 : 1.8} />
                {!isCollapsed && item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-ink-muted transition hover:text-ink"
          >
            <PanelRightOpen size={16} />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="glass flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-lime-400/10 text-emerald-300">
                <BarChart3 size={16} />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-ink">OKX.AI Hackathon</p>
                <p className="text-[10px] text-ink-muted">Submission build · v1.0</p>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-[11px] font-medium text-ink-muted transition hover:text-ink"
            >
              <PanelLeftClose size={14} /> Collapse
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (mobile) return content;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-white/[0.06] bg-[#07080c]/85 backdrop-blur-2xl transition-[width] duration-300 lg:block",
        isCollapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      {content}
    </aside>
  );
}

export function Topbar({
  onMenu,
  onToggleCollapse,
  collapsed,
}: {
  onMenu: () => void;
  onToggleCollapse?: () => void;
  collapsed?: boolean;
}) {
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
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-lg border border-white/10 p-2 text-ink-muted transition hover:border-emerald-400/30 hover:text-emerald-300 lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
        <div>
          <h1 className="text-base font-semibold tracking-tight text-ink">{current?.label ?? "Dashboard"}</h1>
          <p className="hidden text-xs text-ink-faint sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <WalletConnectButton />
        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink">
          <Activity size={14} className="text-emerald-400" />
          <span className="hidden sm:inline">Markets</span>
          <span className="tabular text-emerald-300">live</span>
        </button>
      </div>
    </header>
  );
}