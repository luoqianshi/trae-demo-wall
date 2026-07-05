// 通用布局 - 苹果风浅色侧边导航

import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  ScanSearch,
  MessageSquare,
  PencilRuler,
  Bookmark,
  LogOut,
  User as UserIcon,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";
import BrandLogo from "./BrandLogo";
import { useStore } from "@/store/useStore";

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: Home, end: true },
  { to: "/recognition", label: "作业识别", icon: ScanSearch },
  { to: "/tutor", label: "交互答疑", icon: MessageSquare },
  { to: "/cad", label: "CAD 画板", icon: PencilRuler },
  { to: "/templates", label: "模板库", icon: Bookmark },
];

export default function Layout() {
  const user = useStore((s) => s.user);
  const init = useStore((s) => s.init);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      init();
    }
  }, [init, user]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* 侧边栏 - 桌面端 */}
      <aside className="hidden md:flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="px-5 py-5 border-b border-gray-100">
          <BrandLogo size="sm" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-apple-50 text-apple-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 用户信息 */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-apple-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-apple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 truncate font-medium">{user.username}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-apple-500 hover:bg-apple-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 移动端顶栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <BrandLogo size="sm" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -mr-2 text-gray-600"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="px-3 pb-3 space-y-1 border-t border-gray-100 pt-2 animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${
                    isActive ? "bg-apple-50 text-apple-600 font-medium" : "text-gray-600"
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-500"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-16">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
