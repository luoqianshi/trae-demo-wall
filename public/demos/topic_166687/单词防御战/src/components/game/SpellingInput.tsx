import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export const SpellingInput = () => {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [lastEarnedPoints, setLastEarnedPoints] = useState(0);
  const { gameState, checkSpelling } = useGameStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [gameState.currentWord]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !gameState.currentWord) return;

    const points = gameState.currentWord.difficulty * 10 + 5;
    const isCorrect = checkSpelling(input);
    setLastEarnedPoints(points);
    setFeedback(isCorrect ? 'success' : 'error');
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (!gameState.currentWord) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-game-blue/30">
        <div className="text-center mb-4">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              难度: {'⭐'.repeat(gameState.currentWord.difficulty)}
            </span>
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {gameState.currentWord.partOfSpeech === 'noun' && '名词'}
              {gameState.currentWord.partOfSpeech === 'verb' && '动词'}
              {gameState.currentWord.partOfSpeech === 'adjective' && '形容词'}
              {gameState.currentWord.partOfSpeech === 'adverb' && '副词'}
            </span>
          </div>
          
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {gameState.currentWord.meaning}
          </div>
          
          <div className="flex justify-center gap-2">
            {gameState.currentWord.word.split('').map((letter, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="w-10 h-12 bg-gray-100 rounded-lg border-b-4 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-400"
              >
                _
              </motion.div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入单词拼写..."
              className={`w-full px-6 py-4 text-lg rounded-xl border-4 transition-all duration-300 outline-none ${
                feedback === 'success'
                  ? 'border-game-green bg-green-50 text-green-700'
                  : feedback === 'error'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-game-blue/30 focus:border-game-blue focus:shadow-lg'
              }`}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-game-blue to-game-purple text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transition-shadow"
            >
              确定
            </motion.button>
          </div>
        </form>

        <AnimatePresence>
          {feedback === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 text-center text-green-600 font-bold text-lg"
            >
              ✅ 正确! +{lastEarnedPoints}分
            </motion.div>
          )}
          {feedback === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 text-center text-red-600 font-bold text-lg"
            >
              ❌ 错误! 正确答案: {gameState.currentWord.word}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
