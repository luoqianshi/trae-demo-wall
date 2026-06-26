/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', '"Microsoft YaHei"', '"Hiragino Sans GB"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#FFF5F5',
          100: '#FFE8E8',
          200: '#FFCCCC',
          300: '#FFA8A8',
          400: '#FF8787',
          500: '#FF6B6B',
          600: '#EE5A5A',
          700: '#D94848',
          800: '#C03939',
          900: '#A83232',
        },
        warm: {
          50: '#FFFBF5',
          100: '#FFF3E0',
          200: '#FFE8CC',
          300: '#FFD8A8',
          400: '#FFC078',
          500: '#FFA94D',
          600: '#F0983A',
          700: '#E0872E',
        },
        success: {
          50: '#F0FFF4',
          100: '#D4F5E0',
          400: '#51CF66',
          500: '#40C057',
          600: '#37B24D',
        },
        cream: {
          50: '#FFFDF7',
          100: '#FFF9EE',
          200: '#FFF3DC',
          300: '#FFE8C0',
        },
        rose: {
          50: '#FFF0F0',
          100: '#FFE0E0',
          200: '#FFC8C8',
          300: '#FFA8A8',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'xs': '0 1px 3px rgba(0,0,0,0.04)',
        'sm': '0 2px 8px rgba(0,0,0,0.06)',
        'soft': '0 8px 32px -8px rgba(0,0,0,0.08)',
        'warm': '0 8px 24px -4px rgba(255,107,107,0.15)',
        'glow': '0 0 20px -4px rgba(255,107,107,0.25)',
        'lift': '0 12px 40px -10px rgba(0,0,0,0.1)',
        'inner-soft': 'inset 0 2px 4px rgba(0,0,0,0.04)',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #FFF5F5 0%, #FFFAF0 50%, #F0FFF4 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #FFFBF5 100%)',
        'gradient-hero': 'linear-gradient(180deg, #FFF5F5 0%, #FFFBF5 40%, #F0FFF4 100%)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'bounce-soft': 'bounce-soft 2.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.02)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};
