'use client';

import { motion, AnimatePresence } from 'framer-motion';
import SnowballCharacter from './SnowballCharacter';
import { getStoryText } from '@/lib/snowball-story-text';
import { useSnowball } from '@/contexts/SnowballContext';

interface CelebrationDialogProps {
  isOpen: boolean;
  taskTitle: string;
  score: number;
  onClose: () => void;
}

export function CelebrationDialog({
  isOpen,
  taskTitle,
  score,
  onClose,
}: CelebrationDialogProps) {
  const { stage } = useSnowball();
  const storyText = getStoryText('celebration', stage);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] p-8 text-center relative overflow-hidden">
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
                {storyText.main}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 mt-2 text-sm relative"
              >
                {storyText.sub}
              </motion.p>
            </div>

            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#FFF8F0] rounded-2xl p-4 mb-5"
              >
                <p className="text-gray-500 text-xs mb-1">完成的任务</p>
                <p className="text-gray-800 font-medium truncate">{taskTitle}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 mb-5"
              >
                <span className="text-2xl">🎈</span>
                <span className="text-lg font-bold bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] bg-clip-text text-transparent">
                  +{score}分 ⚡
                </span>
                <span className="text-2xl">🎈</span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-200"
              >
                继续加油 ⛄
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
