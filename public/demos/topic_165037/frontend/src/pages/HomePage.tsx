import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Sparkles, RefreshCw, Menu, BookMarked, History, User, Home } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import type { Article } from '../types';
import { EXAM_STAGE_NAMES } from '../types';

const HomePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const fetchArticles = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res: any = await api.get('/articles', {
        params: { size: 10 },
      });
      if (res.code === 200) {
        setArticles(res.data.articles);
      }
    } catch (err) {
      console.error('获取文章列表失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleRefresh = () => {
    fetchArticles(true);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">阅知AI</h1>
              <p className="text-xs text-gray-500">
                备考：{EXAM_STAGE_NAMES[user?.examStage || 1]}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">今日推荐</h2>
          </div>
          <p className="text-blue-100 text-sm">
            AI为你精选最新热点文章，适配你的备考水平
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 shadow-sm animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => navigate(`/article/${article.id}`)}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                    {article.difficultyName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {article.summary}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{article.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{article.wordCount}词</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{article.sourceName}</span>
                  </div>
                </div>
              </div>
            ))}

            {articles.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无文章，请下拉刷新</p>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-2xl mx-auto flex">
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-blue-600"
            onClick={() => navigate('/home')}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">首页</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/vocabulary')}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-xs">生词本</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/history')}
          >
            <History className="w-5 h-5" />
            <span className="text-xs">历史</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700"
            onClick={() => setShowMenu(true)}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">我的</span>
          </button>
        </div>
      </nav>

      {showMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.nickname?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {user?.nickname || user?.email || '用户'}
                  </p>
                  <p className="text-sm text-gray-500">
                    备考：{EXAM_STAGE_NAMES[user?.examStage || 1]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/profile');
                }}
                className="w-full py-3 text-left px-4 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                设置备考阶段
              </button>
              <button
                onClick={() => {
                  handleLogout();
                }}
                className="w-full py-3 text-left px-4 rounded-lg hover:bg-red-50 text-red-500"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
