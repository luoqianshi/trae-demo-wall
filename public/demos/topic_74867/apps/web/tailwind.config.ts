import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050508',
        'background-elevated': '#0a0a10',
        surface: {
          DEFAULT: 'rgba(255,255,255,0.03)',
          hover: 'rgba(255,255,255,0.06)',
          active: 'rgba(255,255,255,0.10)',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.06)',
          highlight: 'rgba(255,255,255,0.10)',
        },
        border: 'rgba(255,255,255,0.05)',
        text: {
          DEFAULT: '#f5f5f7',
          muted: 'rgba(255,255,255,0.50)',
          subtle: 'rgba(255,255,255,0.30)',
        },
        accent: {
          DEFAULT: '#5E9EF5',
          hover: '#7BB1F7',
          glow: 'rgba(94,158,245,0.35)',
        },
        life: {
          green: '#4ADE80',
          amber: '#FBBF24',
          rose: '#FB7185',
          cyan: '#22D3EE',
          purple: '#A78BFA',
          orange: '#FB923C',
        },
        ink: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          light: 'rgba(255,255,255,0.12)',
          dark: 'rgba(0,0,0,0.25)',
        },
        family: {
          warm: '#FBBF24',
          care: '#FB7185',
          bond: '#A78BFA',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          '"Microsoft YaHei"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Source Han Sans SC"',
          '"Noto Sans SC"',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          '"Microsoft YaHei"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Source Han Sans SC"',
          '"Noto Sans SC"',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        glass: '24px',
        heavy: '40px',
        extreme: '60px',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'breathe-slow': 'breathe 6s ease-in-out infinite',
        'float': 'float 5s ease-in-out infinite',
        'float-delayed': 'float 5s ease-in-out 2.5s infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'ink-spread': 'inkSpread 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'leaf-fall': 'leafFall 2s ease-out forwards',
        'leaf-return': 'leafReturn 1.5s ease-out forwards',
        'sway': 'sway 4s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.92' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(94,158,245,0.08)' },
          '50%': { boxShadow: '0 0 32px rgba(94,158,245,0.20)' },
        },
        inkSpread: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        leafFall: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(var(--leaf-x, 30px), var(--leaf-y, 200px)) rotate(var(--leaf-r, 45deg))', opacity: '0' },
        },
        leafReturn: {
          '0%': { transform: 'translate(var(--leaf-x, 30px), var(--leaf-y, 200px)) rotate(var(--leaf-r, 45deg))', opacity: '0' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [typography],
};

export default config;
