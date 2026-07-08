'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Cpu, GraduationCap, Sparkles } from 'lucide-react';
import { useFamilyHubStore, type ShimoStatus } from '@/stores/family-hub-store';
import { AnimatedNumber } from '@/components/home/animated-number';

/* ── Spring transition shared across the section ── */
const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

/* ── ShimoCore status metadata ── */
interface StatusMeta {
  label: string;
  color: string;
  glow: string;
}

const SHIMO_STATUS_META: Record<ShimoStatus, StatusMeta> = {
  online: { label: '在线', color: '#4ADE80', glow: 'rgba(74,222,128,0.35)' },
  thinking: { label: '思考中', color: '#5E9EF5', glow: 'rgba(94,158,245,0.35)' },
  learning: { label: '学习中', color: '#FBBF24', glow: 'rgba(251,191,36,0.35)' },
  updating_memory: { label: '更新记忆', color: '#A78BFA', glow: 'rgba(167,139,250,0.35)' },
  updating_tree: { label: '更新生命树', color: '#4ADE80', glow: 'rgba(74,222,128,0.35)' },
  syncing_wechat: { label: '同步微信', color: '#22D3EE', glow: 'rgba(34,211,238,0.35)' },
};

/* ── Core metric card definition ── */
interface MetricCard {
  key: string;
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

export function ShimoCoreSection() {
  const shimoCore = useFamilyHubStore((s) => s.shimoCore);

  const statusMeta = SHIMO_STATUS_META[shimoCore.status] ?? SHIMO_STATUS_META.online;

  const metrics: MetricCard[] = [
    {
      key: 'understanding',
      label: '理解程度',
      value: shimoCore.understanding,
      suffix: '%',
      prefix: '',
      icon: Brain,
      color: '#5E9EF5',
    },
    {
      key: 'level',
      label: '成长等级',
      value: shimoCore.level,
      suffix: '',
      prefix: 'Lv.',
      icon: TrendingUp,
      color: '#FBBF24',
    },
    {
      key: 'agentCount',
      label: 'Agent 数量',
      value: shimoCore.agentCount,
      suffix: '',
      prefix: '',
      icon: Cpu,
      color: '#4ADE80',
    },
    {
      key: 'learningCount',
      label: '学习中',
      value: shimoCore.learningCount,
      suffix: '',
      prefix: '',
      icon: GraduationCap,
      color: '#A78BFA',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-text tracking-tight">ShiMo Core</h2>
          <p className="text-xs text-text-subtle mt-0.5">Family AI Intelligence</p>
        </div>

        {/* ── Status badge with pulse indicator ── */}
        <div
          className="liquid-glass flex items-center gap-2 px-3 py-1.5"
          style={{ borderColor: `${statusMeta.color}30` }}
        >
          <span className="relative flex h-2 w-2">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full"
              style={{ backgroundColor: statusMeta.color }}
              animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: statusMeta.color }}
            />
          </span>
          <span className="text-[11px] font-medium" style={{ color: statusMeta.color }}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* ── Core card ── */}
      <div className="liquid-glass-strong p-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-[80px] pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: statusMeta.glow, opacity: 0.25 }}
        />

        {/* Subtitle */}
        <div className="relative flex items-center gap-2 mb-5">
          <motion.div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-4 w-4 text-accent" />
          </motion.div>
          <p className="text-sm text-text-muted">时墨正在持续理解这个家庭……</p>
        </div>

        {/* ── Metric cards grid ── */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.06, ...spring }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="liquid-glass p-4 relative overflow-hidden"
                style={{ borderColor: `${metric.color}20` }}
              >
                {/* Subtle accent glow */}
                <div
                  className="absolute -top-6 -right-6 h-16 w-16 rounded-full blur-[40px] opacity-20 pointer-events-none"
                  style={{ backgroundColor: metric.color }}
                />

                <div className="relative flex items-center gap-1.5 mb-2">
                  <Icon size={13} className="shrink-0" />
                  <span className="text-[10px] text-text-subtle">{metric.label}</span>
                </div>

                <div className="relative text-xl font-semibold text-text">
                  <AnimatedNumber
                    value={metric.value}
                    prefix={metric.prefix}
                    suffix={metric.suffix}
                  />
                </div>

                {/* Mini progress bar for understanding */}
                {metric.key === 'understanding' && (
                  <div className="relative mt-2 h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── Recent learning tags ── */}
        {shimoCore.recentLearning.length > 0 && (
          <div className="relative mt-5 pt-5 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={13} className="text-life-amber" />
              <span className="text-[11px] text-text-subtle tracking-wide">最近学习内容</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {shimoCore.recentLearning.map((item, index) => (
                <motion.span
                  key={item + index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.06, ...spring }}
                  whileHover={{ y: -2, scale: 1.04 }}
                  className="skill-capsule px-3 py-1.5 text-xs text-text-muted"
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default ShimoCoreSection;
