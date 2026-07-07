import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useFoodStore } from '@/store/useFoodStore';
import { getTodayDateString, CATEGORY_LIST } from '@/utils/dateUtils';
import type { FoodCategory } from '@/types/food';
import { cn } from '@/lib/utils';

export default function AddFoodForm() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('snack');
  const [expiryDate, setExpiryDate] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const addFood = useFoodStore((state) => state.addFood);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expiryDate) return;

    setIsAnimating(true);
    addFood(name, category, expiryDate);
    setName('');
    setCategory('snack');
    setExpiryDate('');

    setTimeout(() => setIsAnimating(false), 300);
  };

  const today = getTodayDateString();

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700',
        'transition-all duration-300',
        isAnimating && 'scale-[1.01]'
      )}
    >
      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="食品名称"
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-500 outline-none transition-all"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FoodCategory)}
            className="w-32 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-none text-gray-700 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-500 outline-none transition-all cursor-pointer"
          >
            {CATEGORY_LIST.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={dateInputRef}
              type="date"
              value={expiryDate}
              min={today}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-none text-gray-700 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-500 outline-none transition-all"
            />
            {!expiryDate && (
              <div
                className="absolute inset-0 flex items-center px-4 pointer-events-none"
                onClick={() => dateInputRef.current?.showPicker?.()}
              >
                <span className="text-gray-400 dark:text-gray-500 text-sm">点击此处添加过期日期</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !expiryDate}
            className={cn(
              'px-6 py-3 rounded-xl font-medium text-white',
              'bg-green-600 hover:bg-green-700',
              'disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed',
              'transition-all duration-200 flex items-center gap-2'
            )}
          >
            <Plus size={18} />
            添加
          </button>
        </div>
      </div>
    </form>
  );
}
