import { LayoutDashboard, Package, FileText, BarChart3, Settings, Glasses, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';

const menuItems = [
  { icon: LayoutDashboard, path: '/', label: '首页' },
  { icon: Package, path: '/products', label: '商品管理' },
  { icon: FileText, path: '/orders', label: '订单管理' },
  { icon: BarChart3, path: '/stats', label: '销售统计' },
  { icon: Settings, path: '/settings', label: '系统设置' },
  { icon: Glasses, path: '/ar', label: '智能眼镜' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-navy-900 min-h-screen text-white flex flex-col">
      <div className="p-6 border-b border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
            <Glasses className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">智能眼镜</h1>
            <p className="text-navy-300 text-sm">记账助手</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'text-navy-200 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-navy-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-navy-700 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">{user?.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-navy-300 text-sm">{user?.role === 'admin' ? '管理员' : '服务员'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-navy-300 hover:bg-navy-800 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </aside>
  );
};
