// Design Tokens
// TypeScript definitions for design tokens based on memory-anchor-ui/colors_and_type.css

/**
 * 设计令牌类型定义
 */
export interface DesignTokens {
  colors: {
    primary: PrimaryColors;
    neutral: NeutralColors;
    surface: SurfaceColors;
    text: TextColors;
    border: BorderColors;
    state: StateColors;
  };
  gradients: GradientTokens;
  radius: RadiusTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
}

/**
 * 主色调（蓝紫色渐变）
 */
export interface PrimaryColors {
  '50': string;
  '100': string;
  '200': string;
  '300': string;
  '400': string;
  '500': string;
  '600': string;
  '700': string;
  '800': string;
  '900': string;
  '950': string;
  accent: string;
  accentLight: string;
}

/**
 * 中性色
 */
export interface NeutralColors {
  '50': string;
  '100': string;
  '200': string;
  '300': string;
  '400': string;
  '500': string;
  '600': string;
  '700': string;
  '800': string;
  '900': string;
  '950': string;
}

/**
 * 表面背景色
 */
export interface SurfaceColors {
  bgPage: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  bgSunken: string;
  bgSidebar: string;
  bgSidebarHover: string;
  bgSidebarActive: string;
}

/**
 * 文本色
 */
export interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  inverse: string;
  brand: string;
}

/**
 * 边框色
 */
export interface BorderColors {
  default: string;
  strong: string;
  brand: string;
}

/**
 * 状态色
 */
export interface StateColors {
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;
}

/**
 * 渐变令牌
 */
export interface GradientTokens {
  brand: string;
  brandSubtle: string;
  surface: string;
}

/**
 * 圆角令牌
 */
export interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * 字体令牌
 */
export interface TypographyTokens {
  fontFamily: {
    display: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

/**
 * 间距令牌
 */
export interface SpacingTokens {
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  '5': string;
  '6': string;
  '8': string;
  '10': string;
  '12': string;
  '16': string;
}

/**
 * 阴影令牌
 */
export interface ShadowTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  float: string;
}

/**
 * CSS 变量名称映射
 */
export const CSS_VAR_NAMES = {
  colors: {
    primary: {
      '50': '--color-primary-50',
      '100': '--color-primary-100',
      '200': '--color-primary-200',
      '300': '--color-primary-300',
      '400': '--color-primary-400',
      '500': '--color-primary-500',
      '600': '--color-primary-600',
      '700': '--color-primary-700',
      '800': '--color-primary-800',
      '900': '--color-primary-900',
      '950': '--color-primary-950',
      accent: '--color-primary-accent',
      accentLight: '--color-primary-accent-light',
    },
    neutral: {
      '50': '--color-neutral-50',
      '100': '--color-neutral-100',
      '200': '--color-neutral-200',
      '300': '--color-neutral-300',
      '400': '--color-neutral-400',
      '500': '--color-neutral-500',
      '600': '--color-neutral-600',
      '700': '--color-neutral-700',
      '800': '--color-neutral-800',
      '900': '--color-neutral-900',
      '950': '--color-neutral-950',
    },
    surface: {
      bgPage: '--color-bg-page',
      bgSurface: '--color-bg-surface',
      bgSurfaceElevated: '--color-bg-surface-elevated',
      bgSunken: '--color-bg-sunken',
      bgSidebar: '--color-bg-sidebar',
      bgSidebarHover: '--color-bg-sidebar-hover',
      bgSidebarActive: '--color-bg-sidebar-active',
    },
    text: {
      primary: '--color-text-primary',
      secondary: '--color-text-secondary',
      tertiary: '--color-text-tertiary',
      inverse: '--color-text-inverse',
      brand: '--color-text-brand',
    },
    border: {
      default: '--color-border-default',
      strong: '--color-border-strong',
      brand: '--color-border-brand',
    },
    state: {
      success: '--state-success',
      successBg: '--state-success-bg',
      warning: '--state-warning',
      warningBg: '--state-warning-bg',
      error: '--state-error',
      errorBg: '--state-error-bg',
      info: '--state-info',
      infoBg: '--state-info-bg',
    },
  },
  gradients: {
    brand: '--gradient-brand',
    brandSubtle: '--gradient-brand-subtle',
    surface: '--gradient-surface',
  },
  radius: {
    sm: '--radius-sm',
    md: '--radius-md',
    lg: '--radius-lg',
    xl: '--radius-xl',
    full: '--radius-full',
  },
  typography: {
    fontFamily: {
      display: '--font-display',
      body: '--font-body',
      mono: '--font-mono',
    },
    fontSize: {
      xs: '--font-size-xs',
      sm: '--font-size-sm',
      base: '--font-size-base',
      lg: '--font-size-lg',
      xl: '--font-size-xl',
      '2xl': '--font-size-2xl',
      '3xl': '--font-size-3xl',
      '4xl': '--font-size-4xl',
    },
    lineHeight: {
      tight: '--line-height-tight',
      normal: '--line-height-normal',
      relaxed: '--line-height-relaxed',
    },
    fontWeight: {
      normal: '--font-weight-normal',
      medium: '--font-weight-medium',
      semibold: '--font-weight-semibold',
      bold: '--font-weight-bold',
    },
    letterSpacing: {
      tight: '--letter-spacing-tight',
      normal: '--letter-spacing-normal',
      wide: '--letter-spacing-wide',
    },
  },
  spacing: {
    '1': '--space-1',
    '2': '--space-2',
    '3': '--space-3',
    '4': '--space-4',
    '5': '--space-5',
    '6': '--space-6',
    '8': '--space-8',
    '10': '--space-10',
    '12': '--space-12',
    '16': '--space-16',
  },
  shadows: {
    xs: '--shadow-xs',
    sm: '--shadow-sm',
    md: '--shadow-md',
    lg: '--shadow-lg',
    float: '--shadow-float',
  },
} as const;

/**
 * 获取 CSS 变量值的辅助函数
 */
export function getCSSVar(varName: string): string {
  return `var(${varName})`;
}

/**
 * 获取颜色 CSS 变量
 */
export function getColorVar(
  category: keyof typeof CSS_VAR_NAMES.colors,
  key: string
): string {
  const group = CSS_VAR_NAMES.colors[category] as Record<string, string>;
  const varName = group[key];
  return varName ? getCSSVar(varName) : '';
}

/**
 * 获取间距 CSS 变量
 */
export function getSpacingVar(key: keyof typeof CSS_VAR_NAMES.spacing): string {
  return getCSSVar(CSS_VAR_NAMES.spacing[key]);
}

/**
 * 获取字体大小 CSS 变量
 */
export function getFontSizeVar(
  key: keyof typeof CSS_VAR_NAMES.typography.fontSize
): string {
  return getCSSVar(CSS_VAR_NAMES.typography.fontSize[key]);
}

/**
 * 获取圆角 CSS 变量
 */
export function getRadiusVar(key: keyof typeof CSS_VAR_NAMES.radius): string {
  return getCSSVar(CSS_VAR_NAMES.radius[key]);
}

/**
 * 获取阴影 CSS 变量
 */
export function getShadowVar(key: keyof typeof CSS_VAR_NAMES.shadows): string {
  return getCSSVar(CSS_VAR_NAMES.shadows[key]);
}

/**
 * 设计令牌常量值（用于非 CSS 上下文）
 * 注意：这些是静态值，不会随主题变化
 */
export const DESIGN_TOKEN_VALUES = {
  colors: {
    primary: {
      '50': '#f0eefb',
      '100': '#e0dcf7',
      '200': '#c5bdef',
      '300': '#a599e5',
      '400': '#8b78d9',
      '500': '#6c5ce7',
      '600': '#5a45d6',
      '700': '#4b35b8',
      '800': '#3d2c93',
      '900': '#342674',
      '950': '#1e1352',
      accent: '#6366f1',
      accentLight: '#818cf8',
    },
    neutral: {
      '50': '#fafafa',
      '100': '#f4f4f5',
      '200': '#e4e4e7',
      '300': '#d4d4d8',
      '400': '#a1a1aa',
      '500': '#71717a',
      '600': '#52525b',
      '700': '#3f3f46',
      '800': '#27272a',
      '900': '#18181b',
      '950': '#09090b',
    },
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  spacing: {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;