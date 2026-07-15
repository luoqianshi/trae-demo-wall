import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '@/components/GameCanvas';
import { HUD } from '@/components/HUD';
import { useGameStore } from '@/store/useGameStore';

export const GamePage = () => {
  const navigate = useNavigate();
  const status = useGameStore((s) => s.status);
  const resetGame = useGameStore((s) => s.resetGame);
  const startGame = useGameStore((s) => s.startGame);

  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      const t = setTimeout(() => navigate('/result'), 900);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  const handleHome = () => {
    resetGame();
    navigate('/');
  };

  const handleRestart = () => {
    startGame();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050816]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,15,80,0.4),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,245,255,0.08),transparent_50%)]" />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-6 md:py-10">
        <div className="w-full max-w-[860px]">
          <HUD onHome={handleHome} />
          <GameCanvas />
          <div className="mt-4 flex items-center justify-between text-[11px] text-white/35 font-mono px-2 flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span>← → 移动</span>
              <span>SPACE / 点击 发射</span>
              <span>ESC 暂停</span>
            </div>
            <button
              onClick={handleRestart}
              className="text-white/50 hover:text-[#00f5ff] underline underline-offset-2 transition-colors"
            >
              重置本局
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
