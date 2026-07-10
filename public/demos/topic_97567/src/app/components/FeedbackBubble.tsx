'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackBubbleProps {
  isVisible: boolean;
  message: string;
  onComplete: () => void;
}

const FeedbackBubble: React.FC<FeedbackBubbleProps> = ({ isVisible, message, onComplete }) => {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-24 left-1/2 z-50 pointer-events-none"
          initial={{ y: 60, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: -30, opacity: 0, x: '-50%' }}
          transition={{
            y: { type: 'spring', stiffness: 300, damping: 20 },
            opacity: { duration: 0.5, ease: 'easeInOut' },
          }}
        >
          <div className="bg-white rounded-2xl px-6 py-3 shadow-xl border border-[#FFB6C1]/20 backdrop-blur-sm">
            <p className="text-sm font-bold bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent whitespace-nowrap">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackBubble;
