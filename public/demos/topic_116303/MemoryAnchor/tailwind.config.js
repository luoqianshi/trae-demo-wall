/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/shared/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Brand Primary Colors (from colors_and_type.css)
        primary: {
          50: '#f0eefb',
          100: '#e0dcf7',
          200: '#c5bdef',
          300: '#a599e5',
          400: '#8b78d9',
          500: '#6c5ce7',
          600: '#5a45d6',
          700: '#4b35b8',
          800: '#3d2c93',
          900: '#342674',
          950: '#1e1352',
          accent: '#6366f1',
          'accent-light': '#818cf8'
        },

        // Neutral Palette
        neutral: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b'
        },

        // Background Colors
        bg: {
          page: '#fafaff',
          surface: '#ffffff',
          'surface-elevated': '#ffffff',
          sunken: '#f4f4f5',
          sidebar: '#1e1b2e',
          'sidebar-hover': '#2a2640',
          'sidebar-active': '#342f4f'
        },

        // Text Colors
        text: {
          primary: '#18181b',
          secondary: '#52525b',
          tertiary: '#a1a1aa',
          inverse: '#ffffff',
          brand: '#6c5ce7'
        },

        // Border Colors
        border: {
          default: '#e4e4e7',
          strong: '#d4d4d8',
          brand: '#6c5ce7'
        },

        // State Colors
        state: {
          success: '#22c55e',
          'success-bg': '#f0fdf4',
          warning: '#f59e0b',
          'warning-bg': '#fffbeb',
          error: '#ef4444',
          'error-bg': '#fef2f2',
          info: '#3b82f6',
          'info-bg': '#eff6ff'
        }
      },

      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px'
      },

      fontFamily: {
        display: ['Inter', 'Noto Sans SC', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'Noto Sans SC', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },

      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },

      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },

      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em'
      },

      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px'
      },

      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.04)',
        md: '0 4px 12px rgba(0, 0, 0, 0.05)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.06)',
        float: '0 12px 36px rgba(0, 0, 0, 0.08)'
      },

      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6c5ce7 0%, #6366f1 50%, #818cf8 100%)',
        'gradient-brand-subtle': 'linear-gradient(135deg, #f0eefb 0%, #e8e6ff 100%)',
        'gradient-surface': 'linear-gradient(180deg, #fafaff 0%, #f5f3ff 100%)'
      }
    }
  },
  plugins: []
}