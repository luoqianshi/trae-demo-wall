import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        xuanzhi: "#F5F0E6",    // 宣纸米
        mo: "#2C2C2C",          // 墨色
        zhusha: "#C8442A",      // 朱砂红
        qinglu: "#5C8D89",      // 青绿
        danmo: "#8B7355",       // 淡墨
        xueya: "#E8DFCC",       // 雪芽
        yinzhu: "#9B8C7D",      // 银竹
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
        hei: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        kai: ['"LXGW WenKai"', '"Kaiti SC"', '"KaiTi"', 'serif'],
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'scroll-unroll': 'scrollUnroll 1s ease-out forwards',
        'ink-spread': 'inkSpread 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'stamp-press': 'stampPress 0.4s ease-out forwards',
      },
      keyframes: {
        scrollUnroll: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stampPress: {
          '0%': { opacity: '0', transform: 'scale(1.5) rotate(-15deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
