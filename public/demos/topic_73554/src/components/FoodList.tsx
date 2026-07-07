import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import FoodCard from './FoodCard';
import Stats from './Stats';
import { useFoodStore } from '@/store/useFoodStore';
import type { FilterType, FoodItemWithStatus, FoodCategory } from '@/types/food';

export default function FoodList() {
  const { getEnrichedFoods, markAsUsed, markAsWasted, clearAllFoods, getStats } = useFoodStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<FoodCategory | 'all'>('all');

  const enrichedFoods = getEnrichedFoods();
  const stats = getStats();

  const filteredFoods = enrichedFoods.filter((food) => {
    const statusMatch = (() => {
      switch (activeFilter) {
        case 'fresh':
          return food.status === 'fresh' || food.status === 'normal';
        case 'warning':
          return food.status === 'warning';
        case 'expired':
          return food.status === 'expired';
        default:
          return true;
      }
    })();

    const categoryMatch = activeCategoryFilter === 'all' || food.category === activeCategoryFilter;

    return statusMatch && categoryMatch;
  });

  const handleMarkUsed = (food: FoodItemWithStatus) => {
    if (window.confirm(`确认已将「${food.name}」使用完毕？`)) {
      markAsUsed(food);
    }
  };

  const handleMarkWasted = (food: FoodItemWithStatus) => {
    if (window.confirm(`确认「${food.name}」已过期浪费，需要删除？`)) {
      markAsWasted(food);
    }
  };

  const handleClearAll = () => {
    if (enrichedFoods.length === 0) return;
    if (window.confirm('确定要清空所有食品记录吗？此操作不可恢复。')) {
      clearAllFoods();
    }
  };

  return (
    <div className="space-y-4">
      <Stats
        foods={enrichedFoods}
        usedCount={stats.used}
        wastedCount={stats.wasted}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeCategoryFilter={activeCategoryFilter}
        onCategoryFilterChange={setActiveCategoryFilter}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">食品清单</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 dark:text-gray-500">({filteredFoods.length})</span>
          {enrichedFoods.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
              清空
            </button>
          )}
        </div>
      </div>

      {enrichedFoods.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400 dark:text-gray-500 mb-1">暂无食品记录</p>
          <p className="text-xs text-gray-300 dark:text-gray-600">点击上方添加你的第一件食品</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 dark:text-gray-500">暂无相关食品</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFoods.map((food, index) => (
            <FoodCard
              key={food.id}
              food={food}
              index={index}
              onMarkUsed={handleMarkUsed}
              onMarkWasted={handleMarkWasted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
