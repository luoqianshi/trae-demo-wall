'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen, CheckCircle2 } from 'lucide-react';
import { SourceTrace as SourceTraceType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SourceTraceProps {
  sources: SourceTraceType[];
}

export default function SourceTrace({ sources }: SourceTraceProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpandedId(prev => (prev === key ? null : key));
  };

  if (!sources || sources.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-yinzhu">
        暂无溯源信息
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((source, index) => {
        const key = `${source.book}-${index}`;
        const isExpanded = expandedId === key;
        return (
          <div
            key={key}
            className={cn(
              'rounded-lg border border-yinzhu/30 bg-xuanzhi/60 overflow-hidden',
              'transition-colors hover:border-danmo/40'
            )}
          >
            {/* 折叠头部 */}
            <button
              onClick={() => toggle(key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-qinglu shrink-0" />
                <span className="font-song text-sm font-semibold text-mo">
                  《{source.book}》
                </span>
                <span className="font-kai text-xs text-danmo">
                  · {source.chapter}
                </span>
                <span className="font-kai text-xs text-yinzhu">
                  · {source.era}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {source.verified && (
                  <span className="flex items-center gap-1 rounded bg-zhusha/10 px-1.5 py-0.5">
                    <CheckCircle2 size={12} className="text-zhusha" />
                    <span className="text-xs text-zhusha">已核实</span>
                  </span>
                )}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} className="text-danmo" />
                </motion.div>
              </div>
            </button>

            {/* 展开内容 */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-yinzhu/20 px-4 py-3">
                    {/* 古文原文 */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="seal text-xs" style={{ padding: '2px 8px' }}>
                          原文
                        </span>
                      </div>
                      <p className="font-kai text-sm leading-loose text-mo">
                        {source.originalText}
                      </p>
                    </div>
                    {/* 白话译文 */}
                    <div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span
                          className="rounded px-2 py-0.5 text-xs font-semibold text-qinglu"
                          style={{ backgroundColor: 'rgba(92,141,137,0.1)' }}
                        >
                          译文
                        </span>
                      </div>
                      <p className="font-hei text-sm leading-relaxed text-danmo">
                        {source.translation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
