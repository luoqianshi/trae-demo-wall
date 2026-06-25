import { useState, useEffect } from 'react';
import { Check, Loader2, Image as ImageIcon, MapPin, Calendar, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

interface IncrementalAnalysisProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  { id: 'photos', icon: ImageIcon, label: '正在识别新增照片', detail: '发现 12 张新照片', duration: 600 },
  { id: 'location', icon: MapPin, label: '正在识别地点', detail: '乌鲁瓦图神庙', duration: 500 },
  { id: 'timeline', icon: Calendar, label: '正在匹配时间线', detail: 'Day4 行程已更新', duration: 500 },
  { id: 'journal', icon: BookOpen, label: '正在生成旅行记录', detail: 'AI旅行手账已更新', duration: 500 },
];

export function IncrementalAnalysis({ open, onComplete }: IncrementalAnalysisProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setCompleted(new Set());
      setDone(false);
      return;
    }

    if (currentStep >= steps.length) {
      setDone(true);
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }

    const step = steps[currentStep];
    const timer = setTimeout(() => {
      setCompleted((prev) => new Set([...prev, currentStep]));
      setTimeout(() => setCurrentStep((s) => s + 1), 200);
    }, step.duration);

    return () => clearTimeout(timer);
  }, [currentStep, open, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-200">
              <Sparkles size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {done ? '增量分析完成' : 'AI 增量分析中'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {done ? '新增内容已整理到旅行档案中' : '正在分析你新上传的资料...'}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = completed.has(idx);
              const isCurrent = idx === currentStep && !done;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${
                    isCompleted
                      ? 'bg-green-50/50 opacity-90'
                      : isCurrent
                      ? 'bg-orange-50 ring-1 ring-orange-200'
                      : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : isCurrent
                        ? 'bg-gradient-to-br from-orange-400 to-amber-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={18} className="text-white" strokeWidth={3} />
                    ) : isCurrent ? (
                      <Loader2 size={18} className="text-white animate-spin" />
                    ) : (
                      <Icon size={18} className="text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.label}
                      {isCurrent && '...'}
                    </p>
                    {isCompleted && (
                      <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                        <Check size={12} />
                        <span>{step.detail}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {done && (
            <button
              onClick={onComplete}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-medium shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>查看更新后的档案</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
