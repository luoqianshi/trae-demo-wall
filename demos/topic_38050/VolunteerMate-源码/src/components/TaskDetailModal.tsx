import { useState } from 'react';
import { X, Clock, Users, Heart, Award, ChevronRight, Sparkles, Lightbulb, Globe, Leaf } from 'lucide-react';
import type { Task } from '../data/tasks';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onCheckIn: (task: Task) => void;
}

export function TaskDetailModal({ task, onClose, onCheckIn }: TaskDetailModalProps) {
  if (!task) return null;

  const steps: Record<string, string[]> = {
    '旧衣捐赠': ['整理家中闲置衣物', '清洗并分类打包', '联系捐赠机构或社区', '完成捐赠并记录'],
    '书籍漂流': ['挑选适合分享的书籍', '检查书籍完整性', '带到社区图书角', '登记并分享'],
    '垃圾分类': ['了解分类标准', '收集家中垃圾', '按类别分拣', '正确投放'],
    '社区助老': ['联系社区老人', '了解需求', '提供帮助', '记录并反馈'],
    '公园环保清洁': ['准备清洁工具', '选择清洁区域', '捡拾垃圾', '分类处理'],
    '知识分享': ['确定分享内容', '准备讲解材料', '找到分享对象', '完成分享'],
    '无偿献血宣传': ['了解献血知识', '准备宣传材料', '向身边人讲解', '鼓励参与'],
    '节水节电挑战': ['设定节约目标', '记录用量变化', '采取节约措施', '分享成果'],
    '关爱留守儿童': ['选择帮助方式', '准备爱心物品', '联系公益机构', '寄送或探访'],
    '公益捐赠': ['选择公益项目', '确定捐赠金额', '完成捐赠', '分享并鼓励'],
    '绿色出行日': ['选择出行方式', '记录出行里程', '计算减排量', '分享成果'],
    '社区文明宣传': ['准备宣传材料', '选择宣传区域', '张贴或讲解', '收集反馈'],
    '关爱流浪动物': ['准备食物或用品', '找到流浪动物', '提供帮助', '记录并分享'],
    '公益马拉松': ['报名公益活动', '准备跑步装备', '完成跑步', '筹集善款'],
    '志愿服务记录': ['整理服务经历', '撰写心得体会', '选择分享平台', '发布并传播'],
  };

  const taskSteps = steps[task.name] || ['了解任务详情', '准备相关材料', '完成任务', '记录并分享'];

  const impacts: Record<string, { icon: string; text: string }> = {
    '环保': { icon: '🌍', text: '减少碳排放，保护生态环境' },
    '捐赠': { icon: '💝', text: '让闲置物品重新发光，温暖他人' },
    '帮扶': { icon: '❤️', text: '点亮他人的生活，传递温暖' },
    '传播': { icon: '📢', text: '让公益被更多人看见，扩大影响力' },
  };

  const impact = impacts[task.category] || { icon: '✨', text: '为社会贡献一份力量' };

  const difficultyColors: Record<string, { bg: string; text: string }> = {
    '简单': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    '中等': { bg: 'bg-amber-100', text: 'text-amber-700' },
    '挑战': { bg: 'bg-rose-100', text: 'text-rose-700' },
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-slideUp shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-br ${
          task.category === '环保' ? 'from-emerald-500 to-teal-500' :
          task.category === '捐赠' ? 'from-rose-500 to-pink-500' :
          task.category === '帮扶' ? 'from-violet-500 to-fuchsia-500' :
          'from-sky-500 to-blue-500'
        } px-5 pt-6 pb-5 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl">
              {task.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">{task.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[task.difficulty].bg} ${difficultyColors[task.difficulty].text}`}>
                  {task.difficulty}
                </span>
                <span className="text-xs text-white/80">{task.category}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/90 leading-relaxed">{task.description}</p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Quick info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-slate-700">{task.duration}</div>
              <div className="text-xs text-slate-500">分钟</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <Award className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-emerald-600">+{task.reward}</div>
              <div className="text-xs text-emerald-500">积分</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <Users className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-amber-600">{task.participants.toLocaleString()}</div>
              <div className="text-xs text-amber-500">人参与</div>
            </div>
          </div>

          {/* Impact */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-600">预计影响</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{impact.icon}</span>
              <p className="text-sm text-indigo-700">{impact.text}</p>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-800">完成步骤</span>
            </div>
            <div className="space-y-2">
              {taskSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <p className="text-xs text-amber-700">
                小提示：完成后记得在首页打卡，AI 会为你生成专属感言！
              </p>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={() => onCheckIn(task)}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Heart className="w-5 h-5" />
            完成打卡
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.15, 1.15, 0.5, 1); }
      `}</style>
    </div>
  );
}