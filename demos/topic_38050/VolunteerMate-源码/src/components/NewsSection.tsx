import { useState } from 'react';
import { Newspaper, ChevronRight, Clock, Tag } from 'lucide-react';
import { newsData, NewsItem } from '../data/news';

export function NewsSection() {
  const [expanded, setExpanded] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const displayNews = expanded ? newsData : newsData.slice(0, 3);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '政策': 'bg-indigo-100 text-indigo-700',
      '活动': 'bg-amber-100 text-amber-700',
      '招募': 'bg-emerald-100 text-emerald-700',
      '创新': 'bg-purple-100 text-purple-700',
      '环保': 'bg-teal-100 text-teal-700',
      '帮扶': 'bg-rose-100 text-rose-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          <span className="font-semibold text-sm">公益资讯</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-all"
        >
          {expanded ? '收起' : '更多'}
        </button>
      </div>

      {/* News list */}
      <div className="p-3 space-y-2">
        {displayNews.map((news) => (
          <div
            key={news.id}
            onClick={() => setSelectedNews(news)}
            className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-3 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-white flex items-center justify-center text-lg flex-shrink-0">
                {news.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${getCategoryColor(news.category)}`}>
                    {news.category}
                  </span>
                  <span className="text-xs text-gray-400">{news.date}</span>
                </div>
                <h4 className="font-medium text-sm text-gray-800 line-clamp-1">{news.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{news.summary}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Selected news detail */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp">
            <div className="bg-gradient-to-br from-slate-500 to-slate-600 px-5 pt-5 pb-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full bg-white/20`}>{selectedNews.category}</span>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <span className="text-sm">×</span>
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selectedNews.icon}</span>
                <h3 className="font-bold">{selectedNews.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <Clock className="w-3 h-3" />
                <span>{selectedNews.date}</span>
                <Tag className="w-3 h-3 ml-2" />
                <span>{selectedNews.source}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 leading-relaxed">{selectedNews.summary}</p>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">来源：{selectedNews.source}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}