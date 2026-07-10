'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Tip {
  day: number;
  category: 'record_tip' | 'feature_discovery' | 'mindset_shift' | 'deep_feature' | 'habit_reinforce';
  title: string;
  content: string;
  emoji: string;
}

const ALL_TIPS: Tip[] = [
  {
    day: 2,
    category: 'record_tip',
    title: '小提示',
    content: '记录不需要完美，\'今天按时起床了\'就是一件值得记录的小成功',
    emoji: '💡',
  },
  {
    day: 4,
    category: 'feature_discovery',
    title: '你知道吗？',
    content: '当你不想动的时候，试试\'拖延急救\'，雪球会带你一步步开始',
    emoji: '🌟',
  },
  {
    day: 7,
    category: 'mindset_shift',
    title: '试试这样想',
    content: '把\'我只做了这么点\'换成\'我做到了这件事\'——这就是正向思维',
    emoji: '🧠',
  },
  {
    day: 14,
    category: 'deep_feature',
    title: '成长报告',
    content: '你的成长报告已生成！点击查看你这两周的变化',
    emoji: '📊',
  },
  {
    day: 21,
    category: 'habit_reinforce',
    title: '21天习惯',
    content: '21天习惯养成理论说，你已经建立了一个新习惯！继续加油',
    emoji: '🏆',
  },
];

const REGISTRATION_DATE_KEY = 'registration_date';
const ONBOARDING_COMPLETED_DATE_KEY = 'onboarding_completed_date';
const TIP_DISMISSED_PREFIX = 'tip_dismissed_';

function getRegistrationDate(): string | null {
  return (
    localStorage.getItem(REGISTRATION_DATE_KEY) ||
    localStorage.getItem(ONBOARDING_COMPLETED_DATE_KEY)
  );
}

function ensureRegistrationDate(): void {
  if (!localStorage.getItem(REGISTRATION_DATE_KEY) && !localStorage.getItem(ONBOARDING_COMPLETED_DATE_KEY)) {
    const completed = localStorage.getItem('onboarding_completed');
    if (completed === 'true') {
      // Onboarding was completed before but no date was stored;
      // store today as the registration date so tips can start working
      localStorage.setItem(REGISTRATION_DATE_KEY, new Date().toISOString().split('T')[0]);
    }
  }
}

function calculateUsageDays(): number {
  const dateStr = getRegistrationDate();
  if (!dateStr) return 0;

  const registrationDate = new Date(dateStr);
  const today = new Date();

  // Normalize both dates to midnight for accurate day difference
  registrationDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - registrationDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays + 1); // Day 1 = registration day
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function useTips() {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    ensureRegistrationDate();

    const usageDays = calculateUsageDays();
    const tip = ALL_TIPS.find((t) => t.day === usageDays) ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentTip(tip);

    if (tip) {
      const dismissedKey = `${TIP_DISMISSED_PREFIX}${getTodayKey()}`;
      const isDismissed = localStorage.getItem(dismissedKey) === 'true';
      setDismissed(isDismissed);
    } else {
      setDismissed(true);
    }
  }, []);

  const dismissTip = useCallback(() => {
    const dismissedKey = `${TIP_DISMISSED_PREFIX}${getTodayKey()}`;
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  }, []);

  return {
    currentTip,
    allTips: ALL_TIPS,
    dismissed,
    dismissTip,
  };
}
