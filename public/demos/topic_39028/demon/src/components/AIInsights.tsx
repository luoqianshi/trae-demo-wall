import { Sparkles, Heart, Camera, Clock, MapPin } from 'lucide-react';
import type { AIDataSource } from '../data/types';

interface AIInsightsProps {
  data: AIDataSource;
  travelId: string;
}

export function AIInsights({ data, travelId }: AIInsightsProps) {
  if (!data.happinessMoment) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-orange-500" />
          <h3 className="text-xl font-bold text-gray-800">AI 还在分析中</h3>
        </div>
        <p className="text-sm text-gray-500">
          AI 正在分析你的照片和位置数据，寻找最幸福的瞬间……
        </p>
      </div>
    );
  }

  const moment = data.happinessMoment;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">本次旅行统计</h3>
            <p className="text-xs text-gray-500">由 AI 从你的资料中自动汇总</p>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { value: data.photos, label: '张照片', color: 'from-pink-400 to-rose-500' },
            { value: data.videos, label: '段视频', color: 'from-purple-400 to-fuchsia-500' },
            { value: data.distance, label: '公里移动', color: 'from-blue-400 to-cyan-500' },
            { value: data.locations, label: '个地点', color: 'from-emerald-400 to-teal-500' },
            { value: data.days, label: '天旅程', color: 'from-amber-400 to-orange-500' },
            { value: data.aiEvents, label: '条 AI 事件', color: 'from-orange-400 to-red-400' },
          ].map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100"
            >
              <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${item.color} opacity-10 blur-xl`} />
              <p className={`text-2xl md:text-3xl font-bold bg-gradient-to-br ${item.color} bg-clip-text text-transparent`}>
                {item.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 rounded-3xl overflow-hidden shadow-sm border border-orange-100/60">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto">
            <img
              src={moment.image}
              alt={moment.location}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-orange-500 shadow-sm">
              <Heart size={12} className="fill-orange-500 text-orange-500" />
              <span>AI 认定最幸福时刻</span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-wider text-orange-500 font-semibold mb-2">
              Happiest Moment
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{moment.location}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
              <span>{moment.date}</span>
              <span>·</span>
              <span>{moment.time}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              <span className="font-semibold text-gray-800">AI 认为：</span>
              {moment.reason}。
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Camera size={14} className="text-orange-500" />
                <span className="text-gray-500">拍摄了</span>
                <span className="font-bold text-gray-800">{moment.photosTaken}</span>
                <span className="text-gray-500">张照片</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-orange-500" />
                <span className="text-gray-500">停留了</span>
                <span className="font-bold text-gray-800">{moment.stayDuration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-orange-500" />
                <span className="text-gray-500">地点</span>
                <span className="font-bold text-gray-800">{moment.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
