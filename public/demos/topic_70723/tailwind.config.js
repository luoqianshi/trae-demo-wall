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
        brand: {
          50: "#eef3ff",
          100: "#dbe5ff",
          200: "#bccfff",
          300: "#8eadff",
          400: "#5b80ff",
          500: "#3c63ff",
          600: "#2a48e8",
          700: "#2236c4",
          800: "#1f2e9c",
          900: "#1d2870",
        },
        mint: {
          50: "#effbf8",
          100: "#d7f5ee",
          200: "#b0ebde",
          300: "#7cdcc8",
          400: "#4fd2c2",
          500: "#2bb6a5",
          600: "#1f9089",
          700: "#1c726f",
          800: "#1a5b5a",
          900: "#184b4b",
        },
        amber: {
          50: "#fffbeb",
          100: "#fff3c4",
          200: "#ffe588",
          300: "#ffd76a",
          400: "#ffc133",
          500: "#f0a800",
        },
        ink: {
          50: "#f6f8fc",
          100: "#eef2f9",
          200: "#dde4f0",
          300: "#b7c2d8",
          400: "#7d8aa6",
          500: "#5d6b84",
          600: "#445067",
          700: "#2e3849",
          800: "#1f2937",
          900: "#162033",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        '4xl': '28px',
        '5xl': '34px',
      },
      boxShadow: {
        glow: "0 24px 60px rgba(37, 55, 97, 0.14)",
        'glow-brand': "0 18px 32px rgba(60, 99, 255, 0.26)",
        'glow-mint': "0 18px 32px rgba(79, 210, 194, 0.30)",
        soft: "0 10px 40px rgba(47, 74, 135, 0.1)",
      },
      animation: {
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease-out both',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
