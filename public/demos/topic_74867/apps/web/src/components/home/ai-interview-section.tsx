'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFamilyHubStore } from '@/stores/family-hub-store';

/* ─── ShiMo proactively starts the conversation ─── */
const MESSAGES = [
  '你好。',
  '欢迎回来。',
  '今天过得怎么样？有没有发生什么值得记录的事情？',
  '如果准备好了，我们可以开始今天的访谈。',
];

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

export function AIInterviewSection() {
  const router = useRouter();
  const triggerInterviewComplete = useFamilyHubStore((s) => s.triggerInterviewComplete);

  const handleStart = () => {
    // Simulate the data update that happens after an interview completes.
    void triggerInterviewComplete();
    router.push('/interview');
  };

  return (
    <section>
      {/* Glass container */}
      <div className="liquid-glass-strong relative overflow-hidden p-6 sm:p-8">
        {/* Subtle glow behind avatar */}
        <div className="pointer-events-none absolute left-8 top-6 h-16 w-16 rounded-full bg-accent/10 blur-2xl" />

        <div className="relative flex items-start gap-4">
          {/* ── ShiMo avatar ── */}
          <motion.div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#5e5ce6] shadow-lg"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-5 w-5 text-white" />

            {/* Pulse ring */}
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-accent"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>

          {/* ── Messages ── */}
          <div className="flex-1 space-y-3">
            {MESSAGES.map((msg, i) => {
              const isLast = i === MESSAGES.length - 1;
              return (
                <motion.p
                  key={i}
                  className={
                    isLast
                      ? 'pt-1 text-base font-medium text-text/95'
                      : 'text-sm leading-relaxed text-text/70'
                  }
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.3 + i * 0.25 }}
                >
                  {msg}
                </motion.p>
              );
            })}
          </div>
        </div>

        {/* ── CTA ── */}
        <motion.div
          className="mt-6 pl-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + MESSAGES.length * 0.25 + 0.2 }}
        >
          <motion.button
            onClick={handleStart}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/15 bg-accent/15 px-6 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/25"
          >
            开始访谈
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

export default AIInterviewSection;
