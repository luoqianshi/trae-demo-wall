import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ScanLine, ListChecks, BookMarked, User } from 'lucide-react';
import Sidebar from './Sidebar';
import SealStamp from './SealStamp';
import { chineseDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: '拾诵台', icon: Home },
  { to: '/scan', label: '扫描', icon: ScanLine },
  { to: '/tasks', label: '任务', icon: ListChecks },
  { to: '/notebook', label: '错题本', icon: BookMarked },
  { to: '/profile', label: '我的', icon: User },
];

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        {/* 顶部报头 */}
        <header className="px-6 md:px-12 pt-8 pb-6 border-b border-ink/8 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 animate-ink-bloom">
              <SealStamp text="诵" size="md" rotate={-4} />
              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className="font-display text-3xl md:text-4xl text-ink leading-none">
                    {title ?? '拾诵'}
                  </h1>
                  {subtitle && (
                    <span className="font-en text-xs text-ink-mute tracking-widest uppercase">
                      {subtitle}
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-mute mt-1.5 tracking-wide">
                  {chineseDate()} · 现场记忆辅助
                </div>
              </div>
            </div>
          </div>
          {/* 装饰：右侧朱砂竖线 */}
          <div className="absolute right-6 top-8 flex flex-col items-center gap-2 opacity-60">
            <div className="w-px h-12 bg-cinnabar/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-cinnabar/60" />
            <div className="w-px h-8 bg-cinnabar/30" />
          </div>
        </header>

        <div className="flex-1 px-6 md:px-12 py-8 max-w-6xl w-full mx-auto">{children}</div>

        {/* 移动端底部 Tab */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-ink/10 bg-paper/95 backdrop-blur z-30">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5',
                  active ? 'text-cinnabar' : 'text-ink-mute'
                )}
              >
                <Icon size={18} strokeWidth={1.6} />
                <span className="text-[10px]">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
