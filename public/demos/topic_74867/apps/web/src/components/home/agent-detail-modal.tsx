'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Hash, Zap, Moon, GraduationCap } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  useFamilyHubStore,
  type AgentRuntime,
  type AgentStatus,
} from '@/stores/family-hub-store';
import { getIcon } from '@/components/home/icon-map';

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

export interface AgentDetailModalProps {
  agent: AgentRuntime | null;
  open: boolean;
  onClose: () => void;
}

export function AgentDetailModal({ agent, open, onClose }: AgentDetailModalProps) {
  const callMCPTool = useFamilyHubStore((s) => s.callMCPTool);

  const [pending, setPending] = React.useState<AgentStatus | null>(null);

  // Reset pending state whenever the target agent or open state changes
  React.useEffect(() => {
    if (!open) setPending(null);
  }, [open, agent?.id]);

  const handleUpdateStatus = React.useCallback(
    async (status: AgentStatus) => {
      if (!agent) return;
      setPending(status);
      try {
        await callMCPTool('agent.update_status', {
          agentId: agent.id,
          status,
        });
      } finally {
        setPending(null);
      }
    },
    [agent, callMCPTool],
  );

  // Don't render inner content without an agent; Modal handles presence
  if (!agent) {
    return <Modal open={open} onClose={onClose} />;
  }

  const meta = AGENT_STATUS_META[agent.status] ?? AGENT_STATUS_META.idle;
  const Icon = getIcon(agent.icon);
  const levelProgress = Math.min((agent.level / 5) * 100, 100);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agent 详情"
      description={`${agent.name} · ${agent.role}`}
      className="max-w-md"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleUpdateStatus('idle')}
            loading={pending === 'idle'}
            disabled={pending !== null}
          >
            <Moon size={14} />
            设为空闲
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleUpdateStatus('learning')}
            loading={pending === 'learning'}
            disabled={pending !== null}
          >
            <GraduationCap size={14} />
            开始学习
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleUpdateStatus('thinking')}
            loading={pending === 'thinking'}
            disabled={pending !== null}
          >
            <Zap size={14} />
            调用此 Agent
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Header: icon + name + role ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${meta.color}30`,
              backgroundColor: `${meta.color}12`,
            }}
          >
            <Icon size={22} style={{ color: meta.color }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-text truncate">{agent.name}</p>
            <p className="text-xs text-text-subtle truncate mt-0.5">{agent.role}</p>
          </div>
        </motion.div>

        {/* ── Status indicator ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-glass flex items-center justify-between px-3.5 py-2.5"
          style={{ borderColor: `${meta.color}1f` }}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {meta.pulse && (
                <motion.span
                  className="absolute inline-flex h-full w-full rounded-full"
                  style={{ backgroundColor: meta.color }}
                  animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
            </span>
            <span className="text-xs text-text-muted">当前状态</span>
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </motion.div>

        {/* ── Growth level progress bar (level / 5) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-subtle">成长等级</span>
            <span className="text-xs font-medium text-text-muted">
              Lv.{agent.level} / 5
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: meta.color }}
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>

        {/* ── Stats: calls + lastActive ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="liquid-glass flex flex-col gap-1 px-3.5 py-3">
            <span className="flex items-center gap-1.5 text-[10px] text-text-subtle">
              <Hash size={11} />
              调用次数
            </span>
            <span className="text-lg font-semibold text-text">{agent.calls}</span>
          </div>
          <div className="liquid-glass flex flex-col gap-1 px-3.5 py-3">
            <span className="flex items-center gap-1.5 text-[10px] text-text-subtle">
              <Clock size={11} />
              最近活跃
            </span>
            <span className="text-lg font-semibold text-text">{agent.lastActive}</span>
          </div>
        </motion.div>

        {/* ── Active summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 text-[11px] text-text-subtle"
        >
          <Activity size={12} style={{ color: meta.color }} />
          <span>
            可通过下方操作切换 Agent 状态，状态变更将通过 MCP 工具
            <code className="mx-1 rounded bg-white/[0.06] px-1 py-0.5 text-[10px] text-text-muted">
              agent.update_status
            </code>
            同步至运行时。
          </span>
        </motion.div>
      </div>
    </Modal>
  );
}

export default AgentDetailModal;
