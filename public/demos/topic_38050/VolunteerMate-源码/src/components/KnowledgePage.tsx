import { useState } from 'react';
import { Heart, BookOpen, Bookmark, ChevronRight, X } from 'lucide-react';
import { knowledgeList } from '../data/knowledge';
import { useStore } from '../store/useStore';

export function KnowledgePage() {
  const { favorites, toggleFavorite } = useStore();
  const [selectedKnowledge, setSelectedKnowledge] = useState<typeof knowledgeList[0] | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const displayedKnowledge = showFavoritesOnly
    ? knowledgeList.filter(k => favorites.includes(k.id))
    : knowledgeList;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-white text-2xl font-bold">公益知识</h1>
              <p className="text-sky-200 text-sm">每日学习一点公益知识</p>
            </div>
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              showFavoritesOnly
                ? 'bg-white text-sky-600'
                : 'bg-white/20 text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 inline mr-1" />
            收藏
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {displayedKnowledge.length > 0 ? (
          displayedKnowledge.map((knowledge) => (
            <div
              key={knowledge.id}
              onClick={() => setSelectedKnowledge(knowledge)}
              className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                  knowledge.category === '环保' ? 'bg-emerald-100' :
                  knowledge.category === '捐赠' ? 'bg-amber-100' :
                  knowledge.category === '帮扶' ? 'bg-violet-100' :
                  'bg-rose-100'
                }`}>
                  {knowledge.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{knowledge.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      knowledge.category === '环保' ? 'bg-emerald-100 text-emerald-600' :
                      knowledge.category === '捐赠' ? 'bg-amber-100 text-amber-600' :
                      knowledge.category === '帮扶' ? 'bg-violet-100 text-violet-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {knowledge.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {knowledge.content.split('\n')[0]}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">点击阅读全文</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(knowledge.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        favorites.includes(knowledge.id)
                          ? 'text-rose-500 bg-rose-50'
                          : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${favorites.includes(knowledge.id) ? 'fill-current' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <span className="text-5xl mb-3 block">📚</span>
            <p className="text-gray-400">还没有收藏</p>
            <p className="text-sm text-gray-300">点击文章中的小心心收藏</p>
          </div>
        )}
      </div>

      {/* Article Modal */}
      {selectedKnowledge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden animate-slideUp">
              {/* Header */}
              <div className={`p-6 ${
                selectedKnowledge.category === '环保' ? 'bg-emerald-500' :
                selectedKnowledge.category === '捐赠' ? 'bg-amber-500' :
                selectedKnowledge.category === '帮扶' ? 'bg-violet-500' :
                'bg-rose-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedKnowledge.icon}</span>
                    <div>
                      <span className="text-white/80 text-sm">{selectedKnowledge.category}</span>
                      <h2 className="text-white text-xl font-bold">{selectedKnowledge.title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedKnowledge(null)}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="prose prose-emerald max-w-none">
                  {selectedKnowledge.content.split('\n').map((line, index) => (
                    <p
                      key={index}
                      className={`mb-3 text-gray-700 leading-relaxed ${
                        line.startsWith('【') ? 'font-bold text-gray-800 mt-6 mb-2' : ''
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>

                {/* Action */}
                <button
                  onClick={() => toggleFavorite(selectedKnowledge.id)}
                  className={`w-full mt-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    favorites.includes(selectedKnowledge.id)
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${favorites.includes(selectedKnowledge.id) ? 'fill-current' : ''}`}
                  />
                  {favorites.includes(selectedKnowledge.id) ? '已收藏' : '收藏文章'}
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-slideUp { animation: slideUp 0.3s ease-out; }
          `}</style>
        </div>
      )}
    </div>
  );
}
