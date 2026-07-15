/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'elder-orange': '#FF7A3D',
        'elder-red': '#E63946',
        'elder-green': '#2A9D8F',
        'elder-blue': '#457B9D',
        'elder-cream': '#FFFBF5',
        'elder-ink': '#1D3557',
        'elder-muted': '#6B7280',
        'elder-warn': '#F4A261',
        'elder-safe': '#52B788'
      },
      fontSize: {
        'elder-xs': ['22px', { lineHeight: '32px', fontWeight: '400' }],
        'elder-sm': ['28px', { lineHeight: '40px', fontWeight: '500' }],
        'elder-base': ['32px', { lineHeight: '44px', fontWeight: '500' }],
        'elder-lg': ['40px', { lineHeight: '56px', fontWeight: '600' }],
        'elder-xl': ['48px', { lineHeight: '64px', fontWeight: '600' }],
        'elder-2xl': ['64px', { lineHeight: '80px', fontWeight: '700' }]
      },
      fontFamily: {
        elder: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'elder': '16px',
        'elder-xl': '24px',
        'elder-2xl': '32px'
      },
      spacing: {
        'elder': '32px',
        'elder-lg': '48px'
      },
      boxShadow: {
        'elder': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'elder-lg': '0 8px 32px -4px rgba(0, 0, 0, 0.12)',
        'elder-active': '0 2px 8px 0px rgba(0, 0, 0, 0.08)',
        'elder-orange': '0 6px 20px -2px rgba(255, 122, 61, 0.35)'
      }
    }
  },
  plugins: []
}
