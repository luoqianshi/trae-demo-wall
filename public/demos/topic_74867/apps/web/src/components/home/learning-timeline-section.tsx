'use client';

import { motion } from 'framer-motion';
import { useFamilyHubStore, type TimelineEntry } from '@/stores/family-hub-store';

/* ─── Type metadata ─── */
const TYPE_COLOR: Record<TimelineEntry['type'], string> = {
  skill: '#5E9EF5',
  agent: '#A78BFA',
  memory: '#FBBF24',
  tree: '#4ADE80',
  device: '#22D3EE',
};

const TYPE_LABEL: Record<TimelineEntry['type'], string> = {
  skill: '技能',
  agent: '智能体',
  memory: '记忆',
  tree: '生命树',
  device: '设备',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

export function LearningTimelineSection() {
  const timeline = useFamilyHubStore((s) => s.timeline);

  return (
    <section>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-text">Learning Timeline</h2>
        <p className="text-sm text-text-muted">时墨的学习成长历程</p>
      </div>

      {/* Glass container */}
      <div className="liquid-glass-strong p-6 sm:p-8">
        <div className="relative">
          {timeline.map((entry, index) => {
            const color = TYPE_COLOR[entry.type];
            const isLast = index === timeline.length - 1;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: index * 0.08 }}
                className="relative flex gap-4 pb-8 last:pb-0"
              >
                {/* ── Axis column ── */}
                <div className="relative flex flex-col items-center">
                  {/* Dot */}
                  <motion.div
                    className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: color }}
                    whileHover={{ scale: 1.35 }}
                    transition={spring}
                  >
                    {/* Glow halo */}
                    <span
                      className="absolute inset-0 rounded-full blur-md opacity-60"
                      style={{ backgroundColor: color }}
                    />
                    {/* Inner highlight */}
                    <span className="relative h-1 w-1 rounded-full bg-white/80" />
                  </motion.div>

                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      className="absolute top-3.5 bottom-0 w-px"
                      style={{
                        background: `linear-gradient(to bottom, ${color}55, rgba(255,255,255,0.04))`,
                      }}
                    />
                  )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 -mt-0.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-medium text-text-subtle">{entry.date}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color,
                        backgroundColor: `${color}1A`,
                        border: `1px solid ${color}33`,
                      }}
                    >
                      {TYPE_LABEL[entry.type]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text">{entry.title}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{entry.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LearningTimelineSection;
