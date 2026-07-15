/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a9f6',
          500: '#0c8ce7',
          600: '#0071e3',
          700: '#0058b8',
          800: '#064a95',
          900: '#0b4078',
        },
        mirror: {
          dark: '#f5f5f7',
          darker: '#ffffff',
          purple: '#e8e8ed',
          purpleLight: '#f0f0f5',
          accent: '#0071e3',
          accentLight: '#4a9eff',
          accentDark: '#0058b8',
          gold: '#ff9500',
          goldLight: '#ffb340',
          cyan: '#32ade6',
          pink: '#ff2d55',
          lavender: '#af52de',
          gradientStart: '#f5f5f7',
          gradientMid: '#e8e8ed',
          gradientEnd: '#d1d1d6',
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-left': 'slideLeft 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'ring-pulse': 'ringPulse 1.5s ease-out infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'text-glow': 'textGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        ringPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(0, 113, 227, 0.4)' },
          '70%': { boxShadow: '0 0 0 12px rgba(0, 113, 227, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0, 113, 227, 0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        textGlow: {
          '0%, 100%': { textShadow: '0 0 10px rgba(0, 113, 227, 0.3)' },
          '50%': { textShadow: '0 0 20px rgba(0, 113, 227, 0.5)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0, 113, 227, 0.2)' },
          '50%': { boxShadow: '0 0 24px rgba(0, 113, 227, 0.35)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'mirror': '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'mirror-hover': '0 12px 40px rgba(0, 113, 227, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
        'glow-accent': '0 0 20px rgba(0, 113, 227, 0.15)',
        'glow-cyan': '0 0 20px rgba(50, 173, 230, 0.15)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'soft': '0 2px 12px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
