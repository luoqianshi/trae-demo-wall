import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, X, Divide, Shuffle, Star, Trophy } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { generateQuestions } from '@/utils/questionGenerator';
import { OperationType, Difficulty, OPERATION_LABELS, DIFFICULTY_LABELS } from '@/types';
import { Header } from '@/components/Header';

const operations: { type: OperationType; icon: React.ReactNode; color: string }[] = [
  { type: 'add', icon: <Plus className="w-8 h-8" />, color: 'from-green-400 to-green-600' },
  { type: 'sub', icon: <Minus className="w-8 h-8" />, color: 'from-red-400 to-red-600' },
  { type: 'mul', icon: <X className="w-8 h-8" />, color: 'from-blue-400 to-blue-600' },
  { type: 'div', icon: <Divide className="w-8 h-8" />, color: 'from-purple-400 to-purple-600' },
  { type: 'mixed', icon: <Shuffle className="w-8 h-8" />, color: 'from-orange-400 to-pink-600' },
];

const difficulties: { type: Difficulty; label: string; color: string }[] = [
  { type: 'easy', label: '简单', color: 'bg-green-100 text-green-700 border-green-300' },
  { type: 'medium', label: '中等', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { type: 'hard', label: '困难', color: 'bg-red-100 text-red-700 border-red-300' },
];

const questionCounts = [10, 20, 30];

export const HomePage = () => {
  const navigate = useNavigate();
  const [selectedOperation, setSelectedOperation] = useState<OperationType>('add');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const { startGame } = useGameStore();

  const handleStartGame = () => {
    const questions = generateQuestions(selectedOperation, selectedDifficulty, selectedQuestionCount);
    startGame(
      { operationType: selectedOperation, difficulty: selectedDifficulty, questionCount: selectedQuestionCount },
      questions
    );
    navigate('/game');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <Header />
      
      <main className="max-w-2xl mx-auto">
        <div className="game-card mb-6">
          <h2 className="text-2xl font-bold text-primary-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-primary-500" />
            选择运算类型
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {operations.map(({ type, icon, color }) => (
              <button
                key={type}
                onClick={() => setSelectedOperation(type)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                  selectedOperation === type
                    ? `bg-gradient-to-br ${color} text-white border-transparent shadow-lg transform scale-105`
                    : 'bg-white border-primary-200 text-gray-600 hover:border-primary-400 hover:shadow-md'
                }`}
              >
                {icon}
                <span className="mt-2 font-bold text-sm">{OPERATION_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="game-card mb-6">
          <h2 className="text-2xl font-bold text-primary-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-primary-500" />
            选择难度级别
          </h2>
          <div className="flex flex-wrap gap-3">
            {difficulties.map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => setSelectedDifficulty(type)}
                className={`px-6 py-3 rounded-xl border-2 font-bold transition-all duration-300 ${
                  selectedDifficulty === type
                    ? `${color} border-current shadow-md transform scale-105`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {DIFFICULTY_LABELS[type]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {selectedDifficulty === 'easy' && '数字范围：1-20'}
            {selectedDifficulty === 'medium' && '数字范围：1-50'}
            {selectedDifficulty === 'hard' && '数字范围：1-100'}
          </p>
        </div>

        <div className="game-card mb-6">
          <h2 className="text-2xl font-bold text-primary-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-primary-500" />
            选择题目数量
          </h2>
          <div className="flex flex-wrap gap-3">
            {questionCounts.map((count) => (
              <button
                key={count}
                onClick={() => setSelectedQuestionCount(count)}
                className={`px-6 py-3 rounded-xl border-2 font-bold text-lg transition-all duration-300 ${
                  selectedQuestionCount === count
                    ? 'bg-gradient-to-r from-primary-400 to-primary-600 text-white border-primary-500 shadow-md transform scale-105'
                    : 'bg-white border-primary-200 text-primary-700 hover:border-primary-400'
                }`}
              >
                {count}题
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="w-full btn-primary text-xl flex items-center justify-center gap-3"
        >
          <Trophy className="w-8 h-8" />
          开始游戏
        </button>
      </main>
    </div>
  );
};