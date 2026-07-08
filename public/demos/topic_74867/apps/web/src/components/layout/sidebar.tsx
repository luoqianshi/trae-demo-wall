'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { navItems } from '@/lib/nav';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Mobile open state. */
  open: boolean;
  /** Close handler for mobile. */
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <aside
          className={cn(
            'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface/80 backdrop-blur-xl',
            'transition-transform duration-300 lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2" onClick={onClose}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-[#5e5ce6]">
                <span className="text-sm font-bold text-white">E</span>
              </span>
              <span className="text-lg font-semibold tracking-tight">
                <span className="gradient-text">EchoLife</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text lg:hidden"
              aria-label="关闭菜单"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent/10 text-text'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-accent' : 'text-text-muted group-hover:text-text',
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User card at bottom */}
          <div className="border-t border-border p-3">
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-hover"
            >
              <Avatar
                src={user?.profile.avatarUrl}
                name={user?.profile.nickname}
                size="md"
                status="online"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">
                  {user?.profile.nickname || '未登录'}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {user?.email}
                </p>
              </div>
            </Link>
          </div>
        </aside>
      </AnimatePresence>
    </>
  );
}
