'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  Play,
  Pause,
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface TourStep {
  route: string;
  title: string;
  description: string;
  duration: number; // ms to auto-advance
  icon: typeof MapPin;
}

const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    title: '家庭 AI 中枢',
    description: 'EchoLife 的首页，集成了 Hero 动画、AI 访谈入口、家庭状态、数据中心、生命树预览、时墨核心、Agent 运行时、技能库和学习时间线等 10 大模块。',
    duration: 6000,
    icon: Sparkles,
  },
  {
    route: '/interview',
    title: 'AI 深度访谈',
    description: '与 AI 助手「时墨」进行实时流式对话。支持 SSE 流式响应、情绪识别、实体抽取、记忆自动保存。选择推荐话题或自由输入，AI 会引导你回忆人生点滴。',
    duration: 6000,
    icon: Sparkles,
  },
  {
    route: '/life-tree',
    title: '生命树',
    description: '将你的记忆编织成一棵生命之树。支持分类、事件、人物、地点、主题 5 种节点类型，树形展开/折叠，节点关联记忆查看，拖拽创建子节点。',
    duration: 6000,
    icon: Sparkles,
  },
  {
    route: '/personality',
    title: '人格 DNA',
    description: '基于记忆与访谈生成的性格画像。五维雷达图（开放性/尽责性/外向性/宜人性/神经质），维度卡片+进度条，AI 分析文本，人格演变时间线。',
    duration: 6000,
    icon: Sparkles,
  },
  {
    route: '/capsules',
    title: '时间胶囊',
    description: '创建数字时间胶囊，封存此刻的记忆与心情，设定未来开启时间。让时间成为你的数字遗产守护者。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/center',
    title: '数字生命中心',
    description: '你的数字生命控制台，汇总记忆统计、AI 调用、人格演变等核心数据，是整个系统的数据驾驶舱。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/knowledge',
    title: '知识库',
    description: '基于 RAG 的知识管理系统。支持向量化检索、知识实体关联、智能问答，让 AI 真正理解你的个人知识体系。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/evolution',
    title: '进化轨迹',
    description: '记录你的数字生命进化历程，从初始访谈到人格成型，每一步成长都有迹可循。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/family',
    title: '家庭',
    description: '家庭数字空间，管理家庭成员、共享记忆、家庭时间线。让 AI 理解你的家庭关系和情感纽带。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/life',
    title: '人生',
    description: '人生全景视图，将记忆、访谈、时间线整合为一条可视化的生命长河。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/museum',
    title: '记忆博物馆',
    description: '沉浸式浏览你的数字记忆展览馆，按时间、主题、人物多维度探索过往。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/skills',
    title: '技能库',
    description: 'AI Agent 的技能管理中心，查看可用技能、配置 Agent 行为、管理提示词模板。',
    duration: 5000,
    icon: Sparkles,
  },
  {
    route: '/settings',
    title: '设置',
    description: '账户设置、偏好配置、API 接入管理、数据导出等系统级功能。',
    duration: 5000,
    icon: Sparkles,
  },
];

export default function DemoTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100 for current step
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = TOUR_STEPS[stepIndex];

  // Navigate to the current step's route whenever stepIndex changes (during tour)
  // This must be in a useEffect, NOT inside a setState updater, to avoid
  // "Cannot update a component while rendering a different component" errors.
  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[stepIndex];
    if (step && pathname !== step.route) {
      router.push(step.route);
    }
  }, [active, stepIndex, router, pathname]);

  // Start tour
  const startTour = useCallback(() => {
    setActive(true);
    setStepIndex(0);
    setPaused(false);
    setProgress(0);
    // Navigation handled by the useEffect above when active/stepIndex change
  }, []);

  // Stop tour
  const stopTour = useCallback(() => {
    setActive(false);
    setPaused(false);
    setProgress(0);
  }, []);

  // Next step
  const nextStep = useCallback(() => {
    setProgress(0);
    setStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
  }, []);

  // Prev step
  const prevStep = useCallback(() => {
    setProgress(0);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (!active || paused) return;

    const step = TOUR_STEPS[stepIndex];
    if (!step) return;

    // Progress bar animation
    const progressInterval = 50; // ms
    const totalSteps = step.duration / progressInterval;
    let currentProgress = 0;

    progressRef.current = setInterval(() => {
      currentProgress += 1;
      setProgress(Math.min((currentProgress / totalSteps) * 100, 100));
    }, progressInterval);

    // Auto-advance
    timerRef.current = setTimeout(() => {
      if (stepIndex < TOUR_STEPS.length - 1) {
        nextStep();
      } else {
        // Tour complete
        setActive(false);
      }
    }, step.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [active, paused, stepIndex, nextStep]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopTour();
      else if (e.key === 'ArrowRight') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
      else if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, stopTour, nextStep, prevStep]);

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!active && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={startTour}
            className="fixed top-5 right-5 z-[60] flex items-center gap-2 liquid-glass-strong px-4 py-2.5 rounded-2xl text-sm font-semibold text-accent hover:text-white hover:bg-accent/20 transition-all duration-300 group"
            aria-label="一键演示"
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="inline-flex"
            >
              <Play size={16} fill="currentColor" className="group-hover:fill-white" />
            </motion.span>
            <span>演示</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tour overlay */}
      <AnimatePresence>
        {active && currentStep && (
          <>
            {/* Top progress bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 z-[70] pointer-events-none"
            >
              {/* Overall progress segments */}
              <div className="flex h-1 gap-0.5 px-0 bg-transparent">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full bg-white/[0.06] rounded-full overflow-hidden"
                  >
                    {i < stepIndex && <div className="h-full w-full bg-accent" />}
                    {i === stepIndex && (
                      <motion.div
                        className="h-full bg-accent"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bottom info card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-lg"
            >
              <div className="liquid-glass-strong rounded-3xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] border-white/[0.12]">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <motion.span
                      key={stepIndex}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/30 to-[#5e5ce6]/20 border border-accent/20"
                    >
                      <currentStep.icon size={18} className="text-accent" />
                    </motion.span>
                    <div>
                      <div className="flex items-center gap-2">
                        <motion.h3
                          key={`title-${stepIndex}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-base font-bold text-text"
                        >
                          {currentStep.title}
                        </motion.h3>
                        <span className="text-[10px] font-mono text-text-muted bg-white/[0.06] px-2 py-0.5 rounded-full">
                          {stepIndex + 1}/{TOUR_STEPS.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted/70 mt-0.5">
                        {currentStep.route}
                      </p>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={stopTour}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-white/[0.06] transition-colors"
                    aria-label="退出演示"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Description */}
                <motion.p
                  key={`desc-${stepIndex}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm leading-relaxed text-text-muted mb-4"
                >
                  {currentStep.description}
                </motion.p>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevStep}
                    disabled={stepIndex === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-xl liquid-glass text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="上一步"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-xl liquid-glass text-text-muted hover:text-text transition-colors text-xs font-medium"
                  >
                    {paused ? (
                      <>
                        <Play size={13} fill="currentColor" />
                        继续
                      </>
                    ) : (
                      <>
                        <Pause size={13} fill="currentColor" />
                        暂停
                      </>
                    )}
                  </button>

                  <button
                    onClick={nextStep}
                    disabled={stepIndex === TOUR_STEPS.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl liquid-glass text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="下一步"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Auto-advance indicator */}
                  <div className="ml-auto flex items-center gap-1.5 text-[10px] text-text-muted/60">
                    {paused ? (
                      <span>已暂停 · 按空格继续</span>
                    ) : stepIndex === TOUR_STEPS.length - 1 ? (
                      <span>最后一步</span>
                    ) : (
                      <>
                        <span>自动前进</span>
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ●
                        </motion.span>
                      </>
                    )}
                  </div>
                </div>

                {/* Keyboard hint */}
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-3 text-[10px] text-text-muted/40">
                  <span>← → 切换</span>
                  <span>空格 暂停</span>
                  <span>ESC 退出</span>
                </div>
              </div>
            </motion.div>

            {/* Spotlight glow on current page */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-[55] h-32 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,113,227,0.08), transparent)',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Tour complete toast */}
      <AnimatePresence>
        {!active && stepIndex === TOUR_STEPS.length - 1 && progress >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] liquid-glass-strong px-5 py-3 rounded-2xl text-sm text-success flex items-center gap-2"
            onAnimationComplete={() => {
              setTimeout(() => setProgress(0), 3000);
            }}
          >
            <Sparkles size={16} />
            演示完成！欢迎探索 EchoLife
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
