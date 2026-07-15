import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trophy, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

const ENCOURAGEMENTS = ['太棒了！', '真聪明！', '继续加油！', '做得好！', '完美！'];
const WRONG_MESSAGES = ['再试一次！', '加油！', '别灰心！', '继续努力！'];

export const GamePage = () => {
  const navigate = useNavigate();
  const [currentInput, setCurrentInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  const {
    questions,
    currentIndex,
    score,
    streak,
    timeUsed,
    setAnswer,
    incrementScore,
    incrementCorrectCount,
    setStreak,
    incrementTimeUsed,
    setCurrentIndex,
    saveHistory,
  } = useGameStore();

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="game-card text-center">
          <p className="text-xl text-gray-600">请先返回首页开始游戏</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">返回首页</button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const timer = setInterval(() => {
      incrementTimeUsed();
    }, 1000);
    return () => clearInterval(timer);
  }, [incrementTimeUsed]);

  const handleSubmit = useCallback(() => {
    if (!currentInput) return;
    
    const answer = parseInt(currentInput, 10);
    setAnswer(answer);
    
    if (answer === currentQuestion.answer) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      incrementCorrectCount();
      incrementScore(10 + (newStreak - 1) * 5);
      setFeedback('correct');
      setFeedbackMessage(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    } else {
      setStreak(0);
      setFeedback('wrong');
      setFeedbackMessage(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]);
    }

    setTimeout(() => {
      setFeedback(null);
      setFeedbackMessage('');
      setCurrentInput('');
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        saveHistory();
        navigate('/result');
      }
    }, 1000);
  }, [currentInput, currentQuestion, streak, currentIndex, questions.length, navigate, setAnswer, incrementScore, incrementCorrectCount, setStreak, setCurrentIndex, saveHistory]);

  const handleNumberClick = (num: string) => {
    if (feedback) return;
    if (num === 'clear') {
      setCurrentInput('');
    } else if (num === 'backspace') {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (num === 'confirm') {
      handleSubmit();
    } else {
      if (currentInput.length < 5) {
        setCurrentInput((prev) => prev + num);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (feedback) return;
    if (e.key >= '0' && e.key <= '9') {
      setCurrentInput((prev) => prev + e.key);
    } else if (e.key === 'Backspace') {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setCurrentInput('');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, feedback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen py-4 px-4">
      <header className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-bold">返回</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl">
            <Clock className="w-5 h-5 text-primary-500" />
            <span className="font-bold text-primary-700">{formatTime(timeUsed)}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-yellow-700">{score}</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        <div className="game-card mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">
              第 {currentIndex + 1} / {questions.length} 题
            </span>
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-orange-600">连击 x{streak}</span>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-400 to-primary-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={`game-card mb-4 p-8 text-center ${feedback === 'correct' ? 'correct-animation' : feedback === 'wrong' ? 'wrong-animation' : ''}`}>
          {feedback && (
            <div className={`mb-4 flex items-center justify-center gap-2 ${
              feedback === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}>
              {feedback === 'correct' ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
              <span className="text-xl font-bold">{feedbackMessage}</span>
            </div>
          )}
          
          <div className="text-5xl md:text-6xl font-bold text-gray-800">
            <span className="inline-block w-20">{currentQuestion.num1}</span>
            <span className="mx-4 text-primary-500">{currentQuestion.operator}</span>
            <span className="inline-block w-20">{currentQuestion.num2}</span>
            <span className="mx-2">=</span>
            <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg min-w-[80px]">
              {currentInput || '?'}
            </span>
          </div>
        </div>

        <div className="game-card">
          <div className="grid grid-cols-4 gap-2">
            {['7', '8', '9', 'backspace'].map((key) => (
              <button
                key={key}
                onClick={() => handleNumberClick(key)}
                disabled={!!feedback}
                className={`btn-number ${key === 'backspace' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}`}
              >
                {key === 'backspace' ? '⌫' : key}
              </button>
            ))}
            {['4', '5', '6', 'clear'].map((key) => (
              <button
                key={key}
                onClick={() => handleNumberClick(key)}
                disabled={!!feedback}
                className={`btn-number ${key === 'clear' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}`}
              >
                {key === 'clear' ? 'C' : key}
              </button>
            ))}
            {['1', '2', '3', 'confirm'].map((key) => (
              <button
                key={key}
                onClick={() => handleNumberClick(key)}
                disabled={!!feedback || !currentInput}
                className={`${key === 'confirm' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white border-green-500' : 'btn-number'}`}
              >
                {key === 'confirm' ? '✓' : key}
              </button>
            ))}
            {['0'].map((key) => (
              <button
                key={key}
                onClick={() => handleNumberClick(key)}
                disabled={!!feedback}
                className="btn-number col-span-3"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};