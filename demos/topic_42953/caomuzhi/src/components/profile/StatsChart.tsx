import { useStore } from '@/store/useStore';
import { Leaf, TrendingUp, Calendar, Award } from 'lucide-react';

const StatsChart = () => {
  const { collections, history } = useStore();

  const categoryStats = collections.reduce((stats, item) => {
    stats[item.category] = (stats[item.category] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCount = Math.max(...Object.values(categoryStats), 1);

  const recognitionStats = history.reduce((stats, item) => {
    const date = item.identifiedAt.split('T')[0];
    stats[date] = (stats[date] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);

  const recentDates = Object.keys(recognitionStats)
    .sort()
    .slice(-7);

  const totalRecognition = recentDates.reduce((sum, date) => sum + recognitionStats[date], 0);

  return (
    <div className="glass rounded-card p-6">
      <h3 className="text-xl font-bold text-text-dark mb-6">我的数据</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-bg-beige rounded-card text-center">
          <Leaf className="w-6 h-6 text-plant-green mx-auto mb-2" />
          <div className="text-2xl font-bold text-plant-green">{collections.length}</div>
          <div className="text-text-medium text-sm">收藏总数</div>
        </div>
        <div className="p-4 bg-bg-beige rounded-card text-center">
          <TrendingUp className="w-6 h-6 text-plant-medium mx-auto mb-2" />
          <div className="text-2xl font-bold text-plant-medium">{history.length}</div>
          <div className="text-text-medium text-sm">识别总数</div>
        </div>
        <div className="p-4 bg-bg-beige rounded-card text-center">
          <Calendar className="w-6 h-6 text-accent-amber mx-auto mb-2" />
          <div className="text-2xl font-bold text-accent-amber">{totalRecognition}</div>
          <div className="text-text-medium text-sm">近7天识别</div>
        </div>
        <div className="p-4 bg-bg-beige rounded-card text-center">
          <Award className="w-6 h-6 text-emphasis-coral mx-auto mb-2" />
          <div className="text-2xl font-bold text-emphasis-coral">
            {Math.floor(collections.length / 10) + 1}
          </div>
          <div className="text-text-medium text-sm">获得徽章</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-text-dark mb-3">收藏分类分布</h4>
        <div className="space-y-3">
          {sortedCategories.map(([category, count]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-medium text-sm">{category}</span>
                <span className="text-text-dark text-sm">{count}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-plant-green to-plant-medium rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-text-dark mb-3">近7天识别趋势</h4>
        <div className="flex items-end justify-between h-32 gap-2">
          {recentDates.map((date) => {
            const count = recognitionStats[date] || 0;
            const maxRecent = Math.max(...recentDates.map((d) => recognitionStats[d] || 0), 1);
            const height = (count / maxRecent) * 100;

            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-plant-green to-plant-medium rounded-t-lg transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <div className="w-full h-8" />
                </div>
                <span className="text-xs text-text-medium">
                  {date.split('-').slice(1).join('/')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsChart;
