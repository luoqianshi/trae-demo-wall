/**
 * 天气服务接口层 — 预留真实 API 接入
 * 
 * 可接入：
 * - 和风天气 (https://dev.qweather.com/)
 * - Open-Meteo (https://open-meteo.com/)
 * - 高德天气 API
 * 
 * API Key 通过环境变量 VITE_WEATHER_API_KEY 注入，不写死在代码中
 */

import type { WeatherData, DayForecast, CityWeather } from '../types';
import { cityWeathers } from '../data/mockData';

// 环境变量中的 API Key
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';
const API_BASE = import.meta.env.VITE_WEATHER_API_BASE || 'https://api.open-meteo.com/v1';

export interface WeatherService {
  getCurrentWeather(city: string): Promise<WeatherData>;
  getForecast(city: string, days?: number): Promise<DayForecast[]>;
  getCityWeather(city: string): Promise<CityWeather>;
}

/**
 * 当前使用 Mock 数据
 * 切换到真实服务只需替换实现
 */
export class MockWeatherService implements WeatherService {
  async getCurrentWeather(city: string): Promise<WeatherData> {
    await this.simulateDelay();
    return cityWeathers.find(w => w.city === city)?.current || cityWeathers[0].current;
  }

  async getForecast(city: string, days: number = 3): Promise<DayForecast[]> {
    await this.simulateDelay();
    return cityWeathers.find(w => w.city === city)?.forecast?.slice(0, days) || [];
  }

  async getCityWeather(city: string): Promise<CityWeather> {
    await this.simulateDelay();
    return cityWeathers.find(w => w.city === city) || cityWeathers[0];
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  }
}

/**
 * Open-Meteo 真实服务（示例，需配置环境变量后启用）
 */
export class OpenMeteoService implements WeatherService {
  // 城市坐标映射
  private cityCoords: Record<string, { lat: number; lon: number }> = {
    '重庆': { lat: 29.56, lon: 106.55 },
    '哈尔滨': { lat: 45.75, lon: 126.65 },
    '上海': { lat: 31.23, lon: 121.47 },
    '广州': { lat: 23.13, lon: 113.26 },
    '北京': { lat: 39.91, lon: 116.40 },
    '西宁': { lat: 36.62, lon: 101.78 },
  };

  async getCurrentWeather(city: string): Promise<WeatherData> {
    const coords = this.cityCoords[city];
    if (!coords) throw new Error(`Unknown city: ${city}`);

    const params = new URLSearchParams({
      latitude: coords.lat.toString(),
      longitude: coords.lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature',
      timezone: 'Asia/Shanghai',
    });

    const resp = await fetch(`${API_BASE}/forecast?${params}`);
    const data = await resp.json();

    return this.transformCurrent(data, city);
  }

  async getForecast(city: string, days: number = 3): Promise<DayForecast[]> {
    const coords = this.cityCoords[city];
    if (!coords) throw new Error(`Unknown city: ${city}`);

    const params = new URLSearchParams({
      latitude: coords.lat.toString(),
      longitude: coords.lon.toString(),
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      forecast_days: days.toString(),
      timezone: 'Asia/Shanghai',
    });

    const resp = await fetch(`${API_BASE}/forecast?${params}`);
    const data = await resp.json();

    return this.transformForecast(data);
  }

  async getCityWeather(city: string): Promise<CityWeather> {
    const [current, forecast] = await Promise.all([
      this.getCurrentWeather(city),
      this.getForecast(city, 3),
    ]);
    
    // 需要补充风险计算逻辑
    return {
      city,
      current,
      forecast,
      riskMode: '正常',
      riskLevel: '低',
      dangerousTimeSlot: '无明显危险时段',
      aiReminder: '',
    };
  }

  private transformCurrent(data: any, city: string): WeatherData {
    const c = data.current;
    return {
      city,
      temperature: Math.round(c.temperature_2m),
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m),
      windDirection: '',
      feelsLike: Math.round(c.apparent_temperature),
      condition: '',
    };
  }

  private transformForecast(data: any): DayForecast[] {
    const d = data.daily;
    return d.time.map((date: string, i: number) => ({
      date,
      highTemp: Math.round(d.temperature_2m_max[i]),
      lowTemp: Math.round(d.temperature_2m_min[i]),
      condition: '',
      humidity: 0,
      windSpeed: 0,
    }));
  }
}

// 导出当前使用的服务实例
// 切换真实服务：export const weatherService = new OpenMeteoService();
export const weatherService = new MockWeatherService();
