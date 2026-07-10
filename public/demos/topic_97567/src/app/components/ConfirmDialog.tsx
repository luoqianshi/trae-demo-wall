'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      icon: '🗑️',
      confirmBg: 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600',
      snowballMood: '😢',
    },
    warning: {
      icon: '⚠️',
      confirmBg: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600',
      snowballMood: '🤔',
    },
    info: {
      icon: '💡',
      confirmBg: 'bg-gradient-to-r from-[#87CEEB] to-[#5BA8D4] hover:from-[#6BB6E8] hover:to-[#4A98C3]',
      snowballMood: '🤔',
    },
  };

  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] p-6 text-center relative overflow-hidden">
              <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-[-15px] right-[-15px] w-20 h-20 bg-white/10 rounded-full blur-xl" />

              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="relative"
              >
                <div
                  className="w-20 h-20 mx-auto rounded-full shadow-lg relative"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #fff, #E8F4F8)',
                  }}
                >
                  <div
                    className="absolute w-4 h-4 bg-white/90 rounded-full"
                    style={{ top: '12px', left: '14px' }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white/70 rounded-full"
                    style={{ top: '18px', left: '26px' }}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-2xl">
                    {config.snowballMood}
                  </div>
                </div>
              </motion.div>

              <h3 className="text-lg font-bold text-white mt-4 relative">{title}</h3>
            </div>

            <div className="p-5">
              <p className="text-gray-600 text-center text-sm leading-relaxed">{message}</p>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 px-4 text-white rounded-2xl transition-all duration-200 font-medium shadow-lg ${config.confirmBg}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
