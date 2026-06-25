import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Home, RotateCcw } from "@/lib/icons";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import CursorGlow from "@/components/CursorGlow";

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function Layout({ children, showNav = true }: LayoutProps) {
  const location = useLocation();
  const reset = useAppStore((s) => s.reset);
  const hasInput = useAppStore((s) => s.hasInput);
  const browseMode = useAppStore((s) => s.browseMode);

  const navItems = [
    { path: "/", label: "首页", icon: Home },
    { path: "/input", label: "信息输入", icon: Compass },
    { path: "/results", label: "职业推荐", icon: Compass, disabled: !hasInput && !browseMode },
    { path: "/report", label: "体验报告", icon: Compass, disabled: !hasInput },
  ];

  return (
    <div className="relative min-h-screen">
      {/* 全局鼠标光辉 */}
      <CursorGlow />

      {/* 顶部导航 */}
      {showNav && (
        <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-space-900/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neon-cyan/40 bg-neon-cyan/10">
                <span className="font-display text-sm font-bold text-neon-cyan">FC</span>
                <div className="absolute inset-0 rounded-lg bg-neon-cyan/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
              </div>
              <div className="hidden flex-col leading-none sm:flex">
                <span className="font-display text-sm font-bold tracking-wider text-ink-100">
                  FUTURE CAREER
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-ink-300">
                  AI 体验馆 v1.0
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                if (item.disabled) {
                  return (
                    <span
                      key={item.path}
                      aria-label={item.label}
                      className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-2 text-sm text-ink-400 opacity-50"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.label}</span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-label={item.label}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-all duration-300",
                      isActive
                        ? "bg-neon-cyan/10 text-neon-cyan"
                        : "text-ink-300 hover:bg-white/5 hover:text-ink-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
              {hasInput && (
                <button
                  onClick={() => {
                    if (confirm("确定要重新开始吗？所有数据将被清除。")) {
                      reset();
                      window.location.href = "/";
                    }
                  }}
                  className="ml-2 flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-sm text-ink-300 transition-all hover:border-neon-magenta/40 hover:text-neon-magenta"
                  title="重置"
                  aria-label="重置体验"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden md:inline">重置</span>
                </button>
              )}
            </nav>
          </div>
        </header>
      )}

      {/* 主内容 */}
      <main className={cn(showNav && "pt-16")}>{children}</main>

      {/* 底部 */}
      <footer className="no-print relative z-10 border-t border-white/[0.04] bg-space-900/30 px-4 py-6 text-center backdrop-blur-sm lg:px-8">
        <p className="font-mono text-xs text-ink-400">
          <span className="text-neon-cyan">●</span> TRAE AI 创造力大赛参赛作品 · AI 未来职业体验馆 ·
          让每个年轻人看见未来
        </p>
      </footer>
    </div>
  );
}
