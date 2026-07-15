import { Heart, Trophy, Zap, Pause, Play, Home } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { LEVELS } from '@/config/levels';

interface HUDProps {
  onHome: () => void;
}

export const HUD = ({ onHome }: HUDProps) => {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const lives = useGameStore((s) => s.lives);
  const level = useGameStore((s) => s.level);
  const status = useGameStore((s) => s.status);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);

  const levelName = LEVELS[Math.min(level - 1, LEVELS.length - 1)]?.name ?? '';
  const isPaused = status === 'paused';

  return (
    <div className="w-full max-w-[800px] mx-auto mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#ffcc00]" strokeWidth={2.5} />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-widest text-white/50">分数</span>
            <span className="font-display text-lg text-white tabular-nums">{score.toLocaleString()}</span>
          </div>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#00f5ff]" strokeWidth={2.5} />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-widest text-white/50">最高分</span>
            <span className="font-display text-lg text-[#00f5ff] tabular-nums">{highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#ff00e5] shadow-[0_0_8px_#ff00e5] animate-pulse" />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-widest text-white/50">第 {level} 关</span>
          <span className="font-display text-sm text-white">{levelName}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 transition-all ${
                i < lives
                  ? 'text-[#ff4d6d] fill-[#ff4d6d] drop-shadow-[0_0_6px_rgba(255,77,109,0.8)]'
                  : 'text-white/15'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => (isPaused ? resumeGame() : pauseGame())}
          className="glass-panel w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all group"
          title={isPaused ? '继续' : '暂停'}
        >
          {isPaused ? (
            <Play className="w-5 h-5 text-[#00f5ff] group-hover:scale-110 transition-transform" fill="currentColor" />
          ) : (
            <Pause className="w-5 h-5 text-white group-hover:text-[#ffcc00] group-hover:scale-110 transition-all" fill="currentColor" />
          )}
        </button>
        <button
          onClick={onHome}
          className="glass-panel w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all group"
          title="返回主菜单"
        >
          <Home className="w-5 h-5 text-white group-hover:text-[#ff00e5] group-hover:scale-110 transition-all" />
        </button>
      </div>
    </div>
  );
};
