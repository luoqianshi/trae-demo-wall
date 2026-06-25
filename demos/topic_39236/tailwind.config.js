/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F172A',
        'card': '#1E293B',
        'card-border': '#334155',
        'primary': '#38BDF8',
        'danger': '#F43F5E',
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
      },
      fontFamily: {
        'tabular': ['Tabular Numbers', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
