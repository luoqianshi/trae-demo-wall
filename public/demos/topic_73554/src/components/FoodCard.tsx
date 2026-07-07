import { Trash2, Check } from 'lucide-react';
import type { FoodItemWithStatus } from '@/types/food';
import { formatDate, getCategoryText } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface FoodCardProps {
  food: FoodItemWithStatus;
  index: number;
  onMarkUsed: (food: FoodItemWithStatus) => void;
  onMarkWasted: (food: FoodItemWithStatus) => void;
}

export default function FoodCard({ food, index, onMarkUsed, onMarkWasted }: FoodCardProps) {
  const categoryText = getCategoryText(food.category);

  const isExpired = food.status === 'expired';
  const isWarning = food.status === 'warning';
  const isToday = food.daysRemaining === 0;

  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400">
          已过期
        </span>
      );
    }
    if (isWarning) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400">
          即将过期
        </span>
      );
    }
    return null;
  };

  const getDaysText = () => {
    if (isExpired) {
      return `${Math.abs(food.daysRemaining)}天前过期`;
    }
    if (isToday) {
      return '今天过期';
    }
    return `${food.daysRemaining}天后过期`;
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700',
        'transition-all duration-200 hover:shadow-sm',
        'animate-fadeInUp'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-800 dark:text-gray-100">{food.name}</h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-400 dark:text-gray-500">{categoryText}</span>
              <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(food.expiryDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={cn(
            'text-sm font-medium',
            isExpired && 'text-red-500 dark:text-red-400',
            isWarning && 'text-orange-500 dark:text-orange-400',
            !isExpired && !isWarning && 'text-gray-500 dark:text-gray-400'
          )}>
            {getDaysText()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMarkUsed(food)}
              className="p-2 text-gray-300 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
              title="已使用"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => onMarkWasted(food)}
              className="p-2 text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
              title="浪费/删除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
