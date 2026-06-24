import { Sparkles, Clock, Users, ChevronRight } from 'lucide-react';
import type { Task } from '../data/tasks';

export interface AIRecCardProps {
  task: Task;
  reason?: string;
  tags?: string[];
  onCheckIn: (task: Task) => void;
  rank?: number;
}

const difficultyStyles: Record<string, string> = {
  '简单': 'bg-emerald-100 text-emerald-700',
  '中等': 'bg-amber-100 text-amber-700',
  '挑战': 'bg-rose-100 text-rose-700',
};

const categoryGradient: Record<string, string> = {
  '环保': 'from-emerald-500 to-teal-500',
  '捐赠': 'from-rose-500 to-pink-500',
  '帮扶': 'from-violet-500 to-fuchsia-500',
  '传播': 'from-sky-500 to-blue-500',
};

export function AIRecCard({ task, reason, tags = [], onCheckIn, rank }: AIRecCardProps) {
  const gradient = categoryGradient[task.category] || 'from-emerald-500 to-teal-500';

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden border border-gray-50">
      <div className={`bg-gradient-to-r ${gradient} px-4 py-2 flex items-center justify-between text-white`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {rank ? `AI 推荐 #${rank}` : 'AI 推荐'}
          </span>
        </div>
        <span className="text-xs text-white/90">
          {task.difficulty} · +{task.reward}分
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${gradient}`}>
            {task.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800 truncate">{task.name}</h3>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{task.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.duration}分钟
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {task.participants.toLocaleString()}人
              </span>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        {reason && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 mb-3 border border-indigo-100">
            <div className="flex items-start gap-2">
              <span className="text-sm">💡</span>
              <p className="text-xs text-indigo-700 leading-relaxed">{reason}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyStyles[task.difficulty]}`}>
            {task.difficulty}
          </span>
          <button
            onClick={() => onCheckIn(task)}
            className={`flex-1 py-2.5 bg-gradient-to-r ${gradient} text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1 hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-emerald-500/10`}
          >
            <span>去打卡</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
