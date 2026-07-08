'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Plus,
  TreePine,
  Lightbulb,
  Sprout,
  Leaf,
  Flower2,
  Users,
  TrendingUp,
  Sparkles,
  BookOpen,
  Brain,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/page-transition';
import { apiClient } from '@/lib/api-client';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const springHover = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

export default function DigitalLifeCenter() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ memories: 0, interviews: 0, capsules: 0, weeklyNew: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [memRes, intRes, capRes] = await Promise.all([
          apiClient.get('/memories/stats').catch(() => ({ total: 0 })),
          apiClient.get('/interviews').catch(() => ({ items: [] })),
          apiClient.get('/capsules').catch(() => ({ items: [] })),
        ]);
        setStats({
          memories: (memRes as any)?.total ?? 0,
          interviews: (intRes as any)?.items?.length ?? 0,
          capsules: (capRes as any)?.items?.length ?? 0,
          weeklyNew: 3,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-accent/50"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="w-full min-h-screen px-4 sm:px-12 lg:px-20 py-6 sm:py-8 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* ===== Hero Section ===== */}
          <motion.div {...fadeUp} className="mb-8 sm:mb-10 text-center">
            <h1 className="text-3xl font-display font-medium text-text mb-2">
              数字生命中心
            </h1>
            <p className="text-sm text-text-muted mb-3">
              查看 AI 成长 · 家庭成长 · 生命树 · 家庭状态
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 liquid-glass px-5 py-2"
            >
              <Sparkles size={14} className="text-accent" />
              <span className="text-sm text-text-muted">
                时墨已经陪伴这个家庭 <span className="text-accent font-medium">0</span> 天
              </span>
            </motion.div>
          </motion.div>

          {/* ===== Family Status Cards (4 cards in a row) ===== */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            <StatusCard
              icon={Heart}
              label="家庭情绪"
              value="温暖"
              glowColor="rgba(251, 191, 36, 0.18)"
              borderColor="rgba(251, 191, 36, 0.25)"
              iconColor="#FBBF24"
            />
            <StatusCard
              icon={Plus}
              label="本周新增"
              value="3 段回忆"
              glowColor="rgba(74, 222, 128, 0.18)"
              borderColor="rgba(74, 222, 128, 0.25)"
              iconColor="#4ADE80"
            />
            <StatusCard
              icon={TreePine}
              label="生命树阶段"
              value="萌芽期"
              glowColor="rgba(74, 222, 128, 0.18)"
              borderColor="rgba(74, 222, 128, 0.25)"
              iconColor="#4ADE80"
            />
            <StatusCard
              icon={Lightbulb}
              label="今日建议"
              value="给爸妈打个电话"
              glowColor="rgba(94, 158, 245, 0.18)"
              borderColor="rgba(94, 158, 245, 0.25)"
              iconColor="#5E9EF5"
            />
          </motion.div>

          {/* ===== Main Content Grid (3 columns) ===== */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10"
          >
            {/* Left: Growth Timeline */}
            <div className="liquid-glass-strong p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Sprout size={16} className="text-life-green" />
                <h3 className="text-sm font-semibold text-text">成长时间线</h3>
              </div>
              <div className="relative pl-4">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-life-green/40 via-accent/20 to-glass-border" />
                <TimelineItem
                  icon={Sprout}
                  stage="种子"
                  desc="数字生命初萌芽"
                  active={false}
                  color="#4ADE80"
                />
                <TimelineItem
                  icon={Leaf}
                  stage="萌芽"
                  desc="第一次家庭访谈"
                  active={true}
                  color="#4ADE80"
                />
                <TimelineItem
                  icon={TreePine}
                  stage="成长"
                  desc="积累 10 段记忆"
                  active={false}
                  color="#5E9EF5"
                />
                <TimelineItem
                  icon={Flower2}
                  stage="繁茂"
                  desc="生命树完全展开"
                  active={false}
                  color="#A78BFA"
                />
              </div>
            </div>

            {/* Center: Life Tree Preview */}
            <div className="liquid-glass-strong p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full blur-[80px] opacity-[0.12] pointer-events-none bg-life-green" />
              <div className="flex items-center gap-2 mb-4 self-start">
                <TreePine size={16} className="text-life-green" />
                <h3 className="text-sm font-semibold text-text">生命树预览</h3>
              </div>
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                {/* Mini tree SVG */}
                <svg width="100" height="120" viewBox="0 0 120 140" fill="none" className="sm:w-[120px] sm:h-[140px] max-w-full h-auto">
                  {/* Glow */}
                  <circle cx="60" cy="70" r="45" fill="rgba(74, 222, 128, 0.04)" />
                  {/* Trunk */}
                  <path
                    d="M60 130 C60 110, 58 95, 55 80"
                    stroke="rgba(139, 90, 43, 0.4)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M60 130 C60 105, 62 90, 65 75"
                    stroke="rgba(139, 90, 43, 0.3)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Branches */}
                  <path
                    d="M55 80 C45 70, 35 65, 30 60"
                    stroke="rgba(139, 90, 43, 0.25)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M65 75 C75 65, 85 60, 90 55"
                    stroke="rgba(139, 90, 43, 0.25)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  {/* Leaves */}
                  <motion.ellipse
                    cx="30"
                    cy="55"
                    rx="14"
                    ry="9"
                    fill="rgba(74, 222, 128, 0.35)"
                    animate={{ rotate: [-3, 3, -3] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: '55px 80px' }}
                  />
                  <motion.ellipse
                    cx="90"
                    cy="50"
                    rx="16"
                    ry="10"
                    fill="rgba(74, 222, 128, 0.3)"
                    animate={{ rotate: [3, -3, 3] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: '65px 75px' }}
                  />
                  <motion.ellipse
                    cx="60"
                    cy="35"
                    rx="18"
                    ry="11"
                    fill="rgba(74, 222, 128, 0.25)"
                    animate={{ rotate: [-2, 2, -2] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: '60px 70px' }}
                  />
                  {/* Bud */}
                  <motion.circle
                    cx="60"
                    cy="28"
                    r="5"
                    fill="rgba(94, 158, 245, 0.3)"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </svg>
              </motion.div>
              <p className="text-xs text-text-subtle mt-3">萌芽期 · 正在成长</p>
              <div className="mt-3 w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-life-green to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: '35%' }}
                  transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-[10px] text-text-subtle mt-1.5">35% · 距离下一阶段还需 7 段记忆</p>
            </div>

            {/* Right: Family Status List */}
            <div className="liquid-glass-strong p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-text">家庭状态</h3>
              </div>
              <StaggerContainer className="space-y-2">
                <StaggerItem>
                  <FamilyMemberRow name={user?.profile?.nickname || '我'} role="管理员" status="在线" color="#5E9EF5" />
                </StaggerItem>
                <StaggerItem>
                  <FamilyMemberRow name="爸爸" role="成员" status="最近活跃" color="#FBBF24" />
                </StaggerItem>
                <StaggerItem>
                  <FamilyMemberRow name="妈妈" role="成员" status="最近活跃" color="#FB7185" />
                </StaggerItem>
                <StaggerItem>
                  <FamilyMemberRow name="时墨 AI" role="家庭助手" status="服务中" color="#4ADE80" />
                </StaggerItem>
              </StaggerContainer>

              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-text-muted">家庭温暖指数</span>
                  <span className="text-life-amber font-medium">87</span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-life-amber"
                    initial={{ width: 0 }}
                    animate={{ width: '87%' }}
                    transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ===== Bottom Section ===== */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            {/* Growth Report Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.005 }}
              transition={springHover}
              className="liquid-glass-strong p-4 sm:p-6 relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[80px] opacity-[0.10] pointer-events-none bg-accent" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                    <TrendingUp size={18} className="text-accent" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-text">成长报告</h3>
                    <p className="text-xs text-text-muted">阶段性人生总结</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="liquid-glass p-3 text-center">
                    <div className="text-lg font-display font-medium text-text">{stats.memories}</div>
                    <div className="text-[10px] text-text-subtle">记忆总数</div>
                  </div>
                  <div className="liquid-glass p-3 text-center">
                    <div className="text-lg font-display font-medium text-text">{stats.interviews}</div>
                    <div className="text-[10px] text-text-subtle">访谈次数</div>
                  </div>
                  <div className="liquid-glass p-3 text-center">
                    <div className="text-lg font-display font-medium text-text">{stats.capsules}</div>
                    <div className="text-[10px] text-text-subtle">时间胶囊</div>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  本周新增了 3 段珍贵回忆，家庭情绪整体温暖。建议继续记录与家人的日常点滴，让生命树更加繁茂。
                </p>
              </div>
            </motion.div>

            {/* Life Map Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.005 }}
              transition={springHover}
              className="liquid-glass-strong p-4 sm:p-6 relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[80px] opacity-[0.10] pointer-events-none bg-life-purple" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-life-purple/10">
                    <Brain size={18} className="text-life-purple" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-text">人生图谱</h3>
                    <p className="text-xs text-text-muted">知识网络可视化</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-3 mb-4">
                  <div className="flex-1 liquid-glass p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={12} className="text-text-muted" />
                      <span className="text-xs text-text">记忆主题分布</span>
                    </div>
                    <div className="space-y-1.5 mt-2">
                      <Bar label="家庭" width={45} color="#FBBF24" />
                      <Bar label="成长" width={30} color="#4ADE80" />
                      <Bar label="旅行" width={15} color="#5E9EF5" />
                      <Bar label="其他" width={10} color="#A78BFA" />
                    </div>
                  </div>
                  <div className="flex-1 liquid-glass p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} className="text-text-muted" />
                      <span className="text-xs text-text">时间分布</span>
                    </div>
                    <div className="space-y-1.5 mt-2">
                      <Bar label="童年" width={20} color="#FB7185" />
                      <Bar label="青年" width={35} color="#5E9EF5" />
                      <Bar label="成年" width={35} color="#4ADE80" />
                      <Bar label="近期" width={10} color="#FBBF24" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  你的人生图谱正在逐步构建中。目前家庭主题占比最高，记录更多不同类型的记忆可以丰富图谱维度。
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  glowColor,
  borderColor,
  iconColor,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  glowColor: string;
  borderColor: string;
  iconColor: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={springHover}
      className="liquid-glass p-5 cursor-default relative overflow-hidden"
      style={{
        boxShadow: `0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 24px ${glowColor}`,
        borderColor: borderColor,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} style={{ color: iconColor }} />
        <span className="text-xs text-text-subtle">{label}</span>
      </div>
      <div className="text-lg font-display font-medium text-text">{value}</div>
    </motion.div>
  );
}

function TimelineItem({
  icon: Icon,
  stage,
  desc,
  active,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  stage: string;
  desc: string;
  active: boolean;
  color: string;
}) {
  return (
    <div className="relative flex items-start gap-3 mb-5 last:mb-0">
      <div
        className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: active ? `${color}60` : 'rgba(255,255,255,0.08)',
          backgroundColor: active ? `${color}20` : 'rgba(255,255,255,0.03)',
        }}
      >
        <Icon size={12} style={{ color: active ? color : 'rgba(255,255,255,0.25)' }} />
      </div>
      <div>
        <div className={`text-sm font-medium ${active ? 'text-text' : 'text-text-muted'}`}>
          {stage}
        </div>
        <div className="text-xs text-text-subtle">{desc}</div>
      </div>
    </div>
  );
}

function FamilyMemberRow({
  name,
  role,
  status,
  color,
}: {
  name: string;
  role: string;
  status: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={springHover}
      className="liquid-glass flex items-center gap-3 p-3"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
        style={{ borderColor: `${color}40`, backgroundColor: `${color}15` }}
      >
        <Users size={14} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{name}</p>
        <p className="text-[10px] text-text-subtle">{role}</p>
      </div>
      <span
        className="shrink-0 text-[10px] px-2 py-0.5 rounded-full"
        style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        {status}
      </span>
    </motion.div>
  );
}

function Bar({ label, width, color }: { label: string; width: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-subtle w-8 shrink-0">{label}</span>
      <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-[10px] text-text-subtle w-6 text-right">{width}%</span>
    </div>
  );
}
