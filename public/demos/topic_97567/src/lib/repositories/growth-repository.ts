// Growth data repository: daily aggregated stats.

import { readData, withTransaction } from './base';
import type { GrowthData } from '../types/entities';

export function getGrowthData(userId: string): GrowthData | null {
  const data = readData();
  return data.growthData.find((g) => g.user_id === userId) || null;
}

export function updateGrowthData(userId: string, updates: any): GrowthData {
  return withTransaction((data) => {
    const idx = data.growthData.findIndex((g) => g.user_id === userId);
    if (idx === -1) throw new Error('Growth data not found');
    data.growthData[idx] = { ...data.growthData[idx], ...updates };
    return data.growthData[idx];
  });
}
