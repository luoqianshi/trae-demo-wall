import { NavLink, useLocation } from 'react-router-dom';
import { Home, ScanLine, ListChecks, BookMarked, User } from 'lucide-react';
import SealStamp from './SealStamp';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: '拾诵台', en: 'HOME', icon: Home },
  { to: '/scan', label: '扫描', en: 'SCAN', icon: ScanLine },
  { to: '/tasks', label: '任务', en: 'TASKS', icon: ListChecks },
  { to: '/notebook', label: '错题本', en: 'NOTEBOOK', icon: BookMarked },
  { to: '/profile', label: '我的', en: 'PROFILE', icon: User },
];

export default function Sidebar() {
  const loc = useLocation();
  return (
    <aside className="hidden md:flex flex-col items-center justify-between py-8 w-20 border-r border-ink/10 bg-paper/40 backdrop-blur-sm sticky top-0 h-screen z-20">
      <div className="flex flex-col items-center gap-2">
        <SealStamp text="诵" size="md" rotate={-4} />
        <div className="font-display text-base text-ink leading-none mt-1">拾诵</div>
        <div className="font-en text-[9px] text-ink-mute tracking-widest">SHISONG</div>
      </div>

      <nav className="flex flex-col gap-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-1 w-16 py-3 rounded-sm transition-all',
                active
                  ? 'bg-ink text-paper shadow-press'
                  : 'text-ink-mute hover:text-ink hover:bg-ink/5'
              )}
              title={item.label}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span className="text-[10px] font-sans tracking-wide">{item.label}</span>
              {active && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-cinnabar" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-px bg-ink/20" />
        <div className="font-en text-[9px] text-ink-mute tracking-widest rotate-90 origin-center mt-4 whitespace-nowrap">
          EST. 2026
        </div>
      </div>
    </aside>
  );
}
