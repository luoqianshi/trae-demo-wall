import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Star, BookMarked } from 'lucide-react';
import api from '../utils/api';
import type { ReadingHistory } from '../types';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res: any = await api.get('/history');
      if (res.code === 200) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('获取历史记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-medium text-gray-800">阅读历史</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">还没有阅读记录</p>
            <button
              onClick={() => navigate('/home')}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              去阅读文章 →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/article/${item.articleVariant.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-medium text-gray-800 flex-1 pr-4">
                    {item.articleVariant.title}
                  </h3>
                  {item.score !== undefined && item.score !== null && (
                    <div
                      className={`flex items-center gap-1 font-bold ${getScoreColor(
                        item.score
                      )}`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span>{item.score}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {item.articleVariant.difficultyName}
                  </span>
                  {item.articleVariant.category && (
                    <span>{item.articleVariant.category}</span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(item.completedAt || item.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-2xl mx-auto flex">
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/home')}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">首页</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/vocabulary')}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-xs">生词本</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-blue-600"
            onClick={() => navigate('/history')}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">历史</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/profile')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">我的</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default HistoryPage;
