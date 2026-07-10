'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavSnowball } from './NavSnowball';
import { useSnowball } from '@/contexts/SnowballContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { stats, stage, stageLabel, progress } = useSnowball();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* 修复 H-7: 使用 Link 替代 a 标签，启用客户端路由 */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFB6C1] to-[#87CEEB] rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                <span className="text-xl">❄️</span>
              </div>
              <span className="text-2xl font-bold text-[#FFB6C1] tracking-tight">雪球日记</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[
                { href: '/', label: '首页' },
                { href: '/tasks', label: '任务' },
                { href: '/records', label: '记录' },
                { href: '/review', label: '回顾' },
                { href: '/profile', label: '个人' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive(item.href) ? 'bg-[#FFB6C1]/15 text-[#FFB6C1] font-semibold' : 'text-gray-600 hover:text-[#FFB6C1] hover:bg-[#FFB6C1]/10'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center">
            <NavSnowball
              todayGrowth={stats.todayScore}
              totalGrowth={stats.totalScore}
              currentStage={stage}
              streakDays={stats.todayStreak}
            />
          </div>
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100">
          <div className="px-4 pt-4 pb-3 space-y-2">
            {[
              { href: '/', label: '首页' },
              { href: '/tasks', label: '任务' },
              { href: '/records', label: '记录' },
              { href: '/review', label: '回顾' },
              { href: '/profile', label: '个人' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive(item.href) ? 'bg-[#FFB6C1]/15 text-[#FFB6C1] font-semibold' : 'text-gray-700 hover:text-[#FFB6C1] hover:bg-[#FFB6C1]/10'}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
