'use client';
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

export function usePageView(pageName: string) {
  useEffect(() => {
    analytics.trackPageView(pageName);
  }, [pageName]);
}
