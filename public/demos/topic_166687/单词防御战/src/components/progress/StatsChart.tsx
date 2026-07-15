import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

export const StatsChart = () => {
  const { progress } = useProgressStore();

  const getMasteryLevel = (wordId: string) => {
    return progress.wordMastery[wordId] || 0;
  };

  const masteryCounts = [0, 0, 0, 0, 0, 0];
  Object.values(progress.wordMastery).forEach((mastery) => {
    if (mastery >= 0 && mastery <= 5) {
      masteryCounts[mastery]++;
    }
  });

  const maxCount = Math.max(...masteryCounts, 1);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        📊 学习进度统计
      </h3>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 text-center">
            <div className="text-4xl">⏱️</div>
            <div className="text-sm text-gray-500">游戏时长</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-game-blue">
              {progress.playTimeMinutes} 分钟
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <motion.div
                className="bg-gradient-to-r from-game-blue to-game-purple h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((progress.playTimeMinutes / 60) * 100, 100)}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 text-center">
            <div className="text-4xl">🎯</div>
            <div className="text-sm text-gray-500">准确率</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-game-green">
              {progress.accuracyRate.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <motion.div
                className="bg-gradient-to-r from-game-green to-emerald-400 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.accuracyRate}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-gray-700 mb-4">单词掌握程度</h4>
          <div className="flex items-end justify-between h-32 gap-2">
            {masteryCounts.map((count, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(count / maxCount) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-1 rounded-t-lg flex flex-col items-center justify-end p-2"
                style={{
                  backgroundColor: index === 0 ? '#FEE2E2' :
                    index === 1 ? '#FDE68A' :
                    index === 2 ? '#BBF7D0' :
                    index === 3 ? '#93C5FD' :
                    index === 4 ? '#D8B4FE' : '#F9A8D4',
                }}
              >
                <span className="text-sm font-bold text-gray-700">{count}</span>
                <span className="text-xs text-gray-500">
                  {index === 0 ? '未学习' : `掌握${index}星`}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
