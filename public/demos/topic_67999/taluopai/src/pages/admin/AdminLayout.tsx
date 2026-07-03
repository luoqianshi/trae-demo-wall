import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, ScrollText, BarChart3, LogOut } from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/admin/records', icon: ScrollText, label: '抽取记录' },
  { path: '/admin/statistics', icon: BarChart3, label: '统计分析' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetch('/api/admin/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('token');
          navigate('/admin/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/admin/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0d0520' }}>
      {/* Sidebar */}
      <aside className="w-56 min-h-screen p-4 flex flex-col" style={{ background: '#1a0a2e', borderRight: '1px solid rgba(212,168,83,0.1)' }}>
        <div className="mb-8 px-2">
          <h1 className="text-lg font-display text-mystic-gold tracking-wider">命运之轮</h1>
          <p className="text-xs text-mystic-silver/40">管理后台</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-mystic-gold/10 text-mystic-gold border border-mystic-gold/20'
                    : 'text-mystic-silver/60 hover:text-mystic-silver hover:bg-mystic-purple/10'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mystic-silver/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}