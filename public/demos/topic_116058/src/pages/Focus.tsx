import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Trophy, Flame } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CorgiMascot, { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import SoftButton from '@/components/common/SoftButton';
import { useSettingsStore } from '@/store/settingsStore';
import { useBackpackStore } from '@/store/backpackStore';
import { useCorgiStore } from '@/store/corgiStore';
import { cn } from '@/lib/utils';

export default function Focus() {
  const { pomodoroDuration, breakDuration } = useSettingsStore();
  const { addPoints, backpack, checkTitleUnlocks } = useBackpackStore();
  const { corgi, setMood } = useCorgiStore();
  const petLabel = PET_LABEL[corgi.petType];

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(pomodoroDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = (mode === 'focus' ? pomodoroDuration : breakDuration) * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  const handleComplete = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      addPoints(20);
      const newCount = completedCount + 1;
      setCompletedCount(newCount);
      setMood('excited');
      setShowCelebrate(true);
      setTimeout(() => setShowCelebrate(false), 3000);
      // 检查称号解锁
      checkTitleUnlocks(newCount, 0);
      // 切换到休息
      setMode('break');
      setSecondsLeft(breakDuration * 60);
    } else {
      setMood('happy');
      setMode('focus');
      setSecondsLeft(pomodoroDuration * 60);
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    if (!isRunning) setMood('normal');
  };

  const handleReset = () => {
    setIsRunning(false);
    setMode('focus');
    setSecondsLeft(pomodoroDuration * 60);
    setMood('happy');
  };

  const handleModeSwitch = (newMode: 'focus' | 'break') => {
    if (isRunning) return;
    setMode(newMode);
    setSecondsLeft((newMode === 'focus' ? pomodoroDuration : breakDuration) * 60);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // 圆环参数
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen warm-bg pb-24">
      <PageHeader
        title="番茄钟专注"
        subtitle={`专注学习，获得${petLabel}积分`}
        right={
          <div className="flex items-center gap-1.5 bg-corgi-yellow/20 px-3 py-2 rounded-xl">
            <Sparkles size={16} className="text-corgi-orange" />
            <span className="font-bold text-corgi-dark text-sm">{backpack.points}</span>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pt-8 flex flex-col items-center">
        {/* 模式切换 */}
        <div className="flex gap-2 mb-8 bg-warm-light rounded-full p-1.5 shadow-soft">
          <button
            onClick={() => handleModeSwitch('focus')}
            className={cn(
              'btn-press px-6 py-2.5 rounded-full font-bold text-sm transition-all',
              mode === 'focus' ? 'bg-corgi-orange text-white shadow-soft' : 'text-text-secondary'
            )}
          >
            专注模式
          </button>
          <button
            onClick={() => handleModeSwitch('break')}
            className={cn(
              'btn-press px-6 py-2.5 rounded-full font-bold text-sm transition-all',
              mode === 'break' ? 'bg-mint-fresh text-text-primary shadow-soft' : 'text-text-secondary'
            )}
          >
            休息模式
          </button>
        </div>

        {/* 计时圆环 */}
        <div className="relative mb-8">
          <svg width="300" height="300" className="-rotate-90">
            {/* 背景圆环 */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke="rgba(232, 168, 87, 0.15)"
              strokeWidth="14"
            />
            {/* 进度圆环 */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke={mode === 'focus' ? '#FF9F43' : '#7DD3C0'}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* 中心内容 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CorgiMascot
              mood={isRunning ? 'normal' : 'happy'}
              petType={corgi.petType}
              size={100}
              floating={false}
              className="mb-2"
            />
            <p className="text-5xl font-display text-text-primary tabular-nums">{timeStr}</p>
            <p className="text-sm text-text-secondary font-bold mt-1">
              {mode === 'focus' ? '专注中...' : '休息一下～'}
            </p>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-4 mb-8">
          <SoftButton variant="secondary" size="lg" onClick={handleReset}>
            <RotateCcw size={20} />
            重置
          </SoftButton>
          <SoftButton
            variant={mode === 'focus' ? 'accent' : 'primary'}
            size="lg"
            onClick={handleStartPause}
            className="px-10"
          >
            {isRunning ? <Pause size={22} /> : <Play size={22} />}
            {isRunning ? '暂停' : '开始'}
          </SoftButton>
        </div>

        {/* 今日记录 */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <StatCard icon={Trophy} label="今日专注" value={`${completedCount}次`} color="text-corgi-orange" />
          <StatCard icon={Sparkles} label="获得积分" value={`+${completedCount * 20}`} color="text-mint-deep" />
          <StatCard icon={Flame} label="连续天数" value="7天" color="text-berry-rose" />
        </div>
      </div>

      {/* 完成庆祝动画 */}
      {showCelebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-corgi-yellow/20 animate-pop-in" />
          <div className="relative z-10 text-center animate-celebrate">
            <div className="text-6xl mb-4">🎉</div>
            <p className="font-display text-3xl text-corgi-dark">专注完成！</p>
            <p className="text-lg text-text-secondary mt-2">+20 {petLabel}积分 ♡</p>
          </div>
          {/* 粒子 */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle text-2xl"
              style={{
                left: `${50 + (Math.random() - 0.5) * 60}%`,
                top: `${50 + (Math.random() - 0.5) * 40}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {['⭐', '✨', '💛', '🎉', '🌟'][i % 5]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-warm-light rounded-2xl p-4 shadow-soft border-2 border-corgi-yellow/20 text-center">
      <Icon size={24} className={cn('mx-auto mb-1', color)} />
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}
