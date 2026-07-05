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
        paper: "#F5F1E8",
        "paper-deep": "#EDE6D3",
        ink: "#1A1814",
        "ink-soft": "#3A352D",
        "ink-mute": "#6B645A",
        cinnabar: "#C8442C",
        "cinnabar-deep": "#A83622",
        "cinnabar-soft": "#E8B5A8",
        celadon: "#5C8A6E",
        "celadon-soft": "#A8C4B2",
        ochre: "#C99A3A",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"ZCOOL XiaoWei"', '"Noto Serif SC"', 'serif'],
        brush: ['"Ma Shan Zheng"', '"Noto Serif SC"', 'cursive'],
        en: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '2px',
        'md': '3px',
      },
      boxShadow: {
        'ink': '0 1px 0 rgba(26,24,20,0.08), 0 0 0 1px rgba(26,24,20,0.04)',
        'press': 'inset 0 1px 2px rgba(26,24,20,0.18)',
        'seal': '0 2px 6px rgba(200,68,44,0.25)',
        'float': '0 6px 24px -8px rgba(26,24,20,0.18)',
      },
      backgroundImage: {
        'paper-grain': "radial-gradient(circle at 20% 30%, rgba(107,100,90,0.04) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(200,68,44,0.03) 0, transparent 35%)",
        'gaozhi': "repeating-linear-gradient(to bottom, transparent 0, transparent 35px, rgba(26,24,20,0.06) 35px, rgba(26,24,20,0.06) 36px)",
      },
      keyframes: {
        'ink-bloom': {
          '0%': { opacity: '0', transform: 'scale(0.96) blur(2px)' },
          '100%': { opacity: '1', transform: 'scale(1) blur(0)' },
        },
        'seal-stamp': {
          '0%': { transform: 'scale(1.4) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(0.92) rotate(-2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-3deg)', opacity: '1' },
        },
        'flow': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'ink-bloom': 'ink-bloom 0.7s ease-out both',
        'seal-stamp': 'seal-stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'flow': 'flow 1.2s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
