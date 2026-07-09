import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PenTool, 
  Eye, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Brain,
  Sparkles,
  History
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/history', icon: History, label: '历史沟通' },
  { path: '/new', icon: Plus, label: '新建项目' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="animation-slide-up">
                <h1 className="text-lg font-bold text-gray-900">智析原型</h1>
                <p className="text-xs text-gray-500">AI驱动的需求分析与原型设计</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary-50 text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}

          {!collapsed && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="px-3 text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">快速功能</p>
              <button
                onClick={() => navigate('/chat-analysis')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                <Brain className="w-5 h-5" />
                <span className="font-medium">需求分析</span>
              </button>
              <button
                onClick={() => navigate('/chat-prototype')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                <PenTool className="w-5 h-5" />
                <span className="font-medium">原型设计</span>
              </button>
            </div>
          )}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5 mx-auto" />}
        </button>
      </div>
    </aside>
  );
};
