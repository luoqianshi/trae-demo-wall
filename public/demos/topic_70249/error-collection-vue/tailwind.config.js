/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488',
        'primary-light': '#ccfbf1',
        accent: '#f59e0b',
        'accent-light': '#fef3c7',
      },
    },
  },
  plugins: [],
}
