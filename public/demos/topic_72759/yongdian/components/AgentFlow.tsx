'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Circle, ArrowDown } from 'lucide-react';
import { AgentStep, AgentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AgentFlowProps {
  steps: AgentStep[];
}

/** 状态样式映射 */
const statusConfig: Record<
  AgentStatus,
  { border: string; bg: string; text: string; label: string }
> = {
  idle: {
    border: 'border-yinzhu/30',
    bg: 'bg-xuanzhi/40',
    text: 'text-yinzhu',
    label: '等待中',
  },
  running: {
    border: 'border-qinglu',
    bg: 'bg-qinglu/5',
    text: 'text-qinglu',
    label: '执行中',
  },
  completed: {
    border: 'border-qinglu/40',
    bg: 'bg-qinglu/5',
    text: 'text-qinglu',
    label: '已完成',
  },
  error: {
    border: 'border-zhusha',
    bg: 'bg-zhusha/5',
    text: 'text-zhusha',
    label: '出错',
  },
};

/** 状态图标 */
function StatusIcon({ status }: { status: AgentStatus }) {
  switch (status) {
    case 'completed':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-qinglu text-xuanzhi">
          <Check size={14} />
        </span>
      );
    case 'running':
      return (
        <span className="agent-pulse flex h-6 w-6 items-center justify-center rounded-full bg-qinglu text-xuanzhi">
          <Loader2 size={14} className="animate-spin" />
        </span>
      );
    case 'error':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zhusha text-xuanzhi">
          <Circle size={14} fill="currentColor" />
        </span>
      );
    default:
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-yinzhu/30 bg-xuanzhi" />
      );
  }
}

export default function AgentFlow({ steps }: AgentFlowProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-yinzhu">
        等待开始...
      </div>
    );
  }

  return (
    <div className="scroll-container rounded-lg p-5">
      {/* 顶部装饰 */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="h-px w-12 bg-danmo/30" />
        <span className="font-song text-sm text-danmo">六典接力</span>
        <div className="h-px w-12 bg-danmo/30" />
      </div>

      {/* Agent 步骤列表 */}
      <div className="relative">
        {steps.map((step, index) => {
          const config = statusConfig[step.status];
          const isLast = index === steps.length - 1;
          return (
            <div key={`${step.agent}-${index}`} className="relative">
              {/* 连线 */}
              {!isLast && (
                <div className="absolute left-[18px] top-[40px] flex h-[calc(100%-24px)] w-px flex-col items-center">
                  <motion.div
                    className="w-full"
                    style={{
                      background:
                        step.status === 'completed'
                          ? 'linear-gradient(to bottom, #5C8D89, rgba(92,141,137,0.2))'
                          : 'rgba(139,115,85,0.2)',
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  />
                  <ArrowDown size={12} className="mt-0.5 text-danmo/30" />
                </div>
              )}

              {/* Agent 卡片 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className={cn(
                  'relative mb-3 ml-12 rounded-lg border bg-xuanzhi/80 p-3',
                  'shadow-sm transition-all',
                  config.border,
                  config.bg
                )}
              >
                {/* 状态图标 - 绝对定位在连线上 */}
                <div className="absolute -left-12 top-3">
                  <StatusIcon status={step.status} />
                </div>

                {/* Agent 名称 + 状态标签 */}
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-song text-sm font-bold text-mo">
                    {step.agentName}
                  </span>
                  <span className={cn('font-hei text-xs', config.text)}>
                    {config.label}
                  </span>
                </div>

                {/* 输入输出摘要 */}
                <AnimatePresence>
                  {step.status !== 'idle' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {step.input && (
                        <div className="flex gap-1.5">
                          <span className="shrink-0 font-kai text-xs text-yinzhu">
                            入：
                          </span>
                          <span className="font-hei text-xs leading-relaxed text-danmo">
                            {step.input}
                          </span>
                        </div>
                      )}
                      {step.output && (
                        <div className="flex gap-1.5">
                          <span className="shrink-0 font-kai text-xs text-qinglu">
                            出：
                          </span>
                          <span className="font-hei text-xs leading-relaxed text-danmo">
                            {step.output}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 耗时 */}
                {step.startTime && step.endTime && (
                  <div className="mt-1 text-xs text-yinzhu">
                    耗时 {((step.endTime - step.startTime) / 1000).toFixed(1)}s
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
