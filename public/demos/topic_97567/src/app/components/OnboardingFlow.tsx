'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analytics } from '@/lib/analytics';

interface OnboardingFlowProps {
  onComplete: (reminderTime?: string) => void;
  onCreateRecord: (content: string) => void;
}

interface OnboardingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class OnboardingErrorBoundary extends React.Component<
  { children: React.ReactNode; onSkip: () => void },
  OnboardingErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onSkip: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): OnboardingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Onboarding error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-black/40 backdrop-blur-sm fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto w-full text-center">
            <div className="text-5xl mb-4">😅</div>
            <h2 className="text-xl font-bold text-[#FFB6C1] mb-3">引导出了点小状况</h2>
            <p className="text-gray-400 text-sm mb-6">没关系，你可以重试或跳过继续使用</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl py-3 px-6 font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                重试
              </button>
              <button
                onClick={this.props.onSkip}
                className="w-full text-gray-400 hover:text-gray-600 font-semibold transition-colors text-sm"
              >
                跳过引导 →
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function StepResonance({ onNext }: { onNext: () => void }) {
  const [scene, setScene] = useState<'A' | 'B'>('A');

  const toggleScene = useCallback(() => {
    setScene((prev) => (prev === 'A' ? 'B' : 'A'));
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-[#FFB6C1] mb-6">你有没有发现...</h2>

      <div
        className="relative w-full h-52 mb-6 cursor-pointer select-none overflow-hidden rounded-2xl"
        onClick={toggleScene}
      >
        <AnimatePresence mode="wait">
          {scene === 'A' ? (
            <motion.div
              key="scene-a"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6"
            >
              <div className="text-5xl mb-3">😔</div>
              <p className="text-lg font-semibold text-gray-700 mb-2">我们总是记住做错的事</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {['又迟到了', '又没忍住', '又拖延了', '又搞砸了'].map((text) => (
                  <span
                    key={text}
                    className="px-3 py-1 bg-gray-300/60 text-gray-600 rounded-full text-sm"
                  >
                    {text}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">← 点击切换 →</p>
            </motion.div>
          ) : (
            <motion.div
              key="scene-b"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8F0] to-[#FFB6C1]/20 rounded-2xl p-6"
            >
              <div className="text-5xl mb-3">😊</div>
              <p className="text-lg font-semibold text-[#FFB6C1] mb-2">却忘了做对的事</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {['按时起床了', '完成了一个任务', '帮助了别人', '坚持了锻炼'].map((text) => (
                  <span
                    key={text}
                    className="px-3 py-1 bg-[#FFB6C1]/20 text-[#FF99AA] rounded-full text-sm"
                  >
                    {text}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">← 点击切换 →</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            scene === 'A' ? 'bg-gray-400 scale-125' : 'bg-gray-200'
          }`}
        />
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            scene === 'B' ? 'bg-[#FFB6C1] scale-125' : 'bg-[#FFB6C1]/30'
          }`}
        />
      </div>

      <button
        onClick={onNext}
        className="w-full bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl py-3 px-6 font-semibold hover:shadow-lg transition-all hover:scale-105"
      >
        我就是这样 →
      </button>
    </div>
  );
}

function StepRecording({
  onCreateRecord,
  onNext,
}: {
  onCreateRecord: (content: string) => void;
  onNext: () => void;
}) {
  const [content, setContent] = useState('今天按时起床了');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!content.trim() || submitted) return;
    setSubmitted(true);
    onCreateRecord(content.trim());
    setTimeout(() => {
      onNext();
    }, 600);
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-[#FFB6C1] mb-2">试试记录一件今天做到的小事</h2>
      <p className="text-sm text-gray-400 mb-6">哪怕是很小很小的事也可以</p>

      <div className="text-5xl mb-6">✏️</div>

      <div className="w-full mb-6">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今天做到的一件小事..."
          disabled={submitted}
          className="w-full px-5 py-4 bg-[#FFF8F0] border border-[#FFB6C1]/30 rounded-2xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all disabled:opacity-60"
        />
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={submitted || !content.trim()}
        className="w-full bg-gradient-to-r from-[#FFB6C1] to-[#FF99AA] text-white rounded-2xl py-4 px-6 font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-lg"
        whileTap={{ scale: submitted ? 1 : 0.95 }}
      >
        {submitted ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            已记录 ✓
          </motion.span>
        ) : (
          '记录 ✨'
        )}
      </motion.button>
    </div>
  );
}

function StepSurprise({ onNext }: { onNext: () => void }) {
  const [canProceed, setCanProceed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSnowball, setShowSnowball] = useState(false);

  useEffect(() => {
    const snowballTimer = setTimeout(() => setShowSnowball(true), 300);
    const feedbackTimer = setTimeout(() => setShowFeedback(true), 1200);
    const proceedTimer = setTimeout(() => setCanProceed(true), 3000);

    return () => {
      clearTimeout(snowballTimer);
      clearTimeout(feedbackTimer);
      clearTimeout(proceedTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-[#FFB6C1] mb-6">看！你的雪球开始滚动了</h2>

      <div className="relative w-full h-40 mb-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={showSnowball ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative"
        >
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #FFFFFF, #FFF8F0, #E8F4FD, #B8D4E8, #87CEEB)',
              boxShadow: '0 10px 30px rgba(135, 206, 235, 0.3), 0 4px 12px rgba(255, 182, 193, 0.15)',
            }}
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            ❄️
          </motion.div>

          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,182,193,0.2) 0%, transparent 70%)',
              inset: -20,
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {showSnowball && (
          <>
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i * 72 * Math.PI) / 180;
              const startX = Math.cos(angle) * 120;
              const startY = Math.sin(angle) * 80;
              return (
                <motion.div
                  key={i}
                  className="absolute text-lg pointer-events-none"
                  style={{ top: '50%', left: '50%' }}
                  initial={{ x: startX, y: startY, opacity: 0, scale: 1 }}
                  animate={{ x: 0, y: 0, opacity: [0, 1, 0], scale: [1, 0.5, 0.2] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeIn',
                    delay: i * 0.3,
                  }}
                >
                  ✨
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full mb-4"
          >
            <div className="bg-gradient-to-r from-[#FFF8F0] to-[#FFB6C1]/10 rounded-2xl p-4 border border-[#FFB6C1]/20">
              <p className="text-sm text-gray-600 leading-relaxed text-center">
                太棒了！你已经迈出了第一步。每一个小成功，都在让你的雪球越滚越大 ❄️
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-sm text-gray-400 mb-6 text-center"
      >
        每一个小成功，都在让你的雪球越滚越大 ❄️
      </motion.p>

      <AnimatePresence>
        {canProceed && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onNext}
            className="w-full bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl py-3 px-6 font-semibold hover:shadow-lg transition-all hover:scale-105"
          >
            继续 →
          </motion.button>
        )}
      </AnimatePresence>

      {!canProceed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-300"
        >
          感受这一刻...
        </motion.p>
      )}
    </div>
  );
}

function StepPromise({ onComplete }: { onComplete: (reminderTime?: string) => void }) {
  const [reminderTime, setReminderTime] = useState('21:00');

  const timeOptions = [
    { value: '08:00', label: '🌅 08:00 - 早晨提醒' },
    { value: '12:30', label: '☀️ 12:30 - 午间提醒' },
    { value: '21:00', label: '🌙 21:00 - 晚间提醒' },
    { value: '', label: '🔕 暂不设置' },
  ];

  const handleComplete = () => {
    try {
      localStorage.setItem('onboarding_completed', 'true');
      if (reminderTime) {
        localStorage.setItem('reminder_time', reminderTime);
      }
      onComplete(reminderTime || undefined);
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
      onComplete(reminderTime || undefined);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-[#FFB6C1] mb-2">每天只需1分钟</h2>
      <p className="text-gray-500 mb-6">记录一件小事，我们一起看着雪球长大</p>

      <div className="text-5xl mb-6">🤝</div>

      <div className="w-full mb-6">
        <label className="block text-sm font-medium text-gray-500 mb-3 text-center">
          选择每日提醒时间
        </label>
        <div className="space-y-2">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setReminderTime(option.value)}
              className={`w-full px-4 py-3 rounded-xl text-left text-sm transition-all ${
                reminderTime === option.value
                  ? 'bg-[#FFB6C1]/15 border-2 border-[#FFB6C1]/50 text-[#FF99AA] font-medium shadow-sm'
                  : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleComplete}
        className="w-full bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl py-3 px-6 font-semibold hover:shadow-lg transition-all hover:scale-105"
      >
        开始使用 🎉
      </button>
    </div>
  );
}

const TOTAL_STEPS = 4;
const STEP_NAMES = ['resonance', 'recording', 'surprise', 'promise'] as const;

const OnboardingFlow = ({ onComplete, onCreateRecord }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);

    if (step >= 0 && step < STEP_NAMES.length) {
      try {
        analytics.trackOnboardingStep(step + 1, STEP_NAMES[step]);
      } catch (err) {
        console.error('Analytics error:', err);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('onboarding_completed', 'true');
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    }
    onComplete();
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const isStep3 = currentStep === 2;
  const canGoBack = currentStep > 0 && !isStep3;

  return (
    <OnboardingErrorBoundary onSkip={handleSkip}>
      <div className="bg-black/40 backdrop-blur-sm fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto w-full relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              {currentStep === 0 && <StepResonance onNext={handleNext} />}
              {currentStep === 1 && (
                <StepRecording onCreateRecord={onCreateRecord} onNext={handleNext} />
              )}
              {currentStep === 2 && <StepSurprise onNext={handleNext} />}
              {currentStep === 3 && <StepPromise onComplete={onComplete} />}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handlePrev}
              className={`text-sm text-gray-400 hover:text-gray-600 transition-colors min-w-[60px] ${
                canGoBack ? '' : 'invisible'
              }`}
            >
              ← 上一步
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-[#FFB6C1] scale-125'
                      : index < currentStep
                      ? 'bg-[#FFB6C1]/50'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {!isStep3 && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors min-w-[60px]"
              >
                跳过 →
              </button>
            )}
            {isStep3 && <div className="min-w-[60px]" />}
          </div>
        </div>
      </div>
    </OnboardingErrorBoundary>
  );
};

export default OnboardingFlow;
