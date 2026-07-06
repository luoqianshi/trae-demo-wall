'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { SceneConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SceneCardProps {
  scene: SceneConfig;
  onClick: () => void;
}

export default function SceneCard({ scene, onClick }: SceneCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg',
        'border border-yinzhu/40 bg-xuanzhi/80 backdrop-blur-sm',
        'px-5 py-6 text-left shadow-sm transition-shadow hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-zhusha/40'
      )}
      style={{ borderTopColor: scene.color, borderTopWidth: '3px' }}
    >
      {/* 左侧色条装饰 */}
      <div
        className="absolute left-0 top-0 h-full w-1 opacity-60"
        style={{ backgroundColor: scene.color }}
      />

      {/* 右上角箭头 */}
      <motion.div
        className="absolute right-4 top-4 text-danmo/40 transition-colors group-hover:text-zhusha"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <ArrowUpRight size={18} />
      </motion.div>

      {/* 图标 */}
      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-md text-2xl"
          style={{ backgroundColor: `${scene.color}15` }}
        >
          {scene.icon}
        </span>
        <h3 className="font-song text-lg font-bold text-mo">
          {scene.name}
        </h3>
      </div>

      {/* 描述 */}
      <p className="font-hei text-sm leading-relaxed text-danmo">
        {scene.description}
      </p>

      {/* 底部装饰线 */}
      <div className="mt-4 flex items-center gap-2">
        <div
          className="h-px flex-1 opacity-20"
          style={{ backgroundColor: scene.color }}
        />
        <span className="font-kai text-xs text-yinzhu">点击问典</span>
      </div>
    </motion.button>
  );
}
