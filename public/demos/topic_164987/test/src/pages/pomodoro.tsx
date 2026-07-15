import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AIPartner } from '@/components/AIPartner';
import type { PomodoroSession } from '@/types';

export function Pomodoro() {
  const navigate = useNavigate();
  const {
    partner,
    currentPomodoroDuration,
    addPomodoroSession,
    updatePomodoroSession,
    setPomodoroDuration,
  } = useStore();
  
  const [timeLeft, setTimeLeft] = useState(currentPomodoroDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = ((currentPomodoroDuration * 60 - timeLeft) / (currentPomodoroDuration * 60)) * 100;
  
  const handleStart = useCallback(() => {
    setIsRunning(true);
    setShowGreeting(false);
    
    const session: PomodoroSession = {
      id: Math.random().toString(36).substring(2, 11),
      duration: currentPomodoroDuration,
      completed: false,
      startTime: new Date(),
    };
    setSessionId(session.id);
    addPomodoroSession(session);
  }, [currentPomodoroDuration, addPomodoroSession]);
  
  const handlePause = () => {
    setIsRunning(false);
  };
  
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(currentPomodoroDuration * 60);
    setIsFinished(false);
  };
  
  const handleFinish = useCallback(() => {
    setIsRunning(false);
    setIsFinished(true);
    
    if (sessionId) {
      updatePomodoroSession(sessionId, {
        completed: true,
        endTime: new Date(),
      });
    }
  }, [sessionId, updatePomodoroSession]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleFinish]);
  
  useEffect(() => {
    if (!partner) {
      navigate('/settings');
    }
  }, [partner, navigate]);
  
  return (
    <div className="min-h-screen bg-cream pb-24">
      <AIPartner showGreeting={showGreeting} onComplete={isFinished} />
      
      <div className="max-w-md mx-auto px-6 pt-12">
        <div className="flex justify-between items-center mb-12">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold text-charcoal mb-2">专注番茄</h1>
            <p className="text-sm text-warm-gray">{partner?.nickname}，准备好开始了吗？</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-light-gray rounded-full transition-colors"
          >
            ⚙️
          </button>
        </div>
        
        {!isRunning && !isFinished && (
          <div className="mb-8">
            <div className="flex justify-center gap-3">
              {[25, 45, 60].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setPomodoroDuration(duration)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentPomodoroDuration === duration
                      ? 'bg-charcoal text-white'
                      : 'bg-light-gray text-warm-gray hover:bg-soft-blue'
                  }`}
                >
                  {duration}分钟
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center">
          <div className="relative w-72 h-72 mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="144"
                cy="144"
                r="130"
                stroke="#F5F5F5"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="144"
                cy="144"
                r="130"
                stroke="url(#pomodoroGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${progress * 817} 817`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C8D5E3" />
                  <stop offset="100%" stopColor="#74B9FF" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-light text-charcoal ${isFinished ? 'animate-fade-in' : ''}`}>
                {formatTime(timeLeft)}
              </span>
              {isRunning && (
                <span className="text-sm text-warm-gray mt-2">专注中...</span>
              )}
              {isFinished && (
                <span className="text-sm text-muted-blue mt-2 font-medium">完成！</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-4">
            {isFinished ? (
              <>
                <button
                  onClick={handleReset}
                  className="px-8 py-4 bg-light-gray text-warm-gray rounded-xl font-medium hover:bg-soft-blue transition-colors"
                >
                  再来一个
                </button>
                <button
                  onClick={() => navigate('/cards')}
                  className="px-8 py-4 bg-charcoal text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  去背诵
                </button>
              </>
            ) : isRunning ? (
              <>
                <button
                  onClick={handlePause}
                  className="px-8 py-4 bg-light-gray text-warm-gray rounded-xl font-medium hover:bg-soft-blue transition-colors"
                >
                  暂停
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-4 bg-red-100 text-red-500 rounded-xl font-medium hover:bg-red-200 transition-colors"
                >
                  结束
                </button>
              </>
            ) : (
              <button
                onClick={handleStart}
                className="px-16 py-4 bg-charcoal text-white rounded-xl font-medium hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
              >
                开始专注
              </button>
            )}
          </div>
        </div>
        
        {isFinished && (
          <div className="mt-12 text-center animate-slide-up">
            <p className="text-warm-gray text-sm">本次专注时长</p>
            <p className="text-2xl font-semibold text-charcoal mt-1">{currentPomodoroDuration} 分钟</p>
          </div>
        )}
      </div>
    </div>
  );
}
