﻿﻿﻿/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // 动态颜色类名（用于 bg- / text- 等场景）
    { pattern: /bg-(cream|soft-blue|light-blue|powder-blue|ice-blue|soft-pink|light-yellow|mint|soft-purple|primary)/ },
    { pattern: /text-(text-primary|text-secondary|text-light|ice-blue|mint|soft-pink|light-blue|soft-blue|primary)/ },
    { pattern: /border-(soft-blue|ice-blue|cream|soft-pink|light-yellow|mint)/ },
    { pattern: /from-(soft-blue|light-blue|soft-pink|light-yellow|mint|soft-purple)/ },
    { pattern: /to-(light-blue|soft-blue|soft-pink|mint)/ },
    // 动画类名
    { pattern: /animate-(fadeInUp|fadeIn|slideInRight|bounce|pulse-slow|bounce-soft|bounce-in|slide-up)/ },
  ],
  theme: {
    extend: {
      colors: {
        'cream': '#F8FAFB',
        'soft-blue': '#E8F4FF',
        'light-blue': '#D0E8F5',
        'powder-blue': '#A8C8D9',
        'ice-blue': '#7AABBF',
        'soft-pink': '#FFE4EC',
        'light-yellow': '#FFF8E1',
        'mint': '#E0F3E0',
        'soft-purple': '#F3E8FF',
        'primary': '#4A7FFF',
        // 文字颜色 - 提高对比度，确保清晰可读
        'text-primary': '#1F2937',   // gray-800 深色文字
        'text-secondary': '#374151', // gray-700 次要文字
        'text-light': '#6B7280',    // gray-500 辅助文字
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif SC', 'serif'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'bounce-in': 'bounce-in 0.4s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
