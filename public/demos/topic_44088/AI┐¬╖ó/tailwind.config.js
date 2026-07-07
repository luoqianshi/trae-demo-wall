/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2.5rem",
        xl: "4rem",
      },
    },
    extend: {
      colors: {
        ink: {
          50: "#F4F6FB",
          100: "#E6EAF3",
          200: "#C7D0E3",
          300: "#9AAACB",
          400: "#6B7FA8",
          500: "#475C85",
          600: "#2F446B",
          700: "#1B2A4E",
          800: "#141E38",
          900: "#0C1424",
          950: "#070B16",
        },
        paper: {
          50: "#FBF9F3",
          100: "#F5F1E8",
          200: "#EDE6D3",
          300: "#E0D5B8",
          400: "#C9B98C",
          500: "#B09E6A",
        },
        highlight: {
          DEFAULT: "#FFE066",
          soft: "#FFF3B0",
          deep: "#E6C700",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          soft: "#FFB3B3",
          deep: "#D94F4F",
        },
        mint: {
          DEFAULT: "#7FD8A8",
          soft: "#C5EED4",
          deep: "#3FAE6F",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', '"Noto Serif SC"', '"Songti SC"', '"SimSun"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', '"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
      boxShadow: {
        paper: "0 1px 2px rgba(27,42,78,0.04), 0 4px 16px rgba(27,42,78,0.06)",
        card: "0 2px 4px rgba(27,42,78,0.05), 0 12px 32px rgba(27,42,78,0.08)",
        lift: "0 8px 24px rgba(27,42,78,0.12), 0 24px 48px rgba(27,42,78,0.10)",
        ink: "0 0 0 1px rgba(27,42,78,0.08), 0 2px 8px rgba(27,42,78,0.10)",
        glow: "0 0 0 4px rgba(255,224,102,0.35)",
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(circle at 20% 30%, rgba(176,158,106,0.05) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(27,42,78,0.04) 0%, transparent 45%)",
        "ink-line":
          "repeating-linear-gradient(180deg, transparent 0px, transparent 31px, rgba(27,42,78,0.06) 32px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "shimmer": "shimmer 2s linear infinite",
        "scan": "scan 2.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        "float": "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
