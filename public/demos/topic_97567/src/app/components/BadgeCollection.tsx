'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Badge {
  id: string;
  name: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold';
  description: string;
  unlocked_at?: string;
}

interface BadgeCollectionProps {
  badges: Badge[];
  fragmentCount?: number;
}

const LEVEL_CONFIG: Record<string, {
  label: string;
  tag: string;
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  iconColor: string;
}> = {
  bronze: {
    label: '⭐青铜',
    tag: '⭐',
    borderColor: '#FFB6C1',
    glowColor: '0 0 12px rgba(255,182,193,0.4)',
    bgGradient: 'from-[#FFF5F7] to-[#FFF0F3]',
    iconColor: '#FFB6C1',
  },
  silver: {
    label: '💎白银',
    tag: '💎',
    borderColor: '#87CEEB',
    glowColor: '0 0 12px rgba(135,206,235,0.4)',
    bgGradient: 'from-[#F0F8FF] to-[#E8F4FD]',
    iconColor: '#87CEEB',
  },
  gold: {
    label: '👑黄金',
    tag: '👑',
    borderColor: '#FFD700',
    glowColor: '0 0 16px rgba(255,215,0,0.5)',
    bgGradient: 'from-[#FFFEF5] to-[#FFF8DC]',
    iconColor: '#FFD700',
  },
};

type FilterType = 'all' | 'bronze' | 'silver' | 'gold';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'bronze', label: '⭐青铜' },
  { key: 'silver', label: '💎白银' },
  { key: 'gold', label: '👑黄金' },
];

const BadgeCollection = React.memo(({ badges, fragmentCount = 0 }: BadgeCollectionProps) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredBadges = useMemo(() => {
    if (filter === 'all') return badges;
    return badges.filter(b => b.level === filter);
  }, [badges, filter]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">徽章收集</h2>
        {fragmentCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">碎片 ×{fragmentCount}</span>
            <span className="text-[10px] text-gray-400">（9个碎片可合成1个白银徽章）</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              filter === opt.key
                ? 'bg-gray-800 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredBadges.map(badge => {
          const levelConfig = LEVEL_CONFIG[badge.level] || LEVEL_CONFIG.bronze;
          const isUnlocked = !!badge.unlocked_at;

          if (isUnlocked) {
            return (
              <motion.div
                key={badge.id}
                className={`bg-gradient-to-br ${levelConfig.bgGradient} rounded-2xl p-3 border border-white/60 flex flex-col items-center text-center relative`}
                style={{ boxShadow: levelConfig.glowColor }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-xs font-bold text-gray-700 leading-tight mb-0.5">{badge.name}</span>
                <span className="text-[10px] text-gray-400">{formatDate(badge.unlocked_at!)}</span>
              </motion.div>
            );
          }

          return (
            <div
              key={badge.id}
              className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col items-center text-center opacity-60"
            >
              <span className="text-2xl mb-1 grayscale opacity-30">🔒</span>
              <span className="text-xs font-bold text-gray-400 leading-tight">{badge.name}</span>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          暂无徽章
        </div>
      )}
    </div>
  );
});

BadgeCollection.displayName = 'BadgeCollection';

export default BadgeCollection;
