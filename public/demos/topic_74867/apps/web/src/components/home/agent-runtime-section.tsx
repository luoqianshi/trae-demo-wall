'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Hash } from 'lucide-react';
import {
  useFamilyHubStore,
  type AgentRuntime,
  type AgentStatus,
} from '@/stores/family-hub-store';
import { getIcon } from '@/components/home/icon-map';
import { StaggerContainer, StaggerItem } from '@/components/page-transition';
import AgentChatModal from '@/components/home/agent-chat-modal';

/* ── Spring transition shared across the section ── */
const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

/* ── Agent status metadata ──
 * running   = 绿色脉冲
 * thinking  = 蓝色
 * idle      = 灰色
 * syncing   = 青色
 * learning  = 琥珀色
 * ready     = 紫色
 */
interface AgentStatusMeta {
  label: string;
  color: string;
  pulse: boolean;
}

const AGENT_STATUS_META: Record<AgentStatus, AgentStatusMeta> = {
  running: { label: '运行中', color: '#4ADE80', pulse: true },
  thinking: { label: '思考中', color: '#5E9EF5', pulse: false },
  idle: { label: '空闲', color: 'rgba(255,255,255,0.40)', pulse: false },
  syncing: { label: '同步中', color: '#22D3EE', pulse: false },
  learning: { label: '学习中', color: '#FBBF24', pulse: false },
  ready: { label: '就绪', color: '#A78BFA', pulse: false },
};

export function AgentRuntimeSection() {
  const agents = useFamilyHubStore((s) => s.agents);

  /* ── Chat modal state ── */
  const [selectedAgent, setSelectedAgent] = React.useState<AgentRuntime | null>(null);
  const [chatOpen, setChatOpen] = React.useState(false);

  const handleTrigger = React.useCallback((agent: AgentRuntime) => {
    setSelectedAgent(agent);
    setChatOpen(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setChatOpen(false);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-text tracking-tight">Agent Runtime</h2>
          <p className="text-xs text-text-subtle mt-0.5">{agents.length} Agents Running</p>
        </div>
        <div className="liquid-glass flex items-center gap-2 px-3 py-1.5">
          <Activity size={13} className="text-life-green" />
          <span className="text-[11px] text-text-muted">
            <span className="text-text font-medium">
              {agents.filter((a) => a.status === 'running').length}
            </span>{' '}
            活跃
          </span>
        </div>
      </div>

      {/* ── Agents grid: 2 / 3 / 4 columns ── */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
        {agents.map((agent) => (
          <StaggerItem key={agent.id} className="h-full">
            <AgentCard agent={agent} onTrigger={handleTrigger} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* ── Agent chat modal (real AI conversation) ── */}
      <AgentChatModal
        agent={selectedAgent}
        open={chatOpen}
        onClose={handleClose}
      />
    </motion.section>
  );
}

/* ── Agent card ── */
function AgentCard({
  agent,
  onTrigger,
}: {
  agent: AgentRuntime;
  onTrigger: (agent: AgentRuntime) => void;
}) {
  const meta = AGENT_STATUS_META[agent.status] ?? AGENT_STATUS_META.idle;
  const Icon = getIcon(agent.icon);
  const levelProgress = Math.min((agent.level / 5) * 100, 100);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onTrigger(agent)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTrigger(agent);
        }
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className="liquid-glass p-3.5 cursor-pointer relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 h-full"
      style={{ borderColor: `${meta.color}1f` }}
    >
      {/* Accent glow on hover */}
      <div
        className="absolute -top-8 -right-8 h-20 w-20 rounded-full blur-[44px] opacity-15 pointer-events-none transition-opacity duration-300"
        style={{ backgroundColor: meta.color }}
      />

      {/* ── Header: icon + name + status ── */}
      <div className="relative flex items-start gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${meta.color}30`,
            backgroundColor: `${meta.color}12`,
          }}
        >
          <Icon size={16} style={{ color: meta.color }} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text truncate">{agent.name}</p>
          <p className="text-[10px] text-text-subtle truncate mt-0.5">{agent.role}</p>
        </div>

        {/* Status indicator */}
        <span className="relative flex h-2 w-2 shrink-0 mt-1" title={meta.label}>
          {meta.pulse && (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full"
              style={{ backgroundColor: meta.color }}
              animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
        </span>
      </div>

      {/* ── Level progress bar (level / 5) ── */}
      <div className="relative mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-subtle">等级</span>
          <span className="text-[10px] font-medium text-text-muted">Lv.{agent.level}</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: meta.color }}
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* ── Footer: lastActive + calls ── */}
      <div className="relative mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-text-subtle">
          <Clock size={10} />
          {agent.lastActive}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-text-subtle">
          <Hash size={10} />
          {agent.calls}
        </span>
      </div>
    </motion.div>
  );
}

export default AgentRuntimeSection;
