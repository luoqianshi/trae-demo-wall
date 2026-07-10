'use client';

import { useState, useEffect, useCallback } from 'react';

const LAST_ACTIVE_KEY = 'last_active_date';
const RETURN_THRESHOLD_DAYS = 3;

export interface ReturnState {
  isReturning: boolean;
  daysInactive: number;
  markActive: () => void;
  dismissWelcome: () => void;
}

export function useReturnDetection(): ReturnState {
  const [isReturning, setIsReturning] = useState(false);
  const [daysInactive, setDaysInactive] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const lastActiveDate = localStorage.getItem(LAST_ACTIVE_KEY);
    // 修复 R8-1: 使用本地日期而非 UTC，避免时区偏差
    const todayD = new Date();
    const today = `${todayD.getFullYear()}-${String(todayD.getMonth() + 1).padStart(2, '0')}-${String(todayD.getDate()).padStart(2, '0')}`;

    if (lastActiveDate) {
      // 修复 R8-1: 附加 T00:00:00 使日期按本地时区解析，而非 UTC 午夜
      const lastDate = new Date(lastActiveDate + 'T00:00:00');
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      setDaysInactive(diffDays);

      if (diffDays >= RETURN_THRESHOLD_DAYS) {
        setIsReturning(true);
        // 修复 R8-2: 回归时不立即更新最后活跃日期，等待 markActive/dismissWelcome 调用
        // 避免 React Strict Mode 双调用或组件 remount 时第二次读到 today 导致 daysInactive=0
        return;
      }
    }

    // 非回归场景下更新最后活跃日期
    localStorage.setItem(LAST_ACTIVE_KEY, today);
  }, []);

  const markActive = useCallback(() => {
    // 修复 R8-1: 使用本地日期，与 effect 中的 today 计算保持一致
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorage.setItem(LAST_ACTIVE_KEY, today);
    setIsReturning(false);
    setDaysInactive(0);
  }, []);

  const dismissWelcome = useCallback(() => {
    setDismissed(true);
    markActive();
  }, [markActive]);

  return {
    isReturning: isReturning && !dismissed,
    daysInactive,
    markActive,
    dismissWelcome,
  };
}
