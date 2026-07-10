'use client';

import { useState } from 'react';
import { TaskType, HabitFrequency } from '../../hooks/useTasks';
import { Thresholds, DEFAULT_THRESHOLDS } from '@/lib/quadrant-utils';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
}

export interface CreateTaskFormData {
  title: string;
  description?: string;
  type: TaskType;
  importance: number;
  due_date?: string;
  frequency?: HabitFrequency;
  target_count?: number;
  reminder_time?: string;
  thresholds?: Thresholds;
}

export default function CreateTaskModal({ isOpen, onClose, onSubmit }: CreateTaskModalProps) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [taskType, setTaskType] = useState<TaskType>('normal');
  const [formData, setFormData] = useState<CreateTaskFormData>({
    title: '',
    description: '',
    type: 'normal',
    importance: 3,
    frequency: 'daily',
    target_count: 1,
    thresholds: { ...DEFAULT_THRESHOLDS },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (type: TaskType) => {
    setTaskType(type);
    setFormData(prev => ({ ...prev, type }));
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        type: 'normal',
        importance: 3,
        frequency: 'daily',
        target_count: 1,
        thresholds: { ...DEFAULT_THRESHOLDS },
      });
      setStep('type');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('type');
    setFormData({
      title: '',
      description: '',
      type: 'normal',
      importance: 3,
      frequency: 'daily',
      target_count: 1,
      thresholds: { ...DEFAULT_THRESHOLDS },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] p-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {step === 'type' ? '创建新任务' :
                taskType === 'big' ? '🎯 创建长任务' :
                taskType === 'habit' ? '🔄 创建习惯' : '📝 创建任务'}
            </h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {step === 'type' ? (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm mb-4">选择你要创建的任务类型：</p>

              <button
                onClick={() => handleTypeSelect('normal')}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-[#FFB6C1] hover:bg-[#FFF8F0] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-[#FFB6C1]/20 flex items-center justify-center text-2xl transition-colors">
                    📝
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">普通任务</h3>
                    <p className="text-sm text-gray-500">有重要性和截止时间的独立任务</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('big')}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-[#87CEEB] hover:bg-[#87CEEB]/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-[#87CEEB]/20 flex items-center justify-center text-2xl transition-colors">
                    🎯
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">长任务</h3>
                    <p className="text-sm text-gray-500">需要分解的长期目标，支持子任务</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('habit')}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-[#90EE90] hover:bg-[#90EE90]/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-[#90EE90]/20 flex items-center justify-center text-2xl transition-colors">
                    🔄
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">习惯打卡</h3>
                    <p className="text-sm text-gray-500">每日重复的小习惯，积累雪球</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setStep('type')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回选择类型
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {taskType === 'habit' ? '习惯名称' : '任务标题'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={taskType === 'habit' ? '例如：早起、喝水、阅读...' : '输入任务标题...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50"
                  autoFocus
                />
              </div>

              {taskType !== 'quick' && taskType !== 'habit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">描述（可选）</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="添加更多细节..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50 resize-none"
                    rows={2}
                  />
                </div>
              )}

              {taskType !== 'quick' && taskType !== 'habit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    重要性 <span className="text-gray-400 font-normal">（默认中）</span>
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setFormData(prev => ({ ...prev, importance: v }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                          formData.importance === v
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                      >
                        {formData.importance >= v ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(taskType === 'normal' || taskType === 'big') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">截止日期（可选）</label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50"
                  />
                </div>
              )}

              {taskType === 'habit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">频率</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'daily' as HabitFrequency, label: '每天' },
                        { value: 'weekly' as HabitFrequency, label: '每周' },
                        { value: 'custom' as HabitFrequency, label: '自定义' },
                      ].map((freq) => (
                        <button
                          key={freq.value}
                          onClick={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                            formData.frequency === freq.value
                              ? 'bg-[#FFB6C1] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">目标次数</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, target_count: Math.max(1, (prev.target_count || 1) - 1) }))}
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold text-gray-800 w-12 text-center">
                        {formData.target_count || 1}
                      </span>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, target_count: (prev.target_count || 1) + 1 }))}
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">提醒时间（可选）</label>
                    <input
                      type="time"
                      value={formData.reminder_time || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: e.target.value || undefined }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50"
                    />
                  </div>
                </>
              )}

              {taskType === 'big' && (
                <div className="p-4 bg-[#87CEEB]/10 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">⚙️</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">子任务紧急度阈值</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        配置子任务的紧急度计算规则
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { key: 'critical' as const, icon: '🔥', label: '极高' },
                      { key: 'high' as const, icon: '⚡', label: '高' },
                      { key: 'medium' as const, icon: '📅', label: '中' },
                      { key: 'low' as const, icon: '⏰', label: '低' },
                      { key: 'none' as const, icon: '🗓️', label: '无' },
                    ].map((item) => (
                      <div key={item.key} className="text-center">
                        <span className="text-sm">{item.icon} {item.label}</span>
                        <input
                          type="number"
                          min={0}
                          value={formData.thresholds?.[item.key] ?? DEFAULT_THRESHOLDS[item.key]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            thresholds: {
                              ...(prev.thresholds || DEFAULT_THRESHOLDS),
                              [item.key]: parseInt(e.target.value) || 0,
                            }
                          }))}
                          className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#87CEEB]/50"
                        />
                        <span className="text-xs text-gray-400">天</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {taskType === 'big' && (
                <div className="p-4 bg-[#87CEEB]/10 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">💡</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">AI 智能分解</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        创建后可使用 AI 自动将长任务分解为可执行的子任务
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {step === 'details' && (
          <div className="p-5 pt-0 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl font-medium hover:from-[#FF99AA] hover:to-[#6BB6E8] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? '创建中...' :
                taskType === 'big' ? '创建长任务' :
                taskType === 'habit' ? '开始养成习惯' : '创建任务'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
