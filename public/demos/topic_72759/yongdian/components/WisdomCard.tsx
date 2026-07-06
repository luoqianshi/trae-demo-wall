'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Scroll,
  Lightbulb,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Quote,
  ListChecks,
} from 'lucide-react';
import { AskResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import SourceTrace from './SourceTrace';

interface WisdomCardProps {
  result: AskResult;
}

export default function WisdomCard({ result }: WisdomCardProps) {
  const [showSources, setShowSources] = useState(false);

  const topPassage = result.retrievedPassages?.[0]?.passage;
  const topInterpretation = result.interpretations?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* 顶部：用户问题 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-2 rounded-lg bg-xuanzhi/60 px-4 py-3"
      >
        <HelpCircle size={18} className="mt-0.5 shrink-0 text-zhusha" />
        <div>
          <span className="mb-0.5 block font-kai text-xs text-yinzhu">你的困惑</span>
          <p className="font-hei text-sm leading-relaxed text-mo">{result.query}</p>
        </div>
      </motion.div>

      {/* 中部：古籍智慧卡 */}
      {topPassage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="scroll-container overflow-hidden rounded-lg"
        >
          {/* 卡片头部 */}
          <div className="flex items-center justify-between border-b border-danmo/15 px-5 py-3">
            <div className="flex items-center gap-2">
              <Scroll size={16} className="text-danmo" />
              <span className="font-song text-sm font-bold text-mo">古籍智慧</span>
            </div>
            <span className="seal text-xs" style={{ padding: '2px 10px' }}>
              {topPassage.book} · {topPassage.chapter}
            </span>
          </div>

          {/* 古文原文（竖排）+ 译文 */}
          <div className="flex gap-6 px-5 py-5">
            {/* 竖排古文 */}
            <div className="flex shrink-0 justify-center">
              <div
                className="vertical-text font-kai text-base leading-relaxed text-mo"
                style={{ maxHeight: '200px', overflow: 'hidden' }}
              >
                {topPassage.originalText}
              </div>
            </div>

            {/* 译文 + 注解 */}
            <div className="flex-1 space-y-3">
              {topInterpretation && (
                <>
                  <div>
                    <div className="mb-1 flex items-center gap-1">
                      <Quote size={12} className="text-qinglu" />
                      <span className="font-kai text-xs text-qinglu">白话译文</span>
                    </div>
                    <p className="font-hei text-sm leading-relaxed text-danmo">
                      {topInterpretation.modernTranslation}
                    </p>
                  </div>
                  {topInterpretation.annotation && (
                    <div>
                      <span className="font-kai text-xs text-yinzhu">注解</span>
                      <p className="mt-0.5 font-hei text-xs leading-relaxed text-yinzhu">
                        {topInterpretation.annotation}
                      </p>
                    </div>
                  )}
                </>
              )}
              {/* 核心智慧提炼 */}
              <div className="rounded-md bg-zhusha/5 px-3 py-2">
                <span className="font-kai text-xs text-zhusha">智慧提炼</span>
                <p className="mt-0.5 font-song text-sm font-semibold text-mo">
                  {topInterpretation?.coreWisdom || topPassage.wisdom}
                </p>
              </div>
            </div>
          </div>

          {/* 时代标签 */}
          <div className="border-t border-danmo/10 px-5 py-2 text-right">
            <span className="font-kai text-xs text-yinzhu">— {topPassage.era} · {topPassage.book}</span>
          </div>
        </motion.div>
      )}

      {/* 下部：今用建议 */}
      {result.advices && result.advices.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb size={16} className="text-zhusha" />
            <span className="font-song text-sm font-bold text-mo">今用建议</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.advices.map((advice, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + idx * 0.08 }}
                className="rounded-lg border border-qinglu/20 bg-qinglu/5 p-4"
              >
                <h4 className="mb-1.5 font-song text-sm font-bold text-mo">
                  {advice.title}
                </h4>
                <p className="mb-2 font-hei text-xs leading-relaxed text-danmo">
                  {advice.description}
                </p>
                {advice.actionSteps && advice.actionSteps.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {advice.actionSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <ListChecks size={12} className="mt-0.5 shrink-0 text-qinglu" />
                        <span className="font-hei text-xs leading-relaxed text-danmo">
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-qinglu/10 pt-1.5">
                  <span className="font-kai text-xs text-qinglu">
                    「{advice.relatedWisdom}」
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 总结 */}
      {result.summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-danmo/5 px-4 py-3"
        >
          <span className="font-kai text-xs text-danmo">总结</span>
          <p className="mt-1 font-hei text-sm leading-relaxed text-mo">
            {result.summary}
          </p>
        </motion.div>
      )}

      {/* 底部：典籍溯源 */}
      {result.sources && result.sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowSources(!showSources)}
            className={cn(
              'mb-2 flex w-full items-center justify-between',
              'rounded-lg border border-yinzhu/30 bg-xuanzhi/60 px-4 py-2.5',
              'transition-colors hover:border-danmo/40'
            )}
          >
            <div className="flex items-center gap-2">
              <BookMarked size={16} className="text-danmo" />
              <span className="font-song text-sm font-bold text-mo">典籍溯源</span>
              <span className="font-kai text-xs text-yinzhu">
                （{result.sources.length}则）
              </span>
            </div>
            {showSources ? (
              <ChevronUp size={16} className="text-danmo" />
            ) : (
              <ChevronDown size={16} className="text-danmo" />
            )}
          </button>
          {showSources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden"
            >
              <SourceTrace sources={result.sources} />
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
