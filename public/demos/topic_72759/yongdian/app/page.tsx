'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { scenes } from '@/lib/scenes';
import SceneCard from '@/components/SceneCard';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSceneClick = (sceneType: string) => {
    router.push(`/ask?scene=${sceneType}`);
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    router.push(`/ask?query=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero 区域 - 卷轴展开动画 */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-8 text-center">
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
          className="overflow-hidden"
        >
          {/* 装饰墨点 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto mb-4 h-2 w-2 rounded-full bg-zhusha"
          />
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-song text-6xl font-bold tracking-[0.3em] text-mo md:text-7xl"
          >
            用典
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '60px' }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mx-auto mt-4 h-px bg-danmo/40"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 font-kai text-lg text-danmo md:text-xl"
          >
            让千年典籍智慧，主动为你解今之忧
          </motion.p>
        </motion.div>

        {/* 产品简介 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mx-auto mt-6 max-w-2xl font-hei text-sm leading-relaxed text-yinzhu"
        >
          以古籍为智囊，以AI为桥梁。从养生、社交到职场、育儿，
          让传统文化不再是书架上的尘封，而是生活中的明灯。
        </motion.p>
      </section>

      {/* 场景卡片网格 */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-danmo/20" />
          <span className="flex items-center gap-2 font-song text-sm text-danmo">
            <Sparkles size={14} />
            选择场景 · 开启问典
          </span>
          <div className="h-px flex-1 bg-danmo/20" />
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene, index) => (
            <motion.div
              key={scene.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + index * 0.08 }}
            >
              <SceneCard
                scene={scene}
                onClick={() => handleSceneClick(scene.type)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 自由输入区 */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
        >
          <div className="mb-4 text-center">
            <span className="font-song text-sm text-danmo">
              或者，直接提出你的困惑
            </span>
          </div>
          <div
            className={cn(
              'flex items-end gap-3 rounded-xl border border-yinzhu/30 bg-xuanzhi/80 p-3',
              'shadow-sm transition-all',
              'focus-within:border-zhusha/40 focus-within:shadow-md'
            )}
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例如：最近压力大总是焦虑，古人有什么调心的智慧？"
              rows={2}
              className={cn(
                'flex-1 resize-none bg-transparent font-hei text-sm text-mo',
                'placeholder:text-yinzhu/50 focus:outline-none'
              )}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!query.trim()}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-5 py-2.5',
                'font-hei text-sm font-medium transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-40',
                query.trim()
                  ? 'bg-zhusha text-xuanzhi hover:bg-zhusha/90'
                  : 'bg-yinzhu/20 text-yinzhu'
              )}
            >
              <Search size={16} />
              求解
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 text-center">
        <p className="font-kai text-xs text-yinzhu">
          用典 · 古籍智慧生活顾问 — 让经典，活在当下
        </p>
      </footer>
    </main>
  );
}
