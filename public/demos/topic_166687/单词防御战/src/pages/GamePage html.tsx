import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GameHUD } from '@/components/game/GameHUD';
import { SpellingInput } from '@/components/game/SpellingInput';
import { BattleField } from '@/components/game/BattleField';
import { HeroCard } from '@/components/game/HeroCard';
import { useGameStore } from '@/store/gameStore';
import { useProgressStore } from '@/store/progressStore';
import { heroes, getHeroById } from '@/data/heroes';

export const GamePage = () => {
  const navigate = useNavigate();
  const { gameState, startGame, selectHero, spawnEnemy, updateEnemies, damageEnemy, nextWave, isTestMode, toggleTestMode, initTestGame, addTestScore, spawnTestEnemy, placeTestHero, skipWave } = useGameStore();
  const gameStore = useGameStore;
  const { updateScore, updateLevel, incrementWordsLearned, addPlayTime } = useProgressStore();
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [enemiesSpawned, setEnemiesSpawned] = useState(0);
  const [totalEnemies, setTotalEnemies] = useState(5);
  const attackCooldowns = useRef<Record<string, number>>({});
  const lastSpawnTime = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    startGame();
    setTotalEnemies(5 + gameState.wave * 2);
  }, []);

  useEffect(() => {
    setTotalEnemies(5 + gameState.wave * 2);
    setEnemiesSpawned(0);
    lastSpawnTime.current = 0;
  }, [gameState.wave]);

  useEffect(() => {
    if (gameState.isGameOver) {
      updateScore(gameState.score);
      updateLevel(gameState.wave);
      addPlayTime(1);
      
      if (gameState.isVictory) {
        setTimeout(() => {
          navigate('/progress');
        }, 3000);
      }
    }
  }, [gameState.isGameOver]);

  useEffect(() => {
    if (gameState.enemies.length === 0 && enemiesSpawned >= totalEnemies && !gameState.isGameOver) {
      setTimeout(() => {
        nextWave();
      }, 2000);
    }
  }, [gameState.enemies.length, enemiesSpawned, totalEnemies, gameState.isGameOver, nextWave]);

  const gameLoop = useCallback((timestamp: number) => {
    if (lastTime === null) {
      setLastTime(timestamp);
    } else {
      const deltaTime = (timestamp - lastTime) / 1000;
      setLastTime(timestamp);
      
      updateEnemies(deltaTime);

      const currentState = gameStore.getState().gameState;
      currentState.heroPositions.forEach((placement) => {
        const hero = getHeroById(placement.heroId);
        if (!hero) return;
        
        const now = timestamp / 1000;
        
        currentState.enemies.forEach((enemy) => {
          const distance = Math.abs(enemy.x - placement.x);
          if (distance < hero.range) {
            const cooldownKey = `${placement.id}-${enemy.id}`;
            const cooldown = attackCooldowns.current[cooldownKey] || 0;
            if (now >= cooldown) {
              damageEnemy(enemy.id, hero.damage, enemy.x, enemy.y, hero.color);
              attackCooldowns.current[cooldownKey] = now + 1;
            }
          }
        });
      });

      const spawnInterval = Math.max(500, 2000 - gameState.wave * 100);
      if (enemiesSpawned < totalEnemies && timestamp - lastSpawnTime.current > spawnInterval) {
        const types: Array<'normal' | 'fast' | 'tank' | 'boss'> = ['normal'];
        if (currentState.wave >= 3) types.push('fast');
        if (currentState.wave >= 5) types.push('tank');
        if (currentState.wave >= 10) types.push('boss');
        
        const type = types[Math.floor(Math.random() * types.length)];
        spawnEnemy(type);
        setEnemiesSpawned((prev) => prev + 1);
        lastSpawnTime.current = timestamp;
      }
    }

    if (!gameStore.getState().gameState.isGameOver) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
  }, [lastTime, updateEnemies, damageEnemy, spawnEnemy, enemiesSpawned, totalEnemies, gameState.wave]);

  useEffect(() => {
    if (!gameState.isGameOver) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop, gameState.isGameOver]);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="mb-4 bg-white/80 text-gray-700 px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
        >
          <span>←</span>
          <span>返回首页</span>
        </motion.button>

        <GameHUD />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 order-2 lg:order-1">
            <BattleField />
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <SpellingInput />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🦸 选择英雄放置
              </h3>
              
              {gameState.selectedHero && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-game-yellow/20 rounded-lg text-game-yellow font-medium text-center"
                >
                  ✨ 点击战场上的格子放置英雄
                </motion.div>
              )}

              <div className="space-y-3">
                {heroes.map((hero) => (
                  <HeroCard
                    key={hero.id}
                    hero={hero}
                    isSelected={gameState.selectedHero === hero.id}
                    onClick={() => selectHero(gameState.selectedHero === hero.id ? null : hero.id)}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border-2 border-yellow-500/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                  🛠️ 测试模式
                </h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${isTestMode ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {isTestMode ? '已启用' : '已禁用'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleTestMode}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                      isTestMode
                        ? 'bg-red-600/80 text-white hover:bg-red-600'
                        : 'bg-blue-600/80 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isTestMode ? '关闭测试模式' : '开启测试模式'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={initTestGame}
                    className="py-2 px-3 rounded-lg font-medium text-sm bg-yellow-600/80 text-white hover:bg-yellow-600 transition-all"
                  >
                    初始化测试数据
                  </motion.button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-400 mb-2">快速生成敌人（测试攻击动画）</div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => spawnTestEnemy('normal', 1, 1)}
                      className="py-2 px-3 rounded-lg font-medium text-sm bg-gray-700 text-gray-200 hover:bg-gray-600 transition-all"
                    >
                      👾 普通敌人
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => spawnTestEnemy('fast', 1, 2)}
                      className="py-2 px-3 rounded-lg font-medium text-sm bg-gray-700 text-gray-200 hover:bg-gray-600 transition-all"
                    >
                      👻 快速敌人
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => spawnTestEnemy('tank', 1, 3)}
                      className="py-2 px-3 rounded-lg font-medium text-sm bg-gray-700 text-gray-200 hover:bg-gray-600 transition-all"
                    >
                      🧟 坦克敌人
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => spawnTestEnemy('boss', 0, 2)}
                      className="py-2 px-3 rounded-lg font-medium text-sm bg-red-700/80 text-white hover:bg-red-700 transition-all"
                    >
                      👹 Boss
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-400 mb-2">快速放置英雄</div>
                  <div className="grid grid-cols-3 gap-2">
                    {heroes.slice(0, 6).map((hero) => (
                      <motion.button
                        key={hero.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const x = Math.floor(Math.random() * 3) + 1;
                          const y = Math.floor(Math.random() * 5);
                          placeTestHero(hero.id, x, y);
                        }}
                        className="py-2 px-2 rounded-lg font-medium text-xs bg-gray-700 text-gray-200 hover:bg-gray-600 transition-all flex items-center justify-center gap-1"
                      >
                        <span>{hero.emoji}</span>
                        <span>{hero.name.slice(0, 2)}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addTestScore(50)}
                    className="py-2 px-3 rounded-lg font-medium text-sm bg-green-600/80 text-white hover:bg-green-600 transition-all"
                  >
                    💰 +50金币
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={skipWave}
                    className="py-2 px-3 rounded-lg font-medium text-sm bg-purple-600/80 text-white hover:bg-purple-600 transition-all"
                  >
                    ⏭️ 跳过波次
                  </motion.button>
                </div>

                <div className="text-xs text-gray-500 text-center mt-2">
                  提示：点击"初始化测试数据"可快速进入测试状态，已有3个英雄和100金币
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {gameState.isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl"
              >
                <div className="text-6xl mb-4">
                  {gameState.isVictory ? '🎉' : '💔'}
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  {gameState.isVictory ? '胜利！' : '游戏结束'}
                </h2>
                <p className="text-xl text-gray-600 mb-2">
                  波次: {gameState.wave}
                </p>
                <p className="text-xl text-gray-600 mb-6">
                  得分: {gameState.score}
                </p>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigate('/');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold"
                  >
                    返回首页
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      startGame();
                      setEnemiesSpawned(0);
                      setTotalEnemies(5);
                    }}
                    className="flex-1 bg-gradient-to-r from-game-blue to-game-purple text-white py-3 rounded-xl font-bold"
                  >
                    再来一局
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
