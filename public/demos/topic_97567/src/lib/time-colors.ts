/**
 * 6时段色彩系统
 * 用于任务卡片完成反馈的光晕颜色
 */

export type TimePeriod = 'dawn' | 'morning' | 'noon' | 'dusk' | 'night' | 'deepnight';

export interface TimeColorConfig {
  /** 光晕背景色 */
  bg: string;
  /** 光晕阴影 */
  shadow: string;
  /** 浮动文字渐变起始色 */
  gradientStart: string;
  /** 浮动文字渐变结束色 */
  gradientEnd: string;
  /** 时段标签 */
  label: string;
}

export const TIME_COLORS: Record<TimePeriod, TimeColorConfig> = {
  // 清晨 6:00-10:00 淡蓝色
  dawn: {
    bg: 'rgba(135, 206, 235, 0.4)',
    shadow: '0 0 40px rgba(135, 206, 235, 0.5)',
    gradientStart: '#87CEEB',
    gradientEnd: '#4169E1',
    label: '清晨',
  },
  // 上午 10:00-12:00 淡蓝到金黄渐变
  morning: {
    bg: 'rgba(135, 206, 235, 0.35)',
    shadow: '0 0 40px rgba(135, 206, 235, 0.4)',
    gradientStart: '#87CEEB',
    gradientEnd: '#FFD700',
    label: '上午',
  },
  // 午后 12:00-17:00 金黄色
  noon: {
    bg: 'rgba(255, 215, 0, 0.35)',
    shadow: '0 0 40px rgba(255, 215, 0, 0.5)',
    gradientStart: '#FFD700',
    gradientEnd: '#FFA500',
    label: '午后',
  },
  // 黄昏 17:00-19:00 金黄到淡粉渐变
  dusk: {
    bg: 'rgba(255, 182, 193, 0.35)',
    shadow: '0 0 40px rgba(255, 182, 193, 0.4)',
    gradientStart: '#FFD700',
    gradientEnd: '#FFB6C1',
    label: '黄昏',
  },
  // 夜晚 19:00-24:00 淡粉色
  night: {
    bg: 'rgba(255, 182, 193, 0.4)',
    shadow: '0 0 40px rgba(255, 182, 193, 0.5)',
    gradientStart: '#FFB6C1',
    gradientEnd: '#FF69B4',
    label: '夜晚',
  },
  // 深夜 0:00-6:00 深蓝色
  deepnight: {
    bg: 'rgba(26, 26, 94, 0.2)',
    shadow: '0 0 40px rgba(26, 26, 94, 0.3)',
    gradientStart: '#1a1a5e',
    gradientEnd: '#4a4a8e',
    label: '深夜',
  },
};

/**
 * 根据当前时间获取时段
 */
export function getCurrentPeriod(): TimePeriod {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return 'dawn';
  if (h >= 10 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'noon';
  if (h >= 17 && h < 19) return 'dusk';
  if (h >= 19) return 'night';
  return 'deepnight';
}

/**
 * 获取当前时段的色彩配置
 */
export function getCurrentTimeColor(): TimeColorConfig {
  return TIME_COLORS[getCurrentPeriod()];
}
