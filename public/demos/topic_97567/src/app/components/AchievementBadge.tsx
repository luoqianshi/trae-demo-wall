'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AchievementLevel } from '@/lib/data-models';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    level: AchievementLevel;
    category: string;
    progress?: number;
  };
  unlocked: boolean;
  unlockedAt?: string;
  isNewlyUnlocked?: boolean;
}

// 层级配置
const TIER_CONFIG: Record<AchievementLevel, {
  label: string;
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  lockedBg: string;
  particleColors: string[];
  size: string;
}> = {
  micro: {
    label: '微',
    borderColor: 'border-[#90EE90]',
    glowColor: 'shadow-[0_0_12px_rgba(144,238,144,0.4)]',
    bgGradient: 'from-[#F0FFF0] to-[#E8F5E9]',
    lockedBg: 'bg-gray-50',
    particleColors: ['#90EE90', '#98FB98', '#7CFC00', '#ADFF2F'],
    size: 'text-2xl',
  },
  minor: {
    label: '小',
    borderColor: 'border-[#87CEEB]',
    glowColor: 'shadow-[0_0_14px_rgba(135,206,235,0.4)]',
    bgGradient: 'from-[#F0F8FF] to-[#E0F0FF]',
    lockedBg: 'bg-gray-50',
    particleColors: ['#87CEEB', '#ADD8E6', '#B0E0E6', '#87CEFA'],
    size: 'text-2xl',
  },
  growth: {
    label: '成长',
    borderColor: 'border-[#FFD700]',
    glowColor: 'shadow-[0_0_18px_rgba(255,215,0,0.5)]',
    bgGradient: 'from-[#FFFEF0] to-[#FFF8DC]',
    lockedBg: 'bg-gray-50',
    particleColors: ['#FFD700', '#FFA500', '#FF8C00', '#FFB347'],
    size: 'text-3xl',
  },
  major: {
    label: '大',
    borderColor: 'border-[#FF8C00]',
    glowColor: 'shadow-[0_0_20px_rgba(255,140,0,0.5)]',
    bgGradient: 'from-[#FFF8F0] to-[#FFECD2]',
    lockedBg: 'bg-gray-50',
    particleColors: ['#FF8C00', '#FF6347', '#FFD700', '#FFA500'],
    size: 'text-3xl',
  },
  transformation: {
    label: '蜕变',
    borderColor: 'border-[#FF69B4]',
    glowColor: 'shadow-[0_0_24px_rgba(255,105,180,0.5),0_0_48px_rgba(135,206,235,0.3)]',
    bgGradient: 'from-[#FFF0F5] via-[#F0F8FF] to-[#FFF0F5]',
    lockedBg: 'bg-gray-50',
    particleColors: ['#FF69B4', '#87CEEB', '#FFD700', '#DDA0DD', '#90EE90'],
    size: 'text-3xl',
  },
};

// 粒子组件
function UnlockParticles({ colors, active }: { colors: string[]; active: boolean }) {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 30 + Math.random() * 25;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: colors[i % colors.length],
        size: 3 + Math.random() * 4,
        delay: Math.random() * 0.2,
      };
    });
  }, [colors]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: '50%',
            top: '50%',
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.8,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// 全屏庆祝效果（仅蜕变层级）
function FullScreenCelebration({ active }: { active: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,105,180,0.1) 0%, rgba(135,206,235,0.05) 40%, transparent 70%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {/* 彩虹光圈 */}
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.2, 1], rotate: 360 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <div
              className="w-40 h-40 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #FF69B4, #FFD700, #90EE90, #87CEEB, #DDA0DD, #FF69B4)',
                filter: 'blur(8px)',
                opacity: 0.6,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AchievementBadge({ achievement, unlocked, unlockedAt, isNewlyUnlocked }: AchievementBadgeProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const tier = TIER_CONFIG[achievement.level] || TIER_CONFIG.micro;

  useEffect(() => {
    if (isNewlyUnlocked && unlocked) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isNewlyUnlocked, unlocked]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 已解锁状态
  if (unlocked) {
    return (
      <>
        {achievement.level === 'transformation' && (
          <FullScreenCelebration active={showAnimation} />
        )}
        <motion.div
          className={`relative bg-gradient-to-br ${tier.bgGradient} rounded-2xl shadow-md p-4 border-l-4 ${tier.borderColor} ${showAnimation ? tier.glowColor : ''} transition-shadow hover:shadow-lg overflow-visible`}
          initial={showAnimation ? { scale: 1 } : undefined}
          animate={showAnimation ? {
            scale: [1, 1.15, 1],
          } : undefined}
          transition={showAnimation ? { duration: 0.5, ease: 'easeOut' } : undefined}
        >
          {/* 层级标签 */}
          <div className="absolute -top-2 -right-1">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                achievement.level === 'micro'
                  ? 'bg-[#90EE90]/80 text-green-700'
                  : achievement.level === 'growth'
                  ? 'bg-[#FFD700]/80 text-amber-700'
                  : 'bg-gradient-to-r from-[#FF69B4]/80 to-[#87CEEB]/80 text-white'
              }`}
            >
              {tier.label}
            </span>
          </div>

          <UnlockParticles colors={tier.particleColors} active={showAnimation} />

          <div className="flex items-start gap-3">
            <span className={`${tier.size} ${showAnimation ? 'animate-bounce' : ''}`}>{achievement.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-800">{achievement.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>
              {unlockedAt && (
                <p className="text-xs text-[#FFD700] mt-1">{formatDate(unlockedAt)} 解锁</p>
              )}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // 未解锁状态
  return (
    <div className={`${tier.lockedBg} rounded-2xl shadow-md p-4 opacity-60 transition-all hover:opacity-80 border-l-4 border-gray-200`}>
      <div className="flex items-start gap-3">
        <span className={`${tier.size} opacity-30`}>🔒</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-400">{achievement.title}</h3>
          <p className="text-xs text-gray-300 mt-0.5">{achievement.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400`}
            >
              {tier.label}
            </span>
            <p className="text-xs text-gray-300">未解锁</p>
          </div>
          {typeof achievement.progress === 'number' && achievement.progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>进度</span>
                <span>{Math.round(achievement.progress * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${tier.particleColors[0]}, ${tier.particleColors[1]})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
