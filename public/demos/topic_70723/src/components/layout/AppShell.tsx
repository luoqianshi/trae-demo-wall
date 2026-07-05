import { type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  Library,
  RefreshCw,
  BarChart3,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "工作台", icon: LayoutDashboard },
  { to: "/upload", label: "上传整理", icon: UploadCloud },
  { to: "/library", label: "错题库", icon: Library },
  { to: "/review", label: "复习中心", icon: RefreshCw },
  { to: "/stats", label: "学习统计", icon: BarChart3 },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "工作台", subtitle: "今日整理概览与快捷入口" },
  "/upload": { title: "上传整理", subtitle: "拍照或拖拽上传，AI 自动识别归档" },
  "/library": { title: "错题库", subtitle: "多维度筛选与查看历史错题" },
  "/review": { title: "复习中心", subtitle: "智能复习清单与错题重做" },
  "/stats": { title: "学习统计", subtitle: "图表化数据分析与薄弱诊断" },
};

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();
  const { role, setRole, name } = useUserStore();
  const current = PAGE_TITLES[pathname] ?? { title: "AI 作业助手", subtitle: "" };

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 px-4 py-6 sticky top-0 h-screen">
        <div className="glass rounded-4xl p-5 flex-1 flex flex-col">
          {/* 品牌 */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 grid place-items-center text-white shadow-glow-brand">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="title-display text-base font-bold text-ink-900 leading-tight">
                AI 作业助手
              </div>
              <div className="text-[11px] text-ink-400">智能整理 · 高效复习</div>
            </div>
          </div>

          {/* 导航 */}
          <nav className="mt-6 flex-1 flex flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={cn(
                    "relative flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-brand"
                      : "text-ink-600 hover:bg-white/60 hover:text-ink-900",
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* 角色切换 */}
          <div className="mt-4 p-3 rounded-2xl bg-gradient-to-br from-brand-50 to-mint-50 border border-white/70">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-brand-500" />
              <span className="text-xs font-bold text-ink-700">当前身份</span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/70 rounded-xl">
              {(["student", "teacher"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-xs font-bold transition-all",
                    role === r
                      ? "bg-white text-brand-600 shadow-soft"
                      : "text-ink-500 hover:text-ink-700",
                  )}
                >
                  {r === "student" ? "学生" : "教师"}
                </button>
              ))}
            </div>
            <div className="mt-2 px-1 text-[11px] text-ink-500 truncate">
              {role === "student" ? "👤 " : "👨‍🏫 "}
              {name}
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 px-4 lg:px-6 py-4">
          <div className="glass rounded-full px-5 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="title-display text-lg lg:text-xl font-bold text-ink-900 leading-tight truncate">
                {current.title}
              </h1>
              <p className="text-[11px] lg:text-xs text-ink-500 truncate">{current.subtitle}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* 移动端导航 */}
              <nav className="lg:hidden flex items-center gap-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={cn(
                        "w-9 h-9 grid place-items-center rounded-full transition-colors",
                        active ? "bg-brand-500 text-white" : "text-ink-500 hover:bg-white/60",
                      )}
                    >
                      <Icon size={16} />
                    </NavLink>
                  );
                })}
              </nav>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint-50 text-mint-700 text-xs font-bold border border-mint-100">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
                AI 已就绪
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-mint-400 grid place-items-center text-white font-bold text-sm shadow-soft">
                {role === "student" ? "明" : "师"}
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 px-4 lg:px-6 pb-10">{children}</main>
      </div>
    </div>
  );
}
