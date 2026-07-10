'use client';

import { useState, useEffect } from 'react';
import RecordCard from '../components/RecordCard';
import QuickRecord from '../components/QuickRecord';
import Skeleton from '../components/Skeleton';
import CelebrationEffect from '../components/CelebrationEffect';
import FeedbackBubble from '../components/FeedbackBubble';
import { useAuth } from '../../hooks/useAuth';
import { useRecordsContext } from '../../contexts/RecordsContext';
import { usePageView } from '../../hooks/usePageView';
import { useSnowball } from '@/contexts/SnowballContext';
import SnowballCharacter from '../components/SnowballCharacter';
import { getStoryText } from '@/lib/snowball-story-text';

interface RecordItem {
  id: string;
  content: string;
  type: string;
  tags: string[];
  mood: string;
  related_task_id?: string;
  created_at: string;
  [key: string]: unknown;
}

interface GoalItem {
  id: string;
  title: string;
  [key: string]: unknown;
}

const RecordsPage = () => {
  const { token } = useAuth();
  const {
    records, goals, loading, error, createRecord, deleteRecord, updateRecord, fetchFeedback, feedbackMap, followUpMap, loadingFeedbackMap, newlyUnlockedAchievements, conversationsMap, answeringFollowUpMap, answerFollowUp, continueChat, fetchConversations,
    celebrationType, showCelebration, streakDays, feedbackMessage, showFeedbackBubble,
    onCelebrationComplete, onFeedbackBubbleComplete, aiQuickFeedback,
  } = useRecordsContext();
  const { addScore, stage } = useSnowball();
  const [localError, setLocalError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  usePageView('records');
  const [newRecord, setNewRecord] = useState({
    content: '',
    type: 'success',
    tags: '',
    mood: 'happy',
    related_task_id: '',
  });

  const displayError = localError || error;

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    const tags = newRecord.tags ? newRecord.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const result = await createRecord({
      content: newRecord.content,
      type: newRecord.type,
      tags,
      mood: newRecord.mood,
      related_task_id: newRecord.related_task_id || undefined,
    });
    if (result) {
      addScore('RECORD_CREATED');
      setIsCreating(false);
      setNewRecord({ content: '', type: 'success', tags: '', mood: 'happy', related_task_id: '' });
    }
  };

  const handleQuickRecord = async (data: { content: string; type: string; mood: string; tags: string[]; related_task_id: string }) => {
    const result = await createRecord(data);
    if (result) addScore('RECORD_CREATED');
    return result;
  };

  const handleUpdateRecord = async (recordId: string, data: { type: string; tags: string[] }) => {
    await updateRecord(recordId, data);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    await deleteRecord(id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#FFD700] to-[#FFB6C1] rounded-3xl p-6 mb-6 shadow-lg animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-7 w-28 bg-white/30 rounded-2xl mb-2"></div>
                <div className="h-4 w-40 bg-white/20 rounded-2xl"></div>
              </div>
              <div className="h-10 w-24 bg-white/30 rounded-2xl"></div>
            </div>
          </div>
          <div className="mb-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded-2xl mb-4"></div>
              <div className="h-10 bg-gray-200 rounded-2xl mb-3"></div>
              <div className="flex gap-3">
                <div className="h-8 w-20 bg-gray-200 rounded-2xl"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-2xl"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
          <Skeleton type="card" count={3} className="space-y-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 relative overflow-hidden">
      <div className="absolute top-[-40px] right-[-40px] w-56 h-56 bg-[#FFD700]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-[#FFB6C1]/10 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-[#FFD700] to-[#FFB6C1] rounded-3xl p-6 mb-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-8 bg-white/80 rounded-full"></span>
                <h1 className="text-2xl font-bold text-white">我的记录</h1>
              </div>
              <p className="text-white/80 text-sm mt-1 ml-4">每个记录都是雪球成长的动力 ⛄</p>
            </div>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="bg-white/90 text-[#FFD700] py-2 px-5 rounded-2xl hover:bg-white transition-colors font-medium shadow-sm"
            >
              {isCreating ? '取消' : '+ 创建记录'}
            </button>
          </div>
        </div>

        {displayError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl mb-4 text-sm border border-red-100">{displayError}</div>
        )}

        <div className="mb-6">
          <QuickRecord onSubmit={handleQuickRecord} onUpdateRecord={handleUpdateRecord} />
        </div>

        {isCreating && (
          <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-6 bg-[#FFD700] rounded-full"></span>
              <h2 className="text-lg font-semibold text-gray-700">创建新记录</h2>
            </div>
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-600 mb-1">内容</label>
                <textarea
                  id="content"
                  name="content"
                  value={newRecord.content}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50 transition-all"
                  placeholder="记录今天的一个小成功..."
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-600 mb-1">类型</label>
                  <select
                    id="type"
                    name="type"
                    value={newRecord.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50 transition-all"
                  >
                    <option value="success">小成功</option>
                    <option value="habit">好习惯</option>
                    <option value="progress">进步</option>
                    <option value="reflection">感悟</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="mood" className="block text-sm font-medium text-gray-600 mb-1">心情</label>
                  <select
                    id="mood"
                    name="mood"
                    value={newRecord.mood}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50 transition-all"
                  >
                    <option value="happy">😊 开心</option>
                    <option value="proud">🥰 自豪</option>
                    <option value="excited">🤩 兴奋</option>
                    <option value="calm">😌 平静</option>
                    <option value="grateful">🙏 感恩</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-600 mb-1">标签（逗号分隔）</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={newRecord.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50 transition-all"
                  placeholder="例如：学习, 编程, 早起"
                />
              </div>
              {goals.length > 0 && (
                <div>
                  <label htmlFor="related_task_id" className="block text-sm font-medium text-gray-600 mb-1">关联长任务</label>
                  <select
                    id="related_task_id"
                    name="related_task_id"
                    value={newRecord.related_task_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] bg-[#FFF8F0]/50 transition-all"
                  >
                    <option value="">不关联长任务</option>
                    {goals.map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="bg-gradient-to-r from-[#FFD700] to-[#FFB6C1] text-white py-3 px-6 rounded-2xl hover:from-[#FFC800] hover:to-[#FF99AA] transition-all shadow-md hover:shadow-lg font-medium"
              >
                创建记录
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 text-center">
              <div className="flex justify-center mb-4">
                <SnowballCharacter size="md" />
              </div>
              <p className="text-gray-500 font-medium mb-1">{getStoryText('recordEmpty', stage).main}</p>
              <p className="text-gray-400 text-sm">{getStoryText('recordEmpty', stage).sub}</p>
            </div>
          ) : (
            records.map(record => {
              const taskId = record.related_task_id;
              const goalTitle = taskId ? goals.find((g: GoalItem) => g.id === taskId)?.title : undefined;
              return (
                <RecordCard
                  key={record.id}
                  record={record}
                  goalTitle={goalTitle}
                  onDelete={handleDeleteRecord}
                  feedback={feedbackMap[record.id]}
                  followUp={followUpMap[record.id]}
                  isLoadingFeedback={loadingFeedbackMap[record.id]}
                  conversations={conversationsMap[record.id] || []}
                  onAnswerFollowUp={answerFollowUp}
                  onContinueChat={continueChat}
                  isAnswering={answeringFollowUpMap[record.id]}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Celebration & Feedback effects */}
      {celebrationType && (
        <CelebrationEffect
          isActive={showCelebration}
          type={celebrationType}
          onComplete={onCelebrationComplete}
          answerContent={celebrationType === 'question_answer' ? feedbackMessage : undefined}
          streakDays={streakDays}
          message={celebrationType === 'breakthrough' ? feedbackMessage : undefined}
        />
      )}
      <FeedbackBubble
        message={feedbackMessage}
        isVisible={showFeedbackBubble}
        onComplete={onFeedbackBubbleComplete}
      />
    </div>
  );
};

export default RecordsPage;
