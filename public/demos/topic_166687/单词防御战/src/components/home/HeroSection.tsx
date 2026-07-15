import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-game-blue via-game-purple to-game-pink rounded-3xl overflow-hidden mb-8 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold mb-4"
          style={{ fontFamily: 'Bubblegum Sans, cursive' }}
        >
          🎮 单词防御战
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-white/90 text-center px-4"
        >
          拼写单词，召唤英雄，守护你的基地！
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex gap-4 mt-6"
        >
          <span className="text-4xl animate-bounce-slow">📚</span>
          <span className="text-4xl animate-bounce-slow" style={{ animationDelay: '0.2s' }}>⚔️</span>
          <span className="text-4xl animate-bounce-slow" style={{ animationDelay: '0.4s' }}>🏰</span>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};
