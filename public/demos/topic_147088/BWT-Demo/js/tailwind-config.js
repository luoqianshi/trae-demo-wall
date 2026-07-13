/**
 * BWT Demo - Unified Tailwind CSS Configuration
 * All 9 pages share this single config to ensure consistency.
 */
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          bwt: {
            bg:       '#0A0E1A',
            surface:  '#12162B',
            card:     '#1A1F35',
            border:   'rgba(255, 255, 255, 0.06)',
            primary:  '#00D4AA',
            danger:   '#FF6B6B',
            warning:  '#FFB84D',
            text:     '#E8ECF4',
            muted:    '#7B829E',
          },
        },
        fontFamily: {
          display: ['"Space Grotesk"', 'sans-serif'],
          body:    ['"Noto Sans SC"', 'sans-serif'],
          mono:    ['"JetBrains Mono"', 'monospace'],
        },
      },
    },
  };
}
