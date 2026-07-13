import { useState } from 'react';
import { Calendar, Plus, Zap, FileDown } from 'lucide-react';
import type { ScheduleItem, ScheduleType } from '@/types';
import ScheduleRow from './ScheduleRow';
import {
  useScheduleStore,
  COURSE_TEMPLATES,
  SCHEDULE_TYPE_CONFIG,
  SCHEDULE_TEMPLATES,
} from '@/store/scheduleStore';
import SoftButton from '@/components/common/SoftButton';
import { cn } from '@/lib/utils';

export default function ScheduleTable() {
  const { items, toggleReminder, removeSchedule, addSchedule, importSchedule } = useScheduleStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newItem, setNewItem] = useState({
    startTime: '08:00',
    endTime: '09:30',
    title: '',
    type: 'course' as ScheduleType,
    reminder: true,
    buffTime: 5,
  });

  const handleAddCustom = () => {
    if (!newItem.title.trim()) return;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addSchedule({
      ...newItem,
      title: newItem.title.trim(),
      isExamSprint: false,
      repeat: 'daily',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      startDate: todayStr,
    });
    setNewItem({ ...newItem, title: '' });
    setShowAddForm(false);
  };

  const handleQuickAdd = (template: Omit<ScheduleItem, 'id'>) => {
    addSchedule(template);
    setShowQuickAdd(false);
  };

  const handleImport = (templateItems: Omit<ScheduleItem, 'id'>[]) => {
    importSchedule(templateItems);
    setShowImport(false);
  };

  return (
    <div className="bg-warm-light rounded-puffy shadow-puffy overflow-hidden border-2 border-corgi-yellow/20">
      {/* 表头 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-corgi-yellow/15 border-b-2 border-corgi-yellow/20">
        <Calendar size={20} className="text-corgi-orange" />
        <h2 className="font-display text-lg text-text-primary">今日日程</h2>
        <span className="ml-auto text-sm text-text-secondary bg-warm-light px-3 py-1 rounded-full font-bold">
          {items.length} 项
        </span>
      </div>

      {/* 日程列表 */}
      {items.length > 0 ? (
        <div className="max-h-[400px] overflow-y-auto">
          {items.map((item: ScheduleItem) => (
            <ScheduleRow
              key={item.id}
              item={item}
              onToggleReminder={toggleReminder}
              onRemove={removeSchedule}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center px-4">
          <div className="text-5xl mb-3 animate-float">🐾</div>
          <p className="text-text-secondary font-bold mb-1">还没有日程哦～</p>
          <p className="text-sm text-text-light mb-4">手动添加课程，或选择模板快速生成日程</p>

          {/* 快速添加模板 */}
          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
            {COURSE_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => handleQuickAdd(tpl)}
                className={cn(
                  'btn-press flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  SCHEDULE_TYPE_CONFIG[tpl.type].color
                )}
              >
                <span>{SCHEDULE_TYPE_CONFIG[tpl.type].icon}</span>
                {tpl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 添加表单 */}
      {showAddForm && (
        <div className="p-4 bg-corgi-yellow/10 border-t-2 border-corgi-yellow/20 animate-pop-in">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="time"
              value={newItem.startTime}
              onChange={(e) => setNewItem({ ...newItem, startTime: e.target.value })}
              className="px-3 py-2 rounded-xl bg-warm-light border-2 border-corgi-yellow/30 text-text-primary text-sm outline-none focus:border-corgi-orange"
            />
            <input
              type="time"
              value={newItem.endTime}
              onChange={(e) => setNewItem({ ...newItem, endTime: e.target.value })}
              className="px-3 py-2 rounded-xl bg-warm-light border-2 border-corgi-yellow/30 text-text-primary text-sm outline-none focus:border-corgi-orange"
            />
          </div>
          <input
            type="text"
            placeholder="日程标题（如：高数课）"
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-warm-light border-2 border-corgi-yellow/30 text-text-primary text-sm outline-none focus:border-corgi-orange mb-2"
          />
          <div className="flex gap-2 mb-2 flex-wrap">
            {(Object.keys(SCHEDULE_TYPE_CONFIG) as ScheduleType[]).map((type) => (
              <button
                key={type}
                onClick={() => setNewItem({ ...newItem, type })}
                className={cn(
                  'btn-press px-2 py-1 rounded-full text-xs font-bold border transition-colors',
                  newItem.type === type
                    ? SCHEDULE_TYPE_CONFIG[type].color
                    : 'bg-warm-light text-text-light border-gray-200'
                )}
              >
                {SCHEDULE_TYPE_CONFIG[type].icon} {SCHEDULE_TYPE_CONFIG[type].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <SoftButton variant="secondary" size="sm" className="flex-1" onClick={() => setShowAddForm(false)}>
              取消
            </SoftButton>
            <SoftButton variant="accent" size="sm" className="flex-1" onClick={handleAddCustom}>
              添加
            </SoftButton>
          </div>
        </div>
      )}

      {/* 三按钮：自定义 / 快速添加 / 一键导入 */}
      <div className="p-3 border-t-2 border-corgi-yellow/15 grid grid-cols-3 gap-2">
        <SoftButton
          variant="secondary"
          size="sm"
          onClick={() => { setShowAddForm(!showAddForm); setShowQuickAdd(false); setShowImport(false); }}
        >
          <Plus size={16} />
          自定义
        </SoftButton>
        <SoftButton
          variant="primary"
          size="sm"
          onClick={() => { setShowQuickAdd(!showQuickAdd); setShowAddForm(false); setShowImport(false); }}
        >
          <Zap size={16} />
          快速
        </SoftButton>
        <SoftButton
          variant="accent"
          size="sm"
          onClick={() => { setShowImport(!showImport); setShowAddForm(false); setShowQuickAdd(false); }}
        >
          <FileDown size={16} />
          导入
        </SoftButton>
      </div>

      {/* 快速添加面板 */}
      {showQuickAdd && (
        <div className="p-3 bg-corgi-yellow/10 border-t-2 border-corgi-yellow/20 animate-pop-in">
          <p className="text-xs font-bold text-text-secondary mb-2">📋 一键添加模板</p>
          <div className="grid grid-cols-2 gap-2">
            {COURSE_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => handleQuickAdd(tpl)}
                className={cn(
                  'btn-press flex items-center gap-2 p-2 rounded-xl border text-left transition-all',
                  SCHEDULE_TYPE_CONFIG[tpl.type].color
                )}
              >
                <span className="text-base">{SCHEDULE_TYPE_CONFIG[tpl.type].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{tpl.title}</p>
                  <p className="text-[10px] opacity-70">{tpl.startTime}-{tpl.endTime}</p>
                </div>
                <Plus size={14} className="shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 一键导入课表面板 */}
      {showImport && (
        <div className="p-3 bg-corgi-yellow/10 border-t-2 border-corgi-yellow/20 animate-pop-in">
          <p className="text-xs font-bold text-text-secondary mb-2">📅 一键导入周/月课表</p>
          <div className="flex flex-col gap-2">
            {SCHEDULE_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => handleImport(tpl.items)}
                className="btn-press flex items-center gap-3 p-3 rounded-xl bg-warm-light border-2 border-corgi-yellow/30 hover:border-corgi-orange transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-corgi-orange/20 flex items-center justify-center text-lg">
                  {i === 0 ? '🗓️' : '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{tpl.name}</p>
                  <p className="text-xs text-text-secondary">
                    {tpl.items.length} 项日程 · {tpl.items[0].startTime} 起
                  </p>
                </div>
                <FileDown size={18} className="text-corgi-orange shrink-0" />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-light mt-2 text-center">
            导入会自动去重，相同时间相同标题不会重复添加
          </p>
        </div>
      )}
    </div>
  );
}
