import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import RouteCard from '@/components/RouteCard';
import { useSearchStore } from '@/store/useSearchStore';
import { DollarSign, Clock, Coffee, SlidersHorizontal, Zap, Search as SearchIcon, Plane, Train, Sparkles } from 'lucide-react';
import type { SortType } from '@shared/types';

// 停留时长筛选选项
const layoverDurationOptions = [
  { key: 'all', label: '全部时长', min: 0, max: Infinity },
  { key: 'short', label: '≤30分钟', min: 0, max: 30 },
  { key: 'medium', label: '30分-2小时', min: 30, max: 120 },
  { key: 'long', label: '2-6小时', min: 120, max: 360 },
  { key: 'cityTour', label: '6-12小时·市区游', min: 360, max: 720 },
  { key: 'longStop', label: '12小时以上·深度游', min: 720, max: Infinity },
];

// 快速筛选（常用）
const quickLayoverFilters = [
  { key: 'cityTour', label: '6h+ 市区游', icon: '🏙️', highlight: true },
  { key: 'longStop', label: '12h+ 深度游', icon: '🌟', highlight: true },
  { key: 'all', label: '全部', icon: '✈️', highlight: false },
];

export default function Search() {
  const { results, sortBy, setSortBy, isLoading, from, to, loadingStage, isLiveResult, isRealAPI } = useSearchStore();
  const [showFilters, setShowFilters] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [layoverFilter, setLayoverFilter] = useState('all');

  const sortOptions: { key: SortType; label: string; icon: typeof DollarSign }[] = [
    { key: 'price', label: '价格最低', icon: DollarSign },
    { key: 'duration', label: '耗时最短', icon: Clock },
    { key: 'layover', label: '停留最短', icon: Coffee },
  ];

  const typeFilters = [
    { key: 'all', label: '全部方案' },
    { key: 'boomerang', label: '回旋镖' },
    { key: 'open_jaw', label: '开口程' },
    { key: 'same_train', label: '同车接续' },
    { key: 'normal', label: '经典中转' },
  ];

  // 计算总停留时长
  const getTotalLayover = (route: { layovers: { duration: number }[] }) => {
    return route.layovers.reduce((sum, l) => sum + l.duration, 0);
  };

  // 应用所有筛选
  const filteredResults = results.filter((route) => {
    // 类型筛选
    if (activeType !== 'all' && route.type !== activeType) return false;

    // 停留时长筛选
    const layoverOption = layoverDurationOptions.find(o => o.key === layoverFilter);
    if (layoverOption) {
      const totalLayover = getTotalLayover(route);
      if (totalLayover < layoverOption.min || totalLayover > layoverOption.max) {
        return false;
      }
    }

    return true;
  });

  // 获取停留时长标签
  const getLayoverTag = (duration: number) => {
    if (duration >= 720) return { text: '12h+ 深度游', color: 'bg-purple-100 text-purple-700' };
    if (duration >= 360) return { text: '6h+ 市区游', color: 'bg-blue-100 text-blue-700' };
    if (duration >= 120) return { text: '2h+ 长停留', color: 'bg-green-100 text-green-700' };
    return { text: `${duration}分钟`, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16">
      <div className="bg-gradient-hero pt-6 pb-10 md:pt-8 md:pb-12">
        <div className="container mx-auto px-4">
          <SearchBar variant="compact" />
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        {/* 实时查询标识 */}
        {!isLoading && results.length > 0 && (
          <div className={`rounded-2xl p-3 mb-4 flex items-center gap-2 animate-fade-in ${
            isRealAPI
              ? 'bg-gradient-to-r from-green-400/10 to-green-500/10 border border-green-400/20'
              : isLiveResult
              ? 'bg-gradient-to-r from-tealish-400/10 to-tealish-500/10 border border-tealish-400/20'
              : 'bg-gradient-to-r from-blue-400/10 to-blue-500/10 border border-blue-400/20'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isRealAPI
                ? 'bg-green-400/20'
                : isLiveResult
                ? 'bg-tealish-400/20'
                : 'bg-blue-400/20'
            }`}>
              <Zap size={16} className={
                isRealAPI
                  ? 'text-green-500'
                  : isLiveResult
                  ? 'text-tealish-500'
                  : 'text-blue-500'
              } />
            </div>
            <div className="flex-1">
              <span className={`text-sm font-medium ${
                isRealAPI
                  ? 'text-green-600'
                  : isLiveResult
                  ? 'text-tealish-600'
                  : 'text-blue-600'
              }`}>
                {isRealAPI ? '✓ 真实航班数据' : isLiveResult ? '实时查询结果' : '预设路线方案'}
              </span>
              <span className="text-sm text-primary-700/50 ml-2">
                已为「{from} → {to}」找到 {results.length} 条方案
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm text-primary-700/50 mb-1">
                {from} → {to} · 共找到 {filteredResults.length} 个中转方案
              </div>
              <div className="flex flex-wrap gap-2">
                {typeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveType(filter.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                      activeType === filter.key
                        ? 'bg-primary-700 text-white'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-xl transition-colors ${
                  showFilters || layoverFilter !== 'all'
                    ? 'border-accent-400 bg-accent-50 text-accent-600'
                    : 'border-gray-200 text-primary-700/70 hover:bg-primary-50'
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">筛选</span>
                {layoverFilter !== 'all' && (
                  <span className="w-2 h-2 rounded-full bg-accent-500" />
                )}
              </button>
              <div className="flex bg-primary-50 rounded-xl p-1">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setSortBy(option.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        sortBy === option.key
                          ? 'bg-white text-accent-500 shadow-sm'
                          : 'text-primary-600/70 hover:text-primary-700'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="hidden md:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 停留时长快速筛选 */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-primary-700/50">停留时长：</span>
            {quickLayoverFilters.map((filter) => {
              const isActive = layoverFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setLayoverFilter(filter.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                    isActive
                      ? filter.highlight
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200'
                        : 'bg-primary-700 text-white'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <div>
                <label className="text-xs text-primary-700/50 mb-1 block">价格区间</label>
                <select className="w-full px-3 py-2 bg-primary-50/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent-400/30">
                  <option>全部价格</option>
                  <option>¥500以下</option>
                  <option>¥500-1000</option>
                  <option>¥1000-1500</option>
                  <option>¥1500以上</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-primary-700/50 mb-1 block">总时长</label>
                <select className="w-full px-3 py-2 bg-primary-50/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent-400/30">
                  <option>全部时长</option>
                  <option>3小时以内</option>
                  <option>3-6小时</option>
                  <option>6-10小时</option>
                  <option>10小时以上</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-primary-700/50 mb-1 block">中转次数</label>
                <select className="w-full px-3 py-2 bg-primary-50/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent-400/30">
                  <option>全部</option>
                  <option>1次中转</option>
                  <option>2次中转</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-primary-700/50 mb-1 block">交通方式</label>
                <select className="w-full px-3 py-2 bg-primary-50/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent-400/30">
                  <option>全部方式</option>
                  <option>飞机中转</option>
                  <option>高铁中转</option>
                  <option>混合交通</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="text-xs text-primary-700/50 mb-1 block">停留时长（详细）</label>
                <div className="flex flex-wrap gap-2">
                  {layoverDurationOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setLayoverFilter(option.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        layoverFilter === option.key
                          ? 'bg-accent-500 text-white'
                          : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 加载状态 - 带分阶段动画 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <SearchIcon size={24} className="text-accent-500" />
              </div>
            </div>
            <div className="text-lg font-bold text-primary-800 mb-2 font-display">
              {from} → {to}
            </div>
            <div className="text-sm text-accent-500 font-medium animate-fade-in" key={loadingStage}>
              {loadingStage || '正在搜索...'}
            </div>
            {/* 搜索步骤指示器 */}
            <div className="flex items-center gap-2 mt-6">
              {['连接引擎', '搜索城市', '比对价格', '生成方案'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      loadingStage.includes(step.slice(0, 2)) || loadingStage === ''
                        ? 'bg-accent-500 scale-125'
                        : 'bg-primary-200'
                    }`}
                  />
                  {i < 3 && <div className="w-8 h-0.5 bg-primary-100" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResults.map((route, index) => (
              <RouteCard key={route.id} route={route} index={index} />
            ))}
          </div>
        )}

        {/* 空结果 */}
        {filteredResults.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-primary-800 mb-2">
              {results.length === 0 ? '暂无中转方案' : '暂无符合条件的方案'}
            </h3>
            <p className="text-primary-700/50 mb-6">
              {results.length === 0
                ? `「${from} → {to}」暂未覆盖，试试其他城市组合`
                : layoverFilter !== 'all'
                ? '试试调整停留时长筛选条件'
                : '试试调整筛选条件或更换城市'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              <span className="text-xs text-primary-700/40">热门路线推荐：</span>
              {['北京→上海', '广州→成都', '深圳→西安', '上海→杭州'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const [f, t] = item.split('→');
                    const { setFrom, setTo, search } = useSearchStore.getState();
                    setFrom(f);
                    setTo(t);
                    search();
                  }}
                  className="px-3 py-1 text-xs bg-primary-50 text-primary-600 rounded-full hover:bg-accent-100 hover:text-accent-600 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
            {layoverFilter !== 'all' && (
              <button
                onClick={() => setLayoverFilter('all')}
                className="mt-4 px-4 py-2 text-sm bg-accent-50 text-accent-600 rounded-full hover:bg-accent-100 transition-colors"
              >
                清除停留时长筛选
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
