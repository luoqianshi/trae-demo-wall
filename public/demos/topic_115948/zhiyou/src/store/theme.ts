import Taro from '@tarojs/taro'

export interface ThemeConfig {
  id: string
  name: string
  nameEn: string
  primary: string
  primaryLight: string
  primaryLighter: string
  primaryLightest: string
  secondary: string
  secondaryLight: string
  bg: string
  bgWarm: string
  gradient: string
}

export const THEMES: Record<string, ThemeConfig> = {
  coral: {
    id: 'coral',
    name: '珊瑚暖阳',
    nameEn: 'Sunshine Coral',
    primary: '#FF6B6B',
    primaryLight: '#FF8A8A',
    primaryLighter: '#FFB4B4',
    primaryLightest: '#FFDADA',
    secondary: '#FF9F43',
    secondaryLight: '#FFB76B',
    bg: '#FFF9F5',
    bgWarm: '#FFF3EB',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF9F43 100%)',
  },
  lavender: {
    id: 'lavender',
    name: '薰衣草梦境',
    nameEn: 'Lavender Dream',
    primary: '#9B7BBF',
    primaryLight: '#B49BD4',
    primaryLighter: '#D4C4EB',
    primaryLightest: '#EDE3F5',
    secondary: '#7B5BBF',
    secondaryLight: '#9B7BBF',
    bg: '#FAF5FF',
    bgWarm: '#F5EEFF',
    gradient: 'linear-gradient(135deg, #9B7BBF 0%, #7B5BBF 100%)',
  },
  mint: {
    id: 'mint',
    name: '薄荷清风',
    nameEn: 'Mint Breeze',
    primary: '#5AB8A6',
    primaryLight: '#7BC4B4',
    primaryLighter: '#A8DCD3',
    primaryLightest: '#D4F5ED',
    secondary: '#4A9A8A',
    secondaryLight: '#5AB8A6',
    bg: '#F0FFF8',
    bgWarm: '#E6FFFA',
    gradient: 'linear-gradient(135deg, #5AB8A6 0%, #4A9A8A 100%)',
  },
}

const THEME_KEY = 'zhiyou_theme'

export class ThemeStore {
  private static instance: ThemeStore

  private _currentTheme: ThemeConfig = THEMES.coral
  private _listeners: Set<() => void> = new Set()

  static getInstance(): ThemeStore {
    if (!ThemeStore.instance) {
      ThemeStore.instance = new ThemeStore()
    }
    return ThemeStore.instance
  }

  constructor() {
    const savedTheme = Taro.getStorageSync(THEME_KEY) || 'coral'
    this._currentTheme = THEMES[savedTheme] || THEMES.coral
    this.applyTheme()
  }

  get currentTheme(): ThemeConfig {
    return this._currentTheme
  }

  get themeId(): string {
    return this._currentTheme.id
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  private notify(): void {
    this._listeners.forEach(listener => listener())
  }

  setTheme(themeId: string): void {
    const theme = THEMES[themeId]
    if (theme && theme.id !== this._currentTheme.id) {
      this._currentTheme = theme
      Taro.setStorageSync(THEME_KEY, themeId)
      this.applyTheme()
      this.notify()
    }
  }

  applyTheme(): void {
    const variables = this.getCssVariables()
    const root = document.documentElement
    Object.keys(variables).forEach(key => {
      root.style.setProperty(key, variables[key])
    })
  }

  getCssVariables(): Record<string, string> {
    const t = this._currentTheme
    return {
      '--color-primary': t.primary,
      '--color-primary-light': t.primaryLight,
      '--color-primary-lighter': t.primaryLighter,
      '--color-primary-lightest': t.primaryLightest,
      '--color-secondary': t.secondary,
      '--color-secondary-light': t.secondaryLight,
      '--color-bg': t.bg,
      '--color-bg-warm': t.bgWarm,
      '--gradient-primary': t.gradient,
      '--shadow-primary': `0 8px 32px ${t.primary}30`,
      '--shadow-primary-light': `0 4px 16px ${t.primary}20`,
    }
  }
}

export const themeStore = ThemeStore.getInstance()
export default themeStore
