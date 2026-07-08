'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  TreePine,
  BookOpen,
  Users,
  TrendingUp,
  Sparkles,
  Zap,
  Bot,
  Plus,
  MessageCircle,
  Database,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import { useFamilyHubStore } from '@/stores/family-hub-store';
import { AnimatedNumber } from '@/components/home/animated-number';
import { StaggerContainer, StaggerItem } from '@/components/page-transition';

/* ── Shared animation presets ── */
const SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 };
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type TagTone = 'success' | 'info' | 'warning';

interface MetricCardConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  /** 数值卡片：使用 AnimatedNumber 滚动动画 */
  numeric?: { value: number; prefix?: string; suffix?: string };
  /** 状态卡片：非数值（如微信同步），渲染状态文本 */
  status?: { text: string; tone: TagTone };
  /** 角标徽章（如 Connected / NEW） */
  tag?: { label: string; tone: TagTone };
}

const toneStyles: Record<TagTone, string> = {
  success: 'bg-life-green/15 text-life-green border-life-green/20',
  info: 'bg-life-purple/15 text-life-purple border-life-purple/20',
  warning: 'bg-life-rose/15 text-life-rose border-life-rose/20',
};

export function DashboardSection() {
  // 全部 12 项数据均来自 store 的 metrics，不使用静态 mock 数据
  const metrics = useFamilyHubStore((s) => s.metrics);
  const {
    understandingPercent,
    treeLevel,
    longTermMemories,
    familyMembers,
    weeklyGrowthPercent,
    aiLevel,
    masteredSkills,
    activeAgents,
    newAbilities,
    wechatSync,
    knowledgeDocs,
    growthValue,
  } = metrics;

  const cards: MetricCardConfig[] = [
    { label: '家庭理解程度', icon: Brain, color: '#FBBF24', numeric: { value: understandingPercent, suffix: '%' } },
    { label: '生命树成长', icon: TreePine, color: '#4ADE80', numeric: { value: treeLevel, prefix: 'Lv.' } },
    { label: '长期记忆', icon: BookOpen, color: '#5E9EF5', numeric: { value: longTermMemories } },
    { label: '家庭成员', icon: Users, color: '#A78BFA', numeric: { value: familyMembers }, tag: { label: 'Connected', tone: 'success' } },
    { label: '本周成长', icon: TrendingUp, color: '#22D3EE', numeric: { value: weeklyGrowthPercent, prefix: '+', suffix: '%' } },
    { label: 'AI 成长等级', icon: Sparkles, color: '#5E9EF5', numeric: { value: aiLevel, prefix: 'Lv.' } },
    { label: '掌握 Skills', icon: Zap, color: '#FB923C', numeric: { value: masteredSkills } },
    { label: 'Agent 在线', icon: Bot, color: '#4ADE80', numeric: { value: activeAgents } },
    { label: '最近新增能力', icon: Plus, color: '#A78BFA', numeric: { value: newAbilities }, tag: { label: 'NEW', tone: 'info' } },
    {
      label: '微信同步',
      icon: MessageCircle,
      color: wechatSync === 'connected' ? '#4ADE80' : '#FB7185',
      status: {
        text: wechatSync === 'connected' ? 'Connected' : 'Disconnected',
        tone: wechatSync === 'connected' ? 'success' : 'warning',
      },
    },
    { label: '知识库文档', icon: Database, color: '#7BB1F7', numeric: { value: knowledgeDocs } },
    { label: '成长值', icon: Gauge, color: '#FBBF24', numeric: { value: growthValue, prefix: '+' } },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
    >
      <h2 className="text-sm font-semibold text-text-muted mb-4 tracking-wide">
        家庭 AI 数据中心
      </h2>

      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.label} className="h-full">
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={SPRING}
                className="liquid-glass p-5 h-full flex flex-col relative overflow-hidden group"
              >
                {/* Accent glow */}
                <div
                  aria-hidden
                  className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-[50px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
                  style={{ backgroundColor: card.color }}
                />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon + label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                      <Icon className="h-4 w-4" style={{ color: card.color }} />
                    </span>
                    <span className="text-[11px] text-text-subtle">{card.label}</span>
                  </div>

                  {/* Value / status (anchored to bottom for uniform card height) */}
                  <div className="mt-auto">
                    {card.numeric ? (
                      <AnimatedNumber
                        value={card.numeric.value}
                        prefix={card.numeric.prefix}
                        suffix={card.numeric.suffix}
                        className="text-2xl font-semibold text-text tabular-nums"
                      />
                    ) : card.status ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full animate-pulse-soft"
                          style={{ backgroundColor: card.color }}
                        />
                        <span className="text-lg font-medium text-text">{card.status.text}</span>
                      </div>
                    ) : null}

                    {card.tag && (
                      <span
                        className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneStyles[card.tag.tone]}`}
                      >
                        {card.tag.label}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </motion.section>
  );
}

export default DashboardSection;
