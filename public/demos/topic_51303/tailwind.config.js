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
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
          dark: "var(--color-primary-dark)",
        },
        success: {
          DEFAULT: "var(--state-success)",
          light: "var(--state-success-light)",
        },
        warning: {
          DEFAULT: "var(--state-warning)",
          light: "var(--state-warning-light)",
        },
        error: {
          DEFAULT: "var(--state-error)",
          light: "var(--state-error-light)",
        },
        info: {
          DEFAULT: "var(--state-info)",
          light: "var(--state-info-light)",
        },
        canvas: "var(--color-bg)",
        elevated: "var(--color-bg-elevated)",
        deep: "var(--color-bg-deep)",
        ink: {
          DEFAULT: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          placeholder: "var(--color-text-placeholder)",
        },
        rule: "var(--color-rule)",
      },
      fontFamily: {
        sans: ["'PingFang SC'", "'Microsoft YaHei'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
