'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step {
  task: string;
  completed: boolean;
}

interface SnowballGuideProps {
  goal: string;
  currentState: string;
  steps: Step[];
  currentStepIndex: number;
  onCompleteStep: (stepIndex: number) => void;
  onAbandon: () => void;
  onRestart: () => void;
  loading?: boolean;
}

const COMPLETION_KEYWORDS = ['已完成', '完成了', 'done', '完成'];

const isCompletionInput = (input: string): boolean => {
  const trimmed = input.trim().toLowerCase();
  return COMPLETION_KEYWORDS.some((keyword) => trimmed.includes(keyword));
};

const SnowballGuide = ({
  goal,
  currentState,
  steps,
  currentStepIndex,
  onCompleteStep,
  onAbandon,
  onRestart,
  loading = false,
}: SnowballGuideProps) => {
  const [userInput, setUserInput] = useState('');
  const [isRepeating, setIsRepeating] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const allCompleted = currentStepIndex >= steps.length;

  const handleInputSubmit = () => {
    if (loading) return;

    if (isCompletionInput(userInput)) {
      setIsRepeating(false);
      onCompleteStep(currentStepIndex);
      if (currentStepIndex + 1 >= steps.length) {
        setShowCompletion(true);
      }
    } else {
      setIsRepeating(true);
    }

    setUserInput('');
  };

  const handleCompleteButtonClick = () => {
    if (loading) return;
    setIsRepeating(false);
    onCompleteStep(currentStepIndex);
    if (currentStepIndex + 1 >= steps.length) {
      setShowCompletion(true);
    }
    setUserInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
  };

  if (showCompletion || allCompleted) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: 2 }}
              className="text-5xl mb-3"
            >
              ⛄🎉
            </motion.div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent mb-2">
              雪球滚到了！
            </h2>
            <p className="text-gray-500">
              从「{currentState}」成功滚到了「{goal}」
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#FFB6C1]/10 to-[#FFB6C1]/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[#FFB6C1]">{steps.length}</p>
              <p className="text-xs text-gray-500 mt-1">完成步骤</p>
            </div>
            <div className="bg-gradient-to-br from-[#87CEEB]/10 to-[#87CEEB]/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[#87CEEB]">100%</p>
              <p className="text-xs text-gray-500 mt-1">达成率</p>
            </div>
            <div className="bg-gradient-to-br from-[#FFD700]/10 to-[#FFD700]/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[#FFD700]">⚡</p>
              <p className="text-xs text-gray-500 mt-1">执行力</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#87CEEB] rounded-full"></span>
              行动链回顾
            </h3>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-2 rounded-xl bg-gray-50"
                >
                  <span className="w-6 h-6 rounded-full bg-[#87CEEB] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    ✅
                  </span>
                  <div>
                <p className="text-sm text-gray-700">{step.task}</p>
              </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FFB6C1]/10 to-[#87CEEB]/10 rounded-2xl p-4 mb-6 border border-[#FFB6C1]/20">
            <p className="text-sm text-gray-600 leading-relaxed">
              🌟 每一个微小的行动都在让你的雪球越滚越大。今天你证明了：从「{currentState}」到「{goal}」，只需要迈出第一步。继续保持这个势头！
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onRestart}
              className="flex-1 bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              🏠 返回首页
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-2 h-8 rounded-full bg-[#87CEEB]" />
        <h2 className="text-xl font-bold text-gray-800">❄️ 雪球正在滚动...</h2>
      </div>
      <p className="text-gray-500 text-sm mb-4 ml-5">
        从「{currentState}」滚向「{goal}」
      </p>
      <div className="flex items-center gap-1.5 mb-6 ml-5">
        <span className="text-xs text-gray-400">步骤 {currentStepIndex + 1}/{steps.length}</span>
        <div className="flex gap-1 ml-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i <= currentStepIndex ? 'bg-[#87CEEB]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-gradient-to-br from-[#87CEEB]/5 to-[#FFB6C1]/5 rounded-2xl p-5 mb-5"
        >
          <div className="flex items-start gap-4">
            <span className="w-10 h-10 rounded-full bg-[#87CEEB] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
              {currentStepIndex + 1}
            </span>
            <p className="text-lg text-gray-700 leading-relaxed pt-1.5">
              {currentStep?.task}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isRepeating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#FFF8F0] rounded-2xl p-4 border border-[#FFB6C1]/20 mb-5"
          >
            <p className="text-gray-500 text-sm mb-2">没关系，我们再试一次这一步：</p>
            <p className="text-gray-700 leading-relaxed">{currentStep?.task}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="完成了就告诉我「已完成」吧～"
          disabled={loading}
          className="rounded-2xl border-2 border-[#FFB6C1]/30 focus:border-[#FFB6C1] p-3 w-full outline-none transition-all disabled:opacity-50"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleCompleteButtonClick}
            disabled={loading}
            className="bg-[#FFB6C1] text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-[#FF99AA] transition-all disabled:opacity-50"
          >
            ✅ 已完成
          </button>
          <button
            onClick={onAbandon}
            className="text-gray-400 hover:text-gray-600 px-4 py-2.5 rounded-2xl transition-all"
          >
            放弃
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnowballGuide;
