/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        forest: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        plant: {
          green: "#2D5A3D",
          dark: "#1A3A2A",
          medium: "#4A7C59",
          light: "#81B29A",
        },
        accent: {
          amber: "#D4A574",
          beige: "#F5E6D3",
          bronze: "#C4956A",
        },
        bg: {
          cream: "#FAF7F2",
          beige: "#F0EBE3",
        },
        emphasis: {
          coral: "#E07A5F",
          mint: "#81B29A",
        },
        text: {
          dark: "#1C1C1E",
          medium: "#6B6B6B",
          light: "#A1A1A6",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "-apple-system", "sans-serif"],
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        english: ['"Inter"', "SF Pro Display", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        tag: "20px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(45, 90, 61, 0.08)",
        cardHover: "0 12px 40px rgba(45, 90, 61, 0.15)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        leafFall: "leafFall 10s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        slideUp: "slideUp 0.5s ease-out forwards",
        ripple: "ripple 0.6s linear",
        rotate: "rotate 3s linear infinite",
        countUp: "countUp 2s ease-out forwards",
        starFly: "starFly 0.8s ease-out forwards",
        confetti: "confetti 1s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        leafFall: {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(360deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        starFly: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.5)", opacity: "1" },
          "100%": { transform: "scale(0) translateY(-100px)", opacity: "0" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100px) rotate(720deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
