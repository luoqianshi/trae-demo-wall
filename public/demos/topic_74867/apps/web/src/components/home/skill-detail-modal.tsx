'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Sparkles, TrendingUp } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { getIcon } from '@/components/home/icon-map';
import { useFamilyHubStore, type SkillProgress } from '@/stores/family-hub-store';

export interface SkillDetailModalProps {
  skill: SkillProgress | null;
  open: boolean;
  onClose: () => void;
}

/* ── Skill status metadata ──
 * mastered = 已掌握 (绿色)
 * learning = 学习中 + 进度条
 * new      = NEW (蓝色闪烁)
 * updated  = Updated (琥珀色)
 */
interface SkillStatusMeta {
  label: string;
  color: string;
  blink: boolean;
}

const SKILL_STATUS_META: Record<SkillProgress['status'], SkillStatusMeta> = {
  mastered: { label: '已掌握', color: '#4ADE80', blink: false },
  learning: { label: '学习中', color: '#5E9EF5', blink: false },
  new: { label: 'NEW', color: '#5E9EF5', blink: true },
  updated: { label: 'Updated', color: '#FBBF24', blink: false },
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 20 };

export function SkillDetailModal({ skill, open, onClose }: SkillDetailModalProps) {
  const triggerSkillLearn = useFamilyHubStore((s) => s.triggerSkillLearn);
  const [upgrading, setUpgrading] = React.useState(false);

  /* Keep the last non-null skill so the exit animation can render content
   * even after the parent has cleared the `skill` prop on close. */
  const [lockedSkill, setLockedSkill] = React.useState<SkillProgress | null>(null);
  React.useEffect(() => {
    if (skill) setLockedSkill(skill);
  }, [skill]);

  // Prefer the live skill while open; fall back to the locked snapshot on close.
  const current = open && skill ? skill : lockedSkill;

  const handleLevelUp = async () => {
    if (!current) return;
    setUpgrading(true);
    try {
      await triggerSkillLearn(current.id);
    } finally {
      setUpgrading(false);
      onClose();
    }
  };

  if (!current) {
    return <Modal open={open} onClose={onClose} />;
  }

  const meta = SKILL_STATUS_META[current.status] ?? SKILL_STATUS_META.learning;
  const Icon = getIcon(current.icon);
  const nextLevel = current.level + 1;

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      {/* ── Hero: icon + level badge + name ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <div
          className="absolute -top-6 h-24 w-24 rounded-full blur-[50px] opacity-25 pointer-events-none"
          style={{ backgroundColor: current.color }}
        />

        <motion.span
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            borderColor: `${current.color}30`,
            backgroundColor: `${current.color}12`,
          }}
          whileHover={{ scale: 1.06, rotate: -2 }}
          transition={spring}
        >
          <Icon size={28} style={{ color: current.color }} />
        </motion.span>

        <motion.span
          className="relative mt-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full"
          style={{
            color: current.color,
            backgroundColor: `${current.color}15`,
            border: `1px solid ${current.color}25`,
          }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
        >
          Lv.{current.level}
        </motion.span>

        <h3 className="relative mt-2 text-lg font-semibold text-text">{current.name}</h3>
      </motion.div>

      {/* ── Status tag ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mt-5 flex items-center justify-center"
      >
        <motion.span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{
            color: meta.color,
            backgroundColor: `${meta.color}15`,
            border: `1px solid ${meta.color}25`,
          }}
          animate={meta.blink ? { opacity: [1, 0.4, 1] } : undefined}
          transition={
            meta.blink
              ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        >
          {meta.blink && (
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
          )}
          {meta.label}
        </motion.span>
      </motion.div>

      {/* ── Source agent ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-subtle"
      >
        <BookMarked size={12} className="shrink-0" />
        <span>来源 Agent：</span>
        <span className="text-text-muted font-medium">{current.sourceAgent}</span>
      </motion.div>

      {/* ── Learning progress + 继续学习 hint ── */}
      {current.status === 'learning' && typeof current.progress === 'number' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="mt-4 liquid-glass p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-text-subtle flex items-center gap-1">
              <TrendingUp size={11} />
              学习进度
            </span>
            <span className="text-[11px] font-medium text-text-muted">
              {current.progress}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: current.color }}
              initial={{ width: 0 }}
              animate={{ width: `${current.progress}%` }}
              transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-2 text-[10px] text-text-subtle text-center">
            继续学习，掌握后将提升至 Lv.{nextLevel}
          </p>
        </motion.div>
      )}

      {/* ── Level up action ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mt-6"
      >
        <Button
          onClick={handleLevelUp}
          loading={upgrading}
          className="w-full"
          size="md"
        >
          <Sparkles size={15} />
          提升等级
        </Button>
      </motion.div>
    </Modal>
  );
}

export default SkillDetailModal;
