import { TrendingUp, Camera, Video, MapPin, Sparkles, BarChart3 } from 'lucide-react';
import type { TravelCompletion } from '../data/types';

interface TravelProgressProps {
  completion: TravelCompletion;
}

export function TravelProgress({ completion }: TravelProgressProps) {
  const progress = Math.round((completion.recordedDays / completion.totalDays) * 100);

  const stats = [
    { icon: Camera, label: '照片', value: completion.photos, color: 'text-pink-500' },
    { icon: Video, label: '视频', value: completion.videos, color: 'text-purple-500' },
    { icon: MapPin, label: '地点', value: completion.locations, color: 'text-emerald-500' },
    { icon: Sparkles, label: '事件', value: completion.events, color: 'text-orange-500' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">旅行完成度</h3>
            <p className="text-xs text-gray-500">
              Day1 ~ Day{completion.totalDays}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
            {progress}%
          </p>
          <p className="text-xs text-gray-500">当前完成</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>已记录 {completion.recordedDays} 天</span>
          <span>共 {completion.totalDays} 天</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-full transition-all duration-1000 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="text-center p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <Icon size={16} className={`${item.color} mx-auto mb-1.5`} />
              <p className="text-lg font-bold text-gray-800">{item.value}</p>
              <p className="text-[10px] text-gray-500">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <TrendingUp size={12} />
        <span>已记录</span>
        <span className="text-gray-600 font-medium">{completion.photos} 张照片</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600 font-medium">{completion.videos} 段视频</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600 font-medium">{completion.locations} 个地点</span>
      </div>
    </div>
  );
}
