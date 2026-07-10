'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Challenge, UserChallenge } from '@/hooks/useChallenges';

interface ChallengeDetailProps {
  challenge: Challenge;
  userChallenge: UserChallenge;
  onMakeUp: (userChallengeId: string) => void;
  onAbandon: (userChallengeId: string) => void;
  onOpenRecordForm: () => void;
  isLoading?: boolean;
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

const ChallengeDetail = React.memo(({
  challenge,
  userChallenge,
  onMakeUp,
  onAbandon,
  onOpenRecordForm,
  isLoading,
}: ChallengeDetailProps) => {
  const [showMakeUpConfirm, setShowMakeUpConfirm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  const config = DIFFICULTY_CONFIG[challenge.type] || DIFFICULTY_CONFIG.bronze;

  // 修复 R7-1: 使用本地日期，与 challenges API 的 getTodayDateString 一致
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayCompleted = useMemo(() => {
    return userChallenge.daily_records?.some(r => r.date === todayStr && r.completed) ?? false;
  }, [userChallenge.daily_records, todayStr]);

  const canMakeUp = (userChallenge.make_up_count || 0) < (userChallenge.max_make_ups || 0);
  const remainingMakeUps = (userChallenge.max_make_ups || 0) - (userChallenge.make_up_count || 0);

  const milestones = challenge.completion_criteria?.milestones || [];
  const milestoneDays = useMemo(() => new Set(milestones.map(m => m.day)), [milestones]);

  const calendarDays = useMemo(() => {
    return Array.from({ length: challenge.duration_days }, (_, i) => {
      const day = i + 1;
      const record = userChallenge.daily_records?.find(r => {
        const startedAt = new Date(userChallenge.started_at);
        const recordDate = new Date(r.date);
        const dayDiff = Math.floor((recordDate.getTime() - startedAt.getTime()) / 86400000);
        return dayDiff + 1 === day;
      });
      const isToday = day === userChallenge.current_day;
      const isCompleted = !!record?.completed;
      const isMilestone = milestoneDays.has(day);
      return { day, isCompleted, isToday, isMilestone };
    });
  }, [challenge.duration_days, userChallenge, milestoneDays]);

  const criteriaItems: { label: string }[] = [];
  const criteria = challenge.completion_criteria;
  if (criteria?.required_tags?.length) {
    criteria.required_tags.forEach(tag => {
      criteriaItems.push({ label: tag });
    });
  }
  if (criteria?.required_questions?.length) {
    criteria.required_questions.forEach(q => {
      criteriaItems.push({ label: q });
    });
  }
  if (criteria?.action_required) {
    criteriaItems.push({ label: criteria.action_description || '完成指定动作' });
  }

  const rows = useMemo(() => {
    const colsPerRow = 7;
    const result: typeof calendarDays[] = [];
    for (let i = 0; i < calendarDays.length; i += colsPerRow) {
      result.push(calendarDays.slice(i, i + colsPerRow));
    }
    return result;
  }, [calendarDays]);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6 relative overflow-hidden">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl flex-shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">{challenge.title}</h2>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{challenge.description}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500">日历进度</span>
          <span className="text-xs text-gray-400">
            Day {userChallenge.current_day}/{challenge.duration_days}
          </span>
        </div>

        <div className="space-y-2">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1.5">
              {row.map(({ day, isCompleted, isToday, isMilestone }) => (
                <div key={day} className="flex flex-col items-center gap-0.5 flex-1">
                  {isMilestone && (
                    <span className="text-[10px] leading-none">🏁</span>
                  )}
                  {!isMilestone && (
                    <span className="h-[10px]" />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      isToday
                        ? 'ring-2 ring-offset-1'
                        : ''
                    }`}
                    style={{
                      backgroundColor: isCompleted ? config.borderColor : '#F3F4F6',
                      color: isCompleted ? '#FFFFFF' : '#9CA3AF',
                      ...(isToday ? { outline: `2px solid ${config.borderColor}`, outlineOffset: '1px' } : {}),
                    }}
                  >
                    {isCompleted ? '●' : '○'}
                  </div>
                  <span className={`text-[9px] ${isToday ? 'text-gray-700 font-bold' : 'text-gray-400'}`}>
                    {day}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {criteriaItems.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-medium text-gray-500 mb-2">今日任务</h3>
          <div className="space-y-1.5">
            {criteriaItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <span style={{ color: todayCompleted ? config.borderColor : '#D1D5DB' }}>
                  {todayCompleted ? '✓' : '○'}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canMakeUp && !todayCompleted && (
        <div className="mb-4">
          <motion.button
            onClick={() => setShowMakeUpConfirm(true)}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 disabled:opacity-50 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            补签（剩余{remainingMakeUps}次）
          </motion.button>
        </div>
      )}

      {!todayCompleted && (
        <motion.button
          onClick={onOpenRecordForm}
          disabled={isLoading}
          className="w-full py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#87CEEB] to-[#4A9BD9] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow mb-3"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          完成今日任务 ✨
        </motion.button>
      )}

      {todayCompleted && (
        <div className="px-3 py-2.5 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium text-center mb-3">
          今日已完成 ✓
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => setShowAbandonConfirm(true)}
          disabled={isLoading}
          className="text-xs text-gray-300 hover:text-gray-400 disabled:opacity-50 transition-colors"
        >
          暂时放下
        </button>
      </div>

      <AnimatePresence>
        {showMakeUpConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMakeUpConfirm(false)}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-xl p-6 mx-4 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-gray-800 text-center mb-2">使用补签机会？</h3>
              <p className="text-sm text-gray-500 text-center mb-5">
                剩余补签次数：{remainingMakeUps}次
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMakeUpConfirm(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <motion.button
                  onClick={() => {
                    onMakeUp(userChallenge.id);
                    setShowMakeUpConfirm(false);
                  }}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#87CEEB] to-[#4A9BD9] disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                >
                  确认补签
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAbandonConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAbandonConfirm(false)}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-xl p-6 mx-4 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-gray-800 text-center mb-2">没关系，下次再来挑战！</h3>
              <p className="text-sm text-gray-500 text-center mb-5">
                暂时放下不会影响你的其他成就
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  继续坚持
                </button>
                <motion.button
                  onClick={() => {
                    onAbandon(userChallenge.id);
                    setShowAbandonConfirm(false);
                  }}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  确认放下
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ChallengeDetail.displayName = 'ChallengeDetail';

export default ChallengeDetail;
