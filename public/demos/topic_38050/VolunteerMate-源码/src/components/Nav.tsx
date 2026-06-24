import { Home, Calendar, User, BookOpen, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Nav() {
  const { currentPage, setPage } = useStore();

  const navItems = [
    { id: 'home' as const, icon: Home, label: '首页' },
    { id: 'ai' as const, icon: Sparkles, label: 'AI 助手' },
    { id: 'calendar' as const, icon: Calendar, label: '日历' },
    { id: 'knowledge' as const, icon: BookOpen, label: '知识' },
    { id: 'profile' as const, icon: User, label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 z-40">
      <div className="max-w-lg mx-auto flex justify-around">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          const isAI = item.id === 'ai';
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex flex-col items-center py-2 px-2 sm:px-3 rounded-xl transition-all ${
                isActive
                  ? (isAI ? 'text-indigo-600' : 'text-emerald-600')
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? (isAI ? 'bg-gradient-to-br from-indigo-100 to-purple-100' : 'bg-emerald-50')
                    : ''
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
