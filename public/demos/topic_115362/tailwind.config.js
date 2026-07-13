/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 深色「开发者控制台 + 蓝图」配色
        ink: {
          950: "#070A0F",
          900: "#0E1116",
          850: "#131721",
          800: "#1A1F2B",
          700: "#242B3A",
          600: "#333C50",
          500: "#4A5468",
        },
        cyan: {
          glow: "#22D3EE",
        },
        amber: {
          accent: "#F59E0B",
        },
        emerald: {
          code: "#34D399",
        },
      },
      fontFamily: {
        sans: ['"HarmonyOS Sans SC"', '"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "monospace"],
        display: ['"Orbitron"', '"JetBrains Mono"', "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(34, 211, 238, 0.35)",
        "glow-sm": "0 0 12px rgba(34, 211, 238, 0.25)",
        panel: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "blueprint": "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)",
        "grid-fade": "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.08), transparent 60%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "slide-in": "slide-in 0.25s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(34, 211, 238, 0.25)" },
          "50%": { boxShadow: "0 0 24px rgba(34, 211, 238, 0.5)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
