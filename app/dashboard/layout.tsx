"use client";

import { useState } from "react";
import { Sidebar, Topbar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#06070b] text-ink">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 right-[-10%] h-[420px] w-[520px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-5%] h-[380px] w-[480px] rounded-full bg-lime-400/[0.04] blur-[120px]" />
      </div>

      <Sidebar
        open={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[272px] border-r border-white/10 bg-[#07080c]/95 backdrop-blur-2xl">
            <Sidebar mobile open onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className={collapsed ? "relative z-10 transition-[padding] duration-300 lg:pl-[76px]" : "relative z-10 transition-[padding] duration-300 lg:pl-[248px]"}>
        <Topbar onMenu={() => setMobileOpen(true)} onToggleCollapse={() => setCollapsed((c) => !c)} collapsed={collapsed} />
        <main className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}