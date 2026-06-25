/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bronze: '#d97706',
        qingtong: '#0d9488',
        xuanzhi: '#111827',
        xuanhuang: '#1f2937',
        songyan: '#0f766e',
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
      },
    },
  },
  plugins: [],
}
