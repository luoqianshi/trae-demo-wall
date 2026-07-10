'use client';

import dynamic from "next/dynamic";
import { useEffect } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { analytics } from "@/lib/analytics";

const ToastProvider = dynamic(
  () => import("./Toast").then((mod) => mod.ToastProvider),
  { ssr: false }
);

const GlobalCelebration = dynamic(
  () => import("./GlobalCelebration"),
  { ssr: false }
);

function AnalyticsTokenSync() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    analytics.setToken(token);
    const handler = () => {
      const newToken = localStorage.getItem('token');
      analytics.setToken(newToken);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return null;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AnalyticsTokenSync />
        <GlobalCelebration />
        {children}
      </ErrorBoundary>
    </ToastProvider>
  );
}
