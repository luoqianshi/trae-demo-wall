/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 高温色系 — 暖橙红
        'heat-low': '#f59e0b',
        'heat-medium': '#f97316',
        'heat-high': '#ef4444',
        'heat-extreme': '#dc2626',
        // 低温色系 — 清蓝青
        'cold-low': '#38bdf8',
        'cold-medium': '#0ea5e9',
        'cold-high': '#0284c7',
        'cold-extreme': '#0369a1',
        // 安全/正常
        'safe': '#10b981',
        'safe-light': '#86efac',
        // 温馨主色调
        'warm': '#f0a060',
        'warm-light': '#fbbf24',
        'warm-dark': '#d97706',
        // 背景 — 使用 CSS 变量
        'app-bg': 'rgb(var(--color-app-bg) / <alpha-value>)',
        'card-bg': 'rgb(var(--color-card-bg) / <alpha-value>)',
        'card-bg-light': 'rgb(var(--color-card-bg-light) / <alpha-value>)',
        'card-bg-hover': 'rgb(var(--color-card-bg-hover) / <alpha-value>)',
        // 文字色
        'ink': 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--color-ink-faint) / <alpha-value>)',
        // 边框
        'rule': 'rgb(var(--color-rule) / <alpha-value>)',
      },
      fontSize: {
        'xxs': '0.625rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(240, 160, 96, 0.12)',
        'card': '0 2px 16px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(240, 160, 96, 0.2)',
      },
    },
  },
  plugins: [],
}
