'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Discovery } from '@/lib/discovery-engine';

interface DiscoveryCardProps {
  discovery: Discovery;
}

export function DiscoveryCard({ discovery }: DiscoveryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const typeEmoji = discovery.type === 'pattern' ? '🔍' : '📊';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-[#FFD700]/10 to-[#87CEEB]/10 rounded-2xl p-4 mt-3 border border-[#FFD700]/30 relative overflow-hidden"
    >
      <div className="absolute top-[-15px] right-[-15px] w-12 h-12 bg-[#FFD700]/10 rounded-full blur-xl"></div>

      <div className="flex items-start gap-3 relative z-10">
        <span className="text-xl">{typeEmoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[#FFD700] bg-[#FFD700]/20 px-2 py-0.5 rounded-full">
              ✨ 发现
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
            >
              {isExpanded ? '收起' : '展开'}
            </button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {discovery.title}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {discovery.content}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <p className="text-sm text-gray-500">{discovery.title}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
