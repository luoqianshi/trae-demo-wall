'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useSnowball } from '@/contexts/SnowballContext';
import { getSnowballStageByScore, getNextStageThresholdByScore, getScoreProgress, type SnowballStage } from '@/lib/snowball-score';
import { incrementSnowballInteractions, incrementSnowballClicks } from '@/hooks/useAchievements';

// ─── Props ───────────────────────────────────────────────────────────────────

interface SnowballStageCardProps {
  totalRecords: number;
  streakDays: number;
  todayRecordCount: number;
  onInteract?: (type: 'pet' | 'shake') => void;
}

// ─── Stage Image Configuration ──────────────────────────────────────────────

interface StageImageConfig {
  image: string;
  alt: string;
  description: string;
}

const STAGE_IMAGES: Record<SnowballStage, StageImageConfig> = {
  snowflake: {
    image: '/images/snowball-stages/stage-1.webp',
    alt: '可爱的雪粒宝宝',
    description: '初生的可爱小云朵，充满好奇心',
  },
  small_ball: {
    image: '/images/snowball-stages/stage-2.webp',
    alt: '闭眼微笑的雪球',
    description: '闭着眼睛享受成长的快乐',
  },
  ball: {
    image: '/images/snowball-stages/stage-3.webp',
    alt: '戴围巾的雪球',
    description: '戴上围巾，变得更加成熟温暖',
  },
};

// ─── Helper Functions ───────────────────────────────────────────────────────

function getStageEmoji(stage: SnowballStage): string {
  const emojis: Record<SnowballStage, string> = {
    snowflake: '✨',
    small_ball: '😊',
    ball: '⛄',
  };
  return emojis[stage];
}

function getStageColor(stage: SnowballStage): string {
  const colors: Record<SnowballStage, string> = {
    snowflake: 'from-blue-100 to-blue-50',
    small_ball: 'from-pink-100 to-pink-50',
    ball: 'from-amber-100 to-amber-50',
  };
  return colors[stage];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SnowballStageCard({
  totalRecords,
  streakDays,
  todayRecordCount,
  onInteract,
}: SnowballStageCardProps) {
  const { stats } = useSnowball();

  const stageConfig = useMemo(() => getSnowballStageByScore(stats.totalScore), [stats.totalScore]);
  const stageImage = STAGE_IMAGES[stageConfig.stage];
  const stageProgress = useMemo(() => getScoreProgress(stats.totalScore), [stats.totalScore]);
  const nextThreshold = useMemo(() => getNextStageThresholdByScore(stats.totalScore), [stats.totalScore]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
    >
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getStageColor(stageConfig.stage)} opacity-30`} />
      
      {/* 装饰光晕 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/50 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/50 rounded-full blur-2xl -ml-12 -mb-12" />

      <div className="relative z-10 p-5">
        {/* 顶部：日期和连续天数 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
          </span>
          {streakDays > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-full"
            >
              <span className="text-xs">🔥</span>
              <span className="text-xs font-medium text-orange-500">{streakDays}</span>
            </motion.div>
          )}
        </div>

        {/* 中间：雪球形象和阶段信息 */}
        <div className="flex items-center gap-4">
          {/* 雪球形象 - 固定大小 100px */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              onInteract?.('pet');
              await incrementSnowballInteractions();
              await incrementSnowballClicks();
            }}
            className="relative flex-shrink-0 w-[100px] h-[100px] cursor-pointer"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <Image
                src={stageImage.image}
                alt={stageImage.alt}
                width={100}
                height={100}
                priority
                className="object-contain drop-shadow-md"
              />
            </motion.div>
            
            {/* 光晕效果 */}
            <div className="absolute inset-0 -z-10 bg-gradient-radial from-white/80 to-transparent rounded-full blur-xl" />
          </motion.div>

          {/* 阶段信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getStageEmoji(stageConfig.stage)}</span>
              <h2 className="text-lg font-bold text-gray-800">{stageConfig.label}</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3 line-clamp-1">
              {stageImage.description}
            </p>

            {/* 进度条 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">成长进度</span>
                <span className="font-medium text-gray-600">{stats.totalScore} 分</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stageProgress.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-pink-300 to-blue-300 rounded-full"
                />
              </div>
              {nextThreshold && (
                <p className="text-[10px] text-gray-400">
                  距下一阶段还需 {nextThreshold - stats.totalScore} 分
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 底部：今日统计 */}
        <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-pink-400">{stats.todayScore}</p>
            <p className="text-[10px] text-gray-400">今日得分</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <p className="text-xl font-bold text-blue-400">{stats.totalScore}</p>
            <p className="text-[10px] text-gray-400">总分</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <p className="text-xl font-bold text-amber-400">{streakDays}</p>
            <p className="text-[10px] text-gray-400">连续滚雪球</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
