'use client';

import { motion } from 'framer-motion';
import { SnowballStage, SNOWBALL_STAGES } from '@/lib/snowball-score';

interface EmptyStateSnowballProps {
  /** 当前雪球阶段 */
  currentStage: SnowballStage;
  /** 当前记录数 */
  recordCount: number;
  /** 自定义标题 */
  title?: string;
  /** 自定义描述 */
  description?: string;
  /** 是否显示阶段标签 */
  showStageLabel?: boolean;
}

/**
 * 雪球空状态组件
 * 展示当前雪球阶段 + 呼吸动画 + 引导文案
 */
export function EmptyStateSnowball({
  currentStage,
  recordCount,
  title = '还没有记录',
  description = '开始记录你的第一个小成功吧',
  showStageLabel = true,
}: EmptyStateSnowballProps) {
  // 获取雪球图片路径
  const getSnowballImage = () => {
    const stageMap: Record<SnowballStage, string> = {
      snowflake: '/images/snowball-stages/stage-1.webp',
      small_ball: '/images/snowball-stages/stage-2.webp',
      ball: '/images/snowball-stages/stage-3.webp',
    };
    return stageMap[currentStage];
  };

  // 获取阶段配置
  const stageConfig = SNOWBALL_STAGES.find(s => s.stage === currentStage);
  const nextStage = SNOWBALL_STAGES.find(s => s.minScore > recordCount * 10);
  const recordsToNext = nextStage ? Math.ceil((nextStage.minScore - recordCount * 10) / 10) : 0;

  // 阶段标签
  const stageLabels: Record<SnowballStage, string> = {
    snowflake: '雪粒',
    small_ball: '小雪球',
    ball: '雪球',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* 雪球图片 - 呼吸动画 */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
        className="relative mb-4"
      >
        <img
          src={getSnowballImage()}
          alt={stageLabels[currentStage]}
          className="w-24 h-24 object-contain drop-shadow-lg"
        />
      </motion.div>

      {/* 阶段标签 */}
      {showStageLabel && (
        <div className="text-sm font-semibold text-pink-400 mb-1">
          ⛄ {stageLabels[currentStage]}
        </div>
      )}

      {/* 标题 */}
      <div className="text-base text-gray-700 font-medium mb-1">
        {title}
      </div>

      {/* 描述 */}
      <div className="text-sm text-gray-400 text-center max-w-xs">
        {description}
      </div>

      {/* 距离下一阶段提示 */}
      {nextStage && recordsToNext > 0 && (
        <div className="mt-3 text-xs text-gray-400">
          再记录 <span className="text-pink-400 font-medium">{recordsToNext}</span> 条，雪球就能长大了
        </div>
      )}
    </div>
  );
}
