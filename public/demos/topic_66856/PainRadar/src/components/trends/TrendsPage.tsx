import { useEffect, useState } from 'react';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useAppStore } from '../../store';

export function TrendsPage() {
  const { trends, fetchTrends } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTrends();
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [fetchTrends]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500">正在分析趋势数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">趋势分析</h2>
          <p className="text-gray-500 mt-1">洞察市场动向，发现蓝海机会</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {trends.map((trend) => (
          <div key={trend.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="tag tag-blue">{trend.category}</span>
                <h3 className="text-lg font-semibold text-gray-900 mt-2">{trend.title}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                trend.growthRate > 200 ? 'bg-red-50 text-red-600' : 
                trend.growthRate > 100 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">增长率</span>
                <span className={`text-xl font-bold ${
                  trend.growthRate > 200 ? 'text-red-600' : 
                  trend.growthRate > 100 ? 'text-orange-600' : 'text-green-600'
                }`}>+{trend.growthRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">讨论量</span>
                <span className="text-lg font-semibold text-gray-900">{(trend.volume / 1000).toFixed(1)}K</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500 mb-2">热门关键词</div>
              <div className="flex flex-wrap gap-2">
                {trend.keywords.map((kw) => (
                  <span key={kw} className="tag bg-gray-100 text-gray-600">{kw}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">讨论量对比</h3>
          </div>
          <div className="space-y-4">
            {trends.map((trend) => (
              <div key={trend.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{trend.title}</span>
                  <span className="text-sm font-medium text-gray-900">{(trend.volume / 1000).toFixed(1)}K</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${(trend.volume / Math.max(...trends.map(t => t.volume)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-accent-600" />
            <h3 className="font-semibold text-gray-900">增长率趋势</h3>
          </div>
          <div className="space-y-4">
            {trends.map((trend) => (
              <div key={trend.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{trend.title}</span>
                  <span className={`text-sm font-medium ${
                    trend.growthRate > 200 ? 'text-red-600' : 
                    trend.growthRate > 100 ? 'text-orange-600' : 'text-green-600'
                  }`}>+{trend.growthRate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      trend.growthRate > 200 ? 'bg-red-500' : 
                      trend.growthRate > 100 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(trend.growthRate / Math.max(...trends.map(t => t.growthRate)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
