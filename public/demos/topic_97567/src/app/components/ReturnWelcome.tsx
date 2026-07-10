'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SnowballCharacter from './SnowballCharacter';

interface ReturnWelcomeProps {
  isVisible: boolean;
  daysInactive: number;
  onQuickRecord: () => void;
  onEasyRoll: () => void;
  onDismiss: () => void;
}

const RETURN_MESSAGES = [
  '这几天我一直在等你。你的雪球还在，随时可以继续滚 🫶',
  '好久不见！我一直在想你呢~ 你的雪球还保持着之前的大小 💙',
  '欢迎回来！不管多久，我都会在这里等你 🌟',
];

export function ReturnWelcome({
  isVisible,
  daysInactive,
  onQuickRecord,
  onEasyRoll,
  onDismiss,
}: ReturnWelcomeProps) {
  // 修复 H-6: 使用 useState 初始化一次随机消息，避免每次渲染重新随机导致闪烁
  const [message] = useState(() => RETURN_MESSAGES[Math.floor(Math.random() * RETURN_MESSAGES.length)]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] p-8 text-center relative overflow-hidden">
              <div className="absolute top-[-30px] left-[-30px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                className="relative flex justify-center"
              >
                <SnowballCharacter size="lg" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-white mt-5 relative"
              >
                雪球等你回来
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 mt-2 text-sm relative"
              >
                你已经 {daysInactive} 天没来了
              </motion.p>
            </div>

            <div className="p-6">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-center mb-5 leading-relaxed"
              >
                {message}
              </motion.p>

              <div className="space-y-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onQuickRecord}
                  className="w-full py-3 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  记一件今天的小事
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onEasyRoll}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  轻松滚一下就好 🤍
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={onDismiss}
                  className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  稍后再说
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
