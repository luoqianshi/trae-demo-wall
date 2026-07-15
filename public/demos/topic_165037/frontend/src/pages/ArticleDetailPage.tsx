import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Send, BookOpen } from 'lucide-react';
import api from '../utils/api';
import type { ArticleDetail, QuizQuestion, QuizResult } from '../types';

const ArticleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
      fetchQuiz();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res: any = await api.get(`/articles/${id}`);
      if (res.code === 200) {
        setArticle(res.data);
      }
    } catch (err) {
      console.error('获取文章详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuiz = async () => {
    try {
      const res: any = await api.get(`/articles/${id}/quiz`);
      if (res.code === 200) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      console.error('获取题目失败:', err);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (submitting || !id) return;
    setSubmitting(true);

    try {
      const answersArr = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const res: any = await api.post(`/articles/${id}/quiz/submit`, {
        answers: answersArr,
      });

      if (res.code === 200) {
        navigate(`/quiz/${id}`, { state: { result: res.data } });
      }
    } catch (err) {
      console.error('提交答案失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">文章不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
            {article.title}
          </h1>
          {questions.length > 0 && (
            <button
              onClick={() => setShowQuiz(!showQuiz)}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              开始作答
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <article>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{article.sourceName || '来源：阅知AI'}</span>
              <span>·</span>
              <span>{article.wordCount}词</span>
              <span>·</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                {article.difficultyName}
              </span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            {article.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-gray-800 leading-relaxed mb-6 text-lg">
                {paragraph}
              </p>
            ))}
          </div>

          {questions.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <button
                onClick={() => setShowQuiz(true)}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                开始阅读测验（{questions.length}题）
              </button>
            </div>
          )}
        </article>
      </div>

      {showQuiz && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-50"
            onClick={() => setShowQuiz(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-96 max-w-full bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setShowQuiz(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="font-medium text-gray-800">阅读测验</h3>
              <div className="w-9" />
            </div>

            <div className="px-4 py-2 border-b border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>
                  第 {currentQuestion + 1} / {questions.length} 题
                </span>
                <span>{answeredCount} 题已答</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {questions.length > 0 && questions[currentQuestion] && (
                <div>
                  <p className="text-base font-medium text-gray-800 mb-6">
                    {questions[currentQuestion].question}
                  </p>

                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const optKey = `option${option}` as keyof QuizQuestion;
                      const isSelected =
                        answers[questions[currentQuestion].id] === option;
                      return (
                        <button
                          key={option}
                          onClick={() =>
                            handleSelectAnswer(
                              questions[currentQuestion].id,
                              option
                            )
                          }
                          className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                                isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {option}
                            </span>
                            <span className="text-gray-700">
                              {questions[currentQuestion][optKey]}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <button
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-1">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentQuestion === idx
                          ? 'bg-blue-500 w-6'
                          : answers[questions[idx].id]
                          ? 'bg-green-400'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  disabled={currentQuestion === questions.length - 1}
                  onClick={() =>
                    setCurrentQuestion((q) => Math.min(questions.length - 1, q + 1))
                  }
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || answeredCount === 0}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? '提交中...' : '提交答案'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ArticleDetailPage;
