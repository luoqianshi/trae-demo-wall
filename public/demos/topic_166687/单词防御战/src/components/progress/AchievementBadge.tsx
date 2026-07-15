import { motion } from 'framer-motion';
import { Achievement } from '@/types';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export const AchievementBadge = ({ achievement }: AchievementBadgeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl p-4 transition-all duration-300 ${
        achievement.unlocked
          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400 shadow-lg'
          : 'bg-gray-100 border-2 border-gray-200 opacity-60'
      }`}
    >
      <div className="text-center">
        <motion.div
          className="text-5xl mb-3"
          animate={achievement.unlocked ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {achievement.icon}
        </motion.div>
        
        <div className={`font-bold text-lg mb-1 ${
          achievement.unlocked ? 'text-gray-800' : 'text-gray-400'
        }`}>
          {achievement.name}
        </div>
        
        <div className={`text-sm ${
          achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {achievement.description}
        </div>

        {achievement.unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2"
          >
            <span className="text-green-500">✓</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
