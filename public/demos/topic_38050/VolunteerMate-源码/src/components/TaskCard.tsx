import { Heart, Users, Clock, Award } from 'lucide-react';
import type { Task } from '../data/tasks';

interface TaskCardProps {
  task: Task;
  onCheckIn: (task: Task) => void;
}

export function TaskCard({ task, onCheckIn }: TaskCardProps) {
  const diffColors: Record<string, string> = {
    '简单': 'bg-emerald-100 text-emerald-700',
    '中等': 'bg-amber-100 text-amber-700',
    '挑战': 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${task.color}`}>
          {task.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate text-sm">{task.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.color}`}>
              {task.category}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.duration}分钟
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {task.participants.toLocaleString()}人
            </span>
            <span className={`px-1.5 py-0.5 rounded-full ${diffColors[task.difficulty]}`}>
              {task.difficulty}
            </span>
          </div>
          <button
            onClick={() => onCheckIn(task)}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-95 shadow-md shadow-emerald-500/15"
          >
            <Heart className="w-4 h-4" />
            完成打卡
            <span className="opacity-80 text-xs">· +{task.reward}分</span>
          </button>
        </div>
      </div>
    </div>
  );
}
