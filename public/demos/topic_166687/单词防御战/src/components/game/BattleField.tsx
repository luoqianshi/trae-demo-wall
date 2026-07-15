import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getHeroById } from '@/data/heroes';
import { HeroPlacement, Enemy } from '@/types';

const CELL_SIZE = 60;

const renderEnemy = (enemy: Enemy) => {
  const enemyEmojis = {
    normal: '👾',
    fast: '👻',
    tank: '🧟',
    boss: '👹',
  };

  const healthPercent = (enemy.health / enemy.maxHealth) * 100;
  const healthColor = healthPercent > 50 ? 'from-green-500 to-green-400' : healthPercent > 25 ? 'from-yellow-500 to-yellow-400' : 'from-red-500 to-red-400';

  return (
    <motion.div
      key={enemy.id}
      initial={{ opacity: 0, scale: 0.5, x: -CELL_SIZE }}
      animate={{ opacity: 1, scale: 1, x: enemy.x * CELL_SIZE }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute text-3xl"
      style={{
        left: enemy.x * CELL_SIZE,
        top: enemy.y * CELL_SIZE,
        zIndex: 10,
      }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      >
        {enemyEmojis[enemy.type]}
      </motion.div>
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${healthColor}`}
          animate={{ width: `${healthPercent}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
      {enemy.type === 'boss' && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-red-600 bg-yellow-100 px-2 py-0.5 rounded">
          BOSS
        </div>
      )}
    </motion.div>
  );
};

const renderHero = (placement: HeroPlacement) => {
  const hero = getHeroById(placement.heroId);
  if (!hero) return null;

  return (
    <>
      <motion.div
        key={`range-${placement.id}`}
        className="absolute rounded-lg opacity-20 pointer-events-none"
        style={{
          left: placement.x * CELL_SIZE - (hero.range - 1) * CELL_SIZE / 2,
          top: placement.y * CELL_SIZE - (hero.range - 1) * CELL_SIZE / 2,
          width: CELL_SIZE * hero.range,
          height: CELL_SIZE * hero.range,
          backgroundColor: hero.color,
          zIndex: 4,
        }}
      />
      <motion.div
        key={placement.id}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0, rotate: 180 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute flex items-center justify-center cursor-pointer"
        style={{
          left: placement.x * CELL_SIZE,
          top: placement.y * CELL_SIZE,
          width: CELL_SIZE - 8,
          height: CELL_SIZE - 8,
          zIndex: 5,
        }}
      >
        <motion.div
          animate={{ 
            boxShadow: [`0 0 0 0 ${hero.color}40`, `0 0 0 8px ${hero.color}00`] 
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-full h-full rounded-xl flex items-center justify-center text-2xl shadow-lg"
          style={{ backgroundColor: `${hero.color}30`, border: `2px solid ${hero.color}` }}
        >
          {hero.emoji}
        </motion.div>
      </motion.div>
    </>
  );
};

export const BattleField = () => {
  const { gameState, gridSize, addHero, selectedHero, damageNumbers } = useGameStore();

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (selectedHero) {
        addHero(selectedHero, x, y);
      }
    },
    [selectedHero, addHero]
  );

  return (
    <div className="relative bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-4 shadow-xl border-4 border-green-400">
      <div className="absolute top-2 left-2 text-sm font-bold text-green-700 bg-white/80 px-2 py-1 rounded">
        🏠 基地
      </div>
      
      <div className="absolute top-2 right-2 text-sm font-bold text-red-700 bg-white/80 px-2 py-1 rounded">
        敌人入口
      </div>

      <div
        className="relative"
        style={{ width: gridSize * CELL_SIZE, height: gridSize * CELL_SIZE }}
      >
        {Array.from({ length: gridSize }).map((_, y) =>
          Array.from({ length: gridSize }).map((_, x) => (
            <motion.div
              key={`${x}-${y}`}
              whileHover={selectedHero ? { scale: 1.02, brightness: 1.1 } : {}}
              whileTap={selectedHero ? { scale: 0.98 } : {}}
              onClick={() => handleCellClick(x, y)}
              className={`absolute border border-green-300/50 transition-colors ${
                x === gridSize - 1 ? 'bg-red-100/50' : 'bg-white/40'
              } ${
                selectedHero
                  ? 'cursor-pointer hover:bg-green-300/50'
                  : 'cursor-default'
              }`}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              {x === gridSize - 1 && y === Math.floor(gridSize / 2) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">🏠</span>
                </div>
              )}
            </motion.div>
          ))
        )}

        <AnimatePresence>
          {gameState.heroPositions.map(renderHero)}
        </AnimatePresence>

        <AnimatePresence>
          {gameState.enemies.map(renderEnemy)}
        </AnimatePresence>

        <AnimatePresence>
          {damageNumbers.map((damage) => (
            <motion.div
              key={damage.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -30, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute font-bold text-lg pointer-events-none"
              style={{
                left: damage.x * CELL_SIZE + CELL_SIZE / 2 - 10,
                top: damage.y * CELL_SIZE - 20,
                color: damage.color,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                zIndex: 20,
              }}
            >
              -{damage.damage}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <span className="text-sm text-gray-600">敌人移动路线:</span>
        <div className="flex items-center gap-1">
          <span>👾</span>
          <svg className="w-16 h-4" viewBox="0 0 64 16">
            <path
              d="M0 8 L56 8"
              stroke="#F97316"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
            <polygon points="60,8 52,4 52,12" fill="#F97316" />
          </svg>
          <span>🏠</span>
        </div>
      </div>
    </div>
  );
};
