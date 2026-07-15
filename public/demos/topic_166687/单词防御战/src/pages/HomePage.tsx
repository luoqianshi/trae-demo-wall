import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '@/components/home/HeroSection';
import { ProgressCard } from '@/components/home/ProgressCard';
import { useProgressStore } from '@/store/progressStore';
import { heroes, getHeroById } from '@/data/heroes';

export const HomePage = () => {
  const navigate = useNavigate();
  const { progress } = useProgressStore();

  const handleStartGame = () => {
    navigate('/game');
  };

  const handleViewProgress = () => {
    navigate('/progress');
  };

  const unlockedHeroes = heroes.filter((h) => progress.unlockedHeroes.includes(h.id));
  const lockedHeroes = heroes.filter((h) => !progress.unlockedHeroes.includes(h.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <HeroSection />
        
        <ProgressCard />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            className="flex-1 bg-gradient-to-r from-game-blue to-game-purple text-white py-4 px-8 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <span>🎮</span>
            <span>开始游戏</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewProgress}
            className="flex-1 bg-white text-game-purple py-4 px-8 rounded-xl font-bold text-xl shadow-lg border-2 border-game-purple hover:shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <span>📊</span>
            <span>查看进度</span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🦸 我的英雄
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {unlockedHeroes.map((hero, index) => (
              <motion.div
                key={hero.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="rounded-xl p-4 border-2"
                style={{
                  backgroundColor: `${hero.color}15`,
                  borderColor: hero.color,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{hero.emoji}</div>
                  <div>
                    <div className="font-bold text-gray-800">{hero.name}</div>
                    <div className="text-xs text-gray-600">{hero.skill}</div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {lockedHeroes.map((hero, index) => (
              <motion.div
                key={hero.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + unlockedHeroes.length * 0.1 + index * 0.1 }}
                className="rounded-xl p-4 border-2 border-dashed border-gray-300 bg-gray-50"
              >
                <div className="flex items-center gap-3 opacity-50">
                  <div className="text-3xl">🔒</div>
                  <div>
                    <div className="font-bold text-gray-400">???</div>
                    <div className="text-xs text-gray-400">完成成就解锁</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-gray-500 text-sm"
        >
          <p>💡 提示：正确拼写单词获得金币，用金币召唤英雄抵御敌人！</p>
        </motion.div>
      </div>
    </div>
  );
};
