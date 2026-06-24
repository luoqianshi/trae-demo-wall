/**
 * 吾滴孩儿 - AI 智能资讯页面 v5
 * 
 * 设计理念：
 * ✅ 清晰易读 - 高对比度，层次分明
 * ✅ 简洁专业 - 去掉干扰元素
 * ✅ 分类明确 - 一眼看清内容来源
 */

import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getSmartNews,
  toggleFavorite,
  getOfficialSources,
  type SmartNewsItem,
} from '../services/smartNews';

// 分类配置
const defaultCategories = [
  { key: 'all', name: '全部', icon: '📋', color: 'blue' },
  { key: 'recall', name: '产品召回', icon: '⚠️', color: 'red' },
  { key: 'alert', name: '安全预警', icon: '🚨', color: 'orange' },
  { key: 'policy', name: '政策法规', icon: '📜', color: 'green' },
  { key: 'research', name: '学术研究', icon: '🔬', color: 'purple' },
  { key: 'incident', name: '事件通报', icon: '📢', color: 'gray' },
  { key: 'guideline', name: '指南规范', icon: '📑', color: 'teal' },
];

// 风险等级配置 - 清晰可读
const riskConfig = {
  critical: { label: '严重', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  high: { label: '高风险', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  medium: { label: '中等', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  low: { label: '低风险', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  info: { label: '信息', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
};

// 来源配置
const sourceConfig: Record<string, { icon: string; label: string; color: string }> = {
  samr: { icon: '🏛️', label: '市场监管', color: 'text-red-600' },
  nhc: { icon: '🏥', label: '卫健委', color: 'text-green-600' },
  cdc: { icon: '🔬', label: '疾控中心', color: 'text-blue-600' },
  nmpa: { icon: '💊', label: '药监局', color: 'text-purple-600' },
  who: { icon: '🌍', label: '学术期刊', color: 'text-indigo-600' },
  expert: { icon: '👨‍⚕️', label: '专家', color: 'text-teal-600' },
};

function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newsResult, setNewsResult] = useState<Awaited<ReturnType<typeof getSmartNews>> | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 加载智能资讯
  const loadNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSmartNews({ category: activeCategory });
      setNewsResult(result);

      // 加载收藏状态
      const favsRaw = localStorage.getItem('wdhr_news_favorites');
      if (favsRaw) {
        setFavorites(new Set(JSON.parse(favsRaw)));
      }
    } catch (e) {
      console.error('[SmartNews] 加载失败:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => { loadNews(); }, [loadNews]);

  // 搜索过滤
  const filteredNews = useMemo(() => {
    if (!newsResult) return [];
    let result = newsResult.items;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.summary.toLowerCase().includes(query) ||
        n.aiAnalysis.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    return result;
  }, [newsResult, searchQuery]);

  // 切换收藏
  const handleToggleFav = useCallback(async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowFav = await toggleFavorite(id);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isNowFav) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  // 渲染资讯卡片
  const renderNewsCard = (item: SmartNewsItem) => {
    const risk = riskConfig[item.aiAnalysis.riskLevel];
    const isFav = favorites.has(item.id);
    const source = sourceConfig[item.sourceType] || { icon: '📰', label: item.source, color: 'text-gray-600' };

    return (
      <Link
        key={item.id}
        to={`/news/${item.id}`}
        state={{ newsItem: item }}
        className="block bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all active:scale-[0.99]"
      >
        {/* 顶部：来源 + 风险等级 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{source.icon}</span>
            <span className={`text-xs font-medium ${source.color}`}>{source.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${risk.bg} ${risk.text} ${risk.border}`}>
              {risk.label}
            </span>
            <button
              onClick={(e) => handleToggleFav(e, item.id)}
              className="text-base transition-transform hover:scale-110 active:scale-95"
              title={isFav ? '取消收藏' : '收藏'}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        {/* 标题 - 大字清晰 */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
          {item.title}
        </h3>

        {/* 摘要 */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {item.summary}
        </p>

        {/* 关键词标签 - 清晰分隔 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.aiAnalysis.keywords.slice(0, 4).map(keyword => (
            <span
              key={keyword}
              className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* 行动建议 */}
        {item.aiAnalysis.actionItems.length > 0 && (
          <div className="bg-green-50 rounded-lg p-2.5 mb-3 border border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">💡 建议：</p>
            <p className="text-xs text-green-700 leading-relaxed">
              {item.aiAnalysis.actionItems[0]}
            </p>
          </div>
        )}

        {/* 底部：日期 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>📅 {item.date}</span>
          {item.sourceUrl && (
            <span className="text-blue-600 font-medium">查看原文 →</span>
          )}
        </div>
      </Link>
    );
  };

  // 获取当前分类名称
  const getCategoryName = () => {
    if (searchQuery) return '搜索结果';
    if (activeCategory === 'all') return '最新资讯';
    return defaultCategories.find(c => c.key === activeCategory)?.name || '资讯';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header - 清晰简洁 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          {/* 标题区 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">📰 母婴资讯</h1>
              <p className="text-xs text-gray-500 mt-0.5">权威来源 · 实时更新</p>
            </div>
            {/* 统计 */}
            {newsResult && (
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{newsResult.stats.total}</p>
                <p className="text-xs text-gray-500">条资讯</p>
              </div>
            )}
          </div>

          {/* 搜索框 - 清晰简洁 */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索资讯..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-300 outline-none text-sm text-gray-900 placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* 紧急提醒 - 醒目但不刺眼 */}
        {!searchQuery && newsResult?.urgentItems && newsResult.urgentItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center mb-3">
              <span className="text-xl mr-2">🚨</span>
              <h2 className="text-base font-bold text-red-800">紧急提醒</h2>
              <span className="ml-auto text-xs px-2 py-0.5 bg-red-500 text-white rounded-full font-medium">
                {newsResult.urgentItems.length}条
              </span>
            </div>
            <div className="space-y-2">
              {newsResult.urgentItems.slice(0, 2).map(item => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="block bg-white rounded-lg p-3 border border-red-100 hover:border-red-200 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 分类标签 - 清晰易点击 */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          {defaultCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* 搜索结果提示 */}
        {searchQuery && (
          <p className="text-sm text-gray-500 mb-3">
            找到 <span className="font-semibold text-gray-900">{filteredNews.length}</span> 条相关资讯
          </p>
        )}

        {/* 资讯列表 */}
        <div className="space-y-3">
          {/* 列表标题 */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {getCategoryName()}
            </h2>
            <span className="text-sm text-gray-500">{filteredNews.length}条</span>
          </div>

          {isLoading ? (
            /* 加载骨架屏 */
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-100 rounded w-16"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredNews.length > 0 ? (
            filteredNews.map(renderNewsCard)
          ) : (
            /* 空状态 */
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-600 font-medium mb-2">
                {searchQuery ? `没有找到与"${searchQuery}"相关的内容` : '暂无该分类的资讯'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  清除搜索
                </button>
              )}
            </div>
          )}
        </div>

        {/* 权威来源 */}
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>🏛️</span>
            权威数据来源
          </h3>
          <div className="space-y-2">
            {getOfficialSources().map(src => (
              <a
                key={src.id}
                href={src.homepageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏢</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{src.name}</p>
                    <p className="text-xs text-gray-500">{src.description}</p>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-medium">访问 →</span>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 text-center">
            所有数据来源于政府部门公开发布的信息
          </p>
        </div>
      </div>
    </div>
  );
}

export default NewsPage;
