import type { WeatherInfo, QuickAction } from '@/types';

export const weatherInfo: WeatherInfo = {
  city: '北京',
  temperature: 28,
  weather: '晴',
  humidity: '45%',
  wind: '东南风2级'
};

export const quickActions: QuickAction[] = [
  { id: '1', name: '语音播报', icon: '🎙️', path: '/pages/home/index' },
  { id: '2', name: '用药提醒', icon: '💊', path: '/pages/medication/index' },
  { id: '3', name: '在线问诊', icon: '🏥', path: '/pages/health/index' }
];