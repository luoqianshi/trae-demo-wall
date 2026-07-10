'use client';

import React, { useState, useMemo } from 'react';
import type { Challenge, UserChallenge, CompletionData } from '@/hooks/useChallenges';

interface ChallengeRecordFormProps {
  challenge: Challenge;
  userChallenge: UserChallenge;
  onSubmit: (data: { content: string; type: string; mood: string; tags: string[]; related_task_id?: string; completionData: CompletionData; userChallengeId: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MOOD_OPTIONS = [
  { value: 'proud', emoji: '😊', label: '自豪' },
  { value: 'happy', emoji: '😄', label: '开心' },
  { value: 'touched', emoji: '🥰', label: '感动' },
  { value: 'determined', emoji: '💪', label: '坚定' },
  { value: 'expectant', emoji: '🌟', label: '期待' },
];

const ChallengeRecordForm = ({ challenge, userChallenge, onSubmit, onCancel, isLoading = false }: ChallengeRecordFormProps) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('proud');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [actionConfirmed, setActionConfirmed] = useState(false);

  const criteria = challenge.completion_criteria;

  const hasRequiredTags = criteria.required_tags && criteria.required_tags.length > 0;
  const hasRequiredQuestions = criteria.required_questions && criteria.required_questions.length > 0;
  const hasActionRequired = criteria.action_required && criteria.action_description;

  const tagsSatisfied = !hasRequiredTags || selectedTags.length > 0;
  const questionsSatisfied = !hasRequiredQuestions || (criteria.required_questions?.every(q => (questionAnswers[q] || '').trim().length > 0) ?? false);
  const actionSatisfied = !hasActionRequired || actionConfirmed;

  const conditions = useMemo(() => {
    const list: { key: string; label: string; satisfied: boolean }[] = [];
    if (hasRequiredTags) {
      list.push({ key: 'tags', label: '选择标签', satisfied: tagsSatisfied });
    }
    if (hasRequiredQuestions) {
      list.push({ key: 'questions', label: '回答引导问题', satisfied: questionsSatisfied });
    }
    if (hasActionRequired) {
      list.push({ key: 'action', label: '确认行动', satisfied: actionSatisfied });
    }
    return list;
  }, [hasRequiredTags, hasRequiredQuestions, hasActionRequired, tagsSatisfied, questionsSatisfied, actionSatisfied]);

  const unmetCount = conditions.filter(c => !c.satisfied).length;
  const allSatisfied = conditions.every(c => c.satisfied);
  const canSubmit = content.trim().length > 0 && allSatisfied;

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleQuestionChange = (question: string, answer: string) => {
    setQuestionAnswers(prev => ({ ...prev, [question]: answer }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    const completionData: CompletionData = {};
    if (hasRequiredTags) {
      completionData.tags = selectedTags;
    }
    if (hasRequiredQuestions) {
      completionData.questions_answered = criteria.required_questions?.map(q => (questionAnswers[q] || '').trim().length > 0) || [];
    }
    if (hasActionRequired) {
      completionData.action_confirmed = actionConfirmed;
    }

    onSubmit({
      content: content.trim(),
      type: 'challenge',
      mood,
      tags: selectedTags,
      related_task_id: undefined,
      completionData,
      userChallengeId: userChallenge.id,
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {challenge.type === 'gold' ? '🏆' : challenge.type === 'silver' ? '🥈' : '🥉'}
          </span>
          <h3 className="text-base font-semibold text-gray-800">{challenge.title}</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天的挑战心得..."
            className="w-full px-4 py-3 bg-[#FFF8F0] border border-[#FFB6C1]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all text-sm resize-none min-h-[100px]"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">心情</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm transition-all ${
                  mood === option.value
                    ? 'bg-[#FFB6C1]/20 border border-[#FFB6C1]/40 scale-105 shadow-sm'
                    : 'bg-white border border-gray-100 hover:border-[#FFB6C1]/30 hover:scale-105'
                }`}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className={`text-xs ${mood === option.value ? 'text-[#FF99AA] font-medium' : 'text-gray-500'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {conditions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">完成条件</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-2">
              {conditions.map(condition => (
                <div
                  key={condition.key}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${
                    condition.satisfied
                      ? 'bg-green-50 border border-green-200 text-green-600'
                      : 'bg-gray-50 border border-gray-200 text-gray-400'
                  }`}
                >
                  <span>{condition.satisfied ? '✓' : '○'}</span>
                  <span>{condition.label}</span>
                  <span>{condition.satisfied ? '已满足' : '未满足'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasRequiredTags && (
          <div className={`p-4 rounded-2xl border transition-all ${tagsSatisfied ? 'bg-green-50/50 border-green-200' : 'bg-[#FFF8F0] border-[#FFB6C1]/20'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">选择标签</span>
              <span className="text-xs text-gray-400">至少选择一个</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {criteria.required_tags!.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-[#FFB6C1] text-white shadow-sm scale-105'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-[#FFB6C1]/40 hover:scale-105'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasRequiredQuestions && (
          <div className={`p-4 rounded-2xl border transition-all ${questionsSatisfied ? 'bg-green-50/50 border-green-200' : 'bg-[#FFF8F0] border-[#FFB6C1]/20'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">引导问题</span>
              <span className="text-xs text-gray-400">请全部回答</span>
            </div>
            <div className="space-y-3">
              {criteria.required_questions!.map((question, index) => (
                <div key={index}>
                  <label className="block text-sm text-gray-700 mb-1">
                    {index + 1}. {question}
                  </label>
                  <input
                    type="text"
                    value={questionAnswers[question] || ''}
                    onChange={(e) => handleQuestionChange(question, e.target.value)}
                    placeholder="写下你的回答..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {hasActionRequired && (
          <div className={`p-4 rounded-2xl border transition-all ${actionSatisfied ? 'bg-green-50/50 border-green-200' : 'bg-[#FFF8F0] border-[#FFB6C1]/20'}`}>
            <button
              type="button"
              onClick={() => setActionConfirmed(!actionConfirmed)}
              className="flex items-start gap-3 w-full text-left"
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                actionConfirmed
                  ? 'bg-[#FFB6C1] border-[#FFB6C1]'
                  : 'bg-white border-gray-300'
              }`}>
                {actionConfirmed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700">{criteria.action_description}</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 bg-gray-100 text-gray-500 rounded-2xl text-sm hover:bg-gray-200 transition-all"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FF99AA] text-white rounded-2xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 text-sm"
          >
            {isLoading ? '提交中...' : unmetCount > 0 ? `还需完成 ${unmetCount} 项条件` : '提交记录'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChallengeRecordForm;
