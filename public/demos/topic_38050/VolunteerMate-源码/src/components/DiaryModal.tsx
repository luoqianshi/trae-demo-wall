import { useState } from 'react';
import { BookOpen, Calendar, Heart, ChevronRight, X, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateDiaryEntry, DiaryEntry } from '../data/diary';

interface DiaryModalProps {
  onClose: () => void;
}

export function DiaryModal({ onClose }: DiaryModalProps) {
  const { checkIns } = useStore();
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  // Generate diary entries from check-ins
  const diaryEntries: DiaryEntry[] = checkIns
    .slice(-20)
    .reverse()
    .map(c => generateDiaryEntry(c.taskName, c.taskIcon, c.category, c.duration, c.timestamp));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '环保': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      '捐赠': 'bg-rose-100 text-rose-700 border-rose-200',
      '帮扶': 'bg-violet-100 text-violet-700 border-violet-200',
      '传播': 'bg-sky-100 text-sky-700 border-sky-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-slideUp shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-5 pt-6 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-6 h-6" />
            <span className="text-lg font-bold">公益日记本</span>
          </div>
          <p className="text-sm text-white/90">记录每一次善意，AI 为你生成感悟</p>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {diaryEntries.length > 0 ? (
            <div className="space-y-3">
              {diaryEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-3 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg flex-shrink-0">
                      {entry.taskIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-800 truncate">{entry.taskName}</h4>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getCategoryColor(entry.category)}`}>
                          {entry.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{entry.date}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{entry.mood}</span>
                        <p className="text-xs text-indigo-600 line-clamp-1">{entry.reflection}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📔</div>
              <p className="text-gray-500 text-sm mb-1">还没有日记记录</p>
              <p className="text-xs text-gray-400">完成打卡后 AI 会自动为你生成感悟</p>
            </div>
          )}
        </div>

        {/* Selected entry detail */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 px-5 py-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{selectedEntry.date}</span>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedEntry.taskIcon}</span>
                  <h3 className="font-semibold">{selectedEntry.taskName}</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-sm text-gray-600">{selectedEntry.duration} 分钟公益时间</span>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-medium text-indigo-600">AI 感悟</span>
                  </div>
                  <p className="text-sm text-indigo-800 leading-relaxed">{selectedEntry.reflection}</p>
                </div>
                <div className="text-center">
                  <span className="text-3xl">{selectedEntry.mood}</span>
                  <p className="text-xs text-gray-400 mt-1">今日心情</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.15, 1.15, 0.5, 1); }
      `}</style>
    </div>
  );
}