/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'trae-bg': '#0a0a0a',
        'trae-card': '#18181b',
        'trae-tag': '#27272a',
        'trae-tag-hover': '#3f3f46',
        'trae-border': '#27272a',
        'trae-border-strong': '#3f3f46',
        'trae-accent': '#22c55e',
        'trae-accent-deep': '#16a34a',
        'trae-gold': '#fbbf24',
        'trae-silver': '#a1a1aa',
        'trae-bronze': '#b45309',
        'trae-text': '#ffffff',
        'trae-text-secondary': '#a1a1aa',
        'trae-text-tertiary': '#d4d4d8',
        'trae-text-muted': '#71717a',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'trae-card': '16px',
        'trae-pill': '9999px',
        'trae-input': '8px',
      },
      maxWidth: {
        'trae-container': '1280px',
      },
      boxShadow: {
        'trae-glow': '0 0 24px rgba(34, 197, 94, 0.12)',
        'trae-glow-strong': '0 0 48px rgba(34, 197, 94, 0.2)',
      },
    },
  },
  plugins: [],
}
