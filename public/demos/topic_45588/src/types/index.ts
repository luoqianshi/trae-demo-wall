export interface CatStory {
  id: string;
  catName: string;
  catFeatures?: string;
  lostTime: string;
  lostLocation: string;
  foundTime: string;
  foundLocation: string;
  distance?: number;
  story?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface PredictResult {
  timeRange: string;
  possibleLocations: string[];
  tips: string[];
  confidence: number;
}

export type TimeRangeKey = '1-3' | '3-6' | '6-12' | '12-24' | '24-48' | '48-72' | 'over72';
