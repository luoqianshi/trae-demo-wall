/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: '#00D4AA',
        secondary: '#FF8C42',
        dark: {
          bg: '#0B1120',
          surface: '#131B2E',
          card: '#1A2540',
        },
        ink: '#E8ECF4',
        muted: '#7B8BA8',
        rule: '#253354',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'PingFang SC',
          'Microsoft YaHei',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}