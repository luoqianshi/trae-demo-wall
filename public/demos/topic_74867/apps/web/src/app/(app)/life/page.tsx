'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  Wrench,
  ShoppingCart,
  Plane,
  Bell,
  Wallet,
  Zap,
} from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/page-transition';
import { Button } from '@/components/ui/button';

const springHover = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

const services = [
  {
    id: 'recipe',
    name: '菜谱推荐',
    icon: ChefHat,
    description: '根据家庭成员口味和冰箱食材推荐菜谱',
    color: '#FB923C',
    glowColor: 'rgba(251, 146, 60, 0.20)',
  },
  {
    id: 'repair',
    name: '维修助手',
    icon: Wrench,
    description: '根据家电型号自动生成维修教程',
    color: '#5E9EF5',
    glowColor: 'rgba(94, 158, 245, 0.20)',
  },
  {
    id: 'shopping',
    name: '购物建议',
    icon: ShoppingCart,
    description: '根据库存自动推荐购买清单',
    color: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.20)',
  },
  {
    id: 'travel',
    name: '旅行规划',
    icon: Plane,
    description: '根据预算和偏好自动规划行程',
    color: '#22D3EE',
    glowColor: 'rgba(34, 211, 238, 0.20)',
  },
  {
    id: 'elder',
    name: '老人提醒',
    icon: Bell,
    description: '用药提醒、健康监测、生活关怀',
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.20)',
  },
  {
    id: 'finance',
    name: '家庭理财',
    icon: Wallet,
    description: '家庭开支分析、预算建议',
    color: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.20)',
  },
];

const suggestions = [
  {
    id: '1',
    title: '今晚推荐：青椒炒蛋',
    meta: '预计 18 分钟',
    color: '#FB923C',
  },
  {
    id: '2',
    title: '冰箱牛奶即将过期',
    meta: '建议优先使用',
    color: '#5E9EF5',
  },
  {
    id: '3',
    title: '本周六适合全家出游',
    meta: '温度 22°C',
    color: '#4ADE80',
  },
];

export default function LifePage() {
  return (
    <PageTransition>
      <div className="w-full h-full overflow-y-auto px-6 sm:px-12 lg:px-20 py-8 pb-32">
        <div className="max-w-5xl mx-auto">
          {/* ===== Header ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="liquid-glass-strong flex h-10 w-10 items-center justify-center rounded-xl animate-float">
                <Zap className="h-5 w-5 text-accent" />
              </span>
              <div>
                <h1 className="text-2xl font-display font-medium text-text">生活助手</h1>
                <p className="text-sm text-text-muted">时墨主动为家庭提供生活服务</p>
              </div>
            </div>
          </motion.div>

          {/* ===== Service Cards ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <h2 className="text-sm font-semibold text-text mb-5">服务市场</h2>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => {
                const Icon = svc.icon;
                return (
                  <StaggerItem key={svc.id}>
                    <motion.div
                      whileHover={{ scale: 1.03, y: -4 }}
                      transition={springHover}
                      className="liquid-glass flex flex-col gap-4 p-5 cursor-default relative overflow-hidden h-full"
                      style={{
                        boxShadow: `0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 20px ${svc.glowColor}`,
                        borderColor: `${svc.color}25`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border"
                          style={{
                            borderColor: `${svc.color}35`,
                            backgroundColor: `${svc.color}15`,
                          }}
                        >
                          <Icon size={20} style={{ color: svc.color }} />
                        </div>
                        <p className="text-base font-medium text-text">{svc.name}</p>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{svc.description}</p>
                      <div className="mt-auto pt-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs"
                          style={{
                            borderColor: `${svc.color}30`,
                            backgroundColor: `${svc.color}10`,
                            color: svc.color,
                          }}
                        >
                          开始使用
                        </Button>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </motion.div>

          {/* ===== Today's Suggestions ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <h2 className="text-sm font-semibold text-text mb-5">今日推荐</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestions.map((s, index) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="liquid-glass flex flex-col gap-1 p-4 cursor-default"
                  style={{
                    borderColor: `${s.color}20`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 16px ${s.color}12`,
                  }}
                >
                  <p className="text-sm font-medium text-text">{s.title}</p>
                  <p className="text-xs text-text-muted">{s.meta}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ===== AI Active Service Demo ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="liquid-glass-strong p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full bg-accent/20"
                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-accent/15"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
                <Zap className="h-4 w-4 text-accent" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">时墨正在主动学习家庭生活习惯...</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: '0%' }}
                    animate={{ width: '40%' }}
                    transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="text-xs text-text-muted shrink-0">已学习 12 个家庭偏好</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
