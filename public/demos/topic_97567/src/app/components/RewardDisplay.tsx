'use client';

import { useState } from 'react';

// ============================================================
// 类型定义
// ============================================================

interface RewardItem {
  id: string;
  name: string;
  condition: string;
  unlocked: boolean;
}

interface RewardDisplayProps {
  rewards: {
    unlocked: { decorations: string[]; colors: string[]; themes: string[]; titles: string[] };
    available: {
      decorations: RewardItem[];
      colors: RewardItem[];
      themes: RewardItem[];
      titles: RewardItem[];
    };
  };
  currentSettings: {
    decoration: string;
    color: string;
    theme: string;
    title: string;
  };
  onEquip: (type: string, value: string) => void;
}

// ============================================================
// Tab 配置
// ============================================================

type TabKey = 'decorations' | 'colors' | 'themes' | 'titles';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'decorations', label: '装饰', icon: '🎩' },
  { key: 'colors', label: '颜色', icon: '🎨' },
  { key: 'themes', label: '主题', icon: '🌈' },
  { key: 'titles', label: '称号', icon: '🏅' },
];

// ============================================================
// 颜色预览映射
// ============================================================

const COLOR_PREVIEW: Record<string, { bg: string; border: string; label: string }> = {
  white: { bg: 'bg-white', border: 'border-gray-200', label: '白' },
  pink: { bg: 'bg-[#FFB6C1]', border: 'border-[#FFB6C1]', label: '粉' },
  blue: { bg: 'bg-[#87CEEB]', border: 'border-[#87CEEB]', label: '蓝' },
  gold: { bg: 'bg-[#FFD700]', border: 'border-[#FFD700]', label: '金' },
  rainbow: { bg: 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400', border: 'border-purple-300', label: '虹' },
};

// ============================================================
// 主题预览映射
// ============================================================

const THEME_PREVIEW: Record<string, { gradient: string; label: string }> = {
  clear_sky: { gradient: 'from-[#87CEEB] to-[#E0F0FF]', label: '晴' },
  starry: { gradient: 'from-[#1a1a3e] to-[#4a2c8a]', label: '星' },
  flower: { gradient: 'from-[#FFB6C1] to-[#FFC0CB]', label: '花' },
  aurora: { gradient: 'from-[#00c9ff] via-[#92fe9d] to-[#f9d423]', label: '极' },
};

// ============================================================
// 装饰预览映射
// ============================================================

const DECORATION_PREVIEW: Record<string, string> = {
  none: '⚪',
  hat: '🎩',
  scarf: '🧣',
  glasses: '👓',
  crown: '👑',
};

// ============================================================
// 组件
// ============================================================

export default function RewardDisplay({ rewards, currentSettings, onEquip }: RewardDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('decorations');
  const [equipping, setEquipping] = useState<string | null>(null);

  const currentKeyMap: Record<TabKey, string> = {
    decorations: currentSettings.decoration,
    colors: currentSettings.color,
    themes: currentSettings.theme,
    titles: currentSettings.title,
  };

  const handleEquip = async (type: string, value: string) => {
    setEquipping(value);
    try {
      await onEquip(type, value);
    } finally {
      setEquipping(null);
    }
  };

  const currentItems = rewards.available[activeTab];
  const currentEquipped = currentKeyMap[activeTab];

  return (
    <div>
      {/* Tab 切换 */}
      <div className="flex gap-2 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white shadow-md'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`text-xs ${activeTab === tab.key ? 'text-white/80' : 'text-gray-400'}`}>
              {rewards.unlocked[tab.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* 奖励网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {currentItems.map(item => {
          const isEquipped = currentEquipped === item.id;
          const isEquipping = equipping === item.id;

          return (
            <RewardCard
              key={item.id}
              item={item}
              type={activeTab}
              isEquipped={isEquipped}
              isEquipping={isEquipping}
              onEquip={handleEquip}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 单个奖励卡片
// ============================================================

interface RewardCardProps {
  item: RewardItem;
  type: TabKey;
  isEquipped: boolean;
  isEquipping: boolean;
  onEquip: (type: string, value: string) => void;
}

function RewardCard({ item, type, isEquipped, isEquipping, onEquip }: RewardCardProps) {
  const handleClick = () => {
    if (item.unlocked && !isEquipped && !isEquipping) {
      onEquip(type, item.id);
    }
  };

  // 已解锁卡片
  if (item.unlocked) {
    return (
      <button
        onClick={handleClick}
        className={`relative rounded-2xl p-4 text-left transition-all overflow-hidden ${
          isEquipped
            ? 'bg-gradient-to-br from-[#FFF8F0] to-[#FFE4E1] shadow-lg border-2 border-[#FFB6C1]/60 ring-2 ring-[#FFB6C1]/20'
            : 'bg-white shadow-md border border-gray-100 hover:shadow-lg hover:border-[#FFB6C1]/30 hover:scale-[1.02] active:scale-[0.98]'
        } ${isEquipping ? 'opacity-70' : ''}`}
      >
        {/* 已装备标记 */}
        {isEquipped && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white text-xs font-bold shadow-sm">
              ✓
            </span>
          </div>
        )}

        {/* 预览内容 */}
        <div className="flex flex-col items-center gap-2">
          <RewardPreview type={type} id={item.id} />
          <div className="text-center">
            <p className={`text-sm font-bold ${isEquipped ? 'text-[#FF69B4]' : 'text-gray-700'}`}>
              {item.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{item.condition}</p>
          </div>
        </div>

        {/* 装备中提示 */}
        {isEquipping && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
            <div className="w-5 h-5 border-2 border-[#FFB6C1] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </button>
    );
  }

  // 未解锁卡片
  return (
    <div className="relative rounded-2xl p-4 bg-gray-50 border border-gray-100 opacity-60 cursor-not-allowed">
      {/* 锁定标记 */}
      <div className="absolute top-2 right-2">
        <span className="text-gray-300 text-sm">🔒</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <span className="text-gray-300 text-lg">?</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-400">{item.name}</p>
          <p className="text-xs text-gray-300 mt-0.5">{item.condition}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 奖励预览（根据类型渲染不同的视觉效果）
// ============================================================

function RewardPreview({ type, id }: { type: TabKey; id: string }) {
  if (type === 'decorations') {
    const emoji = DECORATION_PREVIEW[id] || '⚪';
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF8F0] to-[#FFE4E1] flex items-center justify-center text-2xl shadow-sm">
        {emoji}
      </div>
    );
  }

  if (type === 'colors') {
    const colorConfig = COLOR_PREVIEW[id];
    if (!colorConfig) return null;
    return (
      <div className={`w-12 h-12 rounded-xl ${colorConfig.bg} ${colorConfig.border} border-2 flex items-center justify-center shadow-sm`}>
        <span className="text-sm font-bold text-white drop-shadow-sm">{colorConfig.label}</span>
      </div>
    );
  }

  if (type === 'themes') {
    const themeConfig = THEME_PREVIEW[id];
    if (!themeConfig) return null;
    return (
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${themeConfig.gradient} flex items-center justify-center shadow-sm`}>
        <span className="text-sm font-bold text-white drop-shadow-sm">{themeConfig.label}</span>
      </div>
    );
  }

  if (type === 'titles') {
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 flex items-center justify-center shadow-sm border border-[#FFD700]/30">
        <span className="text-sm font-bold text-[#DAA520]">{id.charAt(0)}</span>
      </div>
    );
  }

  return null;
}
