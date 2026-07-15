/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['Orbitron', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        space: {
          950: '#050816',
          900: '#0a0e27',
          800: '#111640',
        },
        neon: {
          cyan: '#00f5ff',
          magenta: '#ff00e5',
          amber: '#ffcc00',
        },
      },
      animation: {
        'titleGlow': 'titleGlow 3s ease-in-out infinite',
        'bgShift': 'bgShift 4s linear infinite',
        'fadeIn': 'fadeIn 0.4s ease both',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        titleGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 20px rgba(0, 245, 255, 0.3))' },
          '50%': { filter: 'drop-shadow(0 0 40px rgba(255, 0, 229, 0.4))' },
        },
        bgShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
