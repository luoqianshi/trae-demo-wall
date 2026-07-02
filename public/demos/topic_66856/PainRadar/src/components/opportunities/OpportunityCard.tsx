import { Star, MessageCircle, ExternalLink, TrendingUp, AlertCircle, Users, ChevronRight, BarChart2, Globe } from 'lucide-react';
import { Opportunity } from '../../types';
import { useAppStore } from '../../store';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
}

export function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const { favorites, toggleFavorite } = useAppStore();
  const isFavorite = favorites.includes(opportunity.id);

  const getPainLevelColor = (level: number) => {
    if (level >= 80) return 'text-red-600 bg-red-50';
    if (level >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getCompetitionColor = (level: number) => {
    if (level <= 40) return 'text-green-600 bg-green-50';
    if (level <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'very_high': return 'text-gradient-to-r from-green-600 to-emerald-600';
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getSourceTagColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Reddit': 'bg-orange-50 text-orange-600',
      '小红书': 'bg-pink-50 text-pink-600',
      'Twitter': 'bg-blue-50 text-blue-600',
      'Product Hunt': 'bg-red-50 text-red-600',
      'B站': 'bg-purple-50 text-purple-600',
      '抖音': 'bg-black text-white',
      'TikTok': 'bg-black text-white',
      'YouTube': 'bg-red-50 text-red-600',
      '知乎': 'bg-blue-50 text-blue-600',
      'Hacker News': 'bg-orange-50 text-orange-600',
      'LinkedIn': 'bg-blue-50 text-blue-600',
      '淘宝': 'bg-orange-50 text-orange-600',
      'Amazon': 'bg-orange-50 text-orange-600',
    };
    return colors[platform] || 'bg-gray-50 text-gray-600';
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'social': return '🌐';
      case 'video': return '📹';
      case 'news': return '📰';
      case 'developer': return '💻';
      case 'ecommerce': return '🛒';
      case 'blog': return '📝';
      case 'forum': return '💬';
      case 'live': return '🎬';
      case 'search': return '🔍';
      default: return '🌐';
    }
  };

  // 计算主要来源类型
  const topSourceType = opportunity.sourceDistribution?.length > 0 
    ? opportunity.sourceDistribution.sort((a, b) => b.count - a.count)[0] 
    : null;

  return (
    <div 
      className="card hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className={`tag ${getSourceTagColor(opportunity.dataSources[0]?.platform || '')}`}>
            {opportunity.dataSources[0]?.platform}
          </span>
          <span className="tag tag-purple">{opportunity.category}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(opportunity.id);
          }}
          className={`p-2 rounded-lg transition-colors ${
            isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
          }`}
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
        {opportunity.title}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {opportunity.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {opportunity.tags.map((tag) => (
          <span key={tag} className="tag bg-gray-100 text-gray-600">{tag}</span>
        ))}
      </div>

      {/* 来源分布统计 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 flex items-center space-x-1">
            <Globe className="w-3 h-3" />
            <span>来源分布</span>
          </span>
          <span className="text-xs text-gray-400">{opportunity.dataSources.length}个来源</span>
        </div>
        <div className="flex items-center space-x-1">
          {opportunity.sourceDistribution?.slice(0, 4).map((dist) => (
            <div 
              key={dist.type}
              className={`h-2 rounded-full ${dist.color}`}
              style={{ width: `${dist.percentage}%`, minWidth: '8px' }}
              title={`${dist.typeLabel}: ${dist.count}条 (${dist.percentage}%)`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {opportunity.sourceDistribution?.slice(0, 3).map((dist) => (
            <span key={dist.type} className="text-xs text-gray-500 flex items-center space-x-1">
              <span>{getSourceTypeIcon(dist.type)}</span>
              <span>{dist.typeLabel}</span>
              <span className="font-medium text-gray-700">{dist.count}</span>
            </span>
          ))}
          {(opportunity.sourceDistribution?.length || 0) > 3 && (
            <span className="text-xs text-gray-400">+{(opportunity.sourceDistribution?.length || 0) - 3}种</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <TrendingUp className="w-3 h-3 text-primary-600" />
          </div>
          <span className="text-lg font-bold text-primary-600">{opportunity.validationScore}%</span>
          <p className="text-xs text-gray-500">验证</p>
        </div>

        <div className={`rounded-lg p-2 text-center ${getPainLevelColor(opportunity.painLevel)}`}>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <AlertCircle className="w-3 h-3" />
          </div>
          <span className="text-lg font-bold">{opportunity.painLevel}</span>
          <p className="text-xs">痛度</p>
        </div>

        <div className={`rounded-lg p-2 text-center ${getCompetitionColor(opportunity.competitionLevel)}`}>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Users className="w-3 h-3" />
          </div>
          <span className="text-lg font-bold">{opportunity.competitionLevel}%</span>
          <p className="text-xs">竞争</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <BarChart2 className="w-3 h-3 text-gray-400" />
          </div>
          <span className="text-lg font-bold text-gray-900">{opportunity.mentions.toLocaleString()}</span>
          <p className="text-xs text-gray-500">提及</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className={`text-sm font-semibold ${getPotentialColor(opportunity.potential)}`}>
          {opportunity.potential === 'very_high' ? '🔥 极高潜力' : 
           opportunity.potential === 'high' ? '📈 高潜力' : 
           opportunity.potential === 'medium' ? '📊 中潜力' : '📉 低潜力'}
        </div>

        <div className="flex items-center space-x-2 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm">查看详情</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={opportunity.dataSources[0]?.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center space-x-1 text-sm text-gray-500 hover:text-primary-600"
        >
          <span>查看来源</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
