'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnowball } from '@/contexts/SnowballContext';
import { getStoryText } from '@/lib/snowball-story-text';
import type { SnowballStage } from '@/lib/snowball-score';
import Image from 'next/image';

const STAGE_IMAGES: Record<SnowballStage, { image: string; alt: string }> = {
  snowflake: { image: '/images/snowball-stages/stage-1.webp', alt: '可爱的雪粒宝宝' },
  small_ball: { image: '/images/snowball-stages/stage-2.webp', alt: '闭眼微笑的雪球' },
  ball: { image: '/images/snowball-stages/stage-3.webp', alt: '戴围巾的雪球' },
};

const LOADING_DOTS = ['·', '· ·', '· · ·'];

interface SnowballLoadingOverlayProps {
  isVisible: boolean;
}

export default function SnowballLoadingOverlay({ isVisible }: SnowballLoadingOverlayProps) {
  const { stage } = useSnowball();
  const stageImage = STAGE_IMAGES[stage];
  const story = getStoryText('recordLoading', stage);
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setDotIndex(prev => (prev + 1) % LOADING_DOTS.length);
    }, 500);
    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ scale: 0.8, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className="relative"
              style={{ width: 96, height: 96 }}
              animate={{
                y: [0, -8, 0],
                rotate: [0, 8, -8, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Image
                src={stageImage.image}
                alt={stageImage.alt}
                width={96}
                height={96}
                priority
                className="object-contain drop-shadow-lg"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-radial from-white/90 to-transparent rounded-full blur-xl" />
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-1 text-center px-4"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <p className="text-sm font-medium text-gray-700">
                {story.main}
                <motion.span
                  key={dotIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-block w-8 text-left"
                >
                  {LOADING_DOTS[dotIndex]}
                </motion.span>
              </p>
              <p className="text-xs text-gray-400">{story.sub}</p>
            </motion.div>

            <motion.div
              className="flex gap-1 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-pink-300"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
