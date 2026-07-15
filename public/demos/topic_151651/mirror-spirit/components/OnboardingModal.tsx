import { useState } from "react";
import { Sparkles, X, ChevronRight, BookOpen, BarChart3, MessageCircle, MapPin, Zap, Heart } from "lucide-react";

interface OnboardingModalProps {
  onClose: () => void;
  onStartDemo: () => void;
}

const features = [
  {
    icon: Heart,
    title: "文字之镜",
    desc: "写下你的感受，AI帮你梳理情绪，看见真实的自己",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "数据之镜",
    desc: "偏差值系统，把抽象的成长变成看得见的曲线",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageCircle,
    title: "对话之镜",
    desc: "它不说'你应该'，只问'你觉得呢？'——镜像式对话",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: MapPin,
    title: "空间之镜",
    desc: "从情绪到行动，地图式任务，把觉察变成生活",
    color: "from-green-500 to-emerald-500",
  },
];

export default function OnboardingModal({ onClose, onStartDemo }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-card p-0 overflow-hidden animate-scale-in">
        <div className="relative h-40 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-float">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/30 animate-pulse" />
              <div className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>
          <div className="absolute bottom-4 left-6">
            <h2 className="text-2xl font-bold text-white">镜灵 · Mirror Spirit</h2>
            <p className="text-white/70 text-sm mt-1">你的数字心理镜子，越照越懂你</p>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors card-enter"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h5 className="font-medium text-amber-800 text-sm">关于这个产品</h5>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  镜灵不是那种「一用就哇塞」的产品。它更像真实的心理咨询——
                  需要时间，那面镜子才会慢慢清晰。建议使用「快速体验模式」，
                  一键感受第1天、第7天、第30天的不同。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              慢慢探索
            </button>
            <button
              onClick={() => {
                onStartDemo();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-1.5"
            >
              快速体验
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
