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
        warm: {
          bg: "#FFF4E0",
          light: "#FFFBF0",
          cream: "#FFF8EC",
        },
        corgi: {
          yellow: "#FFD66B",
          orange: "#FF9F43",
          brown: "#E8A857",
          dark: "#C68642",
          deep: "#A06B2E",
        },
        text: {
          primary: "#5D4E37",
          secondary: "#8B7355",
          light: "#B0A088",
        },
        berry: {
          pink: "#FF8FA3",
          rose: "#FF6B8A",
        },
        mint: {
          fresh: "#7DD3C0",
          deep: "#5BAE9C",
        },
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', '"Noto Sans SC"', "sans-serif"],
        body: ['"Noto Sans SC"', '"PingFang SC"', "sans-serif"],
      },
      borderRadius: {
        "puffy": "28px",
        "chubby": "20px",
      },
      boxShadow: {
        "soft": "0 4px 20px rgba(232, 168, 87, 0.15)",
        "puffy": "0 8px 30px rgba(232, 168, 87, 0.2)",
        "inner-soft": "inset 0 2px 8px rgba(232, 168, 87, 0.1)",
        "press": "0 2px 8px rgba(160, 107, 46, 0.2)",
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "bounce-soft": "bounceSoft 2s ease-in-out infinite",
        "wiggle": "wiggle 0.5s ease-in-out",
        "pop-in": "popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-up": "fadeUp 0.6s ease-out",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "celebrate": "celebrate 0.8s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-8px) scale(1.02)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
        popIn: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "0.6" },
          "50%": { transform: "scale(1.3) rotate(180deg)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-8px) rotate(-3deg)" },
          "75%": { transform: "translateX(8px) rotate(3deg)" },
        },
        celebrate: {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(10deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
