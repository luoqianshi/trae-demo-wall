import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, RotateCcw, Home, CheckCircle, XCircle, Star } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { OPERATION_LABELS, DIFFICULTY_LABELS } from '@/types';
import { generateQuestions } from '@/utils/questionGenerator';

const getGrade = (accuracy: number) => {
  if (accuracy >= 90) return { grade: 'A', emoji: '🏆', message: '太棒了！你是数学小天才！', color: 'text-yellow-500' };
  if (accuracy >= 80) return { grade: 'B', emoji: '🥇', message: '做得很好！继续保持！', color: 'text-green-500' };
  if (accuracy >= 70) return { grade: 'C', emoji: '🥈', message: '不错哦！再接再厉！', color: 'text-blue-500' };
  if (accuracy >= 60) return { grade: 'D', emoji: '🥉', message: '加油！多多练习！', color: 'text-orange-500' };
  return { grade: 'E', emoji: '💪', message: '别灰心！熟能生巧！', color: 'text-red-500' };
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};

export const ResultPage = () => {
  const navigate = useNavigate();
  const { questions, score, correctCount, timeUsed, config, resetGame } = useGameStore();
  
  const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const { grade, emoji, message, color } = getGrade(accuracy);

  const handleRestart = () => {
    const newQuestions = generateQuestions(config.operationType, config.difficulty, config.questionCount);
    useGameStore.getState().startGame(config, newQuestions);
    navigate('/game');
  };

  const handleHome = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <main className="max-w-2xl mx-auto">
        <div className="game-card text-center mb-6">
          <div className={`text-8xl mb-4 ${color}`}>
            {emoji}
          </div>
          <div className={`text-6xl font-bold mb-2 ${color}`}>
            {grade}
          </div>
          <p className="text-xl font-medium text-gray-700 mb-4">{message}</p>
          
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary-600 mb-1">
                <Trophy className="w-6 h-6" />
                <span className="font-bold">得分</span>
              </div>
              <div className="text-3xl font-bold text-primary-700">{score}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                <Target className="w-6 h-6" />
                <span className="font-bold">正确率</span>
              </div>
              <div className="text-3xl font-bold text-green-700">{accuracy}%</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                <Clock className="w-6 h-6" />
                <span className="font-bold">用时</span>
              </div>
              <div className="text-3xl font-bold text-blue-700">{formatTime(timeUsed)}</div>
            </div>
          </div>
        </div>

        <div className="game-card mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary-500" />
            答题详情
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {questions.map((q) => (
              <div
                key={q.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  q.isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {q.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {q.num1} {q.operator} {q.num2} = {q.answer}
                  </span>
                </div>
                {!q.isCorrect && q.userAnswer !== undefined && (
                  <span className="text-sm text-red-600 font-medium">
                    你的答案: {q.userAnswer}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="game-card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">游戏信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">运算类型</span>
              <div className="font-bold text-gray-800">{OPERATION_LABELS[config.operationType]}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">难度级别</span>
              <div className="font-bold text-gray-800">{DIFFICULTY_LABELS[config.difficulty]}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">题目数量</span>
              <div className="font-bold text-gray-800">{config.questionCount}题</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">正确数量</span>
              <div className="font-bold text-gray-800">{correctCount}/{questions.length}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleHome}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Home className="w-6 h-6" />
            返回首页
          </button>
          <button
            onClick={handleRestart}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-6 h-6" />
            再玩一次
          </button>
        </div>
      </main>
    </div>
  );
};