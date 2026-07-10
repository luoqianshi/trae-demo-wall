'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSnowball } from '@/contexts/SnowballContext';
import type { SnowballStage } from '@/lib/snowball-score';

interface StageImageConfig {
  image: string;
  alt: string;
}

const STAGE_IMAGES: Record<SnowballStage, StageImageConfig> = {
  snowflake: { image: '/images/snowball-stages/stage-1.webp', alt: '可爱的雪粒宝宝' },
  small_ball: { image: '/images/snowball-stages/stage-2.webp', alt: '闭眼微笑的雪球' },
  ball: { image: '/images/snowball-stages/stage-3.webp', alt: '戴围巾的雪球' },
};

const SIZE_MAP = {
  sm: 48,
  md: 120,
  lg: 160,
} as const;

interface SnowballCharacterProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'sleepy' | 'excited';
  className?: string;
}

export default function SnowballCharacter({
  size = 'md',
  mood,
  className = '',
}: SnowballCharacterProps) {
  const { stage } = useSnowball();
  const stageImage = STAGE_IMAGES[stage];
  const px = SIZE_MAP[size];

  return (
    <motion.div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
      animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
    >
      <Image
        src={stageImage.image}
        alt={stageImage.alt}
        width={px}
        height={px}
        priority
        className="object-contain drop-shadow-md"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-radial from-white/80 to-transparent rounded-full blur-xl" />
    </motion.div>
  );
}
