import { useState } from 'react';
import { ChevronRight, X, Sparkles, Heart, Trophy, Target } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '欢迎来到 VolunteerMate',
      subtitle: '公益随手做',
      description: '让每一次小小的善意，都成为改变世界的力量。',
      icon: '🌱',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'AI 智能推荐',
      subtitle: '找到最适合你的公益任务',
      description: 'AI 会根据你的偏好和时间，推荐最适合的公益行动。',
      icon: '🤖',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: '打卡记录成长',
      subtitle: '每一次行动都有意义',
      description: '完成打卡获得积分和徽章，AI 还会为你生成专属感言。',
      icon: '🏆',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-md text-center">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === step ? 'w-8 bg-white' : idx < step ? 'bg-white/70' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${current.color} mx-auto mb-6 flex items-center justify-center text-5xl shadow-lg animate-bounce-slow`}>
          {current.icon}
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-white mb-2">{current.title}</h1>
        <p className="text-lg text-white/80 mb-3">{current.subtitle}</p>
        <p className="text-sm text-white/60 mb-8 max-w-xs mx-auto">{current.description}</p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
            >
              上一步
            </button>
          )}
          <button
            onClick={() => isLast ? onComplete() : setStep(step + 1)}
            className={`px-8 py-3 bg-gradient-to-r ${current.color} text-white rounded-xl font-medium flex items-center gap-2 hover:opacity-95 transition-all active:scale-95 shadow-lg`}
          >
            {isLast ? (
              <>
                <Sparkles className="w-5 h-5" />
                开始公益之旅
              </>
            ) : (
              <>
                下一步
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={onComplete}
          className="mt-6 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          跳过引导
        </button>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}