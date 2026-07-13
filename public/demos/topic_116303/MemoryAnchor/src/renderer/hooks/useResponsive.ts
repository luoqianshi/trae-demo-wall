import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export function useResponsive(): ResponsiveInfo {
  const [responsive, setResponsive] = useState<ResponsiveInfo>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return getResponsiveInfo(width);
  });

  useEffect(() => {
    const handleResize = () => {
      setResponsive(getResponsiveInfo(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return responsive;
}

function getResponsiveInfo(width: number): ResponsiveInfo {
  let breakpoint: Breakpoint;

  if (width < BREAKPOINTS.mobile) {
    breakpoint = 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    breakpoint = 'tablet';
  } else {
    breakpoint = 'desktop';
  }

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width,
  };
}