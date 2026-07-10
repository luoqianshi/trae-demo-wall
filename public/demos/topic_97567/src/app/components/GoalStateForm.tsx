'use client';

import { useState } from 'react';

interface GoalStateFormProps {
  onSubmit: (goal: string, currentState: string) => void;
  loading?: boolean;
  error?: string;
}

const GoalStateForm = ({ onSubmit, loading = false, error }: GoalStateFormProps) => {
  const [goal, setGoal] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [errors, setErrors] = useState<{ goal?: string; currentState?: string }>({});

  const validate = () => {
    const newErrors: { goal?: string; currentState?: string } = {};
    if (!goal.trim()) {
      newErrors.goal = '请输入想要完成的事情';
    }
    if (!currentState.trim()) {
      newErrors.currentState = '请输入当下的状态';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(goal.trim(), currentState.trim());
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
      <div className="bg-gradient-to-br from-white to-[#87CEEB]/10 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-2 h-8 rounded-full bg-[#87CEEB]"></span>
          <h2 className="text-xl font-bold text-gray-800">❄️ 让雪球滚起来</h2>
        </div>
        <p className="text-sm text-gray-500 ml-5">告诉我你想做什么，以及你现在在做什么</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 想要完成的事情</label>
          <input
            type="text"
            value={goal}
            onChange={(e) => { setGoal(e.target.value); if (errors.goal) setErrors((prev) => ({ ...prev, goal: undefined })); }}
            placeholder="比如：去图书馆、开始写作业、去跑步..."
            className="rounded-2xl border-2 border-[#87CEEB]/30 focus:border-[#87CEEB] p-3 w-full outline-none transition-all bg-white"
          />
          {errors.goal && <p className="text-red-400 text-sm mt-1">{errors.goal}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📱 当下的状态</label>
          <input
            type="text"
            value={currentState}
            onChange={(e) => { setCurrentState(e.target.value); if (errors.currentState) setErrors((prev) => ({ ...prev, currentState: undefined })); }}
            placeholder="比如：躺在床上刷手机、坐在沙发上发呆..."
            className="rounded-2xl border-2 border-[#87CEEB]/30 focus:border-[#87CEEB] p-3 w-full outline-none transition-all bg-white"
          />
          {errors.currentState && <p className="text-red-400 text-sm mt-1">{errors.currentState}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '正在生成步骤...' : '让雪球滚起来 →'}
        </button>
      </form>
    </div>
  );
};

export default GoalStateForm;
