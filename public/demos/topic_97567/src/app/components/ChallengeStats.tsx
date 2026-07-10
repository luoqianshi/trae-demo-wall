'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChallengeStatsProps {
  stats: {
    completed_count: number;
    streak_days: number;
    longest_streak: number;
    total_snowball: number;
    badge_progress: {
      bronze: { earned: number; total: number };
      silver: { earned: number; total: number };
      gold: { earned: number; total: number };
    };
  } | null;
}

const STAT_CARDS = [
  { key: 'completed_count', label: '已完成挑战', icon: '' },
  { key: 'streak_days', label: '连续挑战', icon: '🔥' },
  { key: 'longest_streak', label: '最长连续', icon: '' },
  { key: 'total_snowball', label: '总获得雪球', icon: '❄️' },
] as const;

const BADGE_BARS = [
  { key: 'bronze' as const, label: '⭐青铜', barColor: 'bg-gradient-to-r from-[#FFB6C1] to-[#FF69B4]', trackColor: 'bg-[#FFB6C1]/20' },
  { key: 'silver' as const, label: '💎白银', barColor: 'bg-gradient-to-r from-[#87CEEB] to-[#4A9BD9]', trackColor: 'bg-[#87CEEB]/20' },
  { key: 'gold' as const, label: '👑黄金', barColor: 'bg-gradient-to-r from-[#FFD700] to-[#FFA500]', trackColor: 'bg-[#FFD700]/20' },
];

const ChallengeStats = React.memo(({ stats }: ChallengeStatsProps) => {
  if (!stats) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
        <div className="text-center py-8 text-sm text-gray-400">
          暂无统计数据
        </div>
      </div>
    );
  }

  const statValues: Record<string, number> = {
    completed_count: stats.completed_count,
    streak_days: stats.streak_days,
    longest_streak: stats.longest_streak,
    total_snowball: stats.total_snowball,
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4">挑战统计</h2>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {STAT_CARDS.map(card => (
          <div
            key={card.key}
            className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-2xl font-bold text-gray-800">{statValues[card.key]}</span>
              {card.icon && <span className="text-base">{card.icon}</span>}
            </div>
            <span className="text-xs text-gray-400">{card.label}</span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-3">徽章收集进度</h3>
        <div className="space-y-3">
          {BADGE_BARS.map(bar => {
            const progress = stats.badge_progress[bar.key];
            const percent = progress.total > 0
              ? Math.min(Math.round((progress.earned / progress.total) * 100), 100)
              : 0;

            return (
              <div key={bar.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">{bar.label}</span>
                  <span className="text-xs text-gray-400">
                    {progress.earned}/{progress.total}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${bar.trackColor} overflow-hidden`}>
                  <motion.div
                    className={`h-full rounded-full ${bar.barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ChallengeStats.displayName = 'ChallengeStats';

export default ChallengeStats;
