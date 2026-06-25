import { useGameStore } from '@/store/gameStore';

export default function GameHUD() {
  const { score, coins, lives, time, level } = useGameStore();

  const hudStyle: React.CSSProperties = {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '12px',
    color: '#FFFFFF',
    textShadow: '2px 2px 0 #000',
  };

  return (
    <div className="flex justify-between items-start px-4 py-2 w-full"
         style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
      <div className="flex gap-8">
        <div style={hudStyle}>
          <div className="text-xs opacity-70">MARIO</div>
          <div>{String(score).padStart(6, '0')}</div>
        </div>
        <div style={hudStyle}>
          <div className="text-xs opacity-70 flex items-center gap-1">
            <span style={{ color: '#FCA044' }}>●</span> x{String(coins).padStart(2, '0')}
          </div>
        </div>
      </div>
      <div className="flex gap-8">
        <div style={hudStyle}>
          <div className="text-xs opacity-70">WORLD</div>
          <div>{level}</div>
        </div>
        <div style={hudStyle}>
          <div className="text-xs opacity-70">TIME</div>
          <div>{time}</div>
        </div>
        <div style={hudStyle}>
          <div className="text-xs opacity-70">LIVES</div>
          <div>x{lives}</div>
        </div>
      </div>
    </div>
  );
}
