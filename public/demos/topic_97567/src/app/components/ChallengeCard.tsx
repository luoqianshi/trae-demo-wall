'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Challenge, UserChallenge, CompletionData } from '@/hooks/useChallenges';
import ChallengeRecordForm from './ChallengeRecordForm';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  onJoin: (challengeId: string) => void;
  onAbandon: (userChallengeId: string) => void;
  onMakeUp: (userChallengeId: string) => void;
  onOpenRecordForm: (challenge: Challenge, userChallenge: UserChallenge) => void;
  onCloseForm?: () => void;
  isFormOpen?: boolean;
  onSubmitForm?: (data: { content: string; type: string; mood: string; tags: string[]; related_task_id?: string; completionData: CompletionData; userChallengeId: string }) => void;
  isLoading?: boolean;
  progressSuccess?: boolean;
  milestoneReached?: { score: number; title: string } | null;
}

const DIFFICULTY_CONFIG: Record<string, {
  label: string;
  borderColor: string;
  borderClass: string;
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  progressBg: string;
  progressFill: string;
  icon: string;
}> = {
  bronze: {
    label: '⭐ 青铜',
    borderColor: '#FFB6C1',
    borderClass: 'border-l-[#FFB6C1]',
    bgGradient: 'from-[#FFF5F7] to-[#FFF0F3]',
    badgeBg: 'bg-[#FFB6C1]/15',
    badgeText: 'text-[#E8929E]',
    progressBg: 'bg-[#FFB6C1]/20',
    progressFill: 'bg-gradient-to-r from-[#FFB6C1] to-[#FF69B4]',
    icon: '⭐',
  },
  silver: {
    label: '💎 白银',
    borderColor: '#87CEEB',
    borderClass: 'border-l-[#87CEEB]',
    bgGradient: 'from-[#F0F8FF] to-[#E8F4FD]',
    badgeBg: 'bg-[#87CEEB]/15',
    badgeText: 'text-[#5BA8D4]',
    progressBg: 'bg-[#87CEEB]/20',
    progressFill: 'bg-gradient-to-r from-[#87CEEB] to-[#4A9BD9]',
    icon: '💎',
  },
  gold: {
    label: '👑 黄金',
    borderColor: '#FFD700',
    borderClass: 'border-l-[#FFD700]',
    bgGradient: 'from-[#FFFEF5] to-[#FFF8DC]',
    badgeBg: 'bg-[#FFD700]/15',
    badgeText: 'text-[#D4A800]',
    progressBg: 'bg-[#FFD700]/20',
    progressFill: 'bg-gradient-to-r from-[#FFD700] to-[#FFA500]',
    icon: '👑',
  },
};

const getRewardTexts = (reward: Record<string, any>): string[] => {
  const texts: string[] = [];
  if (reward?.score) texts.push(`雪球 +${reward.score}`);
  if (reward?.badge_fragments) texts.push(`碎片 ×${reward.badge_fragments}`);
  if (reward?.badge_id) texts.push('徽章');
  if (reward?.special_reward) texts.push('特殊奖励');
  return texts;
};

const ChallengeCard = React.memo(({
  challenge,
  userChallenge,
  onJoin,
  onAbandon,
  onMakeUp,
  onOpenRecordForm,
  onCloseForm,
  isFormOpen,
  onSubmitForm,
  isLoading,
  progressSuccess,
  milestoneReached,
}: ChallengeCardProps) => {
  const config = DIFFICULTY_CONFIG[challenge.type] || DIFFICULTY_CONFIG.bronze;
  const isJoined = !!userChallenge;
  const isCompleted = userChallenge?.status === 'completed';
  const isActive = userChallenge?.status === 'active';
  const isBronze = challenge.type === 'bronze';
  const isSilverOrGold = challenge.type === 'silver' || challenge.type === 'gold';

  const progressPercent = isJoined && challenge.duration_days > 0
    ? Math.min(Math.round(((userChallenge?.progress || 0) / challenge.duration_days) * 100), 100)
    : 0;

  const rewardTexts = getRewardTexts(challenge.reward || {});

  // 修复 R7-1: 使用本地日期，与 challenges API 的 getTodayDateString 一致
  const todayD = new Date();
  const todayStr = `${todayD.getFullYear()}-${String(todayD.getMonth() + 1).padStart(2, '0')}-${String(todayD.getDate()).padStart(2, '0')}`;
  const todayProgressed = userChallenge?.daily_records?.some(r => r.date === todayStr && r.completed) ?? false;

  const criteria = challenge.completion_criteria;
  const criteriaItems: { label: string; completed: boolean }[] = [];
  if (criteria?.required_tags?.length) {
    criteria.required_tags.forEach(tag => {
      criteriaItems.push({ label: tag, completed: !!todayProgressed });
    });
  }
  if (criteria?.required_questions?.length) {
    criteria.required_questions.forEach(q => {
      criteriaItems.push({ label: q, completed: !!todayProgressed });
    });
  }
  if (criteria?.action_required) {
    criteriaItems.push({
      label: criteria.action_description || '完成指定动作',
      completed: !!todayProgressed,
    });
  }

  const milestones = criteria?.milestones || [];
  const canMakeUp = userChallenge
    ? (userChallenge.make_up_count || 0) < (userChallenge.max_make_ups || 0)
    : false;

  return (
    <>
    <motion.div
      className={`bg-gradient-to-br ${config.bgGradient} rounded-3xl shadow-lg border border-white/80 p-6 border-l-4 ${config.borderClass} relative overflow-hidden`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="absolute top-4 right-4">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}>
          {config.label}
        </span>
      </div>

      {isCompleted && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-white text-xs font-bold px-3 py-1.5 rounded-bl-2xl rounded-tr-3xl shadow-md">
            已完成 🎉
          </div>
        </div>
      )}

      <AnimatePresence>
        {milestoneReached && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/30 text-[#D4A800] text-xs font-medium flex items-center gap-2"
          >
            <span className="text-base">🏆</span>
            <span>里程碑达成：{milestoneReached.title}（雪球 +{milestoneReached.score}）</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3 pr-16">
          <span className="text-2xl flex-shrink-0 mt-0.5">
            {config.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 leading-snug">
              {challenge.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
              {challenge.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {challenge.duration_days}天
          </span>
          {rewardTexts.length > 0 && (
            <span className="flex items-center gap-1" style={{ color: config.borderColor }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {rewardTexts.join(' · ')}
            </span>
          )}
        </div>

        {!isJoined && criteriaItems.length > 0 && (
          <div className="space-y-1.5">
            {criteriaItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-gray-300">○</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {!isJoined && (
          <div className="mt-1">
            <motion.button
              onClick={() => onJoin(challenge.id)}
              disabled={isLoading}
              className="w-full py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#FFB6C1] via-[#FF69B4] to-[#87CEEB] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? '加载中...' : '接受挑战'}
            </motion.button>
          </div>
        )}

        {isActive && isBronze && (
          <div className="space-y-2 mt-1">
            {criteriaItems.length > 0 && (
              <div className="space-y-1.5">
                {criteriaItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                    <span style={{ color: item.completed ? config.borderColor : '#D1D5DB' }}>
                      {item.completed ? '✓' : '○'}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {progressSuccess && (
              <div className="px-3 py-2 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium flex items-center gap-1.5">
                <span>✅</span>
                <span>今日挑战已完成！{rewardTexts.length > 0 ? rewardTexts.join(' · ') : ''}</span>
              </div>
            )}

            {!progressSuccess && !todayProgressed && userChallenge && (
              <motion.button
                onClick={() => onOpenRecordForm(challenge, userChallenge)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#87CEEB] to-[#4A9BD9] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                开始挑战记录 ✨
              </motion.button>
            )}

            {todayProgressed && !progressSuccess && (
              <div className="px-3 py-2.5 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium text-center">
                今日已完成 ✓
              </div>
            )}
          </div>
        )}

        {isActive && isSilverOrGold && (
          <div className="space-y-2 mt-1">
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-400">进度</span>
                <span className="text-xs font-medium text-gray-500">
                  Day {userChallenge?.current_day || 1}/{challenge.duration_days}
                </span>
              </div>

              {milestones.length > 0 && (
                <div className="relative h-5 mb-0.5">
                  {milestones.map((ms, idx) => {
                    const leftPercent = challenge.duration_days > 0
                      ? Math.min(Math.round((ms.day / challenge.duration_days) * 100), 100)
                      : 0;
                    return (
                      <div
                        key={idx}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${leftPercent}%`, top: 0 }}
                        title={`Day ${ms.day}: ${ms.reward.title}`}
                      >
                        <span className="text-xs">🏁</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={`h-2 rounded-full ${config.progressBg} overflow-hidden`}>
                <motion.div
                  className={`h-full rounded-full ${config.progressFill}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            {challenge.duration_days <= 21 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-gray-500 font-medium mr-1">
                  {userChallenge?.progress || 0}/{challenge.duration_days}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: challenge.duration_days }, (_, i) => (
                    <span
                      key={i}
                      className="text-[10px] leading-none"
                      style={{ color: i < (userChallenge?.progress || 0) ? config.borderColor : '#D1D5DB' }}
                    >
                      {i < (userChallenge?.progress || 0) ? '●' : '○'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {progressSuccess && (
              <div className="px-3 py-2 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium flex items-center gap-1.5">
                <span>✅</span>
                <span>今日进度已记录！{userChallenge?.progress || 0}/{challenge.duration_days} 天</span>
              </div>
            )}

            {!progressSuccess && !todayProgressed && userChallenge && (
              <motion.button
                onClick={() => onOpenRecordForm(challenge, userChallenge)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#87CEEB] to-[#4A9BD9] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                完成今日任务 ✨
              </motion.button>
            )}

            {todayProgressed && !progressSuccess && (
              <div className="px-3 py-2.5 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium text-center">
                今日已完成 ✓
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div>
                {canMakeUp && userChallenge && (
                  <button
                    onClick={() => onMakeUp(userChallenge.id)}
                    disabled={isLoading}
                    className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 disabled:opacity-50 transition-colors"
                  >
                    补签（剩余{(userChallenge.max_make_ups || 0) - (userChallenge.make_up_count || 0)}次）
                  </button>
                )}
              </div>
              {userChallenge && (
                <button
                  onClick={() => onAbandon(userChallenge.id)}
                  disabled={isLoading}
                  className="text-xs text-gray-300 hover:text-gray-400 disabled:opacity-50 transition-colors"
                >
                  暂时放下
                </button>
              )}
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20">
              <span className="text-sm font-bold text-[#D4A800]">已完成</span>
              <span className="text-lg">🎉</span>
            </div>
            {rewardTexts.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs" style={{ color: config.borderColor }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                获得：{rewardTexts.join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>

    <AnimatePresence>
      {isFormOpen && userChallenge && onSubmitForm && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <ChallengeRecordForm
            challenge={challenge}
            userChallenge={userChallenge}
            onSubmit={onSubmitForm}
            onCancel={onCloseForm || (() => {})}
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
});

ChallengeCard.displayName = 'ChallengeCard';

export default ChallengeCard;
