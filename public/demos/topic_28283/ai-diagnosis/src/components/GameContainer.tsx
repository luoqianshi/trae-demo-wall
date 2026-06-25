import { useRef, useEffect, useCallback, useState } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { GAME_STATE } from '@/engine/Constants';
import { useGameStore } from '@/store/gameStore';
import GameHUD from './GameHUD';
import GameOverScreen from './GameOverScreen';
import MainMenu from './MainMenu';
import MobileControls from './MobileControls';

export default function GameContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const { gameState, setGameState, setHUD } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const gameEngine = new GameEngine(canvasRef.current);
    engineRef.current = gameEngine;
    setEngine(gameEngine);

    gameEngine.onStateChange = (state) => {
      setGameState(state);
    };

    gameEngine.onScoreChange = (score, coins, lives, time, level) => {
      setHUD(score, coins, lives, time, level);
    };

    return () => {
      gameEngine.destroy();
    };
  }, [setGameState, setHUD]);

  const handleStart = useCallback(() => {
    engineRef.current?.startGame();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.respawn();
  }, []);

  const handleMenu = useCallback(() => {
    engineRef.current?.destroy();
    if (canvasRef.current) {
      const newEngine = new GameEngine(canvasRef.current);
      engineRef.current = newEngine;
      setEngine(newEngine);
      newEngine.onStateChange = (state) => setGameState(state);
      newEngine.onScoreChange = (score, coins, lives, time, level) => setHUD(score, coins, lives, time, level);
    }
    setGameState(GAME_STATE.MENU);
  }, [setGameState, setHUD]);

  const handleNextLevel = useCallback(() => {
    engineRef.current?.nextLevel();
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
         style={{ backgroundColor: '#000' }}>
      {/* 游戏区域 */}
      <div className="relative" style={{ maxWidth: '800px', width: '100%' }}>
        {/* HUD */}
        {gameState !== GAME_STATE.MENU && <GameHUD />}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="block w-full"
          style={{
            imageRendering: 'pixelated',
            border: '3px solid #333',
          }}
        />

        {/* 主菜单 */}
        {gameState === GAME_STATE.MENU && (
          <MainMenu onStart={handleStart} />
        )}

        {/* 结算界面 */}
        {(gameState === GAME_STATE.GAME_OVER || gameState === GAME_STATE.LEVEL_COMPLETE || gameState === GAME_STATE.WIN) && (
          <GameOverScreen
            onRestart={handleRestart}
            onMenu={handleMenu}
            onNextLevel={gameState === GAME_STATE.LEVEL_COMPLETE ? handleNextLevel : undefined}
          />
        )}

        {/* 移动端控制 */}
        {gameState === GAME_STATE.PLAYING && (
          <MobileControls engine={engine} />
        )}
      </div>
    </div>
  );
}
