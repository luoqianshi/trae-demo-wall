import { useEffect, useRef, useState } from 'react';
import { Play, Info, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import type { Star } from '@/types/game';

interface MenuScreenProps {
  onStart: () => void;
}

export const MenuScreen = ({ onStart }: MenuScreenProps) => {
  const highScore = useGameStore((s) => s.highScore);
  const [showHelp, setShowHelp] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);

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

    starsRef.current = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.5, Math.max(w, h) * 0.7);
      grad.addColorStop(0, 'rgba(40, 15, 80, 0.5)');
      grad.addColorStop(0.5, 'rgba(5, 8, 22, 0.3)');
      grad.addColorStop(1, 'rgba(5, 8, 22, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const s of starsRef.current) {
        s.y += s.speed;
        s.twinklePhase += s.twinkleSpeed;
        if (s.y > h) {
          s.y = 0;
          s.x = Math.random() * w;
        }
        const a = s.opacity * (0.5 + 0.5 * Math.sin(s.twinklePhase));
        ctx.fillStyle = `rgba(180, 220, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const t = performance.now() * 0.001;
      for (let i = 0; i < 3; i++) {
        const px = w * (0.2 + i * 0.3) + Math.sin(t + i) * 40;
        const py = h * (0.25 + i * 0.15) + Math.cos(t * 0.8 + i) * 30;
        const colors = ['rgba(0, 245, 255, 0.12)', 'rgba(255, 0, 229, 0.1)', 'rgba(255, 204, 0, 0.1)'];
        const g = ctx.createRadialGradient(px, py, 0, px, py, 260);
        g.addColorStop(0, colors[i]);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 glass-panel px-4 py-1.5 rounded-full mb-6 text-xs tracking-widest uppercase text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse shadow-[0_0_8px_#00f5ff]" />
              Retro Arcade 2026
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-none mb-4">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] via-[#ffffff] to-[#ff00e5] drop-shadow-[0_0_40px_rgba(0,245,255,0.3)] animate-[titleGlow_3s_ease-in-out_infinite]">
                STAR
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#ff00e5] via-[#ffcc00] to-[#00f5ff] drop-shadow-[0_0_40px_rgba(255,0,229,0.25)]">
                BREAKOUT
              </span>
            </h1>
            <p className="text-white/60 text-sm md:text-base mt-4 font-mono">
              击碎星际砖块 · 挑战极限分数 · 征服三大关卡
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 md:p-8 mb-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffcc00] to-[#ff8c00] flex items-center justify-center shadow-[0_0_24px_rgba(255,204,0,0.4)]">
                  <Trophy className="w-6 h-6 text-[#0a0e27]" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">历史最高分</div>
                  <div className="font-display text-2xl text-[#ffcc00] tabular-nums">{highScore.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-full bg-[#ff4d6d] shadow-[0_0_10px_#ff4d6d]" />
                <span className="w-3 h-3 rounded-full bg-[#ffcc00] shadow-[0_0_10px_#ffcc00]" />
                <span className="w-3 h-3 rounded-full bg-[#00f5ff] shadow-[0_0_10px_#00f5ff]" />
              </div>
            </div>

            <button
              onClick={onStart}
              className="group relative w-full py-5 rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] via-[#a855f7] to-[#ff00e5] animate-[bgShift_4s_linear_infinite] bg-[length:200%_100%]" />
              <div className="absolute inset-[2px] rounded-[10px] bg-[#0a0e27]" />
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Play className="w-6 h-6 text-white group-hover:text-[#00f5ff] fill-current transition-colors" strokeWidth={0} />
                <span className="font-display text-xl tracking-widest text-white group-hover:text-[#00f5ff] transition-colors">
                  开始游戏
                </span>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
                style={{ boxShadow: '0 0 40px rgba(0, 245, 255, 0.5), 0 0 80px rgba(255, 0, 229, 0.3)' }}
              />
            </button>

            <button
              onClick={() => setShowHelp((v) => !v)}
              className="mt-4 w-full flex items-center justify-between glass-panel px-5 py-3 rounded-xl hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-white/70 group-hover:text-[#00f5ff] transition-colors" />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">操作说明</span>
              </div>
              {showHelp ? (
                <ChevronUp className="w-5 h-5 text-white/50" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/50" />
              )}
            </button>

            {showHelp && (
              <div className="mt-4 p-5 rounded-xl bg-white/[0.04] border border-white/10 space-y-3 animate-[fadeIn_0.3s_ease]">
                <HelpRow title="移动挡板" desc="← → 方向键 / A D 键 / 鼠标移动 / 触摸拖动" icon="🎮" />
                <HelpRow title="发射小球" desc="空格键 / 鼠标点击 / 触摸屏幕" icon="🚀" />
                <HelpRow title="暂停 / 继续" desc="ESC 键 / P 键 / 暂停按钮" icon="⏸️" />
                <HelpRow title="积分规则" desc="青色砖 10 分 · 金色砖 25 分 · 品红硬砖 50 分" icon="⭐" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <LevelCard title="星域初探" tag="LV.1" color="from-cyan-400 to-sky-600" desc="入门关卡" />
            <LevelCard title="星云堡垒" tag="LV.2" color="from-amber-400 to-orange-600" desc="含金砖" />
            <LevelCard title="终极黑洞" tag="LV.3" color="from-fuchsia-400 to-purple-600" desc="最终挑战" />
          </div>

          <p className="text-center text-white/30 text-xs font-mono mt-8 tracking-widest">
            crafted with ♥ · canvas + react + typescript
          </p>
        </div>
      </div>
    </div>
  );
};

const HelpRow = ({ title, desc, icon }: { title: string; desc: string; icon: string }) => (
  <div className="flex items-start gap-3">
    <span className="text-xl leading-none pt-0.5">{icon}</span>
    <div className="flex-1">
      <div className="text-sm text-white font-medium">{title}</div>
      <div className="text-xs text-white/55 font-mono mt-0.5">{desc}</div>
    </div>
  </div>
);

const LevelCard = ({ title, tag, color, desc }: { title: string; tag: string; color: string; desc: string }) => (
  <div className="relative glass-panel rounded-xl p-3 overflow-hidden group hover:scale-105 transition-transform">
    <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-30 blur-xl group-hover:opacity-50 transition-opacity`} />
    <div className="relative">
      <div className="text-[10px] font-bold tracking-widest text-white/40">{tag}</div>
      <div className="font-display text-sm text-white mt-1">{title}</div>
      <div className="text-[10px] text-white/40 font-mono mt-0.5">{desc}</div>
    </div>
  </div>
);
