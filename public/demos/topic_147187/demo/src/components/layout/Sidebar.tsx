import { Home, Video, FileText, User, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const tabItems = [
  { icon: Home, path: '/', label: '首页' },
  { icon: Video, path: '/classroom/1', label: '课堂' },
  { type: 'center' as const, label: '创建' },
  { icon: FileText, path: '/records', label: '记录' },
  { icon: User, path: '/profile', label: '我的' },
];

export const TabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 z-40 shrink-0">
      <div className="relative grid grid-cols-5 h-16">
        {tabItems.map((item) => {
          if ('type' in item && item.type === 'center') {
            return (
              <button
                key="center"
                onClick={() => navigate('/?action=create')}
                className="relative flex flex-col items-center justify-end pb-1"
                aria-label="创建课堂"
              >
                <div className="absolute -top-5 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 active:scale-95 transition-transform">
                  <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-7">
                  {item.label}
                </span>
              </button>
            );
          }

          const Icon = item.icon as typeof Home;
          const path = (item as any).path;
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <div className={`relative p-1 transition-all ${
                isActive ? '-translate-y-0.5' : ''
              }`}>
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <span className="absolute inset-0 -m-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-full -z-10" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {(item as any).label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};