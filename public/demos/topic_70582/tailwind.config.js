/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f5fa',
          100: '#dae6f0',
          200: '#b6cde0',
          300: '#89aacb',
          400: '#5b84b0',
          500: '#3d6899',
          600: '#2e5280',
          700: '#1e3a5f',
          800: '#1a2f4c',
          900: '#17263d',
        },
        accent: {
          50: '#fff3ed',
          100: '#ffe2d4',
          200: '#ffc0a0',
          300: '#ff9b6b',
          400: '#ff7d45',
          500: '#ff6b35',
          600: '#f05015',
          700: '#c93e0e',
          800: '#a0330f',
          900: '#822d12',
        },
        tealish: {
          400: '#4ecdc4',
          500: '#3db8b0',
          600: '#2fa39b',
        },
        gold: {
          300: '#ffe66d',
          400: '#ffd93d',
          500: '#f5c518',
        },
        cream: '#faf9f7',
        ink: '#2d3436',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-heart': 'pulseHeart 0.6s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseHeart: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 40px rgba(30, 58, 95, 0.12)',
        'glow': '0 0 30px rgba(255, 107, 53, 0.3)',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #1e3a5f 0%, #2e5280 50%, #3d6899 100%)',
        'gradient-accent': 'linear-gradient(135deg, #ff6b35 0%, #ff9b6b 100%)',
        'gradient-teal': 'linear-gradient(135deg, #4ecdc4 0%, #6ee7de 100%)',
      },
    },
  },
  plugins: [],
};
