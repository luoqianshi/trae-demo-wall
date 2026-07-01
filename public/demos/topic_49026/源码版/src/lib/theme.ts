/**
 * Theme Configuration
 * ===================
 * CSS variables defined in src/index.css are the SINGLE SOURCE OF TRUTH for color values.
 * This TypeScript config is consumed ONLY by runtime JS logic (theme switching, dynamic style computation).
 * When updating colors, ALWAYS update index.css CSS variables first, then mirror here.
 */
export type ThemeName = 'ink' | 'glass' | 'bento' | 'zen' | 'aurora' | 'brutal' | 'japanese' | 'darktech' | 'cinematic'

export interface ThemeConfig {
  name: ThemeName
  label: string
  description: string
  // CSS变量值
  colors: {
    canvas: string
    canvasWarm: string
    surface: string
    surfaceHover: string
    inkPrimary: string
    inkSecondary: string
    inkTertiary: string
    inkMuted: string
    terracotta: string
    sage: string
    indigo: string
    amber: string
    rose: string
    stone: string
  }
  // 字体
  fonts: {
    serif: string
    sans: string
    mono: string
  }
  // 圆角
  radius: {
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  // 阴影
  shadows: {
    sm: string
    md: string
    lg: string
    card: string
    hover: string
  }
  // 特殊效果
  effects: {
    glassBlur?: string
    glassBorder?: string
    gradientBg?: string
    noiseOverlay?: boolean
    borderWidth?: string
    borderColor?: string
  }
}

export const themes: Record<ThemeName, ThemeConfig> = {
  ink: {
    name: 'ink',
    label: '温润水墨',
    description: '温润、克制、东方意境',
    colors: {
      canvas: '#F5F2ED',
      canvasWarm: '#F0EDE6',
      surface: '#FFFFFF',
      surfaceHover: '#FEFDFB',
      inkPrimary: '#1C1917',
      inkSecondary: '#57534E',
      inkTertiary: '#A8A29E',
      inkMuted: '#D6D3D1',
      terracotta: '#C4704A',
      sage: '#7AAF8E',
      indigo: '#6B7B8C',
      amber: '#C4A35A',
      rose: '#B87B7B',
      stone: '#9C8E7E',
    },
    fonts: {
      serif: "'Noto Serif SC', serif",
      sans: "'Noto Sans SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.25rem',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.04)',
      md: '0 2px 8px rgba(0,0,0,0.06)',
      lg: '0 4px 16px rgba(0,0,0,0.08)',
      card: '0 2px 12px rgba(0,0,0,0.04)',
      hover: '0 4px 20px rgba(0,0,0,0.06)',
    },
    effects: {
      borderWidth: '1px',
      borderColor: 'rgba(214, 211, 209, 0.2)',
    },
  },
  glass: {
    name: 'glass',
    label: '毛玻璃拟态',
    description: '柔和、通透、静谧感',
    colors: {
      canvas: 'transparent',
      canvasWarm: 'transparent',
      surface: 'rgba(255,255,255,0.35)',
      surfaceHover: 'rgba(255,255,255,0.45)',
      inkPrimary: 'rgba(60,55,50,0.95)',
      inkSecondary: 'rgba(80,75,70,0.7)',
      inkTertiary: 'rgba(100,95,90,0.5)',
      inkMuted: 'rgba(120,115,110,0.3)',
      terracotta: '#9E7B5E',
      sage: '#7A9E8E',
      indigo: '#7B8BA0',
      amber: '#B8A070',
      rose: '#A8857E',
      stone: 'rgba(100,95,90,0.5)',
    },
    fonts: {
      serif: "'Noto Serif SC', serif",
      sans: "'Noto Sans SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0.75rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      '2xl': '2rem',
    },
    shadows: {
      sm: '0 2px 8px rgba(0,0,0,0.04)',
      md: '0 4px 16px rgba(0,0,0,0.06)',
      lg: '0 8px 32px rgba(0,0,0,0.08)',
      card: '0 4px 20px rgba(0,0,0,0.04)',
      hover: '0 8px 32px rgba(0,0,0,0.06)',
    },
    effects: {
      glassBlur: 'blur(20px) saturate(120%)',
      glassBorder: 'rgba(255,255,255,0.4)',
      gradientBg:
        'linear-gradient(135deg, #C5CBD0 0%, #C8C0B8 25%, #BDC5C0 50%, #C0BDB5 75%, #B8C0C5 100%)',
    },
  },
  bento: {
    name: 'bento',
    label: '便当盒',
    description: '模块化、清晰、高效',
    colors: {
      canvas: '#F8F9FA',
      canvasWarm: '#F1F3F5',
      surface: '#FFFFFF',
      surfaceHover: '#F8F9FA',
      inkPrimary: '#1F2937',
      inkSecondary: '#6B7280',
      inkTertiary: '#9CA3AF',
      inkMuted: '#E5E7EB',
      terracotta: '#3B82F6',
      sage: '#10B981',
      indigo: '#3B82F6',
      amber: '#F59E0B',
      rose: '#EF4444',
      stone: '#9CA3AF',
    },
    fonts: {
      serif: "'Noto Sans SC', sans-serif",
      sans: "'Noto Sans SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1rem',
      '2xl': '1rem',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 1px 3px rgba(0,0,0,0.08)',
      lg: '0 4px 12px rgba(0,0,0,0.08)',
      card: '0 1px 3px rgba(0,0,0,0.05)',
      hover: '0 4px 12px rgba(0,0,0,0.1)',
    },
    effects: {
      borderWidth: '1px',
      borderColor: '#E8EAED',
    },
  },
  zen: {
    name: 'zen',
    label: '禅意',
    description: '温暖柔和，自然静谧的禅意空间',
    colors: {
      canvas: '#F8F6F0',
      canvasWarm: '#F2EFE8',
      surface: '#FAFAF7',
      surfaceHover: '#FEFDFB',
      inkPrimary: '#3C3832',
      inkSecondary: '#6B6560',
      inkTertiary: '#A8A29E',
      inkMuted: '#D6D3D1',
      terracotta: '#A67C5B',
      sage: '#8AAF8A',
      indigo: '#7B8BA8',
      amber: '#C4A55A',
      rose: '#B89090',
      stone: '#A09A90',
    },
    fonts: {
      serif: "'Noto Serif SC', 'Songti SC', serif",
      sans: "'Noto Sans SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.25rem',
      xl: '0.375rem',
      '2xl': '0.5rem',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.04)',
      md: '0 2px 8px rgba(0,0,0,0.06)',
      lg: '0 4px 16px rgba(0,0,0,0.08)',
      card: '0 2px 12px rgba(0,0,0,0.04)',
      hover: '0 4px 20px rgba(0,0,0,0.06)',
    },
    effects: {
      borderWidth: '1px',
      borderColor: 'rgba(214, 211, 209, 0.2)',
    },
  },
  aurora: {
    name: 'aurora',
    label: '极光渐变',
    description: '深色背景，极光渐变，梦幻氛围',
    colors: {
      canvas: '#0F0F1A',
      canvasWarm: '#1A1A2E',
      surface: 'rgba(26, 26, 46, 0.7)',
      surfaceHover: 'rgba(40, 40, 70, 0.8)',
      inkPrimary: '#F1F5F9',
      inkSecondary: '#CBD5E1',
      inkTertiary: '#94A3B8',
      inkMuted: '#475569',
      terracotta: '#F87171',
      sage: '#34D399',
      indigo: '#60A5FA',
      amber: '#FBBF24',
      rose: '#FB7185',
      stone: '#94A3B8',
    },
    fonts: {
      serif: "'Noto Serif SC', serif",
      sans: "'Noto Sans SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.25rem',
    },
    shadows: {
      sm: '0 2px 8px rgba(0,0,0,0.3)',
      md: '0 4px 16px rgba(0,0,0,0.4)',
      lg: '0 8px 32px rgba(0,0,0,0.5)',
      card: '0 4px 24px rgba(0,0,0,0.4)',
      hover: '0 0 20px rgba(96, 165, 250, 0.2)',
    },
    effects: {
      gradientBg: 'linear-gradient(-45deg, #0F0F1A, #1E1B4B, #312E81, #0F0F1A)',
      borderWidth: '1px',
      borderColor: 'rgba(255,255,255,0.1)',
    },
  },
  brutal: {
    name: 'brutal',
    label: '新粗野',
    description: '纯白画布，黑色粗边框，高对比度',
    colors: {
      canvas: '#FFFFFF',
      canvasWarm: '#F5F5F5',
      surface: '#FFFFFF',
      surfaceHover: '#F0F0F0',
      inkPrimary: '#000000',
      inkSecondary: '#333333',
      inkTertiary: '#666666',
      inkMuted: '#999999',
      terracotta: '#FF4400',
      sage: '#00AA44',
      indigo: '#0044FF',
      amber: '#FFAA00',
      rose: '#FF0044',
      stone: '#666666',
    },
    fonts: {
      serif: "'Noto Serif SC', serif",
      sans: "'Noto Sans SC', 'PingFang SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0rem',
      md: '0rem',
      lg: '0rem',
      xl: '0rem',
      '2xl': '0rem',
    },
    shadows: {
      sm: '2px 2px 0px #000000',
      md: '4px 4px 0px #000000',
      lg: '6px 6px 0px #000000',
      card: '4px 4px 0px #000000',
      hover: '6px 6px 0px #000000',
    },
    effects: {
      borderWidth: '3px',
      borderColor: '#000000',
    },
  },
  japanese: {
    name: 'japanese',
    label: '极简日式',
    description: '米白画布，大量留白，细线边框',
    colors: {
      canvas: '#F7F5F0',
      canvasWarm: '#F0EDE6',
      surface: '#FDFCFA',
      surfaceHover: '#F8F7F4',
      inkPrimary: '#2C2C2C',
      inkSecondary: '#5C5C5C',
      inkTertiary: '#9C9C9C',
      inkMuted: '#D0CCC5',
      terracotta: '#B8956A',
      sage: '#8A9E8A',
      indigo: '#7A8BA8',
      amber: '#C4A55A',
      rose: '#B89090',
      stone: '#A09A90',
    },
    fonts: {
      serif: "'Noto Serif SC', 'Songti SC', serif",
      sans: "'Noto Sans SC', 'PingFang SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.25rem',
      xl: '0.375rem',
      '2xl': '0.5rem',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.03)',
      md: '0 1px 3px rgba(0,0,0,0.04)',
      lg: '0 2px 6px rgba(0,0,0,0.04)',
      card: '0 1px 4px rgba(0,0,0,0.03)',
      hover: '0 2px 8px rgba(0,0,0,0.04)',
    },
    effects: {
      borderWidth: '1px',
      borderColor: 'rgba(0,0,0,0.12)',
    },
  },
  darktech: {
    name: 'darktech',
    label: '暗黑科技',
    description: '深黑画布，霓虹强调色，终端风格',
    colors: {
      canvas: '#0A0A0F',
      canvasWarm: '#12121A',
      surface: '#14141F',
      surfaceHover: '#1E1E28',
      inkPrimary: '#E0E0E8',
      inkSecondary: '#A0A0B0',
      inkTertiary: '#6A6A80',
      inkMuted: '#3A3A4A',
      terracotta: '#FF6B6B',
      sage: '#4ECDC4',
      indigo: '#00D4FF',
      amber: '#FFD700',
      rose: '#FF4081',
      stone: '#5A5A6E',
    },
    fonts: {
      serif: "'Noto Serif SC', serif",
      sans: "'Noto Sans SC', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    radius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.625rem',
      '2xl': '0.75rem',
    },
    shadows: {
      sm: '0 0 8px rgba(78,205,196,0.15)',
      md: '0 0 12px rgba(78,205,196,0.2)',
      lg: '0 0 24px rgba(78,205,196,0.25)',
      card: '0 0 16px rgba(0,212,255,0.15)',
      hover: '0 0 30px rgba(0,212,255,0.25)',
    },
    effects: {
      borderWidth: '1px',
      borderColor: 'rgba(0, 212, 255, 0.3)',
    },
  },
  cinematic: {
    name: 'cinematic',
    label: '暗色叙事',
    description: '电影感深色，琥珀高亮，记忆星图最佳展示模式',
    colors: {
      canvas: '#1A1F1A',
      canvasWarm: '#222822',
      surface: '#2A2F2A',
      surfaceHover: '#333A33',
      inkPrimary: '#E8E5DE',
      inkSecondary: '#B0ABA0',
      inkTertiary: '#807A70',
      inkMuted: '#4A4842',
      terracotta: '#C8956D',
      sage: '#6B9E6B',
      indigo: '#7B8BA8',
      amber: '#D4A843',
      rose: '#B87B7B',
      stone: '#6B655C',
    },
    fonts: {
      serif: "'Noto Serif SC', serif",
      sans: "'Noto Sans SC', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    radius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.25rem',
    },
    shadows: {
      sm: '0 2px 8px rgba(0,0,0,0.3)',
      md: '0 4px 16px rgba(0,0,0,0.4)',
      lg: '0 8px 32px rgba(0,0,0,0.5)',
      card: '0 4px 20px rgba(0,0,0,0.3)',
      hover: '0 0 20px rgba(200,149,109,0.15)',
    },
    effects: {
      gradientBg: 'radial-gradient(ellipse at top, #1A2A1A 0%, #1A1F1A 60%, #12161A 100%)',
      borderWidth: '1px',
      borderColor: 'rgba(200,149,109,0.12)',
      noiseOverlay: true,
    },
  },
}

export const themeList: ThemeName[] = ['ink', 'glass', 'bento', 'zen', 'aurora', 'brutal', 'japanese', 'darktech', 'cinematic']

export function getThemeConfig(name: ThemeName): ThemeConfig {
  return themes[name]
}
