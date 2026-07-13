import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Clock, Sun, Moon, Utensils, BookOpen, Home, Sparkles, Check, ChevronLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScheduleStore, SCHEDULE_TYPE_CONFIG } from '@/store/scheduleStore';
import type { ScheduleType, RepeatType } from '@/types';

// 计算睡眠时长（小时），支持跨天
function calculateSleepHours(sleepTime: string, wakeTime: string): number {
  const [sleepH, sleepM] = sleepTime.split(':').map(Number);
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  const sleepMinutes = sleepH * 60 + sleepM;
  const wakeMinutes = wakeH * 60 + wakeM;
  let diff = wakeMinutes - sleepMinutes;
  if (diff < 0) {
    diff += 24 * 60; // 跨天
  }
  return diff / 60;
}

// 工作日作息模板（睡眠时段由独立状态控制，不在此列出）
const WEEKDAY_TEMPLATE: { startTime: string; endTime: string; title: string; type: ScheduleType; icon: React.ReactNode }[] = [
  { startTime: '07:00', endTime: '07:30', title: '起床洗漱', type: 'custom', icon: <Sun size={18} /> },
  { startTime: '07:30', endTime: '08:00', title: '早餐', type: 'rest', icon: <Utensils size={18} /> },
  { startTime: '08:00', endTime: '12:00', title: '上课', type: 'course', icon: <BookOpen size={18} /> },
  { startTime: '12:00', endTime: '13:00', title: '午餐', type: 'rest', icon: <Utensils size={18} /> },
  { startTime: '13:00', endTime: '13:30', title: '午休', type: 'rest', icon: <Moon size={18} /> },
  { startTime: '13:30', endTime: '17:30', title: '上课', type: 'course', icon: <BookOpen size={18} /> },
  { startTime: '17:30', endTime: '18:00', title: '放学回家', type: 'custom', icon: <Home size={18} /> },
  { startTime: '18:00', endTime: '19:00', title: '晚餐', type: 'rest', icon: <Utensils size={18} /> },
  // 晚餐后到睡前时段留给用户自行安排，系统不自动设置固定时间
];

// 周末作息模板（与工作日完全独立）
const WEEKEND_TEMPLATE: { startTime: string; endTime: string; title: string; type: ScheduleType; icon: React.ReactNode }[] = [
  { startTime: '08:00', endTime: '08:30', title: '起床洗漱', type: 'custom', icon: <Sun size={18} /> },
  { startTime: '08:30', endTime: '09:30', title: '早餐', type: 'rest', icon: <Utensils size={18} /> },
  { startTime: '09:30', endTime: '11:30', title: '作业时间', type: 'homework', icon: <BookOpen size={18} /> },
  { startTime: '11:30', endTime: '12:30', title: '自由活动', type: 'entertainment', icon: <Sparkles size={18} /> },
  { startTime: '12:30', endTime: '13:30', title: '午餐', type: 'rest', icon: <Utensils size={18} /> },
  { startTime: '13:30', endTime: '14:30', title: '午休', type: 'rest', icon: <Moon size={18} /> },
  { startTime: '14:30', endTime: '17:00', title: '兴趣爱好', type: 'entertainment', icon: <Sparkles size={18} /> },
  { startTime: '18:00', endTime: '19:00', title: '晚餐', type: 'rest', icon: <Utensils size={18} /> },
  // 晚餐后到睡前时段留给用户自行安排，系统不自动设置固定时间
];

// 假期作息模板（统一一套，不分工作日/周末）
const VACATION_TEMPLATE: { startTime: string; endTime: string; title: string; type: ScheduleType; icon: React.ReactNode }[] = [
  { startTime: '09:00', endTime: '09:30', title: '起床洗漱', type: 'custom', icon: <Sun size={18} /> },
  { startTime: '09:30', endTime: '10:00', title: '早餐', type: 'rest', icon: <Utensils size={18} /> },
  { startTime: '10:00', endTime: '12:00', title: '自主学习', type: 'homework', icon: <BookOpen size={18} /> },
  { startTime: '12:00', endTime: '13:00', title: '午餐', type: 'rest', icon: <Utensils size={18} /> },
  { startTime: '13:00', endTime: '14:30', title: '午休', type: 'rest', icon: <Moon size={18} /> },
  { startTime: '14:30', endTime: '17:00', title: '兴趣时间', type: 'entertainment', icon: <Sparkles size={18} /> },
  { startTime: '17:00', endTime: '18:00', title: '运动锻炼', type: 'custom', icon: <Home size={18} /> },
  { startTime: '18:00', endTime: '19:00', title: '晚餐', type: 'rest', icon: <Utensils size={18} /> },
  // 晚餐后到睡前时段留给用户自行安排，系统不自动设置固定时间
];

interface RoutineItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: ScheduleType;
  important?: boolean;
  repeatDays: number[];
}

// 重复日选项：工作日（周一至周五）与周末（周六、周日）各自可选
const WEEKDAY_DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
];
const WEEKEND_DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 6, label: '六' },
  { value: 0, label: '日' },
];
// 假期不区分工作日/周末，周一至周日全可选
const VACATION_DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
];
// 按 一二三四五六日 顺序排序
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
function sortDays(days: number[]): number[] {
  return [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyRoutine() {
  const navigate = useNavigate();
  const { importSchedule, clearAll } = useScheduleStore();

  // 工作日与周末两套完全独立的作息项数组，互不干扰
  // 工作日作息项默认周一至周五重复，周末作息项默认周六、周日重复
  const [weekdayItems, setWeekdayItems] = useState<RoutineItem[]>(
    WEEKDAY_TEMPLATE.map((item, index) => ({
      ...item,
      repeatDays: [1, 2, 3, 4, 5],
      id: `weekday-template-${index}`,
    }))
  );
  const [weekendItems, setWeekendItems] = useState<RoutineItem[]>(
    WEEKEND_TEMPLATE.map((item, index) => ({
      ...item,
      repeatDays: [0, 6],
      id: `weekend-template-${index}`,
    }))
  );
  // 假期作息项数组（第三套，与工作日/周末完全独立）
  const [vacationItems, setVacationItems] = useState<RoutineItem[]>(
    VACATION_TEMPLATE.map((item, index) => ({
      ...item,
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      id: `vacation-template-${index}`,
    }))
  );

  // 作息模式切换：工作日 / 周末 / 假期 三套可独立查看与编辑
  const [routineMode, setRoutineMode] = useState<'weekday' | 'weekend' | 'vacation'>('weekday');

  // 睡眠时段状态：工作日、周末、假期各自独立，互不影响
  const [weekdaySleepTime, setWeekdaySleepTime] = useState('22:00');
  const [weekdayWakeTime, setWeekdayWakeTime] = useState('07:00');
  const [weekendSleepTime, setWeekendSleepTime] = useState('22:30');
  const [weekendWakeTime, setWeekendWakeTime] = useState('08:00');
  const [vacationSleepTime, setVacationSleepTime] = useState('23:00');
  const [vacationWakeTime, setVacationWakeTime] = useState('09:00');
  // 当前模式对应的睡眠时间（随 routineMode 切换）
  const sleepTime = routineMode === 'weekday' ? weekdaySleepTime : routineMode === 'weekend' ? weekendSleepTime : vacationSleepTime;
  const wakeTime = routineMode === 'weekday' ? weekdayWakeTime : routineMode === 'weekend' ? weekendWakeTime : vacationWakeTime;
  const setSleepTime = routineMode === 'weekday' ? setWeekdaySleepTime : routineMode === 'weekend' ? setWeekendSleepTime : setVacationSleepTime;
  const setWakeTime = routineMode === 'weekday' ? setWeekdayWakeTime : routineMode === 'weekend' ? setWeekendWakeTime : setVacationWakeTime;
  const sleepHours = calculateSleepHours(sleepTime, wakeTime);
  const isSleepInsufficient = sleepHours < 8;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<{
    startTime: string;
    endTime: string;
    title: string;
    type: ScheduleType;
    important: boolean;
    repeatDays: number[];
  }>({
    startTime: '14:00',
    endTime: '15:00',
    title: '',
    type: 'custom' as ScheduleType,
    important: false,
    repeatDays: [1, 2, 3, 4, 5],
  });

  // 当前模式对应的 items 与 setter（随 routineMode 切换）
  const items = routineMode === 'weekday' ? weekdayItems : routineMode === 'weekend' ? weekendItems : vacationItems;
  const setItems = routineMode === 'weekday' ? setWeekdayItems : routineMode === 'weekend' ? setWeekendItems : setVacationItems;

  // 切换模式时关闭添加表单（各模式新增表单内容不互通，避免错位）
  const handleModeSwitch = (mode: 'weekday' | 'weekend' | 'vacation') => {
    setRoutineMode(mode);
    setShowAddForm(false);
    setNewItem({ ...newItem, title: '', repeatDays: defaultRepeatDaysForMode(mode) });
  };

  // 当前模式对应的默认重复日
  const defaultRepeatDaysForMode = (mode: 'weekday' | 'weekend' | 'vacation'): number[] =>
    mode === 'weekday' ? [1, 2, 3, 4, 5] : mode === 'weekend' ? [0, 6] : [0, 1, 2, 3, 4, 5, 6];

  // 当前模式对应的可选重复日选项
  const dayOptions = routineMode === 'weekday' ? WEEKDAY_DAY_OPTIONS : routineMode === 'weekend' ? WEEKEND_DAY_OPTIONS : VACATION_DAY_OPTIONS;

  // 切换已有作息项的某个重复日（可自由选择任意一天或多天，允许全部取消）
  const handleToggleItemDay = (id: string, day: number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const has = item.repeatDays.includes(day);
        const newDays = has
          ? item.repeatDays.filter((d) => d !== day)
          : [...item.repeatDays, day];
        return { ...item, repeatDays: sortDays(newDays) };
      })
    );
  };

  // 切换新增表单中某个重复日
  const handleToggleNewDay = (day: number) => {
    setNewItem((prev) => {
      const has = prev.repeatDays.includes(day);
      const newDays = has
        ? prev.repeatDays.filter((d) => d !== day)
        : [...prev.repeatDays, day];
      return { ...prev, repeatDays: sortDays(newDays) };
    });
  };

  // 打开新增表单时，根据当前模式重置默认重复日
  const handleOpenAddForm = () => {
    if (!showAddForm) {
      setNewItem({
        ...newItem,
        title: '',
        important: false,
        repeatDays: defaultRepeatDaysForMode(routineMode),
      });
    }
    setShowAddForm(!showAddForm);
  };

  const handleAdd = () => {
    if (!newItem.title.trim()) return;
    setItems([
      ...items,
      {
        ...newItem,
        id: `${routineMode}-new-${Date.now()}`,
        title: newItem.title.trim(),
        repeatDays:
          newItem.repeatDays.length > 0
            ? sortDays(newItem.repeatDays)
            : defaultRepeatDaysForMode(routineMode),
      },
    ]);
    setNewItem({ ...newItem, title: '', important: false, repeatDays: defaultRepeatDaysForMode(routineMode) });
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleToggleImportant = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, important: !item.important } : item)));
  };

  const handleUpdate = (id: string, updates: Partial<RoutineItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // ===== 完成前的校验：弹窗提醒两种异常情况 =====
  // 1. 某个作息项的开始时间晚于结束时间
  // 2. 同一模式内、相同重复日的作息项时间区间互相冲突
  // 返回错误文案数组，空数组表示通过
  const validateRoutine = (): string[] => {
    const errors: string[] = [];
    const modeLabel = (m: 'weekday' | 'weekend' | 'vacation') =>
      m === 'weekday' ? '工作日' : m === 'weekend' ? '周末' : '假期';
    const checkItems = (
      list: RoutineItem[],
      mode: 'weekday' | 'weekend' | 'vacation'
    ) => {
      const label = modeLabel(mode);
      // 校验 1：开始时间晚于结束时间
      list.forEach((item) => {
        if (item.startTime >= item.endTime) {
          errors.push(`【${label}】「${item.title}」开始时间晚于结束时间（${item.startTime} - ${item.endTime}）`);
        }
      });
      // 校验 2：相同重复日的作息项时间冲突
      // 两个区间 [s1,e1] 与 [s2,e2] 重叠条件：s1 < e2 && s2 < e1
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          // 仅当两作息项有相同重复日时才视为冲突
          const shareDay = a.repeatDays.some((d) => b.repeatDays.includes(d));
          if (!shareDay) continue;
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            errors.push(
              `【${label}】「${a.title}」(${a.startTime}-${a.endTime}) 与「${b.title}」(${b.startTime}-${b.endTime}) 时间冲突`
            );
          }
        }
      }
    };
    checkItems(weekdayItems, 'weekday');
    checkItems(weekendItems, 'weekend');
    checkItems(vacationItems, 'vacation');
    return errors;
  };

  const handleComplete = () => {
    // 校验：开始时间晚于结束时间 / 同日时间冲突
    const errors = validateRoutine();
    if (errors.length > 0) {
      alert('作息设置存在以下问题，请修改后再完成：\n\n' + errors.join('\n'));
      return;
    }
    // 根据睡眠时间与起床时间生成睡眠时段（跨天则拆为两段）
    // 工作日、周末、假期各自独立的睡眠方案，互不影响
    const buildSleepItems = (
      sTime: string, wTime: string, repeat: RepeatType, repeatDays: number[], vacationOnly = false
    ) => {
      const base = {
        title: '睡眠',
        type: 'rest' as ScheduleType,
        reminder: true,
        buffTime: 5,
        isExamSprint: false,
        vacationOnly,
        repeat,
        repeatDays,
        // 周期性作息不设起始日期，确保每周/每月视图能显示当周/当月所有对应日期
        startDate: '',
      };
      return sTime > wTime
        ? [
            // 跨天睡眠：睡前到午夜 + 午夜到起床
            { ...base, startTime: sTime, endTime: '24:00' },
            { ...base, startTime: '00:00', endTime: wTime },
          ]
        : [
            // 不跨天睡眠（如午睡）
            { ...base, startTime: sTime, endTime: wTime },
          ];
    };
    // 工作日睡眠（仅工作日重复，非假期）
    const weekdaySleep = buildSleepItems(weekdaySleepTime, weekdayWakeTime, 'weekdays', [1, 2, 3, 4, 5]);
    // 周末睡眠（仅周末重复，非假期）
    const weekendSleep = buildSleepItems(weekendSleepTime, weekendWakeTime, 'weekend', [0, 6]);
    // 假期睡眠（每天重复，仅假期内显示）
    const vacationSleep = buildSleepItems(vacationSleepTime, vacationWakeTime, 'daily', [0, 1, 2, 3, 4, 5, 6], true);

    // 根据选择的重复日推导出 repeat 类型与 repeatDays
    // - 工作日模式下，全选周一至周五 → repeat: 'weekdays'
    // - 周末模式下，全选周六、周日 → repeat: 'weekend'
    // - 假期模式下，全选七天 → repeat: 'daily'
    // - 其他情况 → repeat: 'custom'（保留用户自定义的子集）
    const deriveRepeat = (
      days: number[],
      mode: 'weekday' | 'weekend' | 'vacation'
    ): { repeat: RepeatType; repeatDays: number[] } => {
      const sorted = sortDays(days);
      if (mode === 'weekday') {
        const isFullWeekday = sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => sorted.includes(d));
        return {
          repeat: isFullWeekday ? ('weekdays' as RepeatType) : ('custom' as RepeatType),
          repeatDays: isFullWeekday ? [1, 2, 3, 4, 5] : sorted,
        };
      }
      if (mode === 'weekend') {
        const isFullWeekend = sorted.length === 2 && [0, 6].every((d) => sorted.includes(d));
        return {
          repeat: isFullWeekend ? ('weekend' as RepeatType) : ('custom' as RepeatType),
          repeatDays: isFullWeekend ? [0, 6] : sorted,
        };
      }
      // 假期模式：全选七天 → daily，否则 custom
      const isFullWeek = sorted.length === 7 && [0, 1, 2, 3, 4, 5, 6].every((d) => sorted.includes(d));
      return {
        repeat: isFullWeek ? ('daily' as RepeatType) : ('custom' as RepeatType),
        repeatDays: isFullWeek ? [0, 1, 2, 3, 4, 5, 6] : sorted,
      };
    };

    // 工作日作息项 → 按每个作息项自定义的重复日（非假期）
    const weekdayScheduleItems = weekdayItems.map((item) => {
      // 若用户全部取消选择，回退为该模式的全部默认日，避免项目永不显示
      const days = item.repeatDays.length > 0 ? item.repeatDays : [1, 2, 3, 4, 5];
      const { repeat, repeatDays } = deriveRepeat(days, 'weekday');
      return {
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        type: item.type,
        reminder: true,
        buffTime: 5,
        isExamSprint: false,
        important: item.important,
        repeat,
        repeatDays,
        startDate: '',
      };
    });
    // 周末作息项 → 按每个作息项自定义的重复日（非假期）
    const weekendScheduleItems = weekendItems.map((item) => {
      const days = item.repeatDays.length > 0 ? item.repeatDays : [0, 6];
      const { repeat, repeatDays } = deriveRepeat(days, 'weekend');
      return {
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        type: item.type,
        reminder: true,
        buffTime: 5,
        isExamSprint: false,
        important: item.important,
        repeat,
        repeatDays,
        startDate: '',
      };
    });
    // 假期作息项 → 按每个作息项自定义的重复日（仅假期内显示）
    const vacationScheduleItems = vacationItems.map((item) => {
      const days = item.repeatDays.length > 0 ? item.repeatDays : [0, 1, 2, 3, 4, 5, 6];
      const { repeat, repeatDays } = deriveRepeat(days, 'vacation');
      return {
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        type: item.type,
        reminder: true,
        buffTime: 5,
        isExamSprint: false,
        important: item.important,
        vacationOnly: true,
        repeat,
        repeatDays,
        startDate: '',
      };
    });
    clearAll();
    importSchedule([
      ...weekdaySleep,
      ...weekendSleep,
      ...vacationSleep,
      ...weekdayScheduleItems,
      ...weekendScheduleItems,
      ...vacationScheduleItems,
    ]);
    navigate('/');
  };

  // 当前模式对应的作息项（按开始时间排序）
  const sortedItems = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="min-h-screen warm-bg flex flex-col items-center px-4 pt-8 pb-10">
      <button
        onClick={() => navigate('/welcome')}
        className="self-start flex items-center gap-1 text-xs text-text-secondary font-bold mb-4 hover:text-text-primary transition-colors"
      >
        <ChevronLeft size={14} />
        返回上一步
      </button>

      <div className="text-center mb-6">
        <p className="text-4xl mb-2">⏰📅</p>
        <h1 className="font-display text-3xl text-text-primary">设置固定作息</h1>
        <p className="text-sm text-text-secondary mt-1">告诉我们你的日常作息，帮你规划空闲时间</p>
      </div>

      <div className="w-full max-w-md bg-warm-light rounded-3xl p-5 shadow-soft border-2 border-corgi-orange/30 max-h-[70vh] overflow-y-auto">
        {/* 工作日 / 周末 / 假期 作息模式切换 */}
        <div data-tour="routine-mode" className="flex gap-2 mb-4 p-1 bg-warm-cream rounded-2xl">
          <button
            onClick={() => handleModeSwitch('weekday')}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
              routineMode === 'weekday'
                ? 'bg-corgi-orange text-white shadow-soft'
                : 'text-text-secondary hover:bg-corgi-yellow/10'
            )}
          >
            📅 工作日
          </button>
          <button
            onClick={() => handleModeSwitch('weekend')}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
              routineMode === 'weekend'
                ? 'bg-corgi-orange text-white shadow-soft'
                : 'text-text-secondary hover:bg-corgi-yellow/10'
            )}
          >
            🎉 周末
          </button>
          <button
            onClick={() => handleModeSwitch('vacation')}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
              routineMode === 'vacation'
                ? 'bg-corgi-orange text-white shadow-soft'
                : 'text-text-secondary hover:bg-corgi-yellow/10'
            )}
          >
            🏖️ 假期
          </button>
        </div>

        <div className="space-y-3">
          {/* 睡眠时段设置卡片（特殊样式，区别于其他作息卡片） */}
          <div data-tour="routine-sleep" className="rounded-2xl p-4 shadow-soft border-2 border-indigo-400/50 bg-indigo-50/80">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-200">
                <Moon size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-text-primary text-sm">睡眠时段</p>
                <p className="text-xs text-text-secondary">{routineMode === 'weekday' ? '工作日' : routineMode === 'weekend' ? '周末' : '假期'}的睡觉和起床时间（与其他套独立）</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                {sleepHours.toFixed(1)}小时
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-text-secondary font-bold block mb-1">睡觉时间</label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border-2 border-indigo-300 bg-warm-light text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-text-secondary font-bold block mb-1">起床时间</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border-2 border-indigo-300 bg-warm-light text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            {isSleepInsufficient && (
              <p className="text-xs text-berry-rose font-bold mt-2 flex items-center gap-1">
                ⚠️ 睡眠时间不足8小时，建议至少保证8小时睡眠
              </p>
            )}
          </div>

          {sortedItems.map((item, index) => {
            const config = SCHEDULE_TYPE_CONFIG[item.type];
            return (
              <div key={item.id} data-tour={index === 0 ? 'routine-item' : undefined} className="rounded-2xl p-3 shadow-soft border-2 border-corgi-yellow/20 bg-warm-cream/60">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.color)}>
                    {item.type === 'course' && <BookOpen size={18} className="text-corgi-dark" />}
                    {item.type === 'homework' && <BookOpen size={18} className="text-mint-deep" />}
                    {item.type === 'rest' && <Moon size={18} className="text-berry-rose" />}
                    {item.type === 'entertainment' && <Sparkles size={18} className="text-purple-500" />}
                    {item.type === 'custom' && <Home size={18} className="text-corgi-dark" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text-primary text-sm">{item.title}</p>
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock size={12} /> {item.startTime} - {item.endTime}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleImportant(item.id)}
                    className={cn('btn-press p-1 transition-colors', item.important ? 'text-corgi-orange' : 'text-text-light hover:text-corgi-orange')}
                    title={item.important ? '取消重要标记' : '标记为重要'}
                  >
                    <Star size={16} fill={item.important ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-text-light hover:text-berry-rose p-1 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-3 flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-text-secondary font-bold block mb-1">开始时间</label>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleUpdate(item.id, { startTime: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-xs font-bold focus:outline-none focus:border-corgi-orange"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-secondary font-bold block mb-1">结束时间</label>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleUpdate(item.id, { endTime: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-xs font-bold focus:outline-none focus:border-corgi-orange"
                    />
                  </div>
                </div>

                <p className="mt-2 text-[10px] text-text-secondary font-bold">
                  🔁 重复日（{routineMode === 'weekday' ? '工作日' : routineMode === 'weekend' ? '周末' : '假期'}内可选任意一天或多天）
                </p>
                <div className="mt-1.5 flex gap-1 flex-wrap">
                  {dayOptions.map((opt) => {
                    const active = item.repeatDays.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleToggleItemDay(item.id, opt.value)}
                        title={active ? '取消该日' : '加入该日'}
                        className={cn(
                          'w-7 h-7 rounded-full text-xs font-bold transition-all',
                          active
                            ? 'bg-corgi-orange text-white shadow-soft'
                            : 'bg-warm-cream text-text-light border border-corgi-yellow/30 hover:bg-corgi-yellow/10'
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {showAddForm && (
            <div className="rounded-2xl bg-corgi-yellow/10 p-3 border-2 border-dashed border-corgi-orange/40 animate-pop-in">
              <input
                type="text"
                placeholder="作息名称（如：练钢琴）"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border-2 border-corgi-yellow/30 bg-warm-light text-sm font-bold focus:outline-none focus:border-corgi-orange mb-2"
              />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="time"
                  value={newItem.startTime}
                  onChange={(e) => setNewItem({ ...newItem, startTime: e.target.value })}
                  className="px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-sm font-bold focus:outline-none focus:border-corgi-orange"
                />
                <input
                  type="time"
                  value={newItem.endTime}
                  onChange={(e) => setNewItem({ ...newItem, endTime: e.target.value })}
                  className="px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-sm font-bold focus:outline-none focus:border-corgi-orange"
                />
              </div>
              <div className="flex gap-2 mb-2">
                {(Object.keys(SCHEDULE_TYPE_CONFIG) as ScheduleType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewItem({ ...newItem, type })}
                    className={cn(
                      'px-2 py-1 rounded-full text-[10px] font-bold border transition-colors',
                      newItem.type === type
                        ? SCHEDULE_TYPE_CONFIG[type].color
                        : 'bg-warm-light text-text-light border-gray-200'
                    )}
                  >
                    {SCHEDULE_TYPE_CONFIG[type].icon} {SCHEDULE_TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setNewItem({ ...newItem, important: !newItem.important })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all w-fit mb-2',
                  newItem.important
                    ? 'border-corgi-orange bg-corgi-orange/10 text-corgi-orange shadow-soft'
                    : 'border-corgi-yellow/30 bg-warm-cream text-text-secondary hover:border-corgi-yellow/50'
                )}
              >
                <Star size={14} fill={newItem.important ? 'currentColor' : 'none'} />
                {newItem.important ? '已标记重要' : '标记为重要'}
              </button>
              <p className="text-[10px] text-text-secondary font-bold mb-1">
                🔁 重复日（{routineMode === 'weekday' ? '工作日' : routineMode === 'weekend' ? '周末' : '假期'}内可选任意一天或多天）
              </p>
              <div className="flex gap-1 flex-wrap mb-2">
                {dayOptions.map((opt) => {
                  const active = newItem.repeatDays.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleToggleNewDay(opt.value)}
                      title={active ? '取消该日' : '加入该日'}
                      className={cn(
                        'w-7 h-7 rounded-full text-xs font-bold transition-all',
                        active
                          ? 'bg-corgi-orange text-white shadow-soft'
                          : 'bg-warm-light text-text-light border border-corgi-yellow/30 hover:bg-corgi-yellow/10'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-text-secondary mb-2">
                将加入{routineMode === 'weekday' ? '工作日' : routineMode === 'weekend' ? '周末' : '假期'}作息，与其他套独立
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!newItem.title.trim()}
                  className="flex-1 py-2 rounded-xl bg-corgi-orange text-white font-bold text-sm btn-press disabled:bg-gray-300"
                >
                  添加
                </button>
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">
                  取消
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleOpenAddForm}
            data-tour="routine-add"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-corgi-orange/40 text-corgi-dark font-bold bg-corgi-orange/5 hover:bg-corgi-orange/10 transition-colors"
          >
            <Plus size={18} /> 添加作息项
          </button>
        </div>
      </div>

      <div className="mt-6 w-full max-w-md">
        <button
          onClick={handleComplete}
          data-tour="routine-complete"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold shadow-soft transition-all bg-gradient-to-r from-corgi-orange to-berry-rose hover:shadow-puffy"
        >
          <Check size={18} />
          完成设置，开始使用
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-xs text-text-secondary mt-3 py-2 hover:text-text-primary transition-colors"
        >
          跳过，稍后设置
        </button>
      </div>
    </div>
  );
}
