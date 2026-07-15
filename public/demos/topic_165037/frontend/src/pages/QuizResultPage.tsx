import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BookOpen,
  Plus,
  Volume2,
  Sparkles,
} from 'lucide-react';
import api from '../utils/api';
import type { QuizResult, ArticleDetail } from '../types';

const QuizResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<QuizResult | null>(
    location.state?.result || null
  );
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo] = useState<any>(null);
  const [addingWord, setAddingWord] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res: any = await api.get(`/articles/${id}`);
      if (res.code === 200) {
        setArticle(res.data);
      }
    } catch (err) {
      console.error('获取文章失败:', err);
    }
  };

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!cleanWord) return;

    setSelectedWord(cleanWord);

    const mockMeanings: Record<string, string> = {
      artificial: '人工的；人造的',
      intelligence: '智力；智能',
      technology: '技术；科技',
      transform: '转变；改变',
      industry: '工业；行业',
      health: '健康',
      finance: '金融；财政',
      system: '系统',
      machine: '机器',
      learning: '学习',
      algorithm: '算法',
      diagnose: '诊断',
      disease: '疾病',
      predict: '预测',
      market: '市场',
      trend: '趋势',
      create: '创造',
      development: '发展',
      opportunity: '机会',
      challenge: '挑战',
      improve: '改善；提高',
      efficiency: '效率',
      important: '重要的',
      question: '问题',
      privacy: '隐私',
      ethics: '伦理；道德',
      future: '未来',
      research: '研究',
      ensure: '确保',
      responsible: '负责任的',
      emphasize: '强调',
      human: '人类',
      oversight: '监督；疏忽',
      clear: '清楚的',
      regulation: '规定；条例',
      guide: '指导；引导',
      progress: '进步；前进',
      relationship: '关系',
      continue: '继续',
      evolve: '进化；发展',
      key: '关键；钥匙',
      tool: '工具',
      enhance: '增强；提高',
      capability: '能力；才能',
      replace: '代替',
      entirely: '完全地',
    };

    setWordInfo({
      word: cleanWord,
      phonetic: '/.../',
      meaning: mockMeanings[cleanWord] || '暂无释义',
      example: `Example sentence with the word "${cleanWord}".`,
    });
  };

  const handleAddWord = async () => {
    if (!wordInfo || addingWord) return;
    setAddingWord(true);

    try {
      const res: any = await api.post('/vocabulary', {
        word: wordInfo.word,
        phonetic: wordInfo.phonetic,
        meaning: wordInfo.meaning,
        example: wordInfo.example,
      });

      if (res.code === 200) {
        alert('已添加到生词本！');
      }
    } catch (err: any) {
      if (err.response?.data?.message?.includes('已在生词本')) {
        alert('该单词已在生词本中');
      } else {
        alert('添加失败，请重试');
      }
    } finally {
      setAddingWord(false);
    }
  };

  const renderTextWithClickableWords = (text: string) => {
    return text.split(/(\s+)/).map((part, idx) => {
      if (/[a-zA-Z]/.test(part)) {
        return (
          <span
            key={idx}
            onClick={() => handleWordClick(part)}
            className="cursor-pointer hover:bg-blue-100 transition-colors rounded px-0.5"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const scoreColor =
    result.score >= 80
      ? 'text-green-500'
      : result.score >= 60
      ? 'text-yellow-500'
      : 'text-red-500';

  const scoreBg =
    result.score >= 80
      ? 'from-green-400 to-green-600'
      : result.score >= 60
      ? 'from-yellow-400 to-yellow-600'
      : 'from-red-400 to-red-600';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="ml-2 text-base font-medium text-gray-800">测验结果</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm text-center">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#e5e7eb"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#scoreGradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${(result.score / 100) * 352} 352`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>
                {result.score}
              </span>
              <span className="text-xs text-gray-500">分</span>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-sm">
            <div>
              <p className="text-gray-500">总题数</p>
              <p className="text-xl font-bold text-gray-800">
                {result.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-gray-500">正确</p>
              <p className="text-xl font-bold text-green-500">{result.correctCount}</p>
            </div>
            <div>
              <p className="text-gray-500">错误</p>
              <p className="text-xl font-bold text-red-500">
                {result.totalQuestions - result.correctCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            答案解析
          </h2>

          <div className="space-y-6">
            {result.answers.map((ans, idx) => (
              <div
                key={ans.questionId}
                className={`p-4 rounded-xl border-2 ${
                  ans.isCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
                      ans.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {ans.isCorrect ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">
                      {idx + 1}. {ans.question}
                    </p>
                  </div>
                </div>

                <div className="ml-9 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">你的答案：</span>
                    <span
                      className={`font-medium ${
                        ans.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {ans.userAnswer || '未作答'}
                    </span>
                  </div>
                  {!ans.isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">正确答案：</span>
                      <span className="font-medium text-green-600">
                        {ans.correctAnswer}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 text-gray-600">
                    <span className="text-gray-500">解析：</span>
                    {ans.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {article && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                文章与翻译
              </h2>
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="px-4 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
              >
                {showTranslation ? '隐藏翻译' : '显示翻译'}
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              💡 提示：点击单词可查看释义并添加到生词本
            </p>

            <div className="prose prose-lg max-w-none">
              {article.content.split('\n\n').map((paragraph, idx) => (
                <div key={idx}>
                  <p className="text-gray-800 leading-relaxed mb-3 text-base">
                    {renderTextWithClickableWords(paragraph)}
                  </p>
                  {showTranslation && (
                    <p className="text-gray-500 leading-relaxed mb-6 text-sm bg-gray-50 p-3 rounded-lg">
                      {article.translatedContent.split('\n\n')[idx]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate('/home')}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            返回首页
          </button>
          <button
            onClick={() => navigate('/vocabulary')}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            查看生词本
          </button>
        </div>
      </main>

      {selectedWord && wordInfo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => {
            setSelectedWord(null);
            setWordInfo(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {wordInfo.word}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-sm">{wordInfo.phonetic}</span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">释义</h4>
              <p className="text-gray-800">{wordInfo.meaning}</p>
            </div>

            {wordInfo.example && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">例句</h4>
                <p className="text-gray-700 italic">{wordInfo.example}</p>
              </div>
            )}

            <button
              onClick={handleAddWord}
              disabled={addingWord}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {addingWord ? '添加中...' : '添加到生词本'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultPage;
