'use client';

import { motion } from 'framer-motion';
import { TreePine, Sprout, Flower, Apple, Sparkles } from 'lucide-react';
import { useFamilyHubStore } from '@/stores/family-hub-store';
import LivingTree3D from '@/components/tree/living-tree-3d';
import { AnimatedNumber } from '@/components/home/animated-number';

const treeElements = [
  { icon: Sprout, label: '树叶', desc: '家庭故事', color: '#4ADE80', count: 428 },
  { icon: Apple, label: '果实', desc: '时间胶囊', color: '#FBBF24', count: 12 },
  { icon: TreePine, label: '树根', desc: '长期记忆', color: '#5E9EF5', count: 428 },
  { icon: Flower, label: '主枝', desc: '家庭成员', color: '#A78BFA', count: 5 },
];

const growthStages = ['Seed', 'Sprout', 'Young Tree', 'Mature Tree', 'Bloom', 'Fruit', 'Eternal Tree'];

export function LifeTreeSection() {
  const metrics = useFamilyHubStore((s) => s.metrics);
  const treeLevel = metrics.treeLevel;
  const currentStage = metrics.treeStage;
  const growth = metrics.treeGrowth;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-16"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="liquid-glass-strong flex h-10 w-10 items-center justify-center rounded-xl">
            <TreePine className="h-5 w-5 text-life-green" />
          </span>
          <div>
            <h2 className="text-lg font-display font-medium text-text">生命树</h2>
            <p className="text-xs text-text-muted">家庭成长的核心可视化</p>
          </div>
        </div>

        {/* Growth Stage Badge */}
        <div className="flex items-center gap-2">
          <div className="liquid-glass px-3 py-1.5 flex items-center gap-2">
            <Sparkles size={12} className="text-accent" />
            <span className="text-xs text-text-muted">
              Lv.<span className="text-text font-medium">{treeLevel}</span>
            </span>
            <span className="text-xs text-text-subtle">·</span>
            <span className="text-xs text-text">{currentStage}</span>
          </div>
        </div>
      </div>

      {/* Tree Canvas - 50% page height */}
        <div className="liquid-glass-strong relative overflow-hidden" style={{ height: '55vh', minHeight: '450px' }}>
          {/* 3D Living Tree */}
          <div className="absolute inset-0">
            <LivingTree3D
              growthStage="young"
              memoryCount={metrics.longTermMemories}
              familyMembers={[
                { id: 'dad', name: '爸爸', color: '#5E9EF5' },
                { id: 'mom', name: '妈妈', color: '#FBBF24' },
                { id: 'kid', name: '孩子', color: '#4ADE80' },
                { id: 'elder', name: '老人', color: '#A78BFA' },
                { id: 'pet', name: '宠物', color: '#FB7185' },
              ]}
            />
          </div>

        {/* Overlay: Element Legend */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          {treeElements.map((el, index) => (
            <motion.div
              key={el.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              className="flex items-center gap-2 liquid-glass px-3 py-1.5"
            >
              <el.icon size={12} style={{ color: el.color }} />
              <span className="text-[10px] text-text-muted">{el.label}</span>
              <span className="text-[10px] text-text-subtle">·</span>
              <span className="text-[10px] text-text-subtle">{el.desc}</span>
            </motion.div>
          ))}
        </div>

        {/* Overlay: Growth Progress */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="liquid-glass-strong px-5 py-3 flex items-center gap-4">
            <div className="text-center">
              <div className="text-[10px] text-text-subtle">成长进度</div>
              <div className="text-sm font-medium text-text">
                <AnimatedNumber value={Math.round(growth * 100)} suffix="%" />
              </div>
            </div>
            <div className="w-px h-8 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-[10px] text-text-subtle">长期记忆</div>
              <div className="text-sm font-medium text-text">
                <AnimatedNumber value={metrics.longTermMemories} />
              </div>
            </div>
            <div className="w-px h-8 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-[10px] text-text-subtle">家庭成员</div>
              <div className="text-sm font-medium text-text">{metrics.familyMembers}</div>
            </div>
          </div>
        </div>

        {/* Overlay: Stage Path */}
        <div className="absolute top-4 right-4 z-10">
          <div className="liquid-glass px-3 py-2">
            <div className="text-[9px] text-text-subtle mb-1.5">成长阶段</div>
            <div className="flex items-center gap-1">
              {growthStages.map((stage, i) => (
                <div
                  key={stage}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i <= Math.min(6, Math.floor(treeLevel / 1.5))
                      ? 'bg-life-green'
                      : 'bg-white/[0.08]'
                  }`}
                  title={stage}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tree Element Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {treeElements.map((el, index) => (
          <motion.div
            key={el.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
            whileHover={{ y: -2, scale: 1.02 }}
            className="liquid-glass p-3 flex items-center gap-2.5 cursor-default"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${el.color}15` }}
            >
              <el.icon size={14} style={{ color: el.color }} />
            </span>
            <div>
              <div className="text-[10px] text-text-subtle">{el.label}</div>
              <div className="text-xs text-text font-medium">
                {el.label === '树叶' || el.label === '树根' ? (
                  <AnimatedNumber value={metrics.longTermMemories} />
                ) : el.label === '果实' ? (
                  <AnimatedNumber value={12} />
                ) : (
                  <AnimatedNumber value={metrics.familyMembers} />
                )}
              </div>
              <div className="text-[9px] text-text-subtle/60">{el.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
