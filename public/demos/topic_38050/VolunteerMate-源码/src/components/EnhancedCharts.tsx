import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useStore } from '../store/useStore';
import { PieChart as PieIcon, Target, TrendingUp } from 'lucide-react';

const COLORS = ['#10B981', '#F43F5E', '#8B5CF6', '#0EA5E9'];

export function EnhancedCharts() {
  const { stats, getWeeklyData } = useStore();

  // Pie chart data - category distribution
  const pieData = [
    { name: '环保', value: stats.environmentalTasks, color: '#10B981' },
    { name: '捐赠', value: stats.donationTasks, color: '#F43F5E' },
    { name: '帮扶', value: stats.helpTasks, color: '#8B5CF6' },
    { name: '传播', value: stats.spreadTasks, color: '#0EA5E9' },
  ].filter(d => d.value > 0);

  // Radar chart data - user profile
  const radarData = [
    { subject: '环保', A: Math.min(100, stats.environmentalTasks * 10), fullMark: 100 },
    { subject: '捐赠', A: Math.min(100, stats.donationTasks * 20), fullMark: 100 },
    { subject: '帮扶', A: Math.min(100, stats.helpTasks * 10), fullMark: 100 },
    { subject: '传播', A: Math.min(100, stats.spreadTasks * 10), fullMark: 100 },
    { subject: '坚持', A: Math.min(100, stats.currentStreak * 15), fullMark: 100 },
    { subject: '时长', A: Math.min(100, stats.totalMinutes / 15), fullMark: 100 },
  ];

  const weeklyData = getWeeklyData();

  const totalTasks = stats.environmentalTasks + stats.donationTasks + stats.helpTasks + stats.spreadTasks;

  if (totalTasks === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <PieIcon className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-gray-800 text-sm">数据可视化</span>
        </div>
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm text-gray-500 mb-1">还没有足够的数据</p>
          <p className="text-xs text-gray-400">完成打卡后查看你的公益画像</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pie Chart - Category Distribution */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <PieIcon className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-gray-800 text-sm">公益类型分布</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-800">{item.value}次</span>
                  <span className="text-xs text-gray-400">
                    {((item.value / totalTasks) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar Chart - User Profile */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-gray-800 text-sm">公益画像雷达</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
              <Radar
                name="公益能力"
                dataKey="A"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-gray-800 text-sm">本周公益时长</span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {weeklyData.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(4, (day.minutes / Math.max(...weeklyData.map(d => d.minutes), 1)) * 100)}%`,
                  minHeight: day.minutes > 0 ? '8px' : '4px',
                }}
              />
              <span className="text-xs text-gray-400 mt-1">{day.day.slice(1)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">
            本周累计：{weeklyData.reduce((sum, d) => sum + d.minutes, 0)} 分钟
          </span>
        </div>
      </div>
    </div>
  );
}