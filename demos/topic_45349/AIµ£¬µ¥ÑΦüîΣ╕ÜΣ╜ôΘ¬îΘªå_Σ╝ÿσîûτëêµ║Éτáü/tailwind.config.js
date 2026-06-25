/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        // 深空背景
        space: {
          900: "#05070f",
          800: "#0a0e1a",
          700: "#0f1424",
          600: "#161c33",
        },
        // 电光青
        neon: {
          cyan: "#00f0ff",
          blue: "#0091ff",
          magenta: "#ff2e88",
          pink: "#ff5cb4",
          gold: "#ffb800",
          green: "#39ff14",
        },
        // 文字
        ink: {
          100: "#f5f7ff",
          200: "#c8cfe3",
          300: "#8b95a7",
          400: "#5a6378",
        },
      },
      fontFamily: {
        display: ['"Orbitron"', "sans-serif"],
        sans: ['"Sora"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        "neon-cyan": "0 0 16px rgba(0, 240, 255, 0.25), 0 0 32px rgba(0, 240, 255, 0.1)",
        "neon-magenta": "0 0 16px rgba(255, 46, 136, 0.25), 0 0 32px rgba(255, 46, 136, 0.1)",
        "neon-gold": "0 0 16px rgba(255, 184, 0, 0.25), 0 0 32px rgba(255, 184, 0, 0.1)",
        glass: "0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      },
      backgroundImage: {
        "grid-horizon":
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(circle at 50% 0%, rgba(94,234,212,0.12), transparent 60%)",
      },
      animation: {
        "scan-line": "scan 3s linear infinite",
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "spin-slow": "spin 14s linear infinite",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "shimmer": "shimmer 2.5s linear infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", filter: "blur(40px)" },
          "50%": { opacity: "1", filter: "blur(50px)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
