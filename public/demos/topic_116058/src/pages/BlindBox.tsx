import { useState } from 'react';
import { Gift, Sparkles, X, Check } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import SoftButton from '@/components/common/SoftButton';
import { useBackpackStore, drawReward, DRAW_COST, RARITY_CONFIG } from '@/store/backpackStore';
import { useCorgiStore } from '@/store/corgiStore';
import { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import type { BlindBoxReward } from '@/types';
import { cn } from '@/lib/utils';

type DrawState = 'idle' | 'shaking' | 'opening' | 'result';

export default function BlindBox() {
  const { backpack, spendPoints, addReward } = useBackpackStore();
  const { corgi } = useCorgiStore();
  const petLabel = PET_LABEL[corgi.petType];
  const [drawState, setDrawState] = useState<DrawState>('idle');
  const [reward, setReward] = useState<BlindBoxReward | null>(null);

  const handleDraw = () => {
    if (backpack.points < DRAW_COST) return;
    if (!spendPoints(DRAW_COST)) return;

    setDrawState('shaking');
    setReward(null);

    setTimeout(() => {
      const result = drawReward();
      setReward(result);
      addReward(result);
      setDrawState('opening');
      setTimeout(() => {
        setDrawState('result');
      }, 600);
    }, 1500);
  };

  const handleClose = () => {
    setDrawState('idle');
    setReward(null);
  };

  return (
    <div className="min-h-screen warm-bg pb-24">
      <PageHeader
        title="盲盒抽奖"
        subtitle={`消耗积分，抽取${petLabel}奖励`}
        right={
          <div className="flex items-center gap-1.5 bg-corgi-yellow/20 px-3 py-2 rounded-xl">
            <Sparkles size={16} className="text-corgi-orange" />
            <span className="font-bold text-corgi-dark text-sm">{backpack.points}</span>
          </div>
        }
      />

      <div className="max-w-2xl mx-auto px-4 pt-8 flex flex-col items-center">
        {/* 积分提示 */}
        <div className="bg-warm-light rounded-full px-6 py-2 shadow-soft border-2 border-corgi-yellow/30 mb-8">
          <span className="text-text-secondary font-bold text-sm">
            每次抽奖消耗 <span className="text-corgi-orange text-lg">{DRAW_COST}</span> 积分
          </span>
        </div>

        {/* 盲盒展示 */}
        <div className="relative mb-8">
          {/* 光晕 */}
          <div className="absolute inset-0 bg-corgi-yellow/20 rounded-full blur-3xl" />

          {/* 盲盒本体 */}
          <div
            className={cn(
              'relative w-56 h-56 flex items-center justify-center transition-all',
              drawState === 'shaking' && 'animate-shake',
              drawState === 'opening' && 'animate-pop-in'
            )}
          >
            {drawState === 'result' && reward ? (
              <RewardDisplay reward={reward} />
            ) : (
              <BlindBoxSVG state={drawState} />
            )}
          </div>
        </div>

        {/* 抽奖按钮 */}
        {drawState === 'idle' || drawState === 'result' ? (
          <SoftButton
            variant="accent"
            size="lg"
            onClick={handleDraw}
            disabled={backpack.points < DRAW_COST}
            className="px-12"
          >
            <Gift size={22} />
            {backpack.points >= DRAW_COST ? '开始抽奖' : '积分不足'}
          </SoftButton>
        ) : (
          <p className="text-text-secondary font-bold animate-pulse">
            {drawState === 'shaking' ? '🎁 盲盒抖动中...' : '✨ 开箱中...'}
          </p>
        )}

        {/* 概率说明 */}
        <div className="mt-8 w-full bg-warm-light rounded-2xl p-4 shadow-soft border-2 border-corgi-yellow/20">
          <p className="font-bold text-text-primary mb-3 text-sm">🌟 奖品概率</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <ProbBar label="普通" percent="50%" rarity="common" />
            <ProbBar label="稀有" percent="30%" rarity="rare" />
            <ProbBar label="史诗" percent="15%" rarity="epic" />
            <ProbBar label="传说" percent="5%" rarity="legendary" />
          </div>
        </div>
      </div>

      {/* 结果弹窗 */}
      {drawState === 'result' && reward && (
        <ResultModal reward={reward} onClose={handleClose} />
      )}
    </div>
  );
}

function BlindBoxSVG({ state }: { state: DrawState }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" className="drop-shadow-lg">
      {/* 盒子底部 */}
      <rect x="40" y="80" width="120" height="90" rx="12" fill="#FF9F43" stroke="#C68642" strokeWidth="3" />
      {/* 盒子顶部装饰 */}
      <rect x="40" y="80" width="120" height="20" rx="12" fill="#FFD66B" stroke="#C68642" strokeWidth="3" />
      {/* 盒盖 */}
      <path d="M40 80 L60 50 L140 50 L160 80 Z" fill="#FFD66B" stroke="#C68642" strokeWidth="3" strokeLinejoin="round" />
      {/* 丝带 */}
      <rect x="93" y="50" width="14" height="120" fill="#FF6B8A" />
      <path d="M93 50 Q100 35 93 25 Q100 30 107 25 Q100 35 107 50 Z" fill="#FF6B8A" />
      {/* 蝴蝶结 */}
      <ellipse cx="85" cy="40" rx="12" ry="8" fill="#FF6B8A" />
      <ellipse cx="115" cy="40" rx="12" ry="8" fill="#FF6B8A" />
      <circle cx="100" cy="40" r="6" fill="#FF8FA3" />
      {/* 星星装饰 */}
      {state === 'shaking' && (
        <>
          <text x="30" y="70" fontSize="20" className="animate-sparkle">✨</text>
          <text x="160" y="70" fontSize="20" className="animate-sparkle">⭐</text>
          <text x="30" y="140" fontSize="16" className="animate-sparkle">💫</text>
          <text x="165" y="140" fontSize="16" className="animate-sparkle">✨</text>
        </>
      )}
      {/* 柯基图案 */}
      <circle cx="100" cy="125" r="15" fill="#FFFBF0" opacity="0.4" />
      <text x="92" y="132" fontSize="20">🐾</text>
    </svg>
  );
}

function RewardDisplay({ reward }: { reward: BlindBoxReward }) {
  const config = RARITY_CONFIG[reward.rarity];
  return (
    <div className="flex flex-col items-center animate-celebrate">
      <div
        className="w-32 h-32 rounded-3xl flex items-center justify-center text-6xl border-4 shadow-puffy"
        style={{
          backgroundColor: config.bg,
          borderColor: config.border,
        }}
      >
        {reward.emoji}
      </div>
    </div>
  );
}

function ResultModal({ reward, onClose }: { reward: BlindBoxReward; onClose: () => void }) {
  const config = RARITY_CONFIG[reward.rarity];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-pop-in">
      <div className="bg-warm-light rounded-puffy shadow-puffy p-8 max-w-sm mx-4 text-center border-4 border-corgi-yellow/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors"
        >
          <X size={18} />
        </button>

        <p className="font-display text-2xl text-text-primary mb-2">恭喜获得！</p>

        <div className="my-6">
          <div
            className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center text-6xl border-4 shadow-puffy animate-celebrate"
            style={{ backgroundColor: config.bg, borderColor: config.border }}
          >
            {reward.emoji}
          </div>
        </div>

        <p className="font-display text-xl text-text-primary mb-1">{reward.name}</p>
        <span
          className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {config.label}
        </span>
        <p className="text-sm text-text-secondary mb-6">{reward.description}</p>

        <SoftButton variant="primary" onClick={onClose} className="w-full">
          <Check size={18} />
          收下啦！
        </SoftButton>
      </div>
    </div>
  );
}

function ProbBar({ label, percent, rarity }: { label: string; percent: string; rarity: string }) {
  const config = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.border }} />
      <span className="text-text-secondary">{label}</span>
      <span className="ml-auto font-bold" style={{ color: config.color }}>{percent}</span>
    </div>
  );
}
