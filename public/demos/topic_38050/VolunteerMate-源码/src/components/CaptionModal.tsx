import { useState } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import type { Task } from '../data/tasks';
import { UserStats } from '../store/useStore';
import { generateCaption } from '../ai/captionGenerator';

export interface CaptionModalProps {
  task: Task | null;
  stats: UserStats;
  onClose: () => void;
  onConfirm: () => void;
}

export function CaptionModal({ task, stats, onClose, onConfirm }: CaptionModalProps) {
  const [variant, setVariant] = useState(0);
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  if (!task) return null;

  const caption = generateCaption(task, stats, variant);

  const copyText = (text: string, which: 'short' | 'full') => {
    navigator.clipboard?.writeText(text).then(() => {
      if (which === 'short') {
        setCopiedShort(true);
        setTimeout(() => setCopiedShort(false), 1500);
      } else {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 1500);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-slideUp shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide opacity-90">AI 公益感言</span>
          </div>
          <p className="text-lg font-semibold mb-1">🎉 恭喜完成「{task.name}」</p>
          <p className="text-sm text-white/80">
            让 AI 为你生成一段温暖分享，记录这次善行
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-xl font-bold text-slate-700">{task.duration}</div>
              <div className="text-xs text-slate-500">分钟</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <div className="text-xl font-bold text-emerald-600">+1</div>
              <div className="text-xs text-emerald-600">打卡</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <div className="text-xl font-bold text-amber-600">+{task.reward}</div>
              <div className="text-xs text-amber-600">积分</div>
            </div>
          </div>

          {/* Short caption */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">简短版 · 适合朋友圈</span>
              <button
                onClick={() => copyText(caption.short, 'short')}
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                {copiedShort ? (
                  <><Check className="w-3.5 h-3.5" />已复制</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" />复制</>
                )}
              </button>
            </div>
            <p className="text-slate-800 leading-relaxed">{caption.short}</p>
          </div>

          {/* Full caption */}
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-indigo-700">完整版 · {caption.vibe}</span>
              <button
                onClick={() => setVariant((v) => (v + 1) % 5)}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                换一种
              </button>
            </div>
            <p className="text-slate-800 leading-relaxed whitespace-pre-line text-sm">
              {caption.full}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {caption.hashtags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-white/70 text-indigo-600 rounded-full border border-indigo-100">
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => copyText(caption.full + '\n\n' + caption.hashtags.join(' '), 'full')}
              className="mt-3 w-full py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-sm font-medium flex items-center justify-center gap-1 hover:border-indigo-400 transition-all"
            >
              {copiedFull ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedFull ? '已复制完整文案' : '复制完整文案'}
            </button>
          </div>

          {/* Action */}
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-indigo-500/25"
          >
            <Sparkles className="w-5 h-5" />
            确认打卡并分享善意
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.15, 1.15, 0.5, 1); }
      `}</style>
    </div>
  );
}
