'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminders } from '@/hooks/useReminders';
import { useToast } from './Toast';
import type { ReminderItem } from '@/app/api/reminders/route';

const DEFAULT_LABELS = ['早安提醒', '午间提醒', '晚间提醒', '睡前提醒', '自定义'];

export default function ReminderSettings() {
  const {
    reminders,
    loading,
    requestPermission,
    createReminder,
    updateReminder,
    deleteReminder,
  } = useReminders();
  const { showToast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState('21:00');
  const [newLabel, setNewLabel] = useState('晚间提醒');
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleToggle = async (reminder: ReminderItem) => {
    if (!reminder.enabled) {
      const granted = await requestPermission();
      if (!granted) {
        showToast('请允许浏览器通知权限', 'error');
        return;
      }
    }

    setSaving(true);
    const success = await updateReminder(reminder.id, { enabled: !reminder.enabled });
    if (success) {
      showToast(reminder.enabled ? '提醒已关闭' : '提醒已开启', 'success');
    } else {
      showToast('操作失败，请重试', 'error');
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newTime) {
      showToast('请选择提醒时间', 'error');
      return;
    }

    const granted = await requestPermission();
    if (!granted) {
      showToast('请允许浏览器通知权限', 'error');
      return;
    }

    setSaving(true);
    const label = newLabel === '自定义' ? customLabel : newLabel;
    const result = await createReminder(newTime, label || '提醒');
    if (result) {
      showToast('提醒已创建', 'success');
      setShowAddForm(false);
      setNewTime('21:00');
      setNewLabel('晚间提醒');
      setCustomLabel('');
    } else {
      showToast('创建失败，请重试', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const success = await deleteReminder(id);
    if (success) {
      showToast('提醒已删除', 'success');
    } else {
      showToast('删除失败，请重试', 'error');
    }
    setSaving(false);
  };

  const handleTimeChange = async (reminder: ReminderItem, newTime: string) => {
    setEditingId(reminder.id);
    const success = await updateReminder(reminder.id, { time: newTime });
    if (success) {
      showToast(`提醒时间已更新为 ${newTime}`, 'success');
    } else {
      showToast('更新失败，请重试', 'error');
    }
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-24 bg-gray-200 rounded mb-3"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <span className="font-medium text-gray-700">每日提醒</span>
          <span className="text-xs text-gray-400">({reminders.length}个)</span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={saving}
          className="text-sm text-[#87CEEB] hover:text-[#6BB6E8] font-medium transition-colors"
        >
          + 新建
        </button>
      </div>

      <AnimatePresence>
        {reminders.length === 0 && !showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 text-gray-400 text-sm"
          >
            还没有设置提醒，点击"新建"添加一个吧
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence>
          {reminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#FFF8F0]/80 rounded-xl p-3 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(reminder)}
                    disabled={saving}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                      reminder.enabled ? 'bg-[#87CEEB]' : 'bg-gray-200'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                      animate={{ left: reminder.enabled ? '24px' : '4px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{reminder.label}</p>
                    <p className="text-xs text-gray-400">{reminder.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={reminder.time}
                    onChange={(e) => handleTimeChange(reminder, e.target.value)}
                    disabled={editingId === reminder.id || saving}
                    className="px-2 py-1 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#87CEEB]"
                  />
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    disabled={saving}
                    className="text-gray-300 hover:text-red-400 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-gradient-to-r from-[#87CEEB]/10 to-[#FFB6C1]/10 rounded-xl border border-[#87CEEB]/20">
              <p className="text-sm font-medium text-gray-700 mb-3">新建提醒</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">提醒时间</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#87CEEB]/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">提醒名称</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {DEFAULT_LABELS.map((label) => (
                      <button
                        key={label}
                        onClick={() => setNewLabel(label)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                          newLabel === label
                            ? 'bg-[#87CEEB] text-white'
                            : 'bg-white text-gray-500 border border-gray-200 hover:border-[#87CEEB]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {newLabel === '自定义' && (
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="输入自定义名称"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#87CEEB]/50"
                    />
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAdd}
                    disabled={saving || !newTime}
                    className="flex-1 py-2 bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] text-white rounded-xl font-medium text-sm hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {saving ? '创建中...' : '创建'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTime('21:00');
                      setNewLabel('晚间提醒');
                      setCustomLabel('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {reminders.length > 0 && !showAddForm && (
        <p className="text-xs text-gray-400 mt-3">
          到了设定时间，雪球会提醒你来记录小成功
        </p>
      )}
    </div>
  );
}
