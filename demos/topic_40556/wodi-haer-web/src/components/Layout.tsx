import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore, useBabyStore } from '../store';
import { useAuth } from '../hooks/useAuth';

// 根据时间返回问候语
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

// 计算月龄
function calcAge(birthDate: string): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 0) return '';
  if (months >= 12) return `${Math.floor(months / 12)}岁`;
  return `${months}个月`;
}

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const baby = useBabyStore((s) => s.baby);
  const { handleLogout } = useAuth();

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/knowledge', label: '知识库', icon: '📚' },
    { path: '/news', label: '动态', icon: '📰' },
    { path: '/record', label: '记录', icon: '📝' },
    { path: '/vaccine', label: '疫苗', icon: '💉' },
    { path: '/milestone', label: '里程碑', icon: '🏆' },
    { path: '/profile', label: '我的', icon: '👤' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const onLogout = () => {
    handleLogout();
    navigate('/login');
  };

  const babyAge = baby?.birthDate ? calcAge(baby.birthDate) : '';

  return (
    <div className="min-h-screen pb-20">
      {/* 顶部用户信息栏 */}
      <div className="bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-soft-blue to-soft-pink flex items-center justify-center text-lg flex-shrink-0">
            {baby ? '👶' : '👤'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {getGreeting()}，{user?.nickname || '用户'}
            </p>
            {baby ? (
              <p className="text-xs text-text-secondary truncate">
                👶 {baby.name || '宝宝'} · {baby.gender}{babyAge ? ` · ${babyAge}` : ''}
              </p>
            ) : (
              <p className="text-xs text-ice-blue">点击"我的"添加宝宝信息</p>
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-text-light hover:text-red-400 transition-colors px-3 py-1 rounded-full hover:bg-red-50 active:scale-95"
        >
          退出
        </button>
      </div>

      {/* 主内容区 */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-xl border-t border-soft-blue/30 shadow-lg z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-full max-w-2xl mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center px-3 py-2 transition-all duration-300 rounded-xl ${
                  active
                    ? 'text-soft-blue scale-110 -translate-y-1'
                    : 'text-text-secondary hover:text-soft-blue/70'
                }`}
              >
                <span className={`text-2xl mb-0.5 transition-transform ${active ? 'animate-bounce' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-xs ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default Layout;
