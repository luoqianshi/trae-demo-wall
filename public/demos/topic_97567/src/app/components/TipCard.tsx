'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tip } from '../../hooks/useTips';

interface TipCardProps {
  tip: Tip;
  onDismiss: () => void;
}

const CATEGORY_ACCENT: Record<Tip['category'], string> = {
  record_tip: '#FFB6C1',
  feature_discovery: '#87CEEB',
  mindset_shift: '#DDA0DD',
  deep_feature: '#FFD700',
  habit_reinforce: '#90EE90',
};

const AUTO_DISMISS_MS = 10000;

const TipCard = ({ tip, onDismiss }: TipCardProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactedRef = useRef(false);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!interactedRef.current) {
        onDismiss();
      }
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onDismiss]);

  const handleDismiss = () => {
    interactedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onDismiss();
  };

  const accentColor = CATEGORY_ACCENT[tip.category];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative rounded-2xl shadow-md overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8F0 100%)',
        }}
      >
        {/* Subtle gradient border */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            padding: '1.5px',
            background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: accentColor }}
        />

        <div className="relative pl-5 pr-4 py-3.5">
          {/* Header: emoji + title */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{tip.emoji}</span>
            <h4
              className="text-sm font-semibold"
              style={{ color: accentColor }}
            >
              {tip.title}
            </h4>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-600 leading-relaxed mb-2.5">
            {tip.content}
          </p>

          {/* Dismiss button */}
          <div className="flex justify-end">
            <button
              onClick={handleDismiss}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95 cursor-pointer"
              style={{
                color: accentColor,
                backgroundColor: `${accentColor}15`,
              }}
            >
              知道了
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TipCard;
