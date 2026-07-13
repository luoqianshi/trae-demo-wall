/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 墨问配色方案 —— 精细化水墨色彩体系
        ink: {
          bg: '#F5F0EB',       // 主背景 月白暖白
          accent: '#C53D43',   // 强调色 朱砂红
          'accent-dark': '#A03035', // 深朱砂
          'accent-light': '#E8B4B6', // 浅朱砂
          dark: '#2C2C2C',     // 墨色
          'dark-soft': '#3D3D3D', // 软墨色
          muted: '#7C9EB2',    // 辅助色 青灰
          'muted-light': '#A8C4D4', // 浅青灰
          card: '#FFFCF7',     // 卡片底 宣纸白
          sub: '#F1E7D8',      // 次卡片 旧纸黄
          'sub-deep': '#E8D9C2', // 深旧纸
          border: '#E0D4C8',   // 边框
          'border-deep': '#CDB9A8', // 深边框
          gold: '#B89968',     // 鎏金色
          'gold-light': '#D4BC8A', // 浅鎏金
          jade: '#6B8E7F',     // 翠玉色
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      boxShadow: {
        'ink': '0 2px 12px rgba(44, 44, 44, 0.06)',
        'ink-lg': '0 8px 30px rgba(44, 44, 44, 0.10)',
        'ink-xl': '0 12px 48px rgba(44, 44, 44, 0.14)',
        'seal': '0 2px 8px rgba(197, 61, 67, 0.25)',
        'card-hover': '0 4px 20px rgba(44, 44, 44, 0.08), 0 1px 3px rgba(44, 44, 44, 0.04)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 12px rgba(44, 44, 44, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
