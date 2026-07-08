'use client';

import { motion } from 'framer-motion';
import { getIcon } from '@/components/home/icon-map';
import { useFamilyHubStore } from '@/stores/family-hub-store';
import { StaggerContainer, StaggerItem } from '@/components/page-transition';

/* ── Shared animation presets ── */
const SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 };
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FamilyStatusSection() {
  // 全部状态项来自 store，不使用静态 mock 数据
  const familyStatus = useFamilyHubStore((s) => s.familyStatus);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
    >
      <h2 className="text-sm font-semibold text-text-muted mb-4 tracking-wide">
        今日家庭状态
      </h2>

      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {familyStatus.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <StaggerItem key={item.id} className="h-full">
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={SPRING}
                className="liquid-glass p-4 h-full cursor-default"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
                  <span className="text-[11px] text-text-subtle">{item.label}</span>
                </div>
                <div className="text-sm font-medium text-text">{item.value}</div>
                <div className="text-[10px] text-text-subtle/60 mt-1">{item.sub}</div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </motion.section>
  );
}

export default FamilyStatusSection;
