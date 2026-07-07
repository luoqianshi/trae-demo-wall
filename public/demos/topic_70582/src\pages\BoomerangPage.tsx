import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, CalendarDays, Sparkles, Plane, Clock, Star, Heart, ChevronRight, Map, RotateCcw, GitBranch, TrendingDown, TrendingUp, CalendarRange } from 'lucide-react';
import type { Route, RouteType } from '@shared/types';
import { formatDuration, formatPrice, getRouteTypeTagClass, getTransportIcon, getTotalLayoverDuration, formatDate } from '@/utils/format';
import { useAuthStore } from '@/store/useAuthStore';
import { cityDatabase, calculateDistance, allCityNames } from '@/data/cityDatabase';
import { generateBoomerangRoutes, generateNunchakuRoutes } from '@/data/specialRoutes';

type SearchMode = 'single' | 'double';
type FlightType = 'boomerang' | 'nunchaku' | 'both';
type SortType = 'layover' | 'price' | 'duration';
type DateRangeMode = 'single' | 'week' | 'month';

// 生成日期范围
function generateDateRange(baseDate: string, days: number): string[] {
  const dates: string[] = [];
  const base = new Date(baseDate);
  const startOffset = Math.floor(days / 2);
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - startOffset + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function BoomerangPage() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, isLoggedIn } = useAuthStore();
  
  const [searchMode, setSearchMode] = useState<SearchMode>('single');
  const [flightType, setFlightType] = useState<FlightType>('both');
  const [from, setFrom] = useState('北京');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('single');
  const [sortBy, setSortBy] = useState<SortType>('layover');
  const [isLoading, setIsLoading] = useState(false);
  const [allResults, setAllResults] = useState<Route[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');

  const filteredFromCities = allCityNames.filter(c => c.includes(fromQuery) || c === from);
  const filteredToCities = allCityNames.filter(c => c.includes(toQuery) || c === to);

  // 日期范围对应的天数
  const dateRangeDays = dateRangeMode === 'single' ? 1 : dateRangeMode === 'week' ? 7 : 14;

  const handleSearch = async () => {
    if (!from) return;
    
    setIsLoading(true);
    setAllResults([]);
    
    const dates = generateDateRange(date, dateRangeDays);
    const routesPerDate = 2;
    const batchSize = 3;
    
    for (let i = 0; i < dates.length; i += batchSize) {
      const batchDates = dates.slice(i, i + batchSize);
      let batchResults: Route[] = [];
      
      batchDates.forEach(d => {
        if (flightType === 'boomerang' || flightType === 'both') {
          batchResults = [...batchResults, ...generateBoomerangRoutes(from, d, routesPerDate)];
        }
        if (flightType === 'nunchaku' || flightType === 'both') {
          batchResults = [...batchResults, ...generateNunchakuRoutes(from, to || '', d, routesPerDate)];
        }
      });
      
      setAllResults(prev => [...prev, ...batchResults]);
      
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    setIsLoading(false);
  };

  // 排序后的结果
  const sortedResults = useMemo(() => {
    const sorted = [...allResults];
    if (sortBy === 'layover') {
      sorted.sort((a, b) => {
        const layoverA = getTotalLayoverDuration(a.layovers);
        const layoverB = getTotalLayoverDuration(b.layovers);
        return layoverB - layoverA;
      });
    } else if (sortBy === 'price') {
      sorted.sort((a, b) => a.totalPrice - b.totalPrice);
    } else if (sortBy === 'duration') {
      sorted.sort((a, b) => a.totalDuration - b.totalDuration);
    }
    return sorted;
  }, [allResults, sortBy]);

  // 找到最低价和最长停留
  const stats = useMemo(() => {
    if (allResults.length === 0) return { minPrice: 0, maxLayover: 0, avgPrice: 0, dateCount: 0 };
    const prices = allResults.map(r => r.totalPrice);
    const layovers = allResults.map(r => getTotalLayoverDuration(r.layovers));
    const uniqueDates = new Set(allResults.map(r => r.date));
    return {
      minPrice: Math.min(...prices),
      maxLayover: Math.max(...layovers),
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      dateCount: uniqueDates.size,
    };
  }, [allResults]);

  const getLayoverLevel = (duration: number) => {
    if (duration >= 2880) return { label: '2天+', color: 'bg-purple-600 text-white', icon: '🌟' };
    if (duration >= 1440) return { label: '1天+', color: 'bg-purple-500 text-white', icon: '🌙' };
    if (duration >= 720) return { label: '12h+', color: 'bg-blue-500 text-white', icon: '🏙️' };
    if (duration >= 360) return { label: '6h+', color: 'bg-green-500 text-white', icon: '☕' };
    return { label: `${Math.round(duration/60)}h`, color: 'bg-gray-500 text-white', icon: '⏳' };
  };

  const getBoomerangTag = (type: RouteType) => {
    if (type === 'boomerang') return { text: '回旋镖', icon: '🪃', color: 'bg-gradient-to-r from-orange-400 to-amber-500' };
    if (type === 'nunchaku') return { text: '双截棍', icon: '🥋', color: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    return { text: '', icon: '', color: '' };
  };

  // 是否是最低价
  const isLowestPrice = (price: number) => price === stats.minPrice && allResults.length > 1;
  // 是否是最长停留
  const isLongestLayover = (duration: number) => duration === stats.maxLayover && allResults.length > 1;

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16">
      <div className="bg-gradient-hero pt-8 pb-12">
        <div className="container mx-auto px-4">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-800 font-display mb-2">
              🔮 特色玩法
            </h1>
            <p className="text-primary-700/60">
              一张机票，玩转两座城
            </p>
          </div>

          {/* 玩法介绍卡片 */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className={`p-5 rounded-2xl border-2 ${
              flightType === 'boomerang' || flightType === 'both'
                ? 'border-orange-400 bg-orange-50/50'
                : 'border-gray-100 bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 flex items-center justify-center text-white text-xl">
                  🪃
                </div>
                <div>
                  <h3 className="font-bold text-primary-800">回旋镖机票</h3>
                  <p className="text-xs text-primary-700/50">A→B→C，A和C很近，B是目的地</p>
                </div>
              </div>
              <p className="text-sm text-primary-700/70 mb-3">
                买一张从A出发、B中转、最终到C的机票。利用在B城长达30-60小时的中转时间深度游玩，最后从C坐高铁返回A。平均票价比直飞低42%。
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full">省钱42%</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded-full">停留30-60小时</span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border-2 ${
              flightType === 'nunchaku' || flightType === 'both'
                ? 'border-purple-400 bg-purple-50/50'
                : 'border-gray-100 bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                  🥋
                </div>
                <div>
                  <h3 className="font-bold text-primary-800">双截棍机票</h3>
                  <p className="text-xs text-primary-700/50">A→B→C，B和C都是目的地</p>
                </div>
              </div>
              <p className="text-sm text-primary-700/70 mb-3">
                买一张A到C的中转机票，特意选择在B城中转停留1-3天。先玩B城，再继续飞往C城，把一次旅程变成两个目的地。
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full">玩两个城市</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded-full">停留1-3天</span>
              </div>
            </div>
          </div>

          {/* 搜索区域 */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            {/* 搜索模式切换 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchMode('single')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  searchMode === 'single'
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                <RotateCcw size={18} className="inline mr-2" />
                仅选出发城（找回旋镖）
              </button>
              <button
                onClick={() => setSearchMode('double')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  searchMode === 'double'
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                <GitBranch size={18} className="inline mr-2" />
                选出发和到达（双玩法）
              </button>
            </div>

            {/* 玩法类型选择 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFlightType('both')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  flightType === 'both'
                    ? 'bg-gradient-to-r from-orange-500 to-purple-500 text-white'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                🪃 回旋镖 + 🥋 双截棍
              </button>
              <button
                onClick={() => setFlightType('boomerang')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  flightType === 'boomerang'
                    ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                🪃 仅回旋镖
              </button>
              <button
                onClick={() => setFlightType('nunchaku')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  flightType === 'nunchaku'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                🥋 仅双截棍
              </button>
            </div>

            {/* 日期范围选择 */}
            <div className="flex gap-2 mb-4">
              <span className="text-sm text-primary-700/60 py-2 flex items-center gap-1">
                <CalendarRange size={16} />
                日期范围：
              </span>
              {[
                { key: 'single' as DateRangeMode, label: '当天', desc: '1天' },
                { key: 'week' as DateRangeMode, label: '一周', desc: '7天' },
                { key: 'month' as DateRangeMode, label: '两周', desc: '14天' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDateRangeMode(opt.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    dateRangeMode === opt.key
                      ? 'bg-tealish-500 text-white shadow-md shadow-tealish-500/30'
                      : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  {opt.label}
                  <span className="text-xs opacity-70 ml-1">({opt.desc})</span>
                </button>
              ))}
            </div>

            {/* 搜索表单 */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <label className="text-xs text-primary-700/50 mb-1 block">出发城市</label>
                <div
                  onClick={() => { setShowFromDropdown(true); setShowToDropdown(false); setFromQuery(''); }}
                  className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-xl border border-gray-200 hover:border-accent-400 transition-colors cursor-pointer"
                >
                  <MapPin size={18} className="text-accent-500" />
                  <span className="font-semibold text-primary-800">{from || '请选择城市'}</span>
                </div>
                {showFromDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 max-h-64 overflow-y-auto">
                    <input
                      type="text"
                      value={fromQuery}
                      onChange={(e) => setFromQuery(e.target.value)}
                      placeholder="搜索城市..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 outline-none focus:border-accent-400"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      {filteredFromCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => { setFrom(city); setShowFromDropdown(false); }}
                          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            city === from
                              ? 'bg-accent-500 text-white'
                              : 'bg-primary-50 hover:bg-accent-100 hover:text-accent-600'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {searchMode === 'double' && (
                <>
                  <ArrowRight size={20} className="text-primary-300 mt-7" />
                  <div className="flex-1 relative">
                    <label className="text-xs text-primary-700/50 mb-1 block">到达城市</label>
                    <div
                      onClick={() => { setShowToDropdown(true); setShowFromDropdown(false); setToQuery(''); }}
                      className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-xl border border-gray-200 hover:border-tealish-400 transition-colors cursor-pointer"
                    >
                      <MapPin size={18} className="text-tealish-500" />
                      <span className="font-semibold text-primary-800">{to || '请选择城市'}</span>
                    </div>
                    {showToDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 max-h-64 overflow-y-auto">
                        <input
                          type="text"
                          value={toQuery}
                          onChange={(e) => setToQuery(e.target.value)}
                          placeholder="搜索城市..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 outline-none focus:border-tealish-400"
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-2">
                          {filteredToCities.map((city) => (
                            <button
                              key={city}
                              onClick={() => { setTo(city); setShowToDropdown(false); }}
                              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                city === to
                                  ? 'bg-tealish-500 text-white'
                                  : 'bg-primary-50 hover:bg-tealish-100 hover:text-tealish-600'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="relative">
                <label className="text-xs text-primary-700/50 mb-1 block">
                  {dateRangeMode === 'single' ? '出发日期' : '基准日期'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-4 py-3 bg-primary-50/50 rounded-xl border border-gray-200 hover:border-accent-400 transition-colors outline-none focus:border-accent-400"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={!from || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-accent-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5 md:mt-7"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                搜索玩法
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 结果区域 */}
      <div className="container mx-auto px-4 -mt-6">
        {/* 统计和排序 */}
        {!isLoading && sortedResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-primary-700 font-medium">
                    共找到 {sortedResults.length} 个玩法方案
                  </span>
                  {dateRangeMode !== 'single' && (
                    <span className="text-primary-700/50 text-sm ml-2">
                      · 覆盖 {stats.dateCount} 天
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-accent-600">
                    <TrendingDown size={14} />
                    <span>最低价 <b>¥{stats.minPrice}</b></span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-600">
                    <Clock size={14} />
                    <span>最长停留 <b>{formatDuration(stats.maxLayover)}</b></span>
                  </div>
                  <div className="flex items-center gap-1 text-primary-600">
                    <span>均价 <b>¥{stats.avgPrice}</b></span>
                  </div>
                </div>
              </div>
              
              {/* 排序选项 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary-700/50">排序：</span>
                <div className="flex bg-primary-50 rounded-xl p-1">
                  {[
                    { key: 'layover' as SortType, label: '停留最长', icon: Clock },
                    { key: 'price' as SortType, label: '价格最低', icon: TrendingDown },
                    { key: 'duration' as SortType, label: '总时最短', icon: TrendingUp },
                  ].map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          sortBy === opt.key
                            ? 'bg-white text-accent-500 shadow-sm'
                            : 'text-primary-600/70 hover:text-primary-700'
                        }`}
                      >
                        <Icon size={14} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={24} className="text-accent-500" />
              </div>
            </div>
            <div className="text-lg font-bold text-primary-800">正在搜索特色玩法...</div>
            <div className="text-sm text-primary-700/50 mt-2">
              {dateRangeMode === 'single' 
                ? '寻找最优中转方案，最长可停留7天'
                : `正在扫描${dateRangeDays}天的最优价格...`
              }
            </div>
            {dateRangeMode !== 'single' && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent-500 to-tealish-500 rounded-full animate-pulse"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 结果列表 */}
        {!isLoading && sortedResults.length > 0 && (
          <div className="space-y-4">
            {sortedResults.map((route, index) => {
              const totalLayover = getTotalLayoverDuration(route.layovers);
              const layoverLevel = getLayoverLevel(totalLayover);
              const boomerangTag = getBoomerangTag(route.type);
              const layoverCity = route.layovers[0]?.city || '';
              const isFavorited = isFavorite(route.id);
              const lowest = isLowestPrice(route.totalPrice);
              const longest = isLongestLayover(totalLayover);

              return (
                <div
                  key={`${route.id}-${index}`}
                  onClick={() => navigate(`/route/${route.id}`)}
                  className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden relative ${
                    lowest ? 'ring-2 ring-accent-400 ring-offset-2' : ''
                  } ${longest && !lowest ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                >
                  {/* 最低价/最长停留标识 */}
                  {lowest && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-accent-500 to-accent-400 text-white px-3 py-1 text-xs font-bold rounded-br-xl z-10 flex items-center gap-1">
                      <TrendingDown size={12} />
                      最低价
                    </div>
                  )}
                  {longest && !lowest && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-bold rounded-br-xl z-10 flex items-center gap-1">
                      <Clock size={12} />
                      最长停留
                    </div>
                  )}

                  <div className={`p-5 ${lowest || longest ? 'pt-10' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`tag ${getRouteTypeTagClass(route.type)}`}>
                          {boomerangTag.icon} {boomerangTag.text}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${layoverLevel.color}`}>
                          {layoverLevel.icon} {layoverLevel.label}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs">{route.rating}</span>
                        </div>
                        {dateRangeMode !== 'single' && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-tealish-100 text-tealish-700 flex items-center gap-1">
                            <CalendarDays size={12} />
                            {formatDate(route.date)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLoggedIn) navigate('/login');
                          else toggleFavorite(route.id);
                        }}
                        className={`p-2 rounded-full transition-all ${
                          isFavorited
                            ? 'text-accent-500 bg-accent-50'
                            : 'text-gray-300 hover:text-accent-400'
                        }`}
                      >
                        <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* 路线图 */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="text-xl font-bold text-primary-800">{route.from}</div>
                        <div className="text-xs text-primary-700/50">{route.segments[0]?.departureTime}</div>
                      </div>

                      {/* 第一段 */}
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-primary-700/40 mb-1">{formatDuration(route.segments[0]?.duration || 0)}</div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-accent-500" />
                          <div className="w-12 md:w-16 h-0.5 bg-gradient-to-r from-accent-500 to-primary-300" />
                        </div>
                      </div>

                      {/* 中转城市 - 重点突出 */}
                      <div className="flex flex-col items-center px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                        <Map size={18} className="text-orange-500 mb-0.5" />
                        <div className="text-base font-bold text-orange-600">{layoverCity}</div>
                        <div className="text-xs text-orange-500 font-medium">停留 {formatDuration(totalLayover)}</div>
                      </div>

                      {/* 第二段 */}
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-primary-700/40 mb-1">{formatDuration(route.segments[1]?.duration || 0)}</div>
                        <div className="flex items-center">
                          <div className="w-12 md:w-16 h-0.5 bg-gradient-to-r from-primary-300 to-tealish-500" />
                          <div className="w-3 h-3 rounded-full bg-tealish-500" />
                        </div>
                      </div>

                      <div className="flex-1 text-right">
                        <div className="text-xl font-bold text-primary-800">{route.to}</div>
                        <div className="text-xs text-primary-700/50">{route.segments[route.segments.length - 1]?.arrivalTime}</div>
                      </div>
                    </div>

                    {/* 亮点和价格 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {route.highlights.slice(0, 3).map((h, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-lg">
                            {h}
                          </span>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-primary-700/40 line-through">{formatPrice(route.directPrice || 0)}</div>
                        <div className="text-2xl font-bold font-display">
                          <span className={lowest ? 'text-accent-500' : 'text-accent-500'}>
                            {formatPrice(route.totalPrice)}
                          </span>
                        </div>
                        <div className="text-xs text-green-500 font-medium">省{formatPrice(route.savings)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 空结果 */}
        {!isLoading && sortedResults.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-primary-800 mb-2">暂无特色玩法方案</h3>
            <p className="text-primary-700/50 mb-6">试试选择其他城市或日期</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              <span className="text-xs text-primary-700/40">热门出发城市：</span>
              {['北京', '上海', '广州', '成都', '深圳'].map((city) => (
                <button
                  key={city}
                  onClick={() => { setFrom(city); handleSearch(); }}
                  className="px-3 py-1 text-xs bg-primary-50 text-primary-600 rounded-full hover:bg-accent-100 hover:text-accent-600 transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
