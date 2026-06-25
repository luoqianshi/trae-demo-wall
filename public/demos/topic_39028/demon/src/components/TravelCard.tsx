import { useNavigate } from 'react-router-dom';
import { MapPin, Image as ImageIcon, Video, FileText, Sparkles, Loader2 } from 'lucide-react';
import type { Travel } from '../data/mockData';

interface TravelCardProps {
  travel: Travel;
}

export function TravelCard({ travel }: TravelCardProps) {
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const ai = travel.aiData;

  return (
    <div
      onClick={() => navigate(`/travel/${travel.id}`)}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={travel.coverImage}
          alt={travel.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {travel.aiAnalysisStatus === 'completed' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs font-medium shadow-md">
            <Sparkles size={12} />
            <span>AI 已整理</span>
          </div>
        )}

        {travel.aiAnalysisStatus === 'processing' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-medium shadow-md">
            <Loader2 size={12} className="animate-spin" />
            <span>AI 整理中 {travel.aiProgress}%</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-1">{travel.title}</h3>
          <div className="flex items-center gap-1 text-white/85 text-sm">
            <MapPin size={14} />
            <span>{travel.location}</span>
          </div>
        </div>
      </div>

      {ai && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-orange-50/30 to-transparent">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-orange-500 font-semibold mb-2">
            <Sparkles size={10} />
            <span>AI 数据来源</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <ImageIcon size={12} className="text-pink-400" />
              <span className="font-medium text-gray-800">{ai.photos}</span>
              <span>张照片</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Video size={12} className="text-purple-400" />
              <span className="font-medium text-gray-800">{ai.videos}</span>
              <span>段视频</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <FileText size={12} className="text-blue-400" />
              <span className="font-medium text-gray-800">{ai.orders}</span>
              <span>份订单</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Sparkles size={12} className="text-orange-400" />
              <span className="font-medium text-gray-800">{ai.aiEvents}</span>
              <span>条 AI 事件</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between text-gray-500 text-sm">
          <div className="flex items-center gap-1">
            <span>
              {formatDate(travel.startDate)} - {formatDate(travel.endDate)}
            </span>
          </div>
          <span className="text-gray-400">{travel.days} 天</span>
        </div>
      </div>
    </div>
  );
}
