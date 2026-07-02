import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF8F5',
          dark: '#F5F0EB',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#2C2420',
          secondary: '#5A5048',
          muted: '#8A7E74',
          light: '#B5A99A',
        },
        ochre: {
          DEFAULT: '#8B5E3C',
          light: '#C4A882',
          bg: '#F5EDE3',
        },
        cinnabar: {
          DEFAULT: '#B54A3A',
          light: '#D47260',
          bg: '#FBEAE7',
        },
        indigo: {
          DEFAULT: '#4A6B8A',
          light: '#7A9BB8',
          bg: '#E8EFF5',
        },
        gold: {
          DEFAULT: '#C4A882',
          light: '#E8D5B8',
          bg: '#FBF6EE',
        },
        border: {
          DEFAULT: '#E5DDD4',
          light: '#F0EBE5',
        },
      },
      fontFamily: {
        display: ['"Ma Shan Zheng"', '"华文行楷"', 'cursive'],
        body: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"思源宋体"', 'serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '14px',
        'lg': '20px',
        'xl': '28px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(44,36,32,0.04)',
        'md': '0 4px 16px rgba(44,36,32,0.06)',
        'lg': '0 12px 40px rgba(44,36,32,0.08)',
        'xl': '0 20px 60px rgba(44,36,32,0.1)',
        'glass': '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'glass-hover': '0 12px 48px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        'gold': '0 4px 20px rgba(196,168,130,0.2)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: {
        'micro': '150ms',
        'standard': '250ms',
        'entrance': '350ms',
        'slow': '500ms',
      },
      backdropBlur: {
        'glass': '40px',
      },
      backdropSaturate: {
        'glass': '1.8',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config
