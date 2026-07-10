'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SnowballCharacter from './SnowballCharacter';
import { getStoryText } from '@/lib/snowball-story-text';
import { useSnowball } from '@/contexts/SnowballContext';

interface ChallengeCelebrationProps {
  isVisible: boolean;
  difficulty: 'bronze' | 'silver' | 'gold';
  reward: {
    score?: number;
    badge_fragments?: number;
    badge_name?: string;
    badge_icon?: string;
    special_reward?: string;
  };
  milestoneReward?: {
    score: number;
    title: string;
  } | null;
  onComplete: () => void;
}

const DIFFICULTY_CONFIG = {
  bronze: {
    title: '今日挑战完成！',
    icon: '⭐',
    iconBg: 'from-[#CD7F32] to-[#D4A574]',
    autoCloseMs: 3000,
    encouragements: [
      '每一个小进步都值得庆祝！',
      '坚持就是胜利！',
      '你正在变得更好！',
    ],
    milestone: {
      bg: 'from-[#FFF5F0] via-[#FFE4D0] to-[#FFDAB9]',
      border: 'border-[#CD7F32]/40',
      topLine: 'from-[#CD7F32] via-[#D4A574] to-[#CD7F32]',
      iconBg: 'from-[#CD7F32] to-[#D4A574]',
      iconShadow: '0 0 20px rgba(205, 127, 50, 0.5), 0 0 35px rgba(212, 165, 116, 0.3)',
      textGradient: 'from-[#CD7F32] via-[#D4A574] to-[#CD7F32]',
      titleBg: 'border-[#CD7F32]/30',
      rewardBg: 'from-[#CD7F32]/20 to-[#D4A574]/20',
      rewardText: 'from-[#CD7F32] to-[#D4A574]',
    },
  },
  silver: {
    title: '今日进度已记录！',
    icon: '💎',
    iconBg: 'from-[#87CEEB] to-[#C0C0C0]',
    autoCloseMs: 4000,
    encouragements: [
      '你的坚持让人敬佩！',
      '每一步都算数！',
      '继续加油！',
    ],
    milestone: {
      bg: 'from-[#F0F8FF] via-[#E6E6FA] to-[#B0E0E6]',
      border: 'border-[#87CEEB]/40',
      topLine: 'from-[#87CEEB] via-[#C0C0C0] to-[#87CEEB]',
      iconBg: 'from-[#87CEEB] to-[#C0C0C0]',
      iconShadow: '0 0 25px rgba(135, 206, 235, 0.5), 0 0 40px rgba(192, 192, 192, 0.3)',
      textGradient: 'from-[#87CEEB] via-[#C0C0C0] to-[#87CEEB]',
      titleBg: 'border-[#87CEEB]/30',
      rewardBg: 'from-[#87CEEB]/20 to-[#C0C0C0]/20',
      rewardText: 'from-[#87CEEB] to-[#C0C0C0]',
    },
  },
  gold: {
    title: '今日任务完成！',
    icon: '👑',
    iconBg: 'from-[#FFD700] to-[#FFA500]',
    autoCloseMs: 5000,
    encouragements: [
      '你是真正的勇士！',
      '每一天的坚持都有意义！',
      '离目标又近了一步！',
    ],
    milestone: {
      bg: 'from-[#FFF9E6] via-[#FFE6F0] to-[#E6F3FF]',
      border: 'border-[#FFD700]/40',
      topLine: 'from-[#FFD700] via-[#FF6B6B] to-[#FFD700]',
      iconBg: 'from-[#FFD700] to-[#FFA500]',
      iconShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 107, 107, 0.4)',
      textGradient: 'from-[#FFD700] via-[#FF6B6B] to-[#FFD700]',
      titleBg: 'border-[#FFD700]/30',
      rewardBg: 'from-[#FFD700]/20 to-[#FF6B6B]/20',
      rewardText: 'from-[#FFD700] to-[#FF6B6B]',
    },
  },
};

const MilestoneParticleExplosion: React.FC<{ difficulty: 'bronze' | 'silver' | 'gold' }> = ({ difficulty }) => {
  const colorSchemes = {
    bronze: ['#CD7F32', '#D4A574', '#DEB887', '#F4A460', '#D2691E'],
    silver: ['#C0C0C0', '#87CEEB', '#B0C4DE', '#ADD8E6', '#E6E6FA'],
    gold: ['#FFD700', '#FFA500', '#FF6B6B', '#FF8C00', '#FFD700'],
  };
  
  const particles = useMemo(() => {
    const colors = colorSchemes[difficulty];
    return Array.from({ length: difficulty === 'gold' ? 40 : 25 }, (_, i) => {
      const angle = (i / (difficulty === 'gold' ? 40 : 25)) * Math.PI * 2;
      const distance = 80 + Math.random() * (difficulty === 'gold' ? 120 : 80);
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: colors[i % colors.length],
        size: 3 + Math.random() * (difficulty === 'gold' ? 8 : 5),
        delay: Math.random() * 0.3,
      };
    });
  }, [difficulty]);

  return (
    <>
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
            filter: difficulty === 'gold' ? 'blur(1px)' : 'blur(0.5px)',
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, 1.5, 0.5],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: difficulty === 'gold' ? 1.4 : 1,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
};

const MilestoneRings: React.FC<{ difficulty: 'bronze' | 'silver' | 'gold' }> = ({ difficulty }) => {
  const ringColors = {
    bronze: ['#CD7F32', '#D4A574', '#DEB887', '#F4A460', '#D2691E'],
    silver: ['#C0C0C0', '#87CEEB', '#B0C4DE', '#ADD8E6', '#E6E6FA'],
    gold: ['#FFD700', '#FF6B6B', '#FFA500', '#FFB6C1', '#FF8C00'],
  };
  
  const colors = ringColors[difficulty];
  const ringCount = difficulty === 'gold' ? 5 : 3;
  
  return (
    <>
      {[...Array(ringCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, difficulty === 'gold' ? 3.5 : 2.5, difficulty === 'gold' ? 3 : 2], 
            opacity: [0, 0.8, 0] 
          }}
          transition={{ 
            duration: difficulty === 'gold' ? 1.8 : 1.2, 
            delay: i * 0.2, 
            ease: 'easeOut' 
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: 60 + i * 20,
              height: 60 + i * 20,
              border: `${difficulty === 'gold' ? 3 : 2}px solid`,
              borderColor: colors[i],
              filter: `blur(${difficulty === 'gold' ? 3 : 2}px)`,
              boxShadow: `0 0 10px ${colors[i]}`,
            }}
          />
        </motion.div>
      ))}
    </>
  );
};

const MilestoneShineEffect: React.FC<{ difficulty: 'bronze' | 'silver' | 'gold' }> = ({ difficulty }) => {
  const gradients = {
    bronze: 'conic-gradient(from 0deg, transparent, rgba(205, 127, 50, 0.4), transparent, rgba(212, 165, 116, 0.4), transparent)',
    silver: 'conic-gradient(from 0deg, transparent, rgba(192, 192, 192, 0.4), transparent, rgba(135, 206, 235, 0.4), transparent)',
    gold: 'conic-gradient(from 0deg, transparent, rgba(255, 215, 0, 0.4), transparent, rgba(255, 107, 107, 0.4), transparent)',
  };
  
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ scale: 0, rotate: 0, opacity: 0 }}
      animate={{ 
        scale: [0, difficulty === 'gold' ? 2.5 : 2, difficulty === 'gold' ? 2 : 1.5], 
        rotate: [0, difficulty === 'gold' ? 180 : 90], 
        opacity: [0, difficulty === 'gold' ? 0.7 : 0.5, 0] 
      }}
      transition={{ 
        duration: difficulty === 'gold' ? 1.8 : 1.2, 
        ease: 'easeOut' 
      }}
    >
      <div
        className={difficulty === 'gold' ? 'w-40 h-40' : 'w-28 h-28'}
        style={{
          background: gradients[difficulty],
          filter: `blur(${difficulty === 'gold' ? 10 : 6}px)`,
        }}
      />
    </motion.div>
  );
};

const ChallengeCelebration: React.FC<ChallengeCelebrationProps> = ({
  isVisible,
  difficulty,
  reward,
  milestoneReward,
  onComplete,
}) => {
  const { stage } = useSnowball();
  const storyText = getStoryText('challengeComplete', stage);
  const config = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onComplete();
    }, milestoneReward ? 3500 : config.autoCloseMs + 500);
    return () => clearTimeout(timer);
  }, [isVisible, onComplete, config.autoCloseMs, milestoneReward]);

  const rewardTexts: string[] = [];
  if (reward.score) rewardTexts.push(`+${reward.score}分 ⚡`);
  if (reward.badge_fragments) rewardTexts.push(`碎片 ×${reward.badge_fragments}`);
  if (reward.badge_name) rewardTexts.push(reward.badge_name);
  if (reward.special_reward) rewardTexts.push('特殊奖励');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onComplete}
          />

          {milestoneReward && (
            <>
              <MilestoneParticleExplosion difficulty={difficulty} />
              <MilestoneRings difficulty={difficulty} />
              <MilestoneShineEffect difficulty={difficulty} />
            </>
          )}

          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <div className="absolute -top-4 -left-4 text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>✨</div>
            <div className="absolute -top-2 -right-6 text-xl animate-bounce" style={{ animationDelay: '0.3s' }}>{config.icon}</div>
            <div className="absolute -bottom-3 -left-5 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>💫</div>
            <div className="absolute -bottom-4 -right-4 text-xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</div>

            <div className={`bg-gradient-to-br ${milestoneReward ? config.milestone.bg : 'from-white via-[#FFF5F7] to-[#F0F8FF]'} rounded-3xl shadow-2xl border ${milestoneReward ? config.milestone.border : 'border-[#FFB6C1]/30'} p-6 w-80 relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${milestoneReward ? config.milestone.topLine : 'from-[#FFB6C1] via-[#87CEEB] to-[#FFD700]'}`} />

              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <SnowballCharacter size="md" />
                </motion.div>
              </div>

              <motion.h3
                className={`text-center text-xl font-bold mb-3 ${milestoneReward ? `bg-gradient-to-r ${config.milestone.textGradient} bg-clip-text text-transparent` : 'text-gray-700'}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                {milestoneReward ? '里程碑达成！' : config.title}
              </motion.h3>

              {milestoneReward ? (
                <motion.div
                  className="space-y-3"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className={`bg-white/60 rounded-xl p-3 border ${config.milestone.titleBg}`}>
                    <p className="text-sm text-gray-600 text-center">
                      获得称号：<span className={`font-semibold bg-gradient-to-r ${config.milestone.rewardText} bg-clip-text text-transparent`}>{milestoneReward.title}</span>
                    </p>
                  </div>
                  <div className={`flex items-center justify-center gap-2 bg-gradient-to-r ${config.milestone.rewardBg} rounded-full py-2 px-4`}>
                    <span className="text-lg">🏆</span>
                    <span className={`text-sm font-medium bg-gradient-to-r ${config.milestone.rewardText} bg-clip-text text-transparent`}>
                      +{milestoneReward.score}分 ⚡
                    </span>
                  </div>
                </motion.div>
              ) : rewardTexts.length > 0 ? (
                <motion.div
                  className="space-y-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFB6C1]/20 to-[#87CEEB]/20 rounded-full py-2 px-4">
                    <span className="text-lg">🎁</span>
                    <span className="text-sm font-medium bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent">
                      {rewardTexts.join(' · ')}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFB6C1]/20 to-[#87CEEB]/20 rounded-full py-2 px-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <span className="text-lg">✨</span>
                  <span className="text-sm font-medium bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent">
                    进度已记录
                  </span>
                </motion.div>
              )}

              <motion.p
                className="text-center text-sm text-gray-500 mt-4"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                {milestoneReward ? '继续加油，下一个里程碑在等着你！' : storyText.main}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChallengeCelebration;
