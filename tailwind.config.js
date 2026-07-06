/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'trae-bg': '#0a0f0d',
        'trae-bg-elevated': '#0f1714',
        'trae-surface': '#0f1714',
        'trae-card': '#131e1a',
        'trae-tag': '#1a2820',
        'trae-tag-hover': '#243530',
        'trae-border': '#1e2d27',
        'trae-border-strong': '#2a3f37',
        'trae-accent': '#10b981',
        'trae-accent-deep': '#047857',
        'trae-accent-glow': '#34d399',
        'trae-gold': '#fbbf24',
        'trae-silver': '#a1a1aa',
        'trae-bronze': '#b45309',
        'trae-text': '#e8f5ee',
        'trae-text-secondary': '#8fa89e',
        'trae-text-tertiary': '#b8c9c1',
        'trae-text-muted': '#6b8278',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        serif: ['Noto Serif SC', 'Fraunces', 'Georgia', 'serif'],
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
        'trae-glow': '0 0 24px rgba(16, 185, 129, 0.12)',
        'trae-glow-strong': '0 0 48px rgba(16, 185, 129, 0.2)',
        'trae-card-hover': '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(52, 211, 153, 0.15)',
      },
    },
  },
  plugins: [],
}
