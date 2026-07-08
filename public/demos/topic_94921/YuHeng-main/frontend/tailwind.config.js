/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0F172A',
          panel: 'rgba(30, 41, 59, 0.6)',
          border: 'rgba(56, 189, 248, 0.2)',
          cyan: '#22D3EE',
          green: '#4ADE80',
          red: '#F87171',
          amber: '#FBBF24',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(34, 211, 238, 0.15)',
        'glow-green': '0 0 24px rgba(74, 222, 128, 0.35)',
        'glow-red': '0 0 28px rgba(248, 113, 113, 0.45)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-red': 'flashRed 0.6s ease-in-out',
      },
      keyframes: {
        flashRed: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(248, 113, 113, 0)' },
          '50%': { boxShadow: '0 0 30px rgba(248, 113, 113, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
