'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, MessagesSquare, TreePine, Zap, Brain, TrendingUp } from 'lucide-react';
import { useFamilyHubStore } from '@/stores/family-hub-store';

/* ── Shared animation presets ── */
const SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 };
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── AI welcome copy (UI 文案，非数据) ── */
const AI_MESSAGES = [
  '你好。',
  '欢迎来到岁言。',
  '我是时墨。',
  '未来，我会陪伴整个家庭成长。',
  '今天想和我聊聊最近发生的一件开心的小事吗？',
];

export function HeroSection() {
  const metrics = useFamilyHubStore((s) => s.metrics);
  const { masteredSkills, longTermMemories, understandingPercent } = metrics;

  // 注：store 的 metrics 中无"陪伴天数"字段，遵循"不使用静态 mock 数据"原则，
  // 第三枚 stat 胶囊以长期记忆 (longTermMemories) 替代陪伴天数。
  const stats = [
    { icon: Zap, color: 'text-accent', prefix: '已掌握 ', value: masteredSkills, suffix: ' 项技能' },
    { icon: TrendingUp, color: 'text-life-green', prefix: '沉淀 ', value: longTermMemories, suffix: ' 段记忆' },
    { icon: Brain, color: 'text-life-amber', prefix: '理解程度 ', value: understandingPercent, suffix: '%' },
  ];

  return (
    <section className="relative min-h-[65vh] w-full overflow-hidden flex flex-col items-center justify-center text-center px-4 py-20">
      {/* === Soft radial gradient glow (pure CSS, no images) === */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 32%, rgba(94,158,245,0.20), transparent 55%),' +
            'radial-gradient(circle at 82% 18%, rgba(74,222,128,0.12), transparent 45%),' +
            'radial-gradient(circle at 18% 82%, rgba(167,139,250,0.12), transparent 45%)',
        }}
      />
      {/* Breathing core orb */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: 'rgba(94,158,245,0.10)' }}
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* === Title === */}
        <motion.div
          className="relative inline-block"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="absolute -inset-16 rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
          <h1 className="relative text-5xl sm:text-7xl font-bold tracking-tight text-text">
            Family AI Hub
          </h1>
        </motion.div>

        {/* === Subtitle === */}
        <motion.p
          className="mt-4 text-xl text-text-muted font-light tracking-wide"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
        >
          真正懂整个家庭的 AI
        </motion.p>

        {/* === Slogan === */}
        <motion.p
          className="mt-2 text-sm text-text-subtle tracking-widest"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
        >
          连接家庭 · 沉淀记忆 · 陪伴成长
        </motion.p>

        {/* === Core stat capsules === */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.prefix}
                whileHover={{ y: -3, scale: 1.04 }}
                transition={SPRING}
                className="liquid-glass px-4 py-2 flex items-center gap-2"
              >
                <Icon size={14} className={s.color} />
                <span className="text-xs text-text-muted">
                  {s.prefix}
                  <span className="text-text font-medium">{s.value}</span>
                  {s.suffix}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* === AI welcome messages (staggered fade-in) === */}
        <motion.div
          className="mt-8 w-full max-w-xl"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
        >
          <div className="liquid-glass-strong p-6 relative overflow-hidden text-left">
            <div className="absolute top-5 left-6 h-14 w-14 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <motion.div
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#5e5ce6] shadow-lg"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </motion.div>
              <div className="flex-1 space-y-1.5">
                {AI_MESSAGES.map((msg, i) => (
                  <motion.p
                    key={i}
                    className={`text-sm leading-relaxed ${
                      i === AI_MESSAGES.length - 1 ? 'text-text/90 pt-1' : 'text-text/70'
                    }`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.12, duration: 0.4, ease: EASE }}
                  >
                    {msg}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* === CTA buttons === */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
        >
          <motion.div whileHover={{ y: -3, scale: 1.03 }} transition={SPRING}>
            <Link
              href="/interview"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white shadow-lg shadow-accent/20 hover:bg-accent-hover transition-colors"
            >
              <MessagesSquare className="h-4 w-4" />
              开始今天的陪伴
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -3, scale: 1.03 }} transition={SPRING}>
            <Link
              href="/life-tree"
              className="inline-flex items-center justify-center gap-2 rounded-xl liquid-glass px-6 py-3 text-sm font-medium text-text hover:bg-glass-hover transition-colors"
            >
              <TreePine className="h-4 w-4 text-life-green" />
              进入生命树
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
