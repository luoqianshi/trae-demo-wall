import { useState } from 'react';
import { Smile, CreditCard, Award, Lock, Trophy, Sparkles, Cookie, Home } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useBackpackStore, RARITY_CONFIG, TITLE_UNLOCK_CONDITIONS } from '@/store/backpackStore';
import { useCorgiStore } from '@/store/corgiStore';
import { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import { cn } from '@/lib/utils';
import type { CollectionItem, RewardType } from '@/types';

type TabType = Exclude<RewardType, 'points' | 'title'> | 'title';

const tabConfig: Record<TabType, { icon: typeof Smile; label: string }> = {
  expression: { icon: Smile, label: '表情包' },
  card: { icon: CreditCard, label: '卡牌' },
  snack: { icon: Cookie, label: '零食' },
  decoration: { icon: Home, label: '装饰' },
  title: { icon: Award, label: '称号' },
};

export default function Backpack() {
  const { backpack } = useBackpackStore();
  const { corgi } = useCorgiStore();
  const petLabel = PET_LABEL[corgi.petType];
  const [activeTab, setActiveTab] = useState<TabType>('expression');

  const collection =
    activeTab === 'expression' ? backpack.expressions
    : activeTab === 'card' ? backpack.cards
    : activeTab === 'snack' ? backpack.snacks
    : activeTab === 'decoration' ? backpack.decorations
    : backpack.titles;
  const totalCount = collection.length;
  const unlockedCount = collection.filter((c) => c.unlocked && (activeTab === 'snack' ? c.count > 0 : true)).length;

  // 成就
  const achievements = [
    { name: '初次相遇', desc: '获得第一个表情', unlocked: true, icon: '🤝' },
    { name: '小有收藏', desc: '收集5个表情', unlocked: backpack.expressions.filter(e => e.unlocked).length >= 5, icon: '📦' },
    { name: '专注达人', desc: '完成10次番茄钟', unlocked: true, icon: '🎯' },
    { name: `${petLabel}挚友`, desc: `与${petLabel}互动100次`, unlocked: false, icon: '💕' },
    { name: '表情大师', desc: '集齐所有表情', unlocked: false, icon: '👑' },
    { name: '时光守护', desc: '获得传说称号', unlocked: false, icon: '⭐' },
  ];

  return (
    <div className="min-h-screen warm-bg pb-24">
      <PageHeader
        title="背包"
        subtitle="查看你的收藏与成就"
      />

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <StatBox icon="😊" label="表情" value={`${backpack.expressions.filter(e => e.unlocked).length}/${backpack.expressions.length}`} />
          <StatBox icon="🎴" label="卡牌" value={`${backpack.cards.filter(c => c.unlocked).length}/${backpack.cards.length}`} />
          <StatBox icon="🍪" label="零食" value={`${backpack.snacks.filter(s => s.count > 0).length}/${backpack.snacks.length}`} />
          <StatBox icon="🏡" label="装饰" value={`${backpack.decorations.filter(d => d.unlocked).length}/${backpack.decorations.length}`} />
          <StatBox icon="🏆" label="称号" value={`${backpack.titles.filter(t => t.unlocked).length}/${backpack.titles.length}`} />
        </div>

        {/* 标签页 */}
        <div className="flex gap-1 mb-4 bg-warm-light rounded-full p-1.5 shadow-soft">
          {(Object.keys(tabConfig) as TabType[]).map((tab) => {
            const config = tabConfig[tab];
            const Icon = config.icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'btn-press flex-1 flex items-center justify-center gap-1 py-2.5 rounded-full font-bold text-sm transition-all',
                  activeTab === tab
                    ? 'bg-corgi-orange text-white shadow-soft'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon size={16} />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* 进度 */}
        <div className="flex items-center gap-2 mb-4 px-2">
          <span className="text-sm text-text-secondary font-bold">收集进度</span>
          <div className="flex-1 h-3 bg-corgi-yellow/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-corgi-yellow to-corgi-orange rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-bold text-corgi-dark">{unlockedCount}/{totalCount}</span>
        </div>

        {/* 获取方式提示 */}
        {activeTab === 'title' && (
          <div className="bg-corgi-yellow/10 rounded-2xl p-3 mb-4 border-2 border-corgi-yellow/20 flex items-start gap-2">
            <Sparkles size={16} className="text-corgi-orange shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              称号通过完成 <span className="font-bold text-corgi-dark">番茄钟专注</span> 和 <span className="font-bold text-corgi-dark">日程任务</span> 获得，不能从盲盒抽取哦～
            </p>
          </div>
        )}
        {(activeTab === 'expression' || activeTab === 'card') && (
          <div className="bg-corgi-yellow/10 rounded-2xl p-3 mb-4 border-2 border-corgi-yellow/20 flex items-start gap-2">
            <Sparkles size={16} className="text-corgi-orange shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              {activeTab === 'expression' ? '表情包' : '卡牌'}可通过 <span className="font-bold text-corgi-dark">盲盒抽奖</span> 获得，完成专注可攒积分～
            </p>
          </div>
        )}
        {activeTab === 'snack' && (
          <div className="bg-corgi-yellow/10 rounded-2xl p-3 mb-4 border-2 border-corgi-yellow/20 flex items-start gap-2">
            <Sparkles size={16} className="text-corgi-orange shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              零食通过 <span className="font-bold text-corgi-dark">盲盒抽奖</span> 获得，可在「养成」页面喂食{petLabel}，代替积分使用～
            </p>
          </div>
        )}
        {activeTab === 'decoration' && (
          <div className="bg-corgi-yellow/10 rounded-2xl p-3 mb-4 border-2 border-corgi-yellow/20 flex items-start gap-2">
            <Sparkles size={16} className="text-corgi-orange shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              院子装饰通过 <span className="font-bold text-corgi-dark">盲盒抽奖</span> 获得，{petLabel}好感度达到 5 级解锁小院子后即可摆放～
            </p>
          </div>
        )}

        {/* 收集网格 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
          {collection.map((item: CollectionItem) => (
            <CollectionCard key={item.reward.id} item={item} showCount={activeTab === 'snack' || activeTab === 'decoration'} />
          ))}
        </div>

        {/* 成就 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">成就</h3>
            <span className="ml-auto text-xs text-text-secondary font-bold">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.name}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all',
                  ach.unlocked
                    ? 'bg-corgi-yellow/10 border-corgi-yellow/30'
                    : 'bg-gray-100/50 border-gray-200 opacity-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg',
                  ach.unlocked ? 'bg-corgi-yellow/30' : 'bg-gray-200'
                )}>
                  {ach.unlocked ? ach.icon : '🔒'}
                </div>
                <div className="min-w-0">
                  <p className={cn('text-xs font-bold truncate', ach.unlocked ? 'text-text-primary' : 'text-gray-400')}>
                    {ach.name}
                  </p>
                  <p className="text-xs text-text-light truncate">{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollectionCard({ item, showCount }: { item: CollectionItem; showCount?: boolean }) {
  const config = RARITY_CONFIG[item.reward.rarity];
  const isTitle = item.reward.type === 'title';
  const unlockCond = isTitle ? TITLE_UNLOCK_CONDITIONS[item.reward.id] : null;
  const isConsumable = showCount;
  const noStock = isConsumable && item.count <= 0;

  if (!item.unlocked || noStock) {
    return (
      <div className="aspect-square bg-gray-100/60 rounded-2xl border-2 border-gray-200/50 flex flex-col items-center justify-center p-2">
        {noStock ? (
          <>
            <span className="text-2xl mb-1 opacity-40">{item.reward.emoji}</span>
            <span className="text-xs text-gray-400 font-bold mb-0.5">已用完</span>
          </>
        ) : (
          <>
            <Lock size={24} className="text-gray-300 mb-1" />
            <span className="text-xs text-gray-400 font-bold mb-0.5">未获得</span>
          </>
        )}
        {isTitle && unlockCond && (
          <span className="text-[9px] text-text-light text-center leading-tight">
            {unlockCond.focusCount > 0 && `专注${unlockCond.focusCount}次`}
            {unlockCond.focusCount > 0 && unlockCond.scheduleCount > 0 && '+'}
            {unlockCond.scheduleCount > 0 && `日程${unlockCond.scheduleCount}条`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all hover:scale-105 cursor-pointer animate-pop-in"
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
    >
      <span className="text-3xl mb-1">{item.reward.emoji}</span>
      <span className="text-xs font-bold text-center text-text-primary line-clamp-1">{item.reward.name}</span>
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1"
        style={{ backgroundColor: config.color, color: '#fff' }}
      >
        {config.label}
      </span>
      {(item.count > 1 || isConsumable) && (
        <span className="text-[10px] text-text-light font-bold mt-0.5">x{item.count}</span>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-warm-light rounded-2xl p-3 shadow-soft border-2 border-corgi-yellow/20 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-sm font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}
