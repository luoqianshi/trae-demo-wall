'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { getSnowballStage, type SnowballStage } from '@/lib/snowball-score';
import { analytics } from '@/lib/analytics';
import { incrementSnowballInteractions, incrementSnowballClicks } from '@/hooks/useAchievements';

// ─── Props ───────────────────────────────────────────────────────────────────

interface SnowballAnimationProps {
  totalRecords?: number;
  progress?: number;
  triggerRoll?: number;
  totalSteps?: number;
  completedSteps?: number;
  snowballColor?: 'white' | 'pink' | 'blue' | 'gold' | 'rainbow';
  decoration?: 'none' | 'hat' | 'scarf' | 'glasses' | 'crown';
  backgroundTheme?: 'clear_sky' | 'starry' | 'flower' | 'aurora';
  onInteract?: (type: 'pet' | 'shake') => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_SIZE = 100;
const MAX_SIZE = 280;

// 响应式尺寸配置：根据窗口宽度调整雪球大小
const RESPONSIVE_BREAKPOINTS = {
  mobile: 640,    // 手机
  tablet: 1024,   // 平板
  desktop: 1280,  // 桌面
};

// 各断点下的尺寸缩放比例
const SIZE_SCALE_RATIOS = {
  mobile: 0.5,    // 手机端缩小到50%
  tablet: 0.7,    // 平板端缩小到70%
  desktop: 0.85,  // 桌面端缩小到85%
  large: 1.0,     // 大屏幕保持100%
};

// ─── Stage Image Configuration ──────────────────────────────────────────────

interface StageImageConfig {
  image: string;      // 图片路径
  alt: string;        // 替代文本
  size: number;       // 默认显示尺寸
  description: string; // 阶段描述
}

const STAGE_IMAGES: Record<SnowballStage, StageImageConfig> = {
  snowflake: {
    image: '/images/snowball-stages/stage-1.webp',
    alt: '可爱的雪粒宝宝 - 圆滚滚的小云朵',
    size: 1200,
    description: '雪粒阶段：初生的可爱小云朵，充满好奇心',
  },
  small_ball: {
    image: '/images/snowball-stages/stage-2.webp',
    alt: '闭眼微笑的雪球 - 满足又温暖',
    size: 1600,
    description: '小雪球阶段：闭着眼睛享受成长的快乐',
  },
  ball: {
    image: '/images/snowball-stages/stage-3.webp',
    alt: '戴围巾的雪球 - 温暖又成熟',
    size: 2000,
    description: '雪球阶段：戴上围巾，变得更加成熟温暖',
  },
};

// ─── Image-Based Character Component ───────────────────────────────────────

/**
 * 基于图片的雪球角色组件
 * 支持手绘风格图片 + 动画效果
 */
function ImageBasedCharacter({
  stage,
  size,
  isInteracting,
  interactionType,
}: {
  stage: SnowballStage;
  size: number;
  isInteracting: boolean;
  interactionType: string | null;
}) {
  const config = STAGE_IMAGES[stage];

  return (
    <motion.div
      className="relative cursor-pointer"
      animate={{
        y: [0, -8, 0],
        scale: isInteracting
          ? interactionType === 'pet'
            ? [1, 1.12, 1]
            : [1, 1.08, 0.98, 1.04, 1]
          : [1, 1.03, 1],
        rotate: interactionType === 'shake' ? [0, -8, 8, -6, 6, 0] : [0, 2, -2, 0],
      }}
      transition={{
        duration: isInteracting ? 0.5 : 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
        repeatDelay: isInteracting ? 0 : 0.5,
      }}
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      {/* 主图片 */}
      <motion.div
        animate={isInteracting ? { scale: [1.5, 1.62, 1.5] } : { scale: 1.5 }}
        transition={{ duration: 0.4 }}
        className="relative w-full h-full flex items-center justify-center overflow-visible"
      >
        <Image
          src={config.image}
          alt={config.alt}
          width={size}
          height={size}
          priority
          className="object-contain drop-shadow-lg pointer-events-none"
          style={{
            filter: isInteracting
              ? 'brightness(1.1) saturate(1.2)'
              : 'brightness(1) saturate(1)',
            transition: 'filter 0.3s ease',
          }}
        />
      </motion.div>

      {/* 点击时的爱心粒子效果 */}
      <AnimatePresence>
        {isInteracting && interactionType === 'pet' && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`heart-${i}`}
                className="absolute text-xl pointer-events-none"
                style={{ left: `${25 + i * 25}%`, top: '10%' }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], y: -50, scale: [0, 1.3, 0.9] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, delay: i * 0.15 }}
              >
                💕
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* 双击时的星星效果 */}
      <AnimatePresence>
        {isInteracting && interactionType === 'shake' && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute text-lg pointer-events-none"
                style={{
                  left: `${15 + i * 23}%`,
                  top: i % 2 === 0 ? '5%' : '85%',
                }}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 1], rotate: [0, i * 90, i * 180] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, delay: i * 0.1 }}
              >
                ⭐
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* 光晕效果 */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -size * 0.25,
          background: 'radial-gradient(circle, rgba(135, 206, 235, 0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

// ─── Background Theme Component ─────────────────────────────────────────────

function BackgroundTheme({ theme }: { theme: string }) {
  if (theme === 'starry') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0a1628, #1a2a4a)' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              top: `${(i * 5) % 95}%`,
              left: `${(i * 7) % 96}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
            transition={{ duration: 1.5 + (i % 3) * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
          />
        ))}
      </div>
    );
  }

  if (theme === 'flower') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: 'linear-gradient(to bottom, #FFF0F5, #FFE4E1)' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`petal-${i}`}
            className="absolute text-base"
            style={{ top: -25, left: `${8 + (i * 11) % 84}%` }}
            animate={{ y: [0, 450], x: [0, Math.sin(i * 0.8) * 35], rotate: [0, 360], opacity: [0, 0.65, 0.65, 0] }}
            transition={{ duration: 6 + (i % 3), repeat: Infinity, ease: 'linear', delay: i * 0.7 }}
          >
            🌸
          </motion.div>
        ))}
      </div>
    );
  }

  if (theme === 'aurora') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0a0a2e, #1a1a3e)' }}>
        <motion.div
          className="absolute"
          style={{ top: '8%', left: '-25%', width: '150%', height: '42%', background: 'linear-gradient(180deg, rgba(0,255,128,0.1) 0%, rgba(128,0,255,0.1) 50%, rgba(0,255,128,0.05) 100%)', filter: 'blur(35px)' }}
          animate={{ x: ['-12%', '12%', '-12%'], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute"
          style={{ top: '18%', left: '-15%', width: '130%', height: '32%', background: 'linear-gradient(180deg, rgba(128,0,255,0.08) 0%, rgba(0,200,255,0.08) 50%, rgba(128,0,255,0.04) 100%)', filter: 'blur(30px)' }}
          animate={{ x: ['12%', '-12%', '12%'], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,248,240,0.3) 0%, rgba(255,240,245,0.2) 50%, rgba(240,248,255,0.15) 100%)' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-white/30"
          style={{ width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, top: `${(i * 15) % 90}%`, left: `${(i * 17) % 95}%` }}
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8], y: [-15, 15, -15] }}
          transition={{ duration: 4 + (i % 2), repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}

// ─── Absorption Animation ────────────────────────────────────────────────────

function AbsorptionEffect({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-30"
      style={{ top: '15%', right: '-8%' }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
      animate={{ x: -140, y: 90, scale: 0.25, opacity: 0, rotate: 180 }}
      transition={{ duration: 0.9, ease: 'easeIn' }}
      onAnimationComplete={onComplete}
    >
      <span className="text-3xl">❄️</span>
    </motion.div>
  );
}

// ─── Enhanced Progress Badge ────────────────────────────────────────────────

function ProgressBadge({
  stageConfig,
  progressText,
  totalRecords,
  nextThreshold,
}: {
  stageConfig: any;
  progressText: string;
  totalRecords: number;
  nextThreshold: number | null;
}) {
  const stageEmojis: Record<string, string> = {
    snowflake: '☁️',
    small_ball: '😊',
    ball: '⛄',
  };

  const stageEmoji = stageConfig ? stageEmojis[stageConfig.stage] || '❄️' : '❄️';
  const stageDescriptions: Record<string, string> = {
    snowflake: '初生的小云朵，充满好奇',
    small_ball: '闭眼享受成长的快乐',
    ball: '戴上围巾，变得温暖',
  };
  const description = stageConfig ? stageDescriptions[stageConfig.stage] || '' : '';

  return (
    <motion.div
      className="mt-6 text-center relative z-10"
      initial={{ y: 25, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25, type: 'spring', stiffness: 120 }}
    >
      <motion.div
        className="inline-flex flex-col items-center justify-center bg-white/95 backdrop-blur-md rounded-3xl px-8 py-5 shadow-2xl border-2 relative overflow-hidden"
        style={{ borderColor: 'rgba(255, 182, 193, 0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,248,240,0.95) 100%)' }}
        whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(255, 182, 193, 0.25)' }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="absolute top-0 left-0 w-16 h-16 rounded-br-3xl opacity-20" style={{ background: 'linear-gradient(135deg, #FFB6C1 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-3xl opacity-20" style={{ background: 'linear-gradient(-45deg, #87CEEB 0%, transparent 60%)' }} />

        <motion.div className="text-4xl mb-2" animate={{ y: [0, -6, 0], rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {stageEmoji}
        </motion.div>

        <p className="text-3xl lg:text-4xl font-black tracking-wide" style={{ backgroundImage: 'linear-gradient(135deg, #FFB6C1 0%, #FF99AA 30%, #87CEEB 70%, #5BA8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {progressText}
        </p>

        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs">☁️</span>
          <p className="text-sm font-semibold text-gray-500">
            {description || (stageConfig ? '雪球成长阶段' : '雪球成长度')}
          </p>
          <span className="text-xs">❄️</span>
        </div>

        {stageConfig && nextThreshold !== null && (
          <motion.div className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFB6C1]/10 to-[#87CEEB]/10 border border-[#FFB6C1]/20" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-xs text-gray-500 font-medium">
              距离{' '}
              <span className="font-bold text-[#FF99AA]">
                {(() => {
                  const stages = ['snowflake', 'small_ball', 'ball'];
                  const currentIndex = stages.indexOf(stageConfig.stage);
                  const labels = ['小云朵', '小雪球', '雪球'];
                  return currentIndex >= 0 && currentIndex < stages.length - 1 ? labels[currentIndex + 1] : '下一阶段';
                })()}
              </span>{' '}
              还需 <span className="font-bold text-[#87CEEB]">{nextThreshold - totalRecords}</span> 个记录 ✨
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Custom Hook: Window Size ────────────────────────────────────────────────

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始调用

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// ─── Helper: Get Responsive Scale Ratio ──────────────────────────────────────

function getResponsiveScaleRatio(width: number): number {
  if (width < RESPONSIVE_BREAKPOINTS.mobile) {
    return SIZE_SCALE_RATIOS.mobile;
  } else if (width < RESPONSIVE_BREAKPOINTS.tablet) {
    return SIZE_SCALE_RATIOS.tablet;
  } else if (width < RESPONSIVE_BREAKPOINTS.desktop) {
    return SIZE_SCALE_RATIOS.desktop;
  }
  return SIZE_SCALE_RATIOS.large;
}

// ─── Main Component ──────────────────────────────────────────────────────────

const SnowballAnimation = React.memo(({
  totalRecords,
  progress = 0,
  triggerRoll,
  totalSteps = 1,
  completedSteps = 0,
  snowballColor = 'white',
  decoration = 'none',
  backgroundTheme = 'clear_sky',
  onInteract,
}: SnowballAnimationProps) => {
  const rollControls = useAnimation();
  const prevTriggerRoll = useRef(triggerRoll);
  const [interactionExpression, setInteractionExpression] = useState<string | null>(null);
  const [absorptionKey, setAbsorptionKey] = useState<number>(0);
  const [showAbsorption, setShowAbsorption] = useState(false);
  const prevTotalRecords = useRef(totalRecords);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);

  // 获取窗口大小用于响应式调整
  const { width: windowWidth } = useWindowSize();
  const scaleRatio = useMemo(() => getResponsiveScaleRatio(windowWidth), [windowWidth]);

  // Determine stage from totalRecords or fall back to progress-based sizing
  const stageConfig = useMemo(() => {
    if (totalRecords !== undefined) {
      return getSnowballStage(totalRecords);
    }
    return null;
  }, [totalRecords]);

  // Calculate size: use stage config if available, otherwise use progress-based
  // 应用响应式缩放比例
  const currentSize = useMemo(() => {
    let baseSize: number;
    if (stageConfig) {
      baseSize = stageConfig.size;
    } else {
      const baseSizeFromProgress = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.min(progress / 100, 1);
      if (progress === 0) baseSize = MIN_SIZE;
      else if (totalSteps > 0 && completedSteps > 0) {
        const stepsRatio = Math.min(completedSteps / totalSteps, 1);
        baseSize = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * stepsRatio;
      } else {
        baseSize = baseSizeFromProgress;
      }
    }
    // 应用响应式缩放
    return Math.round(baseSize * scaleRatio);
  }, [stageConfig, progress, completedSteps, totalSteps, scaleRatio]);

  const currentStage: SnowballStage = stageConfig?.stage || 'ball';

  // Absorption animation: trigger when totalRecords increases
  useEffect(() => {
    if (totalRecords !== undefined && prevTotalRecords.current !== undefined && totalRecords > prevTotalRecords.current) {
      setShowAbsorption(true);
      setAbsorptionKey((k) => k + 1);
    }
    prevTotalRecords.current = totalRecords;
  }, [totalRecords]);

  // Roll animation on triggerRoll
  useEffect(() => {
    if (triggerRoll !== undefined && triggerRoll !== prevTriggerRoll.current) {
      prevTriggerRoll.current = triggerRoll;
      rollControls.start({
        rotate: 360,
        x: 35,
        transition: { duration: 0.65, ease: 'easeOut' },
      }).then(() => {
        rollControls.start({
          rotate: 0,
          x: 0,
          scale: 1.18,
          transition: { duration: 0.35, ease: 'easeInOut' },
        }).then(() => {
          rollControls.start({
            scale: 1,
            transition: { duration: 0.45, ease: 'easeOut' },
          });
        });
      });
    }
  }, [triggerRoll, totalSteps, progress, rollControls]);

  // Interaction handlers with enhanced feedback
  const handleClick = useCallback(() => {
    clickCountRef.current += 1;
    incrementSnowballClicks();

    if (clickCountRef.current === 1) {
      clickTimerRef.current = setTimeout(async () => {
        if (clickCountRef.current === 1) {
          setInteractionExpression('pet');
          onInteract?.('pet');
          await incrementSnowballInteractions();
          analytics.trackSnowballInteract('pet', currentStage);
          setTimeout(() => setInteractionExpression(null), 900);
        }
        clickCountRef.current = 0;
      }, 250);
    }

    if (clickCountRef.current >= 2) {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickCountRef.current = 0;
      setInteractionExpression('shake');
      onInteract?.('shake');
      incrementSnowballInteractions();
      analytics.trackSnowballInteract('shake', currentStage);
      setTimeout(() => setInteractionExpression(null), 900);
    }
  }, [onInteract, currentStage]);

  // Progress display text
  const progressText = stageConfig ? stageConfig.label : `${progress}%`;

  // Next threshold for progress display
  const nextThreshold = useMemo(() => {
    if (!stageConfig || !totalRecords) return null;
    const stages = ['snowflake', 'small_ball', 'ball'];
    const currentIndex = stages.indexOf(stageConfig.stage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return null;
    const thresholds = [0, 4, 11];
    return thresholds[currentIndex + 1];
  }, [stageConfig, totalRecords]);

  return (
    <div
      className="flex flex-col items-center justify-center p-8 relative select-none min-h-[500px]"
      onClick={handleClick}
      style={{ cursor: onInteract ? 'pointer' : 'default' }}
    >
      {/* Background theme with enhanced effects */}
      <BackgroundTheme theme={backgroundTheme} />

      {/* Ambient glow effect behind character */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="rounded-full"
          style={{
            width: currentSize * 2,
            height: currentSize * 2,
            background: `radial-gradient(circle, ${
              snowballColor === 'pink'
                ? 'rgba(255,182,193,0.15)'
                : snowballColor === 'blue'
                ? 'rgba(135,206,235,0.15)'
                : snowballColor === 'gold'
                ? 'rgba(255,215,0,0.15)'
                : 'rgba(180,220,245,0.15)'
            } 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Absorption animation */}
      <AnimatePresence>
        {showAbsorption && (
          <AbsorptionEffect
            key={absorptionKey}
            onComplete={() => setShowAbsorption(false)}
          />
        )}
      </AnimatePresence>

      {/* Character container with roll controls */}
      <motion.div
        animate={rollControls}
        variants={{ initial: { rotate: 0, x: 0, scale: 1 } }}
        initial="initial"
        className="relative z-10"
      >
        {/* Absorption grow effect */}
        <motion.div
          animate={showAbsorption ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* 使用基于图片的角色组件 */}
          <ImageBasedCharacter
            stage={currentStage}
            size={currentSize}
            isInteracting={interactionExpression !== null}
            interactionType={interactionExpression}
          />
        </motion.div>
      </motion.div>

      {/* Enhanced progress badge */}
      <ProgressBadge
        stageConfig={stageConfig}
        progressText={progressText}
        totalRecords={totalRecords || 0}
        nextThreshold={nextThreshold}
      />
    </div>
  );
});

export default SnowballAnimation;
