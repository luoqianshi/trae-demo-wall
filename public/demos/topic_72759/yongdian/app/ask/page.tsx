'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  Share2,
  X,
} from 'lucide-react';
import { scenes } from '@/lib/scenes';
import { AskResult, SceneType, WisdomCardData } from '@/lib/types';
import { cn } from '@/lib/utils';
import AgentFlow from '@/components/AgentFlow';
import WisdomCard from '@/components/WisdomCard';
import ShareCard from '@/components/ShareCard';

function AskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sceneParam = searchParams.get('scene') as SceneType | null;
  const queryParam = searchParams.get('query');

  const currentScene = scenes.find((s) => s.type === sceneParam);

  const [query, setQuery] = useState(queryParam || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const autoSubmitted = useRef(false);

  const handleSubmit = async (queryText?: string) => {
    const finalQuery = (queryText || query).trim();
    if (!finalQuery) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          scene: sceneParam || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`请求失败 (${res.status})`);
      }

      const data: AskResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // URL 参数带 query 时自动提交
  useEffect(() => {
    if (queryParam && queryParam.trim() && !autoSubmitted.current) {
      autoSubmitted.current = true;
      setQuery(queryParam);
      handleSubmit(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 构建分享卡片数据
  const shareData: WisdomCardData | null = result
    ? {
        query: result.query,
        originalText: result.retrievedPassages?.[0]?.passage.originalText || '',
        translation: result.interpretations?.[0]?.modernTranslation || '',
        book: result.retrievedPassages?.[0]?.passage.book || '',
        chapter: result.retrievedPassages?.[0]?.passage.chapter || '',
        advice: result.advices?.[0]?.description || result.summary || '',
        era: result.retrievedPassages?.[0]?.passage.era || '',
      }
    : null;

  return (
    <main className="min-h-screen pb-12">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b border-yinzhu/20 bg-xuanzhi/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-danmo transition-colors hover:bg-danmo/5"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <div className="h-4 w-px bg-yinzhu/30" />
          <div className="flex items-center gap-2">
            {currentScene && <span className="text-lg">{currentScene.icon}</span>}
            <span className="font-song text-sm font-bold text-mo">
              {currentScene?.name || '自由问典'}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* 输入区 */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl"
          >
            <div className="mb-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="说说你的困惑，典籍自有答案..."
                rows={4}
                className={cn(
                  'w-full resize-none rounded-xl border border-yinzhu/30 bg-xuanzhi/80 p-4',
                  'font-hei text-sm text-mo shadow-sm transition-all',
                  'placeholder:text-yinzhu/50',
                  'focus:border-zhusha/40 focus:outline-none focus:shadow-md'
                )}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="font-kai text-xs text-yinzhu">
                  Ctrl/⌘ + Enter 提交
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSubmit()}
                  disabled={!query.trim() || loading}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-6 py-2',
                    'font-hei text-sm font-medium transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                    query.trim()
                      ? 'bg-zhusha text-xuanzhi'
                      : 'bg-yinzhu/20 text-yinzhu'
                  )}
                >
                  <Send size={14} />
                  求解
                </motion.button>
              </div>
            </div>

            {/* 示例问题 */}
            {currentScene?.examples && (
              <div>
                <p className="mb-2 font-kai text-xs text-yinzhu">
                  试试这些问题：
                </p>
                <div className="space-y-2">
                  {currentScene.examples.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className={cn(
                        'w-full rounded-lg border border-yinzhu/20 bg-xuanzhi/50 px-4 py-2.5',
                        'text-left font-hei text-xs text-danmo transition-colors',
                        'hover:border-zhusha/30 hover:bg-zhusha/5'
                      )}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 加载状态 */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 size={40} className="animate-spin text-qinglu" />
            <p className="mt-4 font-song text-sm text-danmo">
              六典接力，正在为你求解...
            </p>
            <p className="mt-1 font-kai text-xs text-yinzhu">
              检索 · 释义 · 今用 · 溯源 · 审校
            </p>
          </motion.div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-md rounded-xl border border-zhusha/30 bg-zhusha/5 p-6 text-center"
          >
            <AlertCircle size={32} className="mx-auto text-zhusha" />
            <p className="mt-3 font-song text-sm text-mo">
              求解过程中遇到了问题
            </p>
            <p className="mt-1 font-hei text-xs text-danmo">{error}</p>
            <button
              onClick={() => handleSubmit()}
              className="mt-4 rounded-lg bg-zhusha px-4 py-2 font-hei text-xs text-xuanzhi"
            >
              重试
            </button>
          </motion.div>
        )}

        {/* 结果区：左侧AgentFlow + 右侧WisdomCard */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 lg:grid-cols-[360px_1fr]"
          >
            {/* 左侧：Agent 过程 */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-song text-sm font-bold text-mo">
                  求解过程
                </span>
                <button
                  onClick={() => setShowShare(true)}
                  className="flex items-center gap-1 rounded-lg border border-yinzhu/30 px-3 py-1 text-xs text-danmo hover:bg-danmo/5"
                >
                  <Share2 size={12} />
                  分享
                </button>
              </div>
              <AgentFlow steps={result.agentSteps} />
            </div>

            {/* 右侧：智慧解答 */}
            <div>
              <div className="mb-2">
                <span className="font-song text-sm font-bold text-mo">
                  智慧解答
                </span>
              </div>
              <WisdomCard result={result} />
            </div>
          </motion.div>
        )}

        {/* 再问一题 */}
        {result && !loading && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setResult(null);
                setError(null);
                setQuery('');
              }}
              className="rounded-lg border border-danmo/30 px-6 py-2 font-hei text-sm text-danmo hover:bg-danmo/5"
            >
              再问一题
            </button>
          </div>
        )}
      </div>

      {/* 分享卡片弹窗 */}
      <AnimatePresence>
        {showShare && shareData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShare(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-mo/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] overflow-y-auto rounded-xl bg-xuanzhi p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowShare(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-xuanzhi/80 p-1 text-danmo hover:bg-danmo/10"
              >
                <X size={18} />
              </button>
              <ShareCard data={shareData} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 size={32} className="animate-spin text-qinglu" />
        </div>
      }
    >
      <AskPageContent />
    </Suspense>
  );
}
