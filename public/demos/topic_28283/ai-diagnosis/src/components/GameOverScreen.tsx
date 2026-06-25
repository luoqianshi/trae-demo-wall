import { useGameStore } from '@/store/gameStore';
import { GAME_STATE } from '@/engine/Constants';

interface GameOverScreenProps {
  onRestart: () => void;
  onMenu: () => void;
  onNextLevel?: () => void;
}

export default function GameOverScreen({ onRestart, onMenu, onNextLevel }: GameOverScreenProps) {
  const { gameState, score, coins, lives, level } = useGameStore();
  const isWin = gameState === GAME_STATE.WIN;
  const isLevelComplete = gameState === GAME_STATE.LEVEL_COMPLETE;
  const isGameOver = gameState === GAME_STATE.GAME_OVER;

  const title = isWin ? 'CONGRATULATIONS!' : isLevelComplete ? 'LEVEL CLEAR!' : 'GAME OVER';
  const titleColor = isWin ? '#FCA044' : isLevelComplete ? '#00A800' : '#E52521';

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20"
         style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="text-center p-8 border-4 rounded-lg"
           style={{
             borderColor: titleColor,
             backgroundColor: '#1a1a2e',
             minWidth: '400px',
           }}>
        <h2 className="text-3xl font-bold mb-6"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: titleColor,
              textShadow: `3px 3px 0 #000`,
            }}>
          {title}
        </h2>

        <div className="mb-6 space-y-3"
             style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: '#FFFFFF' }}>
          <div className="flex justify-between">
            <span className="opacity-70">SCORE</span>
            <span>{String(score).padStart(6, '0')}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">COINS</span>
            <span style={{ color: '#FCA044' }}>x{coins}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">WORLD</span>
            <span>{level}</span>
          </div>
          {!isGameOver && (
            <div className="flex justify-between">
              <span className="opacity-70">LIVES</span>
              <span>x{lives}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {isLevelComplete && onNextLevel && (
            <button
              onClick={onNextLevel}
              className="px-6 py-2 text-sm font-bold tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                color: '#FFFFFF',
                backgroundColor: '#00A800',
                border: '3px solid #008000',
                borderBottom: '4px solid #004400',
              }}>
              NEXT LEVEL
            </button>
          )}
          <button
            onClick={onRestart}
            className="px-6 py-2 text-sm font-bold tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#FFFFFF',
              backgroundColor: '#E52521',
              border: '3px solid #AC7C00',
              borderBottom: '4px solid #000',
            }}>
            {isGameOver ? 'TRY AGAIN' : 'REPLAY'}
          </button>
          <button
            onClick={onMenu}
            className="px-6 py-2 text-sm font-bold tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#FFFFFF',
              backgroundColor: '#5C94FC',
              border: '3px solid #3C74DC',
              borderBottom: '4px solid #1C54BC',
            }}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
