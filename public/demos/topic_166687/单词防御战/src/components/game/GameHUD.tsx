import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export const GameHUD = () => {
  const { gameState } = useGameStore();

  return (
    <div className="flex flex-wrap justify-center gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border-2 border-game-orange"
      >
        <div className="text-sm text-gray-500 font-medium">波次</div>
        <div className="text-2xl font-bold text-game-orange">
          {gameState.wave} / 15
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border-2 border-game-yellow"
      >
        <div className="text-sm text-gray-500 font-medium">金币</div>
        <div className="text-2xl font-bold text-game-yellow">
          💰 {gameState.score}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border-2 border-game-green"
      >
        <div className="text-sm text-gray-500 font-medium">生命</div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={`text-xl transition-all ${
                i < gameState.lives ? 'opacity-100 scale-100' : 'opacity-30 scale-75'
              }`}
            >
              ❤️
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
