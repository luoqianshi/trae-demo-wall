import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookMarked, Check, X, Volume2, RefreshCw, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import type { UserVocabulary } from '../types';

const VocabularyPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'review' | 'list'>('review');
  const [todayWords, setTodayWords] = useState<UserVocabulary[]>([]);
  const [allWords, setAllWords] = useState<UserVocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayReviewed, setTodayReviewed] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  const fetchTodayReview = async () => {
    try {
      const res: any = await api.get('/vocabulary/today');
      if (res.code === 200) {
        setTodayWords(res.data.words);
        setTodayReviewed(res.data.todayReviewed);
      }
    } catch (err) {
      console.error('获取今日复习失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllWords = async () => {
    try {
      const res: any = await api.get('/vocabulary');
      if (res.code === 200) {
        setAllWords(res.data.words);
      }
    } catch (err) {
      console.error('获取生词本失败:', err);
    }
  };

  useEffect(() => {
    if (mode === 'review') {
      fetchTodayReview();
    } else {
      fetchAllWords();
    }
  }, [mode]);

  const handleKnown = async () => {
    const word = todayWords[currentIndex];
    if (!word) return;

    try {
      const res: any = await api.put(`/vocabulary/${word.id}/mark-known`);
      if (res.code === 200) {
        if (res.data.removed) {
          setMasteredCount((c) => c + 1);
        }
        nextWord();
      }
    } catch (err) {
      console.error('标记认识失败:', err);
    }
  };

  const handleUnknown = () => {
    nextWord();
  };

  const nextWord = () => {
    setShowMeaning(false);
    if (currentIndex < todayWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentWord = todayWords[currentIndex];
  const progress = todayWords.length > 0 ? ((currentIndex + 1) / todayWords.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-medium text-gray-800">生词本</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-4 flex gap-2">
          <button
            onClick={() => setMode('review')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'review'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            每日复习
          </button>
          <button
            onClick={() => setMode('list')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BookMarked className="w-4 h-4 inline mr-1" />
            全部生词
          </button>
        </div>

        {mode === 'review' && (
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : todayWords.length === 0 ? (
              <div className="text-center py-16">
                <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">今天没有需要复习的生词</p>
                <p className="text-sm text-gray-400">阅读文章时点击单词可添加到生词本</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    第 {currentIndex + 1} / {todayWords.length} 个
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    今日已掌握 {masteredCount} 个
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className="p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setShowMeaning(!showMeaning)}
                  >
                    <h2 className="text-4xl font-bold text-gray-800 mb-3">
                      {currentWord?.word}
                    </h2>
                    {currentWord?.phonetic && (
                      <div className="flex items-center gap-2 mb-6 text-gray-500">
                        <span>{currentWord.phonetic}</span>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {showMeaning ? (
                      <div className="text-center w-full">
                        <div className="border-t border-gray-100 pt-6 mt-2">
                          <p className="text-lg text-gray-700 mb-4">
                            {currentWord?.meaning}
                          </p>
                          {currentWord?.example && (
                            <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">
                              {currentWord.example}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-6">点击单词可隐藏释义</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">点击查看释义</p>
                    )}
                  </div>

                  {showMeaning && (
                    <div className="border-t border-gray-100 p-4 flex gap-3">
                      <button
                        onClick={handleUnknown}
                        className="flex-1 py-3 bg-red-50 text-red-500 font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        不认识
                      </button>
                      <button
                        onClick={handleKnown}
                        className="flex-1 py-3 bg-green-50 text-green-600 font-medium rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        认识
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>💡 连续5次标记"认识"，单词将自动移出生词本</p>
                </div>
              </>
            )}
          </div>
        )}

        {mode === 'list' && (
          <div className="p-4">
            {allWords.length === 0 ? (
              <div className="text-center py-16">
                <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">生词本是空的</p>
                <p className="text-sm text-gray-400">阅读文章时点击单词可添加到生词本</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allWords.map((word) => (
                  <div
                    key={word.id}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            {word.word}
                          </h3>
                          {word.phonetic && (
                            <span className="text-sm text-gray-400">
                              {word.phonetic}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{word.meaning}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>连续认识: {word.consecutiveKnown}/5</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-green-500 h-1 rounded-full"
                              style={{
                                width: `${(word.consecutiveKnown / 5) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-2xl mx-auto flex">
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/home')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">首页</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-blue-600"
            onClick={() => navigate('/vocabulary')}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-xs">生词本</span>
          </button>
          <button
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
            onClick={() => navigate('/history')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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

export default VocabularyPage;
