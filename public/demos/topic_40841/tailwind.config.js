/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          dark: 'var(--brand-dark)',
          light: 'var(--brand-light)',
          50: '#ECFDF5',
        },
        surface: {
          page: 'var(--bg-page)',
          card: 'var(--bg-card)',
          subtle: 'var(--bg-subtle)',
          hover: 'var(--bg-hover)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
          inverse: 'var(--text-inverse)',
        },
        success: { DEFAULT: 'var(--success)', bg: 'var(--success-bg)', light: '#ECFDF5' },
        warning: { DEFAULT: 'var(--warning)', bg: 'var(--warning-bg)', light: '#FFFBEB' },
        danger: { DEFAULT: 'var(--danger)', bg: 'var(--danger-bg)', light: '#FEF2F2' },
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)', light: '#EFF6FF' },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
        },
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        brand: 'var(--shadow-brand)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
