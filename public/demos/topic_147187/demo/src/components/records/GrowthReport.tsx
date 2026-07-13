import { ChartCard } from './ChartCard';
import { useRecordStore } from '../../stores/recordStore';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';

export const GrowthReport = () => {
  const { growthData, records } = useRecordStore();

  const weeklyLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const lineChartData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: '学习时长(小时)',
        data: growthData.weeklyHours,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const barChartData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: '平均得分',
        data: growthData.weeklyScores,
        backgroundColor: '#14b8a6',
        borderRadius: 6,
      },
    ],
  };

  const doughnutChartData = {
    labels: Object.keys(growthData.subjectScores),
    datasets: [
      {
        data: Object.values(growthData.subjectScores),
        backgroundColor: ['#6366f1', '#ef4444', '#22c55e', '#eab308'],
        borderWidth: 0,
      },
    ],
  };

  const totalHours = growthData.weeklyHours.reduce((a, b) => a + b, 0);
  const avgScore = Math.round(
    growthData.weeklyScores.reduce((a, b) => a + b, 0) / growthData.weeklyScores.length
  );
  const totalDays = records.length;
  const maxScore = Math.max(...records.map((r) => r.score));

  const stats = [
    {
      icon: Clock,
      label: '本周学习',
      value: `${totalHours}小时`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      icon: Target,
      label: '平均得分',
      value: `${avgScore}分`,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      icon: Award,
      label: '学习天数',
      value: `${totalDays}天`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: TrendingUp,
      label: '最高得分',
      value: `${maxScore}分`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          type="line"
          title="学习时长趋势"
          icon={TrendingUp}
          data={lineChartData}
        />
        <ChartCard
          type="bar"
          title="得分情况"
          icon={Target}
          data={barChartData}
        />
        <ChartCard
          type="doughnut"
          title="科目分布"
          icon={Award}
          data={doughnutChartData}
          options={{
            plugins: {
              legend: {
                display: true,
                position: 'bottom' as const,
              },
            },
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">最近活动</h3>
        <div className="space-y-3">
          {growthData.recentActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {activity.date.slice(5)}
                </span>
                <span className="text-xs text-gray-400">
                  {activity.date.slice(0, 4)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.activity}</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activity.duration}分钟
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};