/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mood-low': '#6366F1',
        'mood-tense': '#F97316',
        'mood-bright': '#FBBF24',
        'mood-soft': '#EC4899',
        'mood-calm': '#06B6D4',
        'mood-curious': '#10B981',
      },
      fontFamily: {
        'serif': ['Noto Serif SC', 'Songti SC', 'serif'],
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
