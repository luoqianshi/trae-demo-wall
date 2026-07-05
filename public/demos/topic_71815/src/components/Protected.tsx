import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedProps {
  children: ReactNode;
}

// 路由守卫：未登录跳转到 /login
export default function Protected({ children }: ProtectedProps) {
  const token = useAuthStore((s) => s.token);
  const loc = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  return <>{children}</>;
}
