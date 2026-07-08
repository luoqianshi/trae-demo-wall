'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  BookOpen,
  Pill,
  Shield,
  List,
  Scroll,
  Search,
  ChevronRight,
} from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/page-transition';

const springHover = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

const categories = [
  {
    id: 'documents',
    name: '证件',
    icon: FileText,
    count: 12,
    subtitle: '身份证、护照、户口本',
    color: '#5E9EF5',
    glowColor: 'rgba(94, 158, 245, 0.20)',
  },
  {
    id: 'manuals',
    name: '说明书',
    icon: BookOpen,
    count: 28,
    subtitle: '家电、电子设备',
    color: '#22D3EE',
    glowColor: 'rgba(34, 211, 238, 0.20)',
  },
  {
    id: 'medicine',
    name: '药品',
    icon: Pill,
    count: 15,
    subtitle: '常备药、处方药',
    color: '#FB7185',
    glowColor: 'rgba(251, 113, 133, 0.20)',
  },
  {
    id: 'warranty',
    name: '保修',
    icon: Shield,
    count: 8,
    subtitle: '家电保修、延保',
    color: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.20)',
  },
  {
    id: 'lists',
    name: '清单',
    icon: List,
    count: 34,
    subtitle: '购物清单、待办',
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.20)',
  },
  {
    id: 'rules',
    name: '制度',
    icon: Scroll,
    count: 6,
    subtitle: '家庭规则、约定',
    color: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.20)',
  },
];

const recentItems = [
  { id: '1', title: '空调保修单', meta: '美的空调', badge: '剩余 180 天' },
  { id: '2', title: '家庭常备药清单', meta: '感冒药、退烧药', badge: null },
  { id: '3', title: '身份证扫描件', meta: '爸爸', badge: null },
  { id: '4', title: '旅行计划', meta: '2025 春节云南', badge: null },
];

const exampleQuestions = [
  '空调保修还有多久？',
  '孩子小时候第一次旅游是哪一年？',
  '爸爸喜欢什么口味？',
];

export default function KnowledgePage() {
  const [query, setQuery] = React.useState('');

  return (
    <PageTransition>
      <div className="w-full h-full overflow-y-auto px-6 sm:px-12 lg:px-20 py-8 pb-32">
        <div className="max-w-5xl mx-auto">
          {/* ===== Header ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="text-2xl font-display font-medium text-text">家庭知识库</h1>
            <p className="text-sm text-text-muted mt-1">AI 统一管理家庭重要信息</p>
          </motion.div>

          {/* ===== Search Bar ===== */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <div className="liquid-glass-input flex items-center gap-3 px-4 py-3">
              <Search className="h-4 w-4 text-text-muted shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索证件、说明书、药品..."
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
              />
            </div>
          </motion.div>

          {/* ===== Category Grid ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <h2 className="text-sm font-semibold text-text mb-5">分类浏览</h2>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <StaggerItem key={cat.id}>
                    <motion.div
                      whileHover={{ scale: 1.03, y: -4 }}
                      transition={springHover}
                      className="liquid-glass flex flex-col gap-3 p-5 cursor-default relative overflow-hidden"
                      style={{
                        boxShadow: `0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 20px ${cat.glowColor}`,
                        borderColor: `${cat.color}25`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border"
                          style={{
                            borderColor: `${cat.color}35`,
                            backgroundColor: `${cat.color}15`,
                          }}
                        >
                          <Icon size={20} style={{ color: cat.color }} />
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            color: cat.color,
                            backgroundColor: `${cat.color}15`,
                            border: `1px solid ${cat.color}30`,
                          }}
                        >
                          {cat.count} 项
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-text">{cat.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">{cat.subtitle}</p>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </motion.div>

          {/* ===== Recent Items List ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <h2 className="text-sm font-semibold text-text mb-5">最近更新</h2>
            <div className="space-y-2">
              {recentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.06, duration: 0.4 }}
                  whileHover={{ y: -2, scale: 1.005 }}
                  className="liquid-glass flex items-center gap-3 p-4 cursor-default"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text">{item.title}</p>
                      <span className="text-xs text-text-muted">— {item.meta}</span>
                    </div>
                  </div>
                  {item.badge && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-life-green bg-life-green/10 border border-life-green/20 shrink-0">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ===== AI Search Demo Section ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="liquid-glass-strong p-6"
          >
            <p className="text-sm font-medium text-text mb-4">试试问时墨：</p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((q, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springHover}
                  className="liquid-glass px-4 py-2 text-xs text-text-muted hover:text-text transition-colors"
                  onClick={() => setQuery(q)}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
