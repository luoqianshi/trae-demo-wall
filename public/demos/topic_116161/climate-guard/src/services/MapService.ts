/**
 * 地图服务接口层 — 预留真实 API 接入
 * 
 * 可接入：
 * - 高德地图 Web API (https://lbs.amap.com/api/javascript-api/summary)
 * - 腾讯地图 API
 * - 百度地图 API
 * 
 * API Key 通过环境变量 VITE_MAP_API_KEY 注入
 */

import type { SafePoint } from '../types';
import { safePoints } from '../data/mockData';

export interface MapService {
  getNearbySafePoints(lat: number, lon: number, radius?: number): Promise<SafePoint[]>;
  navigateTo(point: SafePoint): void;
  getCurrentLocation(): Promise<{ lat: number; lon: number }>;
}

export class MockMapService implements MapService {
  async getNearbySafePoints(lat: number, lon: number, radius: number = 2000): Promise<SafePoint[]> {
    // Mock: 返回所有预置安全点
    return safePoints;
  }

  navigateTo(point: SafePoint): void {
    // Mock: 使用高德地图 Web 方案
    const url = `https://uri.amap.com/navigation?to=${point.lat},${point.lng},${point.name}&mode=walking`;
    window.open(url, '_blank');
  }

  async getCurrentLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Mock: 返回重庆坐标
        resolve({ lat: 29.56, lon: 106.55 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 29.56, lon: 106.55 }),
        { timeout: 5000 }
      );
    });
  }
}

export const mapService = new MockMapService();
