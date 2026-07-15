import { motion } from 'framer-motion';
import { Hero } from '@/types';
import { useGameStore } from '@/store/gameStore';

interface HeroCardProps {
  hero: Hero;
  isSelected: boolean;
  onClick: () => void;
}

const elementIcons: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  earth: '🌍',
  wind: '💨',
  light: '✨',
  dark: '🌑',
};

export const HeroCard = ({ hero, isSelected, onClick }: HeroCardProps) => {
  const { gameState } = useGameStore();
  const canAfford = gameState.score >= hero.cost * 10;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative rounded-xl p-4 cursor-pointer transition-all duration-300 overflow-hidden ${
        isSelected
          ? 'ring-4 ring-game-yellow shadow-xl scale-105'
          : canAfford
          ? 'shadow-md hover:shadow-lg'
          : 'opacity-50 cursor-not-allowed'
      }`}
      style={{ backgroundColor: `${hero.color}15`, border: `2px solid ${hero.color}` }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ backgroundColor: hero.color }}>
        <div className="absolute -top-2 -right-2 text-6xl">{hero.emoji}</div>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <motion.div
          animate={{ bounce: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl"
        >
          {hero.emoji}
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-bold text-gray-800">{hero.name}</div>
            <span className="text-xs" title={hero.element}>
              {elementIcons[hero.element]}
            </span>
          </div>
          <div className="text-sm text-gray-600 font-medium">{hero.skill}</div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
            {hero.description}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold flex items-center gap-1" style={{ color: hero.color }}>
            <span>💰</span>
            <span>{hero.cost * 10}</span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-red-500">⚔️</span>
              <span className="text-gray-600">{hero.damage}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-blue-500">📡</span>
              <span className="text-gray-600">{hero.range}</span>
            </div>
          </div>
        </div>
      </div>

      {!canAfford && (
        <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold bg-red-500 px-4 py-1.5 rounded-full text-sm shadow-lg">
            金币不足
          </span>
        </div>
      )}
    </motion.div>
  );
};
