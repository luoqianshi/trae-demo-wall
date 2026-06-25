import { useEffect, useState } from 'react';
import { X, PartyPopper, Sparkles, Trophy, Share2 } from 'lucide-react';
import type { Task } from '../data/tasks';

interface CelebrationModalProps {
  task: Task;
  onClose: () => void;
  onShare?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  emoji?: string;
}

export function CelebrationModal({ task, onClose, onShare }: CelebrationModalProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Generate particles
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const emojis = ['✨', '🌟', '💫', '⭐', '❤️', '🎉', '🎊', '💖', '🌈', '🔥'];

    const newParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      newParticles.push({
        id: i,
        x: 50 + Math.random() * 20 - 10,
        y: 50,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        emoji: Math.random() > 0.5 ? emojis[Math.floor(Math.random() * emojis.length)] : undefined,
      });
    }
    setParticles(newParticles);

    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.x + p.vx * 0.5,
          y: p.y + p.vy * 0.5,
          vy: p.vy + 0.8,
        })).filter(p => p.y < 120)
      );
    }, 50);

    // Show content after animation
    setTimeout(() => setShowContent(true), 300);

    return () => clearInterval(interval);
  }, []);

  const categoryMessages: Record<string, string> = {
    '环保': '你为地球种下了一颗绿色的种子 🌍',
    '捐赠': '你的善意正在温暖另一个人 💝',
    '帮扶': '你点亮了某个人的今天 ✨',
    '传播': '你让公益被更多人看见 📢',
  };

  const message = categoryMessages[task.category] || '你做了一件了不起的事！';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute transition-all"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: p.emoji ? `${p.size + 8}px` : `${p.size}px`,
              color: p.color,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {p.emoji || '●'}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className={`bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transition-all duration-500 ${
        showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-6 pt-8 pb-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-6xl mb-4 animate-bounce">{task.icon}</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <PartyPopper className="w-6 h-6" />
            <h2 className="text-xl font-bold">打卡成功！</h2>
            <PartyPopper className="w-6 h-6" />
          </div>
          <p className="text-white/90 text-sm">{task.name}</p>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 mb-5 border border-indigo-100">
            <Sparkles className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
            <p className="text-sm text-indigo-700 leading-relaxed">{message}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="text-xl font-bold text-emerald-600">{task.duration}</div>
              <div className="text-xs text-emerald-500">分钟</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="text-xl font-bold text-amber-600">+{task.reward}</div>
              <div className="text-xs text-amber-500">积分</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
              <div className="text-xl font-bold text-rose-600">❤️</div>
              <div className="text-xs text-rose-500">爱心值</div>
            </div>
          </div>

          {/* Achievement hint */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 mb-5 border border-slate-100">
            <Trophy className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-slate-600">
              继续打卡解锁更多成就徽章！
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              太棒了！
            </button>
            {onShare && (
              <button
                onClick={onShare}
                className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm flex items-center gap-1.5 hover:opacity-95 transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce { animation: bounce 0.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}