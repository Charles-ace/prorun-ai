import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0b0f",
          raised: "#0f1119",
          card: "#12141d",
        },
        ink: {
          DEFAULT: "#e7ebf3",
          muted: "#9aa3b8",
          faint: "#5b6478",
        },
        accent: {
          DEFAULT: "#34d399",
          soft: "#a3e635",
          deepp: "#10b981",
        },
        terminal: {
          bg: "#0b0e14",
          panel: "#10141d",
          border: "rgba(255,255,255,0.07)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(52, 211, 153, 0.45)",
        card: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 50px -30px rgba(0,0,0,0.9)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;