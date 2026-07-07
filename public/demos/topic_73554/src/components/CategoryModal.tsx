import { X } from 'lucide-react';
import type { FoodCategory } from '@/types/food';
import { cn } from '@/lib/utils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: FoodCategory | 'all';
  onSelect: (category: FoodCategory | 'all') => void;
}

interface CategoryOptionProps {
  label: string;
  active: boolean;
  onClick: () => void;
  dotColor: string;
  bgClass: string;
  textClass: string;
}

function CategoryOption({ label, active, onClick, dotColor, bgClass, textClass }: CategoryOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-4 rounded-xl transition-all',
        active
          ? `${bgClass} border border-current`
          : 'bg-gray-50 dark:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
      )}
    >
      <span className={cn('w-3 h-3 rounded-full', dotColor)}></span>
      <span className={cn('font-medium flex-1 text-left', active ? textClass : 'text-gray-700 dark:text-gray-200')}>
        {label}
      </span>
      {active && (
        <span className={cn('text-sm font-bold', textClass)}>✓</span>
      )}
    </button>
  );
}

export default function CategoryModal({ isOpen, onClose, activeCategory, onSelect }: CategoryModalProps) {
  if (!isOpen) return null;

  const categories: { key: FoodCategory | 'all'; label: string; dotColor: string; bgClass: string; textClass: string }[] = [
    { key: 'all', label: '全部分类', dotColor: 'bg-gray-400', bgClass: 'bg-gray-100 dark:bg-gray-600', textClass: 'text-gray-700 dark:text-gray-200' },
    { key: 'snack', label: '零食', dotColor: 'bg-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-900/30', textClass: 'text-amber-600 dark:text-amber-400' },
    { key: 'drink', label: '饮品', dotColor: 'bg-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400' },
    { key: 'medicine', label: '药品', dotColor: 'bg-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-900/30', textClass: 'text-purple-600 dark:text-purple-400' },
    { key: 'other', label: '其他', dotColor: 'bg-teal-400', bgClass: 'bg-teal-50 dark:bg-teal-900/30', textClass: 'text-teal-600 dark:text-teal-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm mx-4 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">选择分类</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <CategoryOption
              key={cat.key}
              label={cat.label}
              active={activeCategory === cat.key}
              onClick={() => {
                onSelect(cat.key);
                onClose();
              }}
              dotColor={cat.dotColor}
              bgClass={cat.bgClass}
              textClass={cat.textClass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
