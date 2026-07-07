import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import AddFoodForm from '@/components/AddFoodForm';
import FoodList from '@/components/FoodList';
import { useFoodStore } from '@/store/useFoodStore';

export default function Home() {
  const loadFoods = useFoodStore((state) => state.loadFoods);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [currentDate]);

  const date = new Date(currentDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">食品保质期管理</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">{month}月{day}日 周{weekday}</span>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="设置"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main className="space-y-4">
          <AddFoodForm />
          <FoodList />
        </main>
      </div>
    </div>
  );
}
