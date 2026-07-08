'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useFamilyHubStore, type DeviceSync } from '@/stores/family-hub-store';
import { getIcon } from '@/components/home/icon-map';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

/* ─── Status metadata ─── */
interface StatusMeta {
  label: string;
  color: string;
  pulsing: boolean;
  dimmed: boolean;
  dashed: boolean;
}

const STATUS_CONFIG: Record<DeviceSync['status'], StatusMeta> = {
  connected: { label: '已连接', color: '#4ADE80', pulsing: true, dimmed: false, dashed: false },
  synced: { label: '已同步', color: '#22D3EE', pulsing: true, dimmed: false, dashed: false },
  coming_soon: { label: '即将推出', color: '#9CA3AF', pulsing: false, dimmed: true, dashed: true },
  disconnected: { label: '未连接', color: '#F87171', pulsing: false, dimmed: true, dashed: true },
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

/* ─── Device detail info ─── */
interface DeviceDetail {
  description: string;
  syncItems: string[];
  lastSync: string;
  dataSize: string;
}

const DEVICE_DETAILS: Record<string, DeviceDetail> = {
  web: {
    description: '通过浏览器访问岁言全功能，所有数据实时同步至云端。',
    syncItems: ['家庭记忆', 'AI 访谈记录', '生命树数据', '技能进度'],
    lastSync: '实时同步',
    dataSize: '全部数据',
  },
  wechat: {
    description: '微信 Bot 已连接，家庭群消息自动同步，支持语音访谈和记忆记录。',
    syncItems: ['家庭群消息', '语音访谈', '图片记忆', '提醒通知'],
    lastSync: '2 分钟前',
    dataSize: '128 条消息',
  },
  family: {
    description: '家庭群组同步，每位成员的独立数据与共享记忆保持一致。',
    syncItems: ['成员状态', '共享记忆', '家庭待办', '情绪分析'],
    lastSync: '5 分钟前',
    dataSize: '5 位成员',
  },
  memory: {
    description: '长期记忆数据库，所有珍贵回忆安全存储，支持全文搜索。',
    syncItems: ['428 段记忆', '访谈记录', '时间线', '标签索引'],
    lastSync: '1 小时前',
    dataSize: '2.3 GB',
  },
  app: {
    description: '岁言移动 App，随时随地记录家庭故事，查看生命树成长。',
    syncItems: [],
    lastSync: '即将推出',
    dataSize: '—',
  },
  watch: {
    description: '智能手表端，健康数据自动同步，老人关怀提醒推送到手腕。',
    syncItems: [],
    lastSync: '即将推出',
    dataSize: '—',
  },
  robot: {
    description: '家庭机器人接入，语音交互、陪伴老人、智能家居控制。',
    syncItems: [],
    lastSync: '即将推出',
    dataSize: '—',
  },
};

export function ShiMoAnywhereSection() {
  const devices = useFamilyHubStore((s) => s.devices);
  const callMCPTool = useFamilyHubStore((s) => s.callMCPTool);

  const [selectedDevice, setSelectedDevice] = React.useState<DeviceSync | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  const handleDeviceClick = React.useCallback((device: DeviceSync) => {
    setSelectedDevice(device);
    setModalOpen(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSync = React.useCallback(async () => {
    if (!selectedDevice) return;
    setSyncing(true);
    try {
      await callMCPTool('device.list', { deviceId: selectedDevice.id, action: 'sync' });
    } finally {
      setSyncing(false);
    }
  }, [selectedDevice, callMCPTool]);

  return (
    <section>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-text">ShiMo Anywhere</h2>
        <p className="text-sm text-text-muted">设备同步状态 · 点击设备查看详情</p>
      </div>

      {/* Glass container */}
      <div className="liquid-glass-strong p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {devices.map((device, index) => {
            const Icon = getIcon(device.icon);
            const cfg = STATUS_CONFIG[device.status];

            return (
              <motion.div
                key={device.id}
                role="button"
                tabIndex={0}
                onClick={() => handleDeviceClick(device)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDeviceClick(device);
                  }
                }}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...spring, delay: index * 0.06 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="liquid-glass relative flex flex-col items-center p-4 text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                style={{
                  opacity: cfg.dimmed ? 0.5 : 1,
                  borderStyle: cfg.dashed ? 'dashed' : 'solid',
                  borderColor: cfg.dashed ? 'rgba(156,163,175,0.4)' : undefined,
                }}
              >
                {/* Icon + pulse ring */}
                <div className="relative">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]"
                    style={{ color: cfg.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  {/* Pulse animation for connected / synced */}
                  {cfg.pulsing && (
                    <motion.span
                      className="absolute inset-0 rounded-2xl border-2"
                      style={{ borderColor: cfg.color }}
                      animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </div>

                {/* Device name */}
                <p className="mt-3 text-sm font-medium text-text">{device.name}</p>

                {/* Status badge */}
                <span
                  className="mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    color: cfg.color,
                    backgroundColor: `${cfg.color}1A`,
                  }}
                >
                  {cfg.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Device detail modal */}
      <DeviceDetailModal
        device={selectedDevice}
        open={modalOpen}
        onClose={handleClose}
        syncing={syncing}
        onSync={handleSync}
      />
    </section>
  );
}

/* ─── Device detail modal ─── */

function DeviceDetailModal({
  device,
  open,
  onClose,
  syncing,
  onSync,
}: {
  device: DeviceSync | null;
  open: boolean;
  onClose: () => void;
  syncing: boolean;
  onSync: () => void;
}) {
  const [lockedDevice, setLockedDevice] = React.useState<DeviceSync | null>(null);
  React.useEffect(() => {
    if (device) setLockedDevice(device);
  }, [device]);

  const current = open && device ? device : lockedDevice;

  if (!current) {
    return <Modal open={open} onClose={onClose} />;
  }

  const cfg = STATUS_CONFIG[current.status];
  const Icon = getIcon(current.icon);
  const detail = DEVICE_DETAILS[current.id] ?? {
    description: '设备信息',
    syncItems: [],
    lastSync: '—',
    dataSize: '—',
  };
  const isAvailable = current.status === 'connected' || current.status === 'synced';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="设备详情"
      description={`${current.name} · ${cfg.label}`}
      className="max-w-md"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          {isAvailable ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onSync}
              loading={syncing}
              disabled={syncing}
            >
              <RefreshCw size={14} />
              重新同步
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onClose}>
              <Bell size={14} />
              通知我
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Header: icon + name ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${cfg.color}30`,
              backgroundColor: `${cfg.color}12`,
            }}
          >
            <Icon size={24} style={{ color: cfg.color }} />
          </span>
          <div className="flex-1">
            <p className="text-base font-semibold text-text">{current.name}</p>
            <span
              className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
            >
              {cfg.pulsing && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
              )}
              {cfg.label}
            </span>
          </div>
        </motion.div>

        {/* ── Description ── */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-sm text-text-muted leading-relaxed"
        >
          {detail.description}
        </motion.p>

        {/* ── Sync info (for connected devices) ── */}
        {isAvailable && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="liquid-glass flex flex-col gap-1 px-3.5 py-3">
                <span className="flex items-center gap-1.5 text-[10px] text-text-subtle">
                  <Clock size={11} />
                  最近同步
                </span>
                <span className="text-sm font-semibold text-text">{detail.lastSync}</span>
              </div>
              <div className="liquid-glass flex flex-col gap-1 px-3.5 py-3">
                <span className="flex items-center gap-1.5 text-[10px] text-text-subtle">
                  <CheckCircle2 size={11} />
                  数据量
                </span>
                <span className="text-sm font-semibold text-text">{detail.dataSize}</span>
              </div>
            </motion.div>

            {/* Sync items list */}
            {detail.syncItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="liquid-glass p-3.5"
              >
                <p className="text-[11px] text-text-subtle mb-2.5">同步内容</p>
                <div className="flex flex-wrap gap-2">
                  {detail.syncItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] text-text-muted"
                    >
                      <CheckCircle2 size={10} style={{ color: cfg.color }} />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ── Coming soon notice ── */}
        {!isAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="liquid-glass p-4 flex items-center gap-3"
          >
            <Bell size={16} className="text-text-subtle shrink-0" />
            <p className="text-xs text-text-muted">
              该设备端正在开发中，点击「通知我」将在上线时第一时间提醒你。
            </p>
          </motion.div>
        )}

        {/* ── MCP hint ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center gap-2 text-[11px] text-text-subtle"
        >
          <ArrowRight size={12} style={{ color: cfg.color }} />
          <span>
            同步操作通过 MCP 工具
            <code className="mx-1 rounded bg-white/[0.06] px-1 py-0.5 text-[10px] text-text-muted">
              device.list
            </code>
            执行。
          </span>
        </motion.div>
      </div>
    </Modal>
  );
}

export default ShiMoAnywhereSection;
