import type { Metadata } from "next";
import { PortfolioProvider } from "@/components/providers/portfolio-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prorun AI — Crypto Risk Analyst",
  description:
    "Understand your crypto risk before the market does. AI-powered portfolio analysis and trading intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="scroll-slim bg-[#06070b]">
        <PortfolioProvider>{children}</PortfolioProvider>
      </body>
    </html>
  );
}