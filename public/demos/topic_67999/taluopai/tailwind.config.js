/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        mystic: {
          dark: '#1a0a2e',
          deeper: '#0d0520',
          purple: '#7b2d8e',
          gold: '#d4a853',
          silver: '#c0c0d0',
          blue: '#0d1b3e',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Cormorant Garamond', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'star-twinkle': 'twinkle 3s ease-in-out infinite',
        'card-shuffle': 'shuffle 0.5s ease-in-out',
        'flip': 'flip 0.8s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'magic-spin': 'magicSpin 8s linear infinite',
      },
    },
  },
  plugins: [],
};