/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        // 苹果红主色调
        apple: {
          50: "#FFF5F4",
          100: "#FFE8E6",
          200: "#FFCDCA",
          300: "#FFA6A0",
          400: "#FF6F68",
          500: "#FF3B30",
          600: "#E22822",
          700: "#B71C18",
          800: "#8A1612",
          900: "#5A0E0C",
        },
        // 中性灰（苹果风格）
        gray: {
          50: "#FAFAFA",
          100: "#F5F5F7",
          200: "#E8E8ED",
          300: "#D2D2D7",
          400: "#A1A1A6",
          500: "#86868B",
          600: "#6E6E73",
          700: "#48484A",
          800: "#2C2C2E",
          900: "#1D1D1F",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.04)",
        "soft-lg": "0 4px 30px rgba(0, 0, 0, 0.06)",
        "soft-xl": "0 10px 50px rgba(0, 0, 0, 0.08)",
        card: "0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 4px 20px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
