export type FoodCategory = 'snack' | 'medicine' | 'drink' | 'other';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  expiryDate: string;
  createdAt: number;
}

export type FoodStatus = 'fresh' | 'normal' | 'warning' | 'expired';

export interface FoodItemWithStatus extends FoodItem {
  daysRemaining: number;
  status: FoodStatus;
}

export type FilterType = 'all' | 'fresh' | 'warning' | 'expired';

export interface FoodHistoryItem {
  id: string;
  name: string;
  category: FoodCategory;
  expiryDate: string;
  action: 'used' | 'wasted';
  actionAt: number;
}
