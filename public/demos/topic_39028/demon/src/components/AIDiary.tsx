import { Sparkles, Edit3, Camera, MapPin, Clock } from 'lucide-react';
import type { AIDiaryContent, JournalEntry } from '../data/types';

interface AIDiaryProps {
  content: string | AIDiaryContent;
  journalEntries?: JournalEntry[];
}

export function AIDiary({ content, journalEntries = [] }: AIDiaryProps) {
  const data: AIDiaryContent = typeof content === 'string' ? { summary: content, entries: [] } : content;

  const journalMap = new Map<string, JournalEntry>();
  journalEntries.forEach((j) => journalMap.set(j.date, j));

  return (
    <div className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 rounded-3xl p-6 md:p-8 shadow-sm border border-orange-100/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">AI 旅行手账</h3>
            <p className="text-xs text-gray-500">AI 根据你的照片和位置数据自动生成</p>
          </div>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 transition-colors rounded-full hover:bg-orange-50">
          <Edit3 size={14} />
          <span>编辑</span>
        </button>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-white/60 border border-orange-100/60 text-sm text-gray-700 leading-relaxed italic">
        <Sparkles size={14} className="inline-block mr-1.5 text-orange-500 -mt-0.5" />
        {data.summary}
      </div>

      <div className="space-y-8">
        {data.entries.map((entry, idx) => {
          const date = new Date(entry.date);
          const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;
          const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
          const journal = journalMap.get(entry.date);

          return (
            <article key={idx} className="relative pl-6 border-l-2 border-orange-200/70">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-orange-400" />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-gray-800">{monthDay}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                  星期{weekday}
                </span>
              </div>

              <div className="space-y-2.5 mb-4">
                {entry.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-[15px] text-gray-700 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {journal && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Camera size={12} className="text-orange-500" />
                      <span>+{journal.newPhotos} 张照片</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-orange-500" />
                      <span>{journal.locationCount} 个地点</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-orange-500" />
                      <span>{journal.stayDuration}</span>
                    </div>
                  </div>

                  {journal.insight && (
                    <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100/60">
                      <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium mb-1">
                        <Sparkles size={12} />
                        <span>AI 洞察</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{journal.insight}</p>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {journalEntries.length > 0 && (
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 border border-orange-100/60">
          <div className="flex items-center gap-2 text-orange-600 text-xs font-medium mb-1.5">
            <Sparkles size={12} />
            <span>持续记录</span>
          </div>
          <p className="text-xs text-gray-600">
            旅行手账将持续积累内容。旅行结束后，系统将自动生成最终版旅行回忆册。
          </p>
        </div>
      )}
    </div>
  );
}
