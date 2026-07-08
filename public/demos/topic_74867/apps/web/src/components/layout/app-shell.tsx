'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FloatingDock from './floating-dock';
import InkDrop from '../ink/ink-drop';
import BackgroundAmbient from '../effects/background-ambient';
import { useAuthStore, initAuth } from '@/stores/auth-store';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <div className="relative w-full min-h-screen bg-background">
      {/* Ambient background - fixed behind content */}
      <div className="fixed inset-0 z-0">
        <BackgroundAmbient />
      </div>

      {/* Main content area - scrollable */}
      <main className="relative z-10 w-full min-h-screen">
        {children}
      </main>

      {/* Floating Dock - fixed above content */}
      <FloatingDock />

      {/* Ink Drop (时墨) - fixed above content */}
      <InkDrop />
    </div>
  );
}
