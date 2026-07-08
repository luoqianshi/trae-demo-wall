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
        teal: {
          DEFAULT: "#0d7377",
          light: "#14a3a8",
          pale: "#e0f5f5",
        },
        mint: {
          DEFAULT: "#32b89a",
          glow: "rgba(50, 184, 154, 0.35)",
        },
        cream: "#faf8f3",
        warm: "#f5f0e8",
        ink: {
          DEFAULT: "#1a1a2e",
          mid: "#3d3d56",
          light: "#6b6b80",
        },
        warn: "#e8855a",
        danger: "#e0555a",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },
      borderRadius: {
        xl: "24px",
        lg: "14px",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
        "fade-in": "fadeIn 0.5s ease",
        "slide-up": "slideUp 0.4s ease",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
