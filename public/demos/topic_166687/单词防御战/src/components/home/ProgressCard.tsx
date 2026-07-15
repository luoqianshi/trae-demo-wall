import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

export const ProgressCard = () => {
  const { progress } = useProgressStore();

  const stats = [
    { label: '最高分', value: progress.highScore, icon: '🏆', color: 'game-yellow' },
    { label: '当前等级', value: progress.currentLevel, icon: '⭐', color: 'game-purple' },
    { label: '已学单词', value: progress.totalWordsLearned, icon: '📚', color: 'game-blue' },
    { label: '准确率', value: `${progress.accuracyRate.toFixed(0)}%`, icon: '🎯', color: 'game-green' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2"
          style={{ borderColor: `var(--tw-color-${stat.color})` }}
        >
          <div className="text-3xl mb-2">{stat.icon}</div>
          <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
          <div className="text-2xl font-bold" style={{ color: `var(--tw-color-${stat.color})` }}>
            {stat.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
