'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SnowballCharacter from './SnowballCharacter';
import { getStoryText } from '@/lib/snowball-story-text';
import { useSnowball } from '@/contexts/SnowballContext';

interface CelebrationEffectProps {
  isActive: boolean;
  type: 'breakthrough' | 'streak' | 'late_night' | 'normal' | 'question_answer' | 'challenge';
  onComplete: () => void;
  answerContent?: string;
  streakDays?: number;
  message?: string;
  difficulty?: 'bronze' | 'silver' | 'gold';
  reward?: Record<string, any>;
  milestoneReward?: { score: number; title: string } | null;
}

// --- Particle configurations per celebration type ---

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  emoji?: string;
  rotation: number;
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = ['#FFB6C1', '#87CEEB', '#FFD700', '#FF6B9D', '#90EE90', '#DDA0DD', '#FFA07A'];

function generateConfettiParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: (Math.random() - 0.5) * 300 - 50,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotation: Math.random() * 360,
    delay: Math.random() * 0.3,
    duration: 0.8 + Math.random() * 0.6,
  }));
}

function generateFlameParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const radius = 60 + Math.random() * 20;
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: 8 + Math.random() * 6,
      color: ['#FF6B00', '#FF9500', '#FFD700', '#FF4500', '#FFA500'][i % 5],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.2,
      duration: 0.6 + Math.random() * 0.4,
    };
  });
}

function generateStarParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 280,
    y: (Math.random() - 0.5) * 280 - 30,
    size: 4 + Math.random() * 6,
    color: ['#FFFACD', '#E8E8FF', '#B0C4DE', '#FFD700'][i % 4],
    emoji: i % 3 === 0 ? '⭐' : undefined,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    duration: 0.8 + Math.random() * 0.6,
  }));
}

function generateSnowflakeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 60;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 6 + Math.random() * 8,
      color: ['#B8D4E8', '#87CEEB', '#E8F4FD', '#FFFFFF'][i % 4],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.4,
      duration: 0.6 + Math.random() * 0.5,
    };
  });
}

// --- Celebration text per type ---

const CELEBRATION_TEXT: Record<CelebrationEffectProps['type'], string> = {
  breakthrough: '这是一个突破！🎊',
  streak: '连续第N天！🔥',
  late_night: '这么晚还在坚持，真了不起 🌙',
  normal: '雪球+5% 🎈',
  question_answer: '感谢你的分享！❄️',
  challenge: '挑战完成！🎉',
};

// --- Sub-components for each celebration type ---

const ConfettiEffect: React.FC<{ particles: Particle[] }> = ({ particles }) => (
  <>
    {particles.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-sm"
        style={{
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          left: '50%',
          top: '50%',
        }}
        initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
        animate={{
          x: p.x,
          y: p.y,
          scale: [0, 1.2, 1],
          rotate: p.rotation + 360,
          opacity: [1, 1, 0.6],
        }}
        transition={{
          duration: p.duration,
          delay: p.delay,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);

const BreakthroughEffect: React.FC = () => {
  const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#C9B1FF'];
  
  return (
    <>
      {[...Array(5)].map((_, burst) => {
        const burstDelay = burst * 0.15;
        const burstX = (burst - 2) * 50;
        const burstY = (burst % 2 === 0 ? -1 : 1) * 30;
        
        return (
          <React.Fragment key={burst}>
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 60 + Math.random() * 30;
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <motion.div
                  key={`firework-${burst}-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 4,
                    height: 4,
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
                  }}
                  initial={{ 
                    x: burstX, 
                    y: burstY, 
                    scale: 0,
                    opacity: 0 
                  }}
                  animate={{
                    x: burstX + Math.cos(angle) * distance,
                    y: burstY + Math.sin(angle) * distance,
                    scale: [0, 1.5, 0.3],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: burstDelay,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
            
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
              const distance = 40 + Math.random() * 20;
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <motion.div
                  key={`trail-${burst}-${i}`}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 2,
                    height: 8,
                    backgroundColor: color,
                    borderRadius: 2,
                  }}
                  initial={{ 
                    x: burstX, 
                    y: burstY, 
                    scale: 0,
                    opacity: 0,
                    rotate: 0
                  }}
                  animate={{
                    x: burstX + Math.cos(angle) * distance,
                    y: burstY + Math.sin(angle) * distance,
                    scale: [0, 1.2, 0.5],
                    opacity: [0, 0.8, 0],
                    rotate: [0, 180]
                  }}
                  transition={{
                    duration: 0.6,
                    delay: burstDelay + 0.1,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </React.Fragment>
        );
      })}

      {[...Array(5)].map((_, i) => {
        const startX = (i - 2) * 40;
        return (
          <motion.div
            key={`streamer-${i}`}
            className="absolute"
            style={{ left: '50%', top: '50%' }}
            initial={{ x: startX, y: -160, scaleY: 0, opacity: 0 }}
            animate={{ 
              y: [ -160, 20 ],
              scaleY: [0, 1, 0.8],
              opacity: [0, 0.8, 0],
            }}
            transition={{ duration: 1.8, delay: Math.abs(i - 2) * 0.1, ease: 'easeOut' }}
          >
            <div
              className="w-2 h-24 rounded-full"
              style={{
                background: `linear-gradient(to bottom, ${colors[i]}, transparent)`,
              }}
            />
          </motion.div>
        );
      })}

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-5xl">🎊</div>
      </motion.div>

      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 80 + Math.random() * 20;
        return (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute"
            style={{ left: '50%', top: '50%' }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1, 0.5],
              opacity: [0, 0.6, 0],
            }}
            transition={{ duration: 1, delay: 0.6 + i * 0.03, ease: 'easeOut' }}
          >
            <div className="text-sm opacity-60">✦</div>
          </motion.div>
        );
      })}
    </>
  );
};

const SpiralEnergyEffect: React.FC<{ particles: Particle[]; streakDays: number }> = ({ particles, streakDays }) => {
  const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#C9B1FF'];
  
  return (
    <>
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
      >
        <div
          className="relative flex items-center justify-center rounded-2xl px-6 py-3"
          style={{
            background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 50%, #C9B1FF 100%)',
            boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4), 0 4px 16px rgba(255, 217, 61, 0.3)',
          }}
        >
          <motion.span
            className="text-4xl font-black text-white"
            style={{
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {streakDays}
          </motion.span>
          <motion.span
            className="text-lg font-bold text-white ml-1"
            style={{
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            天
          </motion.span>
          
          <motion.div
            className="absolute -top-3 -right-3"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <span className="text-2xl">🎉</span>
          </motion.div>
        </div>
      </motion.div>
      
      {[...Array(8)].map((_, i) => {
        const baseX = (i - 3.5) * 25;
        const startX = baseX + (Math.random() - 0.5) * 10;
        const startY = 80 + (i % 3) * 15;
        
        return (
          <motion.div
            key={`confetti-${i}`}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
            initial={{ 
              x: startX, 
              y: startY, 
              rotate: 0,
              opacity: 0 
            }}
            animate={{
              x: startX + (Math.random() - 0.5) * 100,
              y: [startY, startY - 80, startY - 40],
              rotate: [0, 360],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: 0.2 + Math.random() * 0.5,
              ease: 'easeOut',
            }}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: colors[i % colors.length],
                transform: `rotate(${Math.random() * 45}deg)`,
              }}
            />
          </motion.div>
        );
      })}
    </>
  );
};

const LightBurstEffect: React.FC = () => (
  <>
    {[...Array(12)].map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 100;
      return (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 4,
            height: 60,
            background: `linear-gradient(to top, transparent, ${['#FF6B6B', '#FFA07A', '#FFD700', '#90EE90', '#87CEEB', '#DDA0DD'][i % 6]})`,
            transformOrigin: 'center bottom',
            transform: `rotate(${angle}rad) translateX(-50%)`,
          }}
          initial={{ 
            scaleY: 0, 
            opacity: 0,
            x: '-50%',
            y: '-100%'
          }}
          animate={{ 
            scaleY: [0, 1.5, 1], 
            opacity: [0, 1, 0.7],
            y: ['-100%', '-250%', '-200%']
          }}
          transition={{ 
            duration: 0.8, 
            delay: i * 0.05, 
            ease: 'easeOut' 
          }}
        />
      );
    })}
    {[...Array(8)].map((_, i) => {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const colors = ['#FF6B6B', '#FFD700', '#87CEEB', '#DDA0DD'];
      return (
        <motion.div
          key={`ring-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 2, 1.5], 
            opacity: [0, 0.8, 0] 
          }}
          transition={{ 
            duration: 1.2, 
            delay: i * 0.15, 
            ease: 'easeOut' 
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: 40 + i * 20,
              height: 40 + i * 20,
              border: `2px solid ${colors[i % 4]}`,
              filter: 'blur(2px)',
            }}
          />
        </motion.div>
      );
    })}
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 2, 1], opacity: [0, 1, 1] }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="text-6xl">✨</div>
    </motion.div>
  </>
);

const StarryVortexEffect: React.FC<{ particles: Particle[] }> = ({ particles }) => (
  <>
    {[...Array(3)].map((_, wave) => (
      <motion.div
        key={`aurora-${wave}`}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 2.5, 2], 
          opacity: [0, 0.6, 0.3],
          rotate: [0, wave % 2 === 0 ? 180 : -180]
        }}
        transition={{ 
          duration: 2.5, 
          delay: wave * 0.4, 
          ease: 'easeOut' 
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: 100 + wave * 60,
            height: 100 + wave * 60,
            background: `conic-gradient(from ${wave * 60}deg, 
              rgba(100, 200, 255, 0.3), 
              rgba(150, 100, 255, 0.3), 
              rgba(200, 150, 255, 0.3), 
              rgba(100, 200, 255, 0.3))`,
            filter: `blur(${15 + wave * 5}px)`,
          }}
        />
      </motion.div>
    ))}
    
    {[...Array(20)].map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 100;
      const size = 1 + Math.random() * 3;
      return (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            left: '50%',
            top: '50%',
            width: size,
            height: size,
            boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`,
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0 
          }}
          animate={{
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            scale: [0, 1.5, 1],
            opacity: [0, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
        />
      );
    })}
    
    {[...Array(8)].map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      return (
        <motion.div
          key={`firefly-${i}`}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0 
          }}
          animate={{
            x: Math.cos(angle) * distance,
            y: [0, Math.sin(angle) * distance - 20, Math.sin(angle) * distance],
            scale: [0, 1.2, 0.8],
            opacity: [0, 1, 0.6],
          }}
          transition={{
            duration: 2,
            delay: i * 0.15,
            ease: 'easeOut',
          }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(200, 255, 200, 0.9) 0%, rgba(100, 255, 150, 0.5) 50%, transparent 100%)',
              boxShadow: '0 0 10px rgba(150, 255, 150, 0.8)',
            }}
          />
        </motion.div>
      );
    })}
    
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ scale: 0, opacity: 0, y: 30 }}
      animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1], y: [30, -10, 0] }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <div className="relative">
        <div className="text-6xl">🌙</div>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 200, 0.4) 0%, transparent 60%)',
            filter: 'blur(8px)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </motion.div>
  </>
);

const RippleDiffusionEffect: React.FC<{ particles: Particle[] }> = ({ particles }) => (
  <>
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 2.8, 2.3], 
          opacity: [0, 0.7, 0] 
        }}
        transition={{ 
          duration: 1.8, 
          delay: i * 0.25, 
          ease: 'easeOut' 
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: 50,
            height: 50,
            border: `2px solid`,
            borderColor: ['#87CEEB', '#FFB6C1', '#FFD700', '#90EE90', '#DDA0DD'][i],
            background: `radial-gradient(circle, ${['rgba(135, 206, 235, 0.15)', 'rgba(255, 182, 193, 0.15)', 'rgba(255, 215, 0, 0.15)', 'rgba(144, 238, 144, 0.15)', 'rgba(221, 160, 221, 0.15)'][i]} 0%, transparent 70%)`,
            boxShadow: `0 0 20px ${['rgba(135, 206, 235, 0.4)', 'rgba(255, 182, 193, 0.4)', 'rgba(255, 215, 0, 0.4)', 'rgba(144, 238, 144, 0.4)', 'rgba(221, 160, 221, 0.4)'][i]}`,
          }}
        />
      </motion.div>
    ))}
    
    {[...Array(12)].map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 40 + Math.random() * 50;
      return (
        <motion.div
          key={`particle-${i}`}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0 
          }}
          animate={{
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            scale: [0, 1.3, 0.6],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.08,
            ease: 'easeOut',
          }}
        >
          <div className="text-lg opacity-70">{['❄️', '✨', '💫', '⭐'][i % 4]}</div>
        </motion.div>
      );
    })}
    
    {[...Array(6)].map((_, i) => {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const distance = 60;
      return (
        <motion.div
          key={`glow-${i}`}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: 8,
            height: 8,
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0 
          }}
          animate={{
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            scale: [0, 1.5, 0.8],
            opacity: [0, 0.8, 0.3],
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.12,
            ease: 'easeOut',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${['#87CEEB', '#FFB6C1', '#FFD700', '#90EE90', '#DDA0DD', '#FFA07A'][i]} 0%, transparent 70%)`,
              boxShadow: `0 0 10px ${['#87CEEB', '#FFB6C1', '#FFD700', '#90EE90', '#DDA0DD', '#FFA07A'][i]}`,
            }}
          />
        </motion.div>
      );
    })}
    
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: [0.3, 1.6, 1.3], opacity: [0, 1, 1] }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, #FFFFFF 0%, #E8F4FD 30%, #87CEEB 70%, #FFB6C1 100%)',
          boxShadow: '0 0 40px rgba(135, 206, 235, 0.6), 0 0 80px rgba(255, 182, 193, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.5)',
        }}
      >
        <motion.span 
          className="text-3xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⛄
        </motion.span>
      </div>
    </motion.div>
  </>
);

const ENCOURAGEMENTS = [
  '每一次分享都让雪球更滚更远 ⛄',
  '你的故事值得被记录 ✨',
  '感谢你愿意与我分享 💫',
  '今天的你，又进步了一点点 🌱',
  '雪球因你而更加温暖 🧡',
];

const QuestionAnswerCard: React.FC<{ answerContent?: string }> = ({ answerContent }) => {
  const { stage } = useSnowball();
  const storyText = getStoryText('dailyQuestion', stage);

  const truncatedAnswer = useMemo(() => {
    if (!answerContent) return '';
    return answerContent.length > 50 ? answerContent.slice(0, 50) + '...' : answerContent;
  }, [answerContent]);

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="absolute -top-4 -left-4 text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>✨</div>
      <div className="absolute -top-2 -right-6 text-xl animate-bounce" style={{ animationDelay: '0.3s' }}>❄️</div>
      <div className="absolute -bottom-3 -left-5 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>💫</div>

      <div className="bg-gradient-to-br from-white via-[#FFF5F7] to-[#F0F8FF] rounded-3xl shadow-2xl border border-[#FFB6C1]/30 p-6 w-80 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFB6C1] via-[#87CEEB] to-[#FFD700]" />

        <div className="flex justify-center mb-4">
          <SnowballCharacter size="md" />
        </div>

        <h3 className="text-center text-lg font-bold text-gray-700 mb-2">
          {storyText.main}
        </h3>

        <p className="text-center text-sm text-gray-500 mb-3">
          {storyText.sub}
        </p>

        {truncatedAnswer && (
          <div className="bg-white/60 rounded-xl p-3 mb-4 border border-[#FFB6C1]/20">
            <p className="text-sm text-gray-600 italic text-center">"{truncatedAnswer}"</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFB6C1]/20 to-[#87CEEB]/20 rounded-full py-2 px-4">
          <span className="text-lg">🎁</span>
          <span className="text-sm font-medium bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent">
            +5分 ⚡
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main component ---

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ 
  isActive, 
  type, 
  onComplete, 
  answerContent, 
  streakDays = 1, 
  message,
  difficulty = 'bronze',
  reward = {},
  milestoneReward,
}) => {
  const particles = useMemo(() => {
    switch (type) {
      case 'breakthrough':
        return generateConfettiParticles(30);
      case 'streak':
        return generateFlameParticles(20);
      case 'late_night':
        return generateStarParticles(15);
      case 'normal':
        return generateSnowflakeParticles(12);
      case 'challenge':
        return generateConfettiParticles(difficulty === 'gold' ? 40 : 25);
      default:
        return [];
    }
  }, [type, difficulty]);

  const text = useMemo(() => {
    if (message) return message;
    if (type === 'streak') {
      return `连续滚雪球第${streakDays}天！🔥`;
    }
    if (type === 'challenge') {
      if (milestoneReward) return '里程碑达成！';
      return '挑战完成！🎉';
    }
    return CELEBRATION_TEXT[type];
  }, [message, type, streakDays, milestoneReward]);

  useEffect(() => {
    if (!isActive) return;
    const duration = type === 'question_answer' ? 3500 : type === 'breakthrough' ? 3500 : type === 'challenge' ? 3500 : 2500;
    const timer = setTimeout(() => {
      onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [isActive, onComplete, type]);

  if (type === 'question_answer') {
    return (
      <AnimatePresence>
        {isActive && (
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
            <QuestionAnswerCard answerContent={answerContent} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Effects container */}
          <motion.div 
            className="relative w-80 h-80 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {type === 'breakthrough' && <BreakthroughEffect />}
            {type === 'challenge' && <RippleDiffusionEffect particles={particles} />}
            {type === 'streak' && <SpiralEnergyEffect particles={particles} streakDays={streakDays} />}
            {type === 'late_night' && <StarryVortexEffect particles={particles} />}
            {type === 'normal' && <RippleDiffusionEffect particles={particles} />}
          </motion.div>

          {/* Text */}
          <motion.div
            className="absolute bottom-1/3 left-1/2 -translate-x-1/2"
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-[#FFB6C1]/20">
              <p className="text-base font-bold bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent whitespace-nowrap">
                {text}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { BreakthroughEffect, CelebrationEffect };
export default CelebrationEffect;
