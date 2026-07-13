import { Link } from 'react-router-dom';
import { PawPrint, BarChart3, Users, CalendarClock, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/schedule', icon: CalendarClock, label: '固定日程' },
  { path: '/corgi', icon: PawPrint, label: '养成' },
  { path: '/friends', icon: Users, label: '好友' },
  { path: '/summary', icon: BarChart3, label: '总结' },
];

export default function BottomNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t-2 border-corgi-yellow/20">
      <div className="max-w-2xl mx-auto px-1 flex items-center justify-around py-1 pb-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all shrink-0',
                isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                  isActive
                    ? 'bg-corgi-orange text-white shadow-soft'
                    : 'text-text-secondary'
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold transition-colors',
                  isActive ? 'text-corgi-dark' : 'text-text-light'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
