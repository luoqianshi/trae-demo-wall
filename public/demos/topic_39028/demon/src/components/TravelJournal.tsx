import { BookOpen, Camera, MapPin, Clock, Sparkles } from 'lucide-react';
import type { JournalEntry } from '../data/types';

interface TravelJournalProps {
  entries: JournalEntry[];
}

export function TravelJournal({ entries }: TravelJournalProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-orange-500" />
          <h3 className="text-xl font-bold text-gray-800">AI 旅行手账</h3>
        </div>
        <p className="text-sm text-gray-500">
          旅行开始后，AI 会自动为你生成每日手账记录。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
          <BookOpen size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">AI 旅行手账</h3>
          <p className="text-xs text-gray-500">每次上传新资料，AI 自动补充手账内容</p>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry, idx) => {
          const date = new Date(entry.date);
          const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;
          const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];

          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-800">{monthDay}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                      星期{weekday}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">AI 自动生成</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {entry.aiSummary}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Camera size={12} className="text-orange-500" />
                  <span>+{entry.newPhotos} 张照片</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-orange-500" />
                  <span>{entry.locationCount} 个地点</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-orange-500" />
                  <span>{entry.stayDuration}</span>
                </div>
              </div>

              {entry.insight && (
                <div className="mt-3 p-3 rounded-xl bg-orange-50/50 border border-orange-100/60">
                  <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium mb-1">
                    <Sparkles size={12} />
                    <span>AI 洞察</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{entry.insight}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 border border-orange-100/60">
        <div className="flex items-center gap-2 text-orange-600 text-xs font-medium mb-1.5">
          <Sparkles size={12} />
          <span>持续记录</span>
        </div>
        <p className="text-xs text-gray-600">
          AI 旅行手账将持续积累内容。旅行结束后，系统将自动生成最终版旅行回忆册。
        </p>
      </div>
    </div>
  );
}
