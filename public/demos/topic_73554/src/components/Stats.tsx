import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { FoodItemWithStatus, FilterType, FoodCategory } from '@/types/food';
import CategoryModal from './CategoryModal';
import { cn } from '@/lib/utils';

interface StatsProps {
  foods: FoodItemWithStatus[];
  usedCount: number;
  wastedCount: number;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  activeCategoryFilter: FoodCategory | 'all';
  onCategoryFilterChange: (category: FoodCategory | 'all') => void;
}

interface FilterTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
  dotColor: string;
  bgClass: string;
  textClass: string;
}

function FilterTab({ label, active, onClick, dotColor, bgClass, textClass }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0',
        'flex items-center gap-2',
        active
          ? `${bgClass} ${textClass}`
          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', dotColor)}></span>
      <span>{label}</span>
    </button>
  );
}

export default function Stats({
  foods,
  usedCount,
  wastedCount,
  activeFilter,
  onFilterChange,
  activeCategoryFilter,
  onCategoryFilterChange,
}: StatsProps) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const total = foods.length;
  const expired = foods.filter((f) => f.status === 'expired').length;
  const warning = foods.filter((f) => f.status === 'warning').length;
  const fresh = foods.filter((f) => f.status === 'fresh' || f.status === 'normal').length;

  const filters: { key: FilterType; label: string; dotColor: string; bgClass: string; textClass: string }[] = [
    { key: 'all', label: `全部 ${total}`, dotColor: 'bg-gray-400', bgClass: 'bg-gray-200 dark:bg-gray-600', textClass: 'text-gray-700 dark:text-gray-200' },
    { key: 'warning', label: `即将过期 ${warning}`, dotColor: 'bg-orange-400', bgClass: 'bg-orange-100 dark:bg-orange-900/30', textClass: 'text-orange-600 dark:text-orange-400' },
    { key: 'expired', label: `已过期 ${expired}`, dotColor: 'bg-red-400', bgClass: 'bg-red-50 dark:bg-red-900/30', textClass: 'text-red-500 dark:text-red-400' },
    { key: 'fresh', label: `已消耗 ${usedCount + wastedCount}`, dotColor: 'bg-green-400', bgClass: 'bg-green-50 dark:bg-green-900/30', textClass: 'text-green-500 dark:text-green-400' },
  ];

  const categoryLabelMap: Record<FoodCategory | 'all', string> = {
    all: '全部分类',
    snack: '零食',
    drink: '饮品',
    medicine: '药品',
    other: '其他',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <FilterTab
            key={filter.key}
            label={filter.label}
            active={activeFilter === filter.key}
            onClick={() => onFilterChange(filter.key)}
            dotColor={filter.dotColor}
            bgClass={filter.bgClass}
            textClass={filter.textClass}
          />
        ))}
        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0',
            'flex items-center gap-2',
            activeCategoryFilter !== 'all'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          <SlidersHorizontal size={14} />
          <span>{categoryLabelMap[activeCategoryFilter]}</span>
        </button>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        activeCategory={activeCategoryFilter}
        onSelect={onCategoryFilterChange}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">{usedCount}</div>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">已使用</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">{wastedCount}</div>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">已浪费</div>
        </div>
      </div>
    </div>
  );
}
