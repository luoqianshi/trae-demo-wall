'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CelebrationEffect from '@/app/components/CelebrationEffect';
import ChallengeCelebration from '@/app/components/ChallengeCelebration';

const PREVIEW_CARDS = [
  {
    category: '普通记录庆祝',
    items: [
      {
        type: 'breakthrough' as const,
        title: '突破记录',
        description: '达成成就时触发',
        icon: '🎊',
      },
      {
        type: 'streak' as const,
        title: '连续记录',
        description: '连续多天记录时触发',
        icon: '🔥',
      },
      {
        type: 'late_night' as const,
        title: '深夜记录',
        description: '深夜还在坚持记录',
        icon: '🌙',
      },
      {
        type: 'normal' as const,
        title: '普通记录',
        description: '日常记录完成',
        icon: '❄️',
      },
      {
        type: 'question_answer' as const,
        title: '回答问题',
        description: '回答雪球的问题后',
        icon: '💬',
      },
    ],
  },
  {
    category: '挑战完成庆祝',
    items: [
      {
        difficulty: 'bronze' as const,
        title: '青铜挑战完成',
        description: '完成每日小挑战',
        icon: '⭐',
      },
      {
        difficulty: 'silver' as const,
        title: '白银挑战进度',
        description: '进阶挑战每日进度',
        icon: '💎',
      },
      {
        difficulty: 'gold' as const,
        title: '黄金挑战完成',
        description: '完成大师级挑战',
        icon: '👑',
      },
    ],
  },
];

export default function CelebrationPreviewPage() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<'bronze' | 'silver' | 'gold' | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  const handleTriggerCelebration = (type: string) => {
    setActiveType(type);
  };

  const handleTriggerChallenge = (difficulty: 'bronze' | 'silver' | 'gold', withMilestone: boolean = false) => {
    setActiveDifficulty(difficulty);
    setShowMilestone(withMilestone);
  };

  const handleCloseCelebration = () => {
    setActiveType(null);
  };

  const handleCloseChallenge = () => {
    setActiveDifficulty(null);
    setShowMilestone(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F7] via-white to-[#F0F8FF] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent mb-4">
            庆祝效果预览
          </h1>
          <p className="text-gray-500">点击卡片预览不同的庆祝动画效果</p>
        </div>

        {PREVIEW_CARDS.map((category) => (
          <div key={category.category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-2">
              <span className="text-3xl">✨</span>
              {category.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items.map((item) => (
                <motion.div
                  key={item.title}
                  className="bg-white rounded-2xl shadow-lg border border-[#FFB6C1]/20 p-6 cursor-pointer hover:shadow-xl transition-all"
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if ('type' in item) {
                      handleTriggerCelebration(item.type);
                    } else if ('difficulty' in item) {
                      handleTriggerChallenge(item.difficulty, false);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFB6C1]/20 to-[#87CEEB]/20 flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if ('type' in item) {
                          handleTriggerCelebration(item.type);
                        } else if ('difficulty' in item) {
                          handleTriggerChallenge(item.difficulty, false);
                        }
                      }}
                    >
                      预览效果
                    </button>
                    {'difficulty' in item && item.difficulty !== 'bronze' && (
                      <button
                        className="py-2 px-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerChallenge(item.difficulty, true);
                        }}
                      >
                        +里程碑
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 bg-white/60 rounded-2xl p-6 border border-[#FFB6C1]/20">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            说明
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-[#FFB6C1]">•</span>
              <span><strong>突破记录</strong>：彩带飘落效果，庆祝重要成就</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFB6C1]">•</span>
              <span><strong>连续记录</strong>：火焰环绕效果，激励用户保持连续</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFB6C1]">•</span>
              <span><strong>深夜记录</strong>：月亮星星效果，感谢深夜坚持</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFB6C1]">•</span>
              <span><strong>普通记录</strong>：雪花吸收效果，雪球慢慢变大</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFB6C1]">•</span>
              <span><strong>回答问题</strong>：精美卡片展示，感谢用户分享</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#87CEEB]">•</span>
              <span><strong>挑战完成</strong>：根据难度显示不同图标和奖励</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFD700]">•</span>
              <span><strong>里程碑</strong>：达成阶段性目标时额外展示</span>
            </li>
          </ul>
        </div>
      </div>

      {activeType && (
        <CelebrationEffect
          isActive={true}
          type={activeType as any}
          onComplete={handleCloseCelebration}
          answerContent={activeType === 'question_answer' ? '这是一个示例回答，用于预览卡片效果...' : undefined}
          streakDays={7}
        />
      )}

      {activeDifficulty && (
        <ChallengeCelebration
          isVisible={true}
          difficulty={activeDifficulty}
          reward={{
            score: activeDifficulty === 'bronze' ? 5 : activeDifficulty === 'silver' ? 15 : 50,
            badge_name: activeDifficulty === 'gold' ? '早起勇士徽章' : undefined,
          }}
          milestoneReward={showMilestone ? {
            score: activeDifficulty === 'silver' ? 10 : 20,
            title: activeDifficulty === 'silver' ? '坚持者' : '一周达人',
          } : null}
          onComplete={handleCloseChallenge}
        />
      )}
    </div>
  );
}
