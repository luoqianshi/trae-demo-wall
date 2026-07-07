import type { FoodStatus, FoodItem, FoodItemWithStatus, FoodCategory } from '@/types/food';

export function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getFoodStatus(daysRemaining: number): FoodStatus {
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= 3) return 'warning';
  if (daysRemaining <= 7) return 'normal';
  return 'fresh';
}

export function getStatusText(status: FoodStatus): string {
  const statusMap: Record<FoodStatus, string> = {
    fresh: '新鲜',
    normal: '正常',
    warning: '临期',
    expired: '已过期',
  };
  return statusMap[status];
}

export function getStatusColor(status: FoodStatus): string {
  const colorMap: Record<FoodStatus, string> = {
    fresh: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    normal: 'text-teal-600 bg-teal-50 border-teal-200',
    warning: 'text-orange-600 bg-orange-50 border-orange-200',
    expired: 'text-red-600 bg-red-50 border-red-200',
  };
  return colorMap[status];
}

export function getStatusBgColor(status: FoodStatus): string {
  const colorMap: Record<FoodStatus, string> = {
    fresh: 'from-emerald-50 to-white border-emerald-100',
    normal: 'from-teal-50 to-white border-teal-100',
    warning: 'from-orange-50 to-white border-orange-100',
    expired: 'from-red-50 to-white border-red-100',
  };
  return colorMap[status];
}

export function enrichFoodItem(food: FoodItem): FoodItemWithStatus {
  const daysRemaining = getDaysRemaining(food.expiryDate);
  const status = getFoodStatus(daysRemaining);
  return { ...food, daysRemaining, status };
}

export function sortByExpiry(foods: FoodItemWithStatus[]): FoodItemWithStatus[] {
  return [...foods].sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCategoryText(category: FoodCategory): string {
  const categoryMap: Record<FoodCategory, string> = {
    snack: '零食',
    medicine: '药品',
    drink: '饮品',
    other: '其他',
  };
  return categoryMap[category];
}

export function getCategoryEmoji(category: FoodCategory): string {
  const categoryMap: Record<FoodCategory, string> = {
    snack: '🍪',
    medicine: '💊',
    drink: '🥤',
    other: '📦',
  };
  return categoryMap[category];
}

export function getCategoryColor(category: FoodCategory): string {
  const categoryMap: Record<FoodCategory, string> = {
    snack: 'text-amber-600 bg-amber-50 border-amber-200',
    medicine: 'text-blue-600 bg-blue-50 border-blue-200',
    drink: 'text-purple-600 bg-purple-50 border-purple-200',
    other: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return categoryMap[category];
}

export const CATEGORY_LIST: { value: FoodCategory; label: string; emoji: string }[] = [
  { value: 'snack', label: '零食', emoji: '🍪' },
  { value: 'medicine', label: '药品', emoji: '💊' },
  { value: 'drink', label: '饮品', emoji: '🥤' },
  { value: 'other', label: '其他', emoji: '📦' },
];
