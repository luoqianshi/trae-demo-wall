'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookMarked, ChevronRight, Sparkles } from 'lucide-react';
import { useFamilyHubStore, type SkillProgress } from '@/stores/family-hub-store';
import { getIcon } from '@/components/home/icon-map';
import { StaggerContainer, StaggerItem } from '@/components/page-transition';
import { SkillDetailModal } from '@/components/home/skill-detail-modal';

/* ── Spring transition shared across the section ── */
const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

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

export function SkillsSection() {
  const skills = useFamilyHubStore((s) => s.skills);
  const [selectedSkill, setSelectedSkill] = React.useState<SkillProgress | null>(null);

  const masteredCount = skills.filter((s) => s.status === 'mastered').length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-text tracking-tight">Skills Library</h2>
          <p className="text-xs text-text-subtle mt-0.5">时墨掌握的全部技能</p>
        </div>
        <div className="liquid-glass flex items-center gap-2 px-3 py-1.5">
          <Sparkles size={13} className="text-accent" />
          <span className="text-[11px] text-text-muted">
            <span className="text-text font-medium">{masteredCount}</span> / {skills.length} 已掌握
          </span>
        </div>
      </div>

      {/* ── Skills grid ── */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {skills.map((skill) => (
          <StaggerItem key={skill.id}>
            <SkillCard skill={skill} onSelect={() => setSelectedSkill(skill)} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* ── View all skills ── */}
      <div className="mt-4 flex justify-center">
        <Link
          href="/skills"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg px-1 py-0.5"
        >
          查看全部技能
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Skill detail modal ── */}
      <SkillDetailModal
        skill={selectedSkill}
        open={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
      />
    </motion.section>
  );
}

/* ── Skill card ── */
function SkillCard({ skill, onSelect }: { skill: SkillProgress; onSelect: () => void }) {
  const meta = SKILL_STATUS_META[skill.status] ?? SKILL_STATUS_META.learning;
  const Icon = getIcon(skill.icon);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-3xl"
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        className="liquid-glass p-4 h-full cursor-pointer relative overflow-hidden group"
        style={{ borderColor: `${skill.color}25` }}
      >
        {/* Accent glow */}
        <div
          className="absolute -top-8 -right-8 h-20 w-20 rounded-full blur-[44px] opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity duration-300"
          style={{ backgroundColor: skill.color }}
        />

        {/* ── Header: icon + level badge ── */}
        <div className="relative flex items-start justify-between">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${skill.color}30`,
              backgroundColor: `${skill.color}12`,
            }}
          >
            <Icon size={18} style={{ color: skill.color }} />
          </span>

          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{
              color: skill.color,
              backgroundColor: `${skill.color}15`,
              border: `1px solid ${skill.color}25`,
            }}
          >
            Lv.{skill.level}
          </span>
        </div>

        {/* ── Name ── */}
        <p className="relative mt-3 text-sm font-medium text-text truncate">{skill.name}</p>

        {/* ── Source agent ── */}
        <p className="relative mt-0.5 text-[10px] text-text-subtle truncate flex items-center gap-1">
          <BookMarked size={9} className="shrink-0" />
          {skill.sourceAgent}
        </p>

        {/* ── Status tag + progress (learning) ── */}
        <div className="relative mt-3">
          <motion.span
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
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

          {/* Progress bar for learning skills */}
          {skill.status === 'learning' && typeof skill.progress === 'number' && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-text-subtle">进度</span>
                <span className="text-[9px] font-medium text-text-muted">{skill.progress}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: skill.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.progress}%` }}
                  transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Hover hint ── */}
        <div className="relative mt-3 flex items-center text-[10px] text-text-subtle/60 group-hover:text-text-muted transition-colors">
          <span>查看</span>
          <ChevronRight className="h-3 w-3 ml-0.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </motion.div>
    </div>
  );
}

export default SkillsSection;
