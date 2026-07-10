'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoveryCard } from './DiscoveryCard';
import type { Discovery } from '@/lib/discovery-engine';

interface AIFeedbackProps {
  feedback?: string;
  isLoading?: boolean;
  discovery?: Discovery;
}

const AIFeedback = ({ feedback, isLoading = false, discovery }: AIFeedbackProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!feedback && !isLoading) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-[#FFB6C1]/10 to-[#87CEEB]/10 rounded-2xl p-4 mt-3 border border-[#FFB6C1]/20 relative overflow-hidden"
        >
          <div className="absolute top-[-20px] right-[-20px] w-16 h-16 bg-[#FFD700]/10 rounded-full blur-xl"></div>
          
          <div className="flex items-start gap-3 relative z-10">
            <span className="text-2xl">❄️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#FFB6C1] mb-1">雪球说</p>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 bg-[#87CEEB] rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#FFB6C1] rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#FFD700] rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  />
                  <span className="text-sm text-gray-400 ml-1">雪球正在思考...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">{feedback}</p>
              )}
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-300 hover:text-gray-500 text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {discovery && <DiscoveryCard discovery={discovery} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIFeedback;
