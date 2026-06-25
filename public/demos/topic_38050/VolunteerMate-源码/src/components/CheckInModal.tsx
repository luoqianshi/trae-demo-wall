import { X, Heart, Sparkles, PartyPopper } from 'lucide-react';
import type { Task } from '../data/tasks';

interface CheckInModalProps {
  task: Task | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function CheckInModal({ task, onClose, onConfirm }: CheckInModalProps) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-slideUp">
        <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-5xl mb-3">{task.icon}</div>
          <h2 className="text-xl font-bold mb-1">恭喜完成任务！</h2>
          <p className="text-emerald-100 text-sm">{task.name}</p>
        </div>

        <div className="p-6">
          <div className="bg-emerald-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-600 font-medium">本次打卡收益</span>
              <span className="text-xs text-emerald-500">+{task.duration}分钟公益时长</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-xl p-2">
                <div className="text-lg font-bold text-amber-500">{task.duration}</div>
                <div className="text-xs text-gray-400">分钟</div>
              </div>
              <div className="bg-white rounded-xl p-2">
                <div className="text-lg font-bold text-emerald-500">+1</div>
                <div className="text-xs text-gray-400">打卡次数</div>
              </div>
              <div className="bg-white rounded-xl p-2">
                <div className="text-lg font-bold text-rose-500">
                  {Math.floor(task.duration / 10)}
                </div>
                <div className="text-xs text-gray-400">爱心值</div>
              </div>
            </div>
          </div>

          <button
            onClick={onConfirm}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
          >
            <Sparkles className="w-5 h-5" />
            确认打卡
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}

interface AchievementModalProps {
  achievement: { name: string; description: string; icon: string } | null;
  onClose: () => void;
}

export function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  if (!achievement) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl w-full max-w-xs overflow-hidden animate-bounceIn shadow-2xl">
        <div className="bg-white/20 backdrop-blur p-6 text-center">
          <div className="text-7xl mb-4 animate-pulse">{achievement.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <PartyPopper className="w-6 h-6" />
            获得新成就！
            <PartyPopper className="w-6 h-6" />
          </h2>
          <h3 className="text-xl font-bold text-white mb-1">{achievement.name}</h3>
          <p className="text-amber-100 text-sm">{achievement.description}</p>
        </div>

        <div className="bg-white p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            太棒了！
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-bounceIn { animation: bounceIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
