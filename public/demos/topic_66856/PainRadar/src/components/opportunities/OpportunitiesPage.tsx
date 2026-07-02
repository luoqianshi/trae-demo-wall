import { useEffect, useState } from 'react';
import { Filter, RefreshCw, Sparkles, TrendingUp, TrendingDown, Zap, Target, BarChart3 } from 'lucide-react';
import { useAppStore } from '../../store';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityDetail } from './OpportunityDetail';
import { Opportunity } from '../../types';

export function OpportunitiesPage() {
  const { 
    opportunities, 
    searchQuery, 
    selectedCategory, 
    fetchOpportunities, 
    setSelectedCategory,
    isRecommendedOnly,
    setRecommendedOnly 
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'recommended' | 'high_pain' | 'low_competition'>('all');

  useEffect(() => {
    setLoading(true);
    fetchOpportunities();
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [fetchOpportunities]);

  const categories = ['全部', '营销工具', '开发者工具', '生产力工具', '电商工具', '创意工具', '求职工具'];

  const filterOpportunities = () => {
    let filtered = opportunities.filter((opp) => {
      const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           opp.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '' || selectedCategory === '全部' || opp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // 应用推荐筛选：竞争小(<45%)、市场大、痛度高(>80%)、潜力极高
    if (isRecommendedOnly) {
      filtered = filtered.filter(opp => 
        opp.competitionLevel <= 45 && 
        opp.painLevel >= 80 && 
        opp.marketDetail.size === 'large' &&
        opp.potential === 'very_high'
      );
    }

    switch (filterMode) {
      case 'recommended':
        return filtered.filter(opp => 
          opp.competitionLevel <= 45 && 
          opp.painLevel >= 80 && 
          opp.marketDetail.size === 'large' &&
          opp.potential === 'very_high'
        ).sort((a, b) => b.validationScore - a.validationScore);
      case 'high_pain':
        return filtered.sort((a, b) => b.painLevel - a.painLevel);
      case 'low_competition':
        return filtered.sort((a, b) => a.competitionLevel - b.competitionLevel);
      default:
        return filtered;
    }
  };

  const filteredOpportunities = filterOpportunities();

  const getFilterButtonClass = (mode: typeof filterMode) => {
    return `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      filterMode === mode
        ? 'bg-primary-100 text-primary-700'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500">正在扫描市场机会...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">机会发现</h2>
          <p className="text-gray-500 mt-1">基于多平台数据挖掘的真实市场需求</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchOpportunities();
            setTimeout(() => setLoading(false), 600);
          }}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新数据</span>
        </button>
      </div>

      {/* 推荐项目横幅 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">智能推荐机会</h4>
              <p className="text-sm text-gray-600">筛选条件：竞争小(&lt;45%) | 市场大 | 痛度高(&gt;80%) | 潜力极高</p>
            </div>
          </div>
          <button
            onClick={() => setRecommendedOnly(!isRecommendedOnly)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              isRecommendedOnly
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRecommendedOnly ? '已开启推荐' : '开启推荐'}</span>
          </button>
        </div>
        
        {isRecommendedOnly && (
          <div className="mt-4 pt-4 border-t border-green-100">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{filteredOpportunities.length}</p>
                <p className="text-xs text-gray-500">推荐机会数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{Math.round(filteredOpportunities.reduce((sum, o) => sum + o.painLevel, 0) / (filteredOpportunities.length || 1))}%</p>
                <p className="text-xs text-gray-500">平均痛度</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round(filteredOpportunities.reduce((sum, o) => sum + o.competitionLevel, 0) / (filteredOpportunities.length || 1))}%</p>
                <p className="text-xs text-gray-500">平均竞争</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{filteredOpportunities.reduce((sum, o) => sum + o.mentions, 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">总提及数</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat || (cat === '全部' && selectedCategory === '')
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterMode('all')}
            className={getFilterButtonClass('all')}
          >
            <Zap className="w-4 h-4" />
            <span>全部</span>
          </button>
          <button
            onClick={() => setFilterMode('recommended')}
            className={getFilterButtonClass('recommended')}
          >
            <Sparkles className="w-4 h-4" />
            <span>精选</span>
          </button>
          <button
            onClick={() => setFilterMode('high_pain')}
            className={getFilterButtonClass('high_pain')}
          >
            <TrendingUp className="w-4 h-4" />
            <span>高痛度</span>
          </button>
          <button
            onClick={() => setFilterMode('low_competition')}
            className={getFilterButtonClass('low_competition')}
          >
            <TrendingDown className="w-4 h-4" />
            <span>低竞争</span>
          </button>
        </div>
      </div>

      {filterMode === 'recommended' && (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">AI智能精选</h4>
            <p className="text-sm text-gray-600">以下机会经过AI筛选：竞争小、市场大、痛度高、潜力极高</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOpportunities.map((opportunity) => (
          <OpportunityCard 
            key={opportunity.id} 
            opportunity={opportunity} 
            onClick={() => setSelectedOpportunity(opportunity)}
          />
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 font-medium">没有找到匹配的机会</p>
          <p className="text-gray-500 text-sm mt-1">试试调整搜索关键词或筛选条件</p>
          {isRecommendedOnly && (
            <button
              onClick={() => setRecommendedOnly(false)}
              className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              关闭推荐筛选查看全部机会
            </button>
          )}
        </div>
      )}

      {selectedOpportunity && (
        <OpportunityDetail 
          opportunity={selectedOpportunity} 
          onClose={() => setSelectedOpportunity(null)} 
        />
      )}
    </div>
  );
}
