import { useEffect, useRef } from 'react';
import { Trophy, RotateCcw, Home, Star, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import type { Particle } from '@/types/game';

interface ResultScreenProps {
  onRestart: () => void;
  onHome: () => void;
}

export const ResultScreen = ({ onRestart, onHome }: ResultScreenProps) => {
  const won = useGameStore((s) => s.status === 'won');
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const isNewRecord = score > 0 && score >= highScore;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = (count: number) => {
      for (let i = 0; i < count; i++) {
        const colors = won
          ? ['#00f5ff', '#ffcc00', '#ff00e5', '#7cff6b', '#a855f7']
          : ['#ff4d6d', '#ff7a59', '#8b5cf6', '#60a5fa'];
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * 50,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(1 + Math.random() * 3),
          life: 1,
          maxLife: 100 + Math.random() * 80,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 3,
        });
      }
    };

    let spawnTimer = 0;
    const tick = () => {
      ctx.fillStyle = 'rgba(5, 8, 22, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      spawnTimer++;
      if (spawnTimer > (won ? 3 : 8)) {
        spawn(won ? 4 : 1);
        spawnTimer = 0;
      }

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.life -= 1 / p.maxLife;
        if (p.life > 0) {
          alive.push(p);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
      particlesRef.current = alive;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [won]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050816]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="glass-panel rounded-3xl p-8 md:p-10 backdrop-blur-xl text-center relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${won ? 'from-[#00f5ff] via-[#ffcc00] to-[#ff00e5]' : 'from-[#ff4d6d] via-[#8b5cf6] to-[#60a5fa]'} animate-[bgShift_3s_linear_infinite] bg-[length:200%_100%]`} />

            <div className="mb-6 relative">
              {won ? (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-[#ffcc00] via-[#ff8c00] to-[#ff00e5] shadow-[0_0_60px_rgba(255,204,0,0.5)] animate-[bounce_2s_ease-in-out_infinite]">
                  <Trophy className="w-12 h-12 text-[#0a0e27]" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-[#ff4d6d] via-[#8b5cf6] to-[#60a5fa] shadow-[0_0_50px_rgba(255,77,109,0.4)]">
                  <Star className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
              )}
            </div>

            {isNewRecord && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ffcc00]/20 to-[#ff00e5]/20 border border-[#ffcc00]/40 mb-4 animate-[fadeIn_0.6s_ease]">
                <Sparkles className="w-4 h-4 text-[#ffcc00]" />
                <span className="text-xs font-bold tracking-widest text-[#ffcc00] uppercase">New Record!</span>
              </div>
            )}

            <h2 className="font-display text-4xl md:text-5xl font-black mb-3">
              <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${won ? 'from-[#00f5ff] via-[#ffffff] to-[#ffcc00]' : 'from-[#ff4d6d] via-[#a855f7] to-[#60a5fa]'}`}>
                {won ? '胜利通关！' : '挑战失败'}
              </span>
            </h2>
            <p className="text-white/55 text-sm font-mono mb-8">
              {won ? '恭喜你征服了全部三大星际关卡' : '再接再厉，宇宙等着你重新征服'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass-panel rounded-xl p-4 bg-white/[0.04]">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">本局得分</div>
                <div className="font-display text-3xl text-white tabular-nums">{score.toLocaleString()}</div>
              </div>
              <div className="glass-panel rounded-xl p-4 bg-white/[0.04]">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">历史最高</div>
                <div className={`font-display text-3xl tabular-nums ${isNewRecord ? 'text-[#ffcc00]' : 'text-[#00f5ff]'}`}>
                  {highScore.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onRestart}
                className="group flex-1 py-4 rounded-xl relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] to-[#ff00e5] animate-[bgShift_4s_linear_infinite] bg-[length:200%_100%]" />
                <div className="absolute inset-[2px] rounded-[10px] bg-[#0a0e27]" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <RotateCcw className="w-5 h-5 text-white group-hover:text-[#00f5ff] transition-colors" />
                  <span className="font-display tracking-wider text-white group-hover:text-[#00f5ff] transition-colors">再来一局</span>
                </div>
              </button>
              <button
                onClick={onHome}
                className="sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-white/10 transition-all group flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5 text-white/80 group-hover:text-[#ff00e5] transition-colors" />
                <span className="font-display tracking-wider text-white/80 group-hover:text-[#ff00e5] transition-colors">主菜单</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
