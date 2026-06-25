import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Loader2,
  Image as ImageIcon,
  Plane,
  Hotel,
  Calendar,
  Sparkles,
  MapPin,
  BookOpen,
  TrendingUp,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { travelDetails } from '../data/mockData';

interface Step {
  id: string;
  icon: typeof ImageIcon;
  label: string;
  detail: string;
  duration: number;
}

const baseSteps: Omit<Step, 'detail'>[] = [
  { id: 'photos', icon: ImageIcon, label: '正在识别照片', duration: 700 },
  { id: 'video', icon: Sparkles, label: '正在分析视频', duration: 600 },
  { id: 'flight', icon: Plane, label: '正在解析机票', duration: 500 },
  { id: 'hotel', icon: Hotel, label: '正在解析酒店订单', duration: 500 },
  { id: 'tickets', icon: MapPin, label: '正在识别景点门票', duration: 400 },
  { id: 'timeline', icon: Calendar, label: '正在构建时间线', duration: 700 },
  { id: 'route', icon: TrendingUp, label: '正在还原旅行轨迹', duration: 500 },
  { id: 'moment', icon: Heart, label: '正在寻找最幸福时刻', duration: 500 },
  { id: 'diary', icon: BookOpen, label: '正在撰写旅行日记', duration: 700 },
];

const stepDetails: Record<string, (travelId: string) => string> = {
  photos: (id) => {
    const d = travelDetails[id];
    return d?.aiData ? `已识别 ${d.aiData.photos} 张照片` : '已识别 126 张照片';
  },
  video: (id) => {
    const d = travelDetails[id];
    return d?.aiData ? `已分析 ${d.aiData.videos} 段视频` : '已分析 18 段视频';
  },
  flight: () => '上海 → 巴厘岛',
  hotel: () => 'Ayana Resort Bali',
  tickets: () => '已识别 5 张景点门票',
  timeline: (id) => {
    const d = travelDetails[id];
    return d ? `已生成 ${d.timeline.length} 天旅行轨迹` : '已生成 7 天旅行轨迹';
  },
  route: () => '已还原 87 公里移动轨迹',
  moment: () => '已定位最幸福时刻',
  diary: () => '已生成旅行回忆册',
};

export default function AIProcessing() {
  const { id = 'bali' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep >= baseSteps.length) {
      setDone(true);
      setProgress(100);
      const timer = setTimeout(() => {
        navigate(`/travel/${id}`);
      }, 1800);
      return () => clearTimeout(timer);
    }

    const step = baseSteps[currentStep];
    const timer = setTimeout(() => {
      setCompleted((prev) => new Set([...prev, currentStep]));
      setProgress(Math.round(((currentStep + 1) / baseSteps.length) * 100));
      setTimeout(() => setCurrentStep((s) => s + 1), 200);
    }, step.duration);

    return () => clearTimeout(timer);
  }, [currentStep, id, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-amber-50/30 to-rose-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/80 text-orange-600 text-sm font-medium mb-4">
            <Sparkles size={14} />
            <span>Moment AI</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {done ? 'AI 分析完成' : 'AI 正在整理你的旅行'}
          </h1>
          <p className="text-gray-500">
            {done ? '一切就绪，马上为你呈现这本旅行档案' : '这通常需要 3-5 秒，请稍候'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">整理进度</span>
              <span className="text-sm font-bold text-orange-500">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="p-6 space-y-3 max-h-[480px] overflow-y-auto">
            {baseSteps.map((step, idx) => {
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
                    <p
                      className={`font-medium ${
                        isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                      {isCurrent && '...'}
                    </p>
                    {isCompleted && (
                      <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                        <Check size={12} />
                        <span>{stepDetails[step.id](id)}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {done && (
            <div className="p-6 border-t border-gray-100 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-800 mb-1">档案已生成</p>
                  <p className="text-sm text-gray-500">点击查看完整旅行回忆</p>
                </div>
                <button
                  onClick={() => navigate(`/travel/${id}`)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-medium shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>查看档案</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
