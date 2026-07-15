import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StatsChart } from '@/components/progress/StatsChart';
import { AchievementBadge } from '@/components/progress/AchievementBadge';
import { useProgressStore } from '@/store/progressStore';
import { words } from '@/data/words';

export const ProgressPage = () => {
  const navigate = useNavigate();
  const { progress, achievements } = useProgressStore();

  const sortedWords = [...words].sort((a, b) => {
    const masteryA = progress.wordMastery[a.id] || 0;
    const masteryB = progress.wordMastery[b.id] || 0;
    return masteryB - masteryA;
  });

  const learnedWords = sortedWords.filter((w) => progress.wordMastery[w.id] && progress.wordMastery[w.id] > 0);

  const handleBack = () => {
    navigate('/');
  };

  const handlePlayAgain = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="mb-4 bg-white/80 text-gray-700 px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
        >
          <span>←</span>
          <span>返回首页</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            📊 我的学习进度
          </h1>
        </motion.div>

        <StatsChart />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🏆 成就徽章
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>
        </motion.div>

        {learnedWords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📚 已学单词 ({learnedWords.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {learnedWords.slice(0, 20).map((word) => {
                const mastery = progress.wordMastery[word.id] || 0;
                return (
                  <motion.div
                    key={word.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{word.word}</div>
                      <div className="text-sm text-gray-500">{word.meaning}</div>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < mastery ? 'opacity-100' : 'opacity-30'
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayAgain}
          className="mt-8 w-full bg-gradient-to-r from-game-blue to-game-purple text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
        >
          🎮 继续游戏
        </motion.button>
      </div>
    </div>
  );
};
