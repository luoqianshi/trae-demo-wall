import { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Settings, ChevronDown, ChevronRight, CalendarClock, Calendar, CalendarDays, Star, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { useScheduleStore, SCHEDULE_TYPE_CONFIG } from '@/store/scheduleStore';
import { usePlannerStore, CATEGORY_CONFIG } from '@/store/plannerStore';
import { mergeDaySchedule, type MergedItem } from '@/lib/mergeSchedule';
import type { ScheduleType, RepeatType, ScheduleItem } from '@/types';

// 重复规则快捷预设（与 DailyRoutine 保持一致）
const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekdays', label: '工作日' },
  { value: 'weekend', label: '周末' },
  { value: 'custom', label: '自定义' },
];

// 星期选项（0=周日，1-6=周一至周六），按一二三四五六日顺序展示
const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
];

// 根据重复类型生成对应的星期数组
function getRepeatDays(repeat: RepeatType, customDays: number[] = []): number[] {
  switch (repeat) {
    case 'daily':
      return [0, 1, 2, 3, 4, 5, 6];
    case 'weekdays':
      return [1, 2, 3, 4, 5];
    case 'weekend':
      return [0, 6];
    case 'custom':
      return customDays;
  }
}

// 生成重复规则的可读文案
function getRepeatLabel(repeat: RepeatType, repeatDays: number[]): string {
  switch (repeat) {
    case 'daily':
      return '每天';
    case 'weekdays':
      return '工作日';
    case 'weekend':
      return '周末';
    case 'custom': {
      const dayMap: Record<number, string> = { 0: '日', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' };
      const order = [1, 2, 3, 4, 5, 6, 0];
      const sorted = [...(repeatDays || [])].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      return sorted.length > 0 ? '每周' + sorted.map((d) => dayMap[d]).join('') : '未选择';
    }
  }
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 获取某日期所在周的周一到周日（返回 7 个 Date，按周一到周日顺序）
function getWeekDates(base: Date = new Date()): Date[] {
  const d = new Date(base);
  const dayOfWeek = d.getDay(); // 0=周日，1=周一...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const result: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    result.push(cur);
  }
  return result;
}

// 获取某年某月的日历矩阵（周日为一周起点，含前导与尾部空格）
function getMonthMatrix(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function FixedSchedule() {
  const navigate = useNavigate();
  const { items: scheduleItems, addSchedule, removeSchedule, toggleScheduleImportant, generateDailySchedule } = useScheduleStore();
  const { tasks: plannerTasks, schedule: plannerSchedule } = usePlannerStore();

  const [showRoutineForm, setShowRoutineForm] = useState(false);

  // 主日程新增表单
  const [rTitle, setRTitle] = useState('');
  const [rStart, setRStart] = useState('14:00');
  const [rEnd, setREnd] = useState('15:00');
  const [rType, setRType] = useState<ScheduleType>('custom');
  const [rRepeat, setRRepeat] = useState<RepeatType>('daily');
  const [rRepeatDays, setRRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [rImportant, setRImportant] = useState(false);

  // 主日程子视图：当日表格 / 每周表格 / 每月日历
  // 支持从首页日历入口直接跳转到每月日历视图（?view=month）
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get('view') === 'month' ? 'month' : searchParams.get('view') === 'week' ? 'week' : 'day') as 'day' | 'week' | 'month';
  const [routineView, setRoutineView] = useState<'day' | 'week' | 'month'>(initialView);
  // 当日表格折叠状态
  const [dayCollapsed, setDayCollapsed] = useState(false);
  // 每月日历中展开查看详情的日期
  const [monthExpandedDay, setMonthExpandedDay] = useState<string | null>(null);
  // 管理全部日程项列表的折叠状态
  const [mgmtCollapsed, setMgmtCollapsed] = useState(true);

  // ===== 保存为图片：用 html2canvas 截取当前视图容器，导出 PNG 供下载打印 =====
  const dayViewRef = useRef<HTMLDivElement>(null);
  const weekViewRef = useRef<HTMLDivElement>(null);
  const monthViewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportImage = async () => {
    const refMap = { day: dayViewRef, week: weekViewRef, month: monthViewRef };
    const target = refMap[routineView].current;
    if (!target) return;
    setExporting(true);
    try {
      // 截图时临时展开折叠的当日表格，保证内容完整
      const wasCollapsed = dayCollapsed;
      if (routineView === 'day' && wasCollapsed) setDayCollapsed(false);
      // 等待 DOM 更新后再截图
      await new Promise((r) => setTimeout(r, 50));
      const canvas = await html2canvas(target, {
        backgroundColor: '#FFF8F0', // 暖白背景，与 app 风格一致
        scale: 2,                   // 2 倍清晰度，打印效果好
        useCORS: true,
        logging: false,
      });
      const labelMap = { day: '当日日程', week: '每周日程', month: '每月日历' };
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const link = document.createElement('a');
      link.download = `${labelMap[routineView]}_${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('导出图片失败:', e);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 主日程：切换重复规则，同步更新 repeatDays
  const handleRoutineRepeatChange = (repeat: RepeatType) => {
    const repeatDays = repeat === 'custom' ? getRepeatDays('weekdays') : getRepeatDays(repeat);
    setRRepeat(repeat);
    setRRepeatDays(repeatDays);
  };

  const handleRoutineToggleDay = (day: number) => {
    const dayOrder = WEEKDAY_OPTIONS.map((d) => d.value);
    const currentDays = rRepeatDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    setRRepeatDays(newDays);
    setRRepeat('custom');
  };

  const submitRoutine = () => {
    if (!rTitle.trim()) return;
    if (rStart >= rEnd) return;
    addSchedule({
      startTime: rStart,
      endTime: rEnd,
      title: rTitle.trim(),
      type: rType,
      reminder: true,
      buffTime: 5,
      isExamSprint: false,
      important: rImportant,
      repeat: rRepeat,
      repeatDays: rRepeat === 'custom' ? rRepeatDays : getRepeatDays(rRepeat),
      // 周期性日程不设起始日期，确保当周/当月所有对应日期都能显示
      startDate: '',
    });
    setRTitle('');
    setRRepeat('daily');
    setRRepeatDays([0, 1, 2, 3, 4, 5, 6]);
    setRImportant(false);
    setShowRoutineForm(false);
  };

  // ===== 主日程子视图数据 =====
  // 固定日程管理页需展示全部日程（含假期模式隐藏的课程），故 includeHidden = true
  // 三个视图均合并当日计划表项目，呈现完整时间线
  const daySchedule = useMemo(
    () => mergeDaySchedule(todayStr(), true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scheduleItems, plannerSchedule]
  );

  const weekDates = useMemo(() => getWeekDates(), []);
  // 每周表格：按 startTime 聚合，每个时间行包含 7 天的合并项
  const weekRows = useMemo(() => {
    const dayMerged = weekDates.map((d) => mergeDaySchedule(formatDate(d), true));
    const timeSet = new Set<string>();
    dayMerged.forEach((items) => items.forEach((it) => timeSet.add(it.startTime)));
    const times = Array.from(timeSet).sort();
    return times.map((time) => ({
      time,
      cells: dayMerged.map((items) => items.find((it) => it.startTime === time) || null),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, scheduleItems, plannerSchedule]);

  const monthNow = useMemo(() => new Date(), []);
  const monthWeeks = useMemo(() => getMonthMatrix(monthNow.getFullYear(), monthNow.getMonth()), [monthNow]);
  // 当月每天的合并时间线（固定日程 + 计划项目），月历单元格星标和展开详情共用
  const monthMergedCache = useMemo(() => {
    const map: Record<string, MergedItem[]> = {};
    monthWeeks.forEach((week) => {
      week.forEach((date) => {
        if (date) {
          const ds = formatDate(date);
          map[ds] = mergeDaySchedule(ds, true);
        }
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthWeeks, scheduleItems, plannerSchedule]);
  // 月历单元格星标所需：从合并缓存中提取当日固定日程项（避免重复调 generateDailySchedule）
  const monthSchedules = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    Object.entries(monthMergedCache).forEach(([date, merged]) => {
      map[date] = merged.filter((m): m is Extract<MergedItem, { kind: 'fixed' }> => m.kind === 'fixed').map((m) => m.raw);
    });
    return map;
  }, [monthMergedCache]);
  // 月度日历中显示的标星重要项目：按日期聚合，每天最多 3 个
  // 来源：① 固定日程中标星的 ScheduleItem ② 时间规划中标星的项目（plannerSchedule 中对应 block）
  // 两者合并后按 startTime 排序再取前 3，避免固定日程占满名额导致时间规划重要项无法显示
  // importantTaskIdSet：所有标星项目的 taskId 集合，展开详情中也用于回退判断旧数据 block 是否标星
  const importantTaskIdSet = useMemo(
    () => new Set(plannerTasks.filter((t) => t.important).map((t) => t.id)),
    [plannerTasks]
  );
  const monthImportantTasks = useMemo(() => {
    const map: Record<string, { id: string; name: string; startTime: string }[]> = {};
    // ① 固定日程中标星的 ScheduleItem（按当月每天的日程筛选）
    Object.entries(monthSchedules).forEach(([date, dayItems]) => {
      dayItems
        .filter((it) => it.important)
        .forEach((it) => {
          (map[date] || (map[date] = [])).push({ id: it.id, name: it.title, startTime: it.startTime });
        });
    });
    // ② 时间规划中标星的项目（block.important 或对应 task.important）
    plannerSchedule.forEach((block) => {
      if (block.important || importantTaskIdSet.has(block.taskId)) {
        (map[block.date] || (map[block.date] = [])).push({ id: block.id, name: block.taskName, startTime: block.startTime });
      }
    });
    // 每天按 startTime 排序后取前 3，保证时间规划重要项有机会显示
    Object.values(map).forEach((list) => {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (list.length > 3) list.splice(3);
    });
    return map;
  }, [importantTaskIdSet, plannerSchedule, monthSchedules]);

  const currentMonthLabel = `${monthNow.getFullYear()}年${monthNow.getMonth() + 1}月`;

  return (
    <div className="min-h-screen warm-bg pb-28">
      {/* 顶部 */}
      <header className="sticky top-0 z-20 glass border-b-2 border-corgi-yellow/20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="font-display text-lg text-text-primary">📅 固定日程</p>
            <p className="text-xs text-text-secondary">主日程查看与修改 · 当日 / 每周 / 每月</p>
          </div>
          <button
            onClick={() => navigate('/routine')}
            className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-warm-cream text-text-secondary font-bold text-sm hover:bg-corgi-yellow/10 transition-all border border-corgi-yellow/30"
          >
            <Settings size={16} />
            作息修改
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {/* 子视图切换按钮 + 保存图片按钮 */}
        <div className="flex gap-1.5 mb-3">
          {([
            { value: 'day', label: '当日日程', icon: <CalendarClock size={12} /> },
            { value: 'week', label: '每周日程', icon: <Calendar size={12} /> },
            { value: 'month', label: '每月日历', icon: <CalendarDays size={12} /> },
          ] as { value: 'day' | 'week' | 'month'; label: string; icon: React.ReactNode }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoutineView(opt.value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all',
                routineView === opt.value
                  ? 'bg-corgi-orange text-white shadow-soft'
                  : 'bg-warm-light text-text-secondary border border-corgi-yellow/20 hover:bg-corgi-yellow/10'
              )}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
          {/* 保存为图片：截取当前视图导出 PNG，方便下载打印 */}
          <button
            onClick={handleExportImage}
            disabled={exporting}
            title="保存为图片，可打印贴在家里"
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-mint-fresh/15 text-mint-deep border border-mint-fresh/30 hover:bg-mint-fresh/25 disabled:opacity-60"
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {exporting ? '导出中' : '保存图片'}
          </button>
        </div>

        {/* ===== 当日表格 ===== */}
        {routineView === 'day' && (
          <div ref={dayViewRef} className="rounded-2xl bg-warm-light shadow-soft border-2 border-corgi-yellow/20 overflow-hidden mb-3">
            <button
              onClick={() => setDayCollapsed(!dayCollapsed)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-corgi-yellow/10 hover:bg-corgi-yellow/20 transition-colors"
            >
              <span className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                <CalendarClock size={14} /> 今日日程 · {todayStr()}
                <span className="text-xs text-text-secondary font-normal">（点击{dayCollapsed ? '展开' : '折叠'}）</span>
              </span>
              {dayCollapsed ? <ChevronRight size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
            </button>
            {!dayCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-text-secondary border-b border-corgi-yellow/20 bg-warm-cream/50">
                      <th className="text-left px-3 py-2 font-bold">时间</th>
                      <th className="text-left px-3 py-2 font-bold">日程项</th>
                      <th className="text-left px-3 py-2 font-bold">类型</th>
                      <th className="text-left px-3 py-2 font-bold">详情</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {daySchedule.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-text-secondary text-xs">
                          今日暂无日程，可在下方添加
                        </td>
                      </tr>
                    ) : (
                      daySchedule.map((m, idx) => {
                        // 计划表项目行（只读展示，不在此页操作）
                        if (m.kind === 'project' || m.kind === 'break') {
                          const block = m.raw;
                          const cat = CATEGORY_CONFIG[block.category];
                          return (
                            <tr key={`proj-${block.id}-${idx}`} className="border-b border-corgi-yellow/10 last:border-0 bg-corgi-orange/5">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="font-bold text-text-primary text-xs">{block.startTime}</div>
                                <div className="text-[10px] text-text-light">{block.endTime}</div>
                              </td>
                              <td className="px-3 py-2 font-bold text-text-primary text-xs">
                                {block.taskName}
                                {block.done && <span className="ml-1 text-[9px] text-mint-deep">✓</span>}
                              </td>
                              <td className="px-3 py-2">
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap', cat.color)}>
                                  {cat.icon} 计划项目
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[10px] text-text-secondary whitespace-nowrap">
                                预估 {block.estimatedMinutes}分
                                {block.actualMinutes !== undefined && ` · 实际 ${block.actualMinutes}分`}
                              </td>
                              <td className="px-2 py-2 text-[10px] text-text-light">—</td>
                            </tr>
                          );
                        }
                        // 固定日程行（可删除/标星）
                        const item = m.raw;
                        const config = SCHEDULE_TYPE_CONFIG[item.type];
                        return (
                          <tr key={`fixed-${item.id}-${idx}`} className="border-b border-corgi-yellow/10 last:border-0">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="font-bold text-text-primary text-xs">{item.startTime}</div>
                              <div className="text-[10px] text-text-light">{item.endTime}</div>
                            </td>
                            <td className="px-3 py-2 font-bold text-text-primary text-xs">{item.title}</td>
                            <td className="px-3 py-2">
                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap', config.color)}>
                                {config.icon} {config.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[10px] text-text-secondary whitespace-nowrap">{getRepeatLabel(item.repeat, item.repeatDays)}</td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => toggleScheduleImportant(item.id)}
                                  className={cn('btn-press p-1 transition-colors', item.important ? 'text-corgi-orange' : 'text-text-light hover:text-corgi-orange')}
                                  title={item.important ? '取消重要标记' : '标记为重要'}
                                >
                                  <Star size={14} fill={item.important ? 'currentColor' : 'none'} />
                                </button>
                                <button onClick={() => removeSchedule(item.id)} className="text-text-light hover:text-berry-rose p-1 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== 每周表格 ===== */}
        {routineView === 'week' && (
          <div ref={weekViewRef} className="rounded-2xl bg-warm-light shadow-soft border-2 border-corgi-yellow/20 overflow-hidden mb-3">
            <div className="px-3 py-2 bg-corgi-yellow/10">
              <span className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                <Calendar size={14} /> 本周 · {weekDates[0] && `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()}`} - {weekDates[6] && `${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-text-secondary border-b border-corgi-yellow/20 bg-warm-cream/50">
                    <th className="text-left px-2 py-2 font-bold whitespace-nowrap">时间</th>
                    {weekDates.map((d, i) => {
                      const isToday = formatDate(d) === todayStr();
                      const labels = ['一', '二', '三', '四', '五', '六', '日'];
                      return (
                        <th key={i} className={cn('px-1 py-2 font-bold text-center min-w-[64px]', isToday ? 'text-corgi-orange' : 'text-text-secondary')}>
                          <div>周{labels[i]}</div>
                          <div className="text-[10px] text-text-light font-normal">{d.getMonth() + 1}/{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {weekRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-text-secondary text-xs">
                        本周暂无日程
                      </td>
                    </tr>
                  ) : (
                    weekRows.map((row) => (
                      <tr key={row.time} className="border-b border-corgi-yellow/10 last:border-0">
                        <td className="px-2 py-1.5 text-text-secondary font-bold whitespace-nowrap">{row.time}</td>
                        {row.cells.map((cell, i) => {
                          const isToday = formatDate(weekDates[i]) === todayStr();
                          if (!cell) {
                            return (
                              <td key={i} className={cn('px-1 py-1.5 text-center', isToday && 'bg-corgi-orange/5')}>
                                <span className="text-text-light/50">·</span>
                              </td>
                            );
                          }
                          // 计划表项目 / 休息块
                          if (cell.kind === 'project' || cell.kind === 'break') {
                            const block = cell.raw;
                            return (
                              <td key={i} className={cn('px-1 py-1.5 text-center', isToday && 'bg-corgi-orange/5')}>
                                <span className={cn('inline-block text-[10px] font-bold px-1 py-0.5 rounded-md border whitespace-nowrap', 'border-corgi-orange/40 bg-corgi-orange/10 text-corgi-dark')}>
                                  {block.taskName}
                                </span>
                              </td>
                            );
                          }
                          // 固定日程项
                          const it = cell.raw;
                          return (
                            <td key={i} className={cn('px-1 py-1.5 text-center', isToday && 'bg-corgi-orange/5')}>
                              <span className={cn('inline-block text-[10px] font-bold px-1 py-0.5 rounded-md border whitespace-nowrap', SCHEDULE_TYPE_CONFIG[it.type].color)}>
                                {it.title}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== 每月日历 ===== */}
        {routineView === 'month' && (
          <div ref={monthViewRef} className="rounded-2xl bg-warm-light shadow-soft border-2 border-corgi-yellow/20 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                <CalendarDays size={14} /> {currentMonthLabel}
              </span>
              <span className="text-[10px] text-text-secondary">点击日期查看详情</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-text-secondary py-1">{d}</div>
              ))}
            </div>
            <div className="space-y-1">
              {monthWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((date, di) => {
                    if (!date) return <div key={di} className="min-h-[44px] rounded-lg bg-warm-cream/40" />;
                    const dateStr = formatDate(date);
                    const isToday = dateStr === todayStr();
                    const isExpanded = monthExpandedDay === dateStr;
                    const importantList = (monthImportantTasks[dateStr] || []).slice(0, 3);
                    return (
                      <div
                        key={di}
                        onClick={() => setMonthExpandedDay(isExpanded ? null : dateStr)}
                        className={cn(
                          'min-h-[44px] rounded-lg p-1 flex flex-col items-center justify-start transition-colors cursor-pointer',
                          isToday ? 'bg-corgi-orange/20 border border-corgi-orange/40' : 'bg-warm-cream/60 hover:bg-corgi-yellow/10 border border-transparent',
                          isExpanded && 'ring-2 ring-corgi-orange'
                        )}
                      >
                        <span className={cn('text-xs font-bold', isToday ? 'text-corgi-orange' : 'text-text-primary')}>{date.getDate()}</span>
                        {importantList.length > 0 && (
                          <div className="w-full mt-0.5 space-y-0.5">
                            {importantList.map((it) => (
                              <div key={it.id} className="flex items-center gap-0.5 px-0.5 rounded bg-corgi-orange/10">
                                <Star size={8} className="text-corgi-orange fill-corgi-orange shrink-0" />
                                <span className="text-[8px] text-corgi-dark font-bold truncate">{it.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* 展开当日详情：合并固定日程 + 计划表项目 */}
            {monthExpandedDay && (
              <div className="mt-3 rounded-xl bg-warm-cream/80 p-3 border border-corgi-yellow/30 animate-pop-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-text-primary text-xs">{monthExpandedDay} 日程</span>
                  <span className="text-[10px] text-text-secondary">{(monthMergedCache[monthExpandedDay] || []).length} 项</span>
                </div>
                {(monthMergedCache[monthExpandedDay] || []).length === 0 ? (
                  <p className="text-[10px] text-text-secondary text-center py-2">当天暂无日程</p>
                ) : (
                  <div className="space-y-1.5">
                    {(monthMergedCache[monthExpandedDay] || []).map((m, idx) => {
                      // 计划表项目 / 休息块（只读）
                      if (m.kind === 'project' || m.kind === 'break') {
                        const block = m.raw;
                        const cat = CATEGORY_CONFIG[block.category];
                        // 判断项目块是否标星：优先用 block.important，旧数据回退到 task 反查
                        const isImportant = block.important || importantTaskIdSet.has(block.taskId);
                        return (
                          <div key={`proj-${block.id}-${idx}`} className="flex items-center gap-2 text-xs">
                            <span className="text-text-secondary font-bold whitespace-nowrap text-[10px]">{block.startTime}-{block.endTime}</span>
                            <span className={cn('px-1.5 py-0.5 rounded-full border font-bold text-[10px] border-corgi-orange/40 bg-corgi-orange/10 text-corgi-dark')}>
                              {cat.icon} {block.taskName}
                            </span>
                            {isImportant && <Star size={10} className="text-corgi-orange fill-corgi-orange shrink-0" />}
                            {block.done && <span className="text-[9px] text-mint-deep">✓</span>}
                          </div>
                        );
                      }
                      // 固定日程项（可标星/删除）
                      const item = m.raw;
                      const config = SCHEDULE_TYPE_CONFIG[item.type];
                      return (
                        <div key={`fixed-${item.id}-${idx}`} className="flex items-center gap-2 text-xs">
                          <span className="text-text-secondary font-bold whitespace-nowrap text-[10px]">{item.startTime}-{item.endTime}</span>
                          <span className={cn('px-1.5 py-0.5 rounded-full border font-bold text-[10px]', config.color)}>{config.icon} {item.title}</span>
                          <div className="ml-auto flex items-center gap-0.5">
                            <button
                              onClick={() => toggleScheduleImportant(item.id)}
                              className={cn('btn-press p-0.5 transition-colors', item.important ? 'text-corgi-orange' : 'text-text-light hover:text-corgi-orange')}
                              title={item.important ? '取消重要标记' : '标记为重要'}
                            >
                              <Star size={12} fill={item.important ? 'currentColor' : 'none'} />
                            </button>
                            <button onClick={() => removeSchedule(item.id)} className="text-text-light hover:text-berry-rose p-0.5 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 添加日程项按钮 */}
        <button
          onClick={() => setShowRoutineForm(true)}
          data-tour="add-schedule-btn"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-corgi-orange/40 text-corgi-dark font-bold bg-corgi-orange/5 hover:bg-corgi-orange/10 transition-colors mb-3"
        >
          <Plus size={18} /> 添加日程项
        </button>

        {/* 新增日程表单 */}
        {showRoutineForm && (
          <div className="rounded-2xl bg-warm-light p-4 shadow-soft border-2 border-corgi-yellow/30 space-y-3 animate-pop-in mb-3">
            <input
              value={rTitle}
              onChange={(e) => setRTitle(e.target.value)}
              placeholder="日程名称（如：高等数学）"
              className="w-full px-3 py-2 rounded-xl border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-text-secondary font-bold">开始时间</label>
                <input type="time" value={rStart} onChange={(e) => setRStart(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange" />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-bold">结束时间</label>
                <input type="time" value={rEnd} onChange={(e) => setREnd(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary font-bold block mb-1">类型</label>
              <div className="flex gap-1 flex-wrap">
                {(Object.keys(SCHEDULE_TYPE_CONFIG) as ScheduleType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setRType(type)}
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-bold border transition-colors',
                      rType === type
                        ? SCHEDULE_TYPE_CONFIG[type].color
                        : 'bg-warm-cream text-text-light border-gray-200'
                    )}
                  >
                    {SCHEDULE_TYPE_CONFIG[type].icon} {SCHEDULE_TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setRImportant(!rImportant)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all w-fit',
                rImportant
                  ? 'border-corgi-orange bg-corgi-orange/10 text-corgi-orange shadow-soft'
                  : 'border-corgi-yellow/30 bg-warm-cream text-text-secondary hover:border-corgi-yellow/50'
              )}
            >
              <Star size={14} fill={rImportant ? 'currentColor' : 'none'} />
              {rImportant ? '已标记重要' : '标记为重要'}
            </button>
            <div>
              <label className="text-xs text-text-secondary font-bold block mb-1">重复规则</label>
              <div className="flex gap-1">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRoutineRepeatChange(opt.value)}
                    className={cn(
                      'flex-1 py-1 rounded-lg text-xs font-bold transition-all',
                      rRepeat === opt.value
                        ? 'bg-corgi-orange text-white'
                        : 'bg-warm-cream text-text-secondary border border-corgi-yellow/20'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {rRepeat === 'custom' && (
                <div className="mt-2 flex gap-1">
                  {WEEKDAY_OPTIONS.map((day) => {
                    const selected = rRepeatDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        onClick={() => handleRoutineToggleDay(day.value)}
                        className={cn(
                          'flex-1 py-1.5 rounded-full text-xs font-bold transition-all',
                          selected
                            ? 'bg-corgi-orange text-white'
                            : 'bg-warm-cream text-text-secondary border border-corgi-yellow/20'
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={submitRoutine} className="flex-1 py-2 rounded-xl bg-corgi-orange text-white font-bold text-sm btn-press">
                添加
              </button>
              <button onClick={() => setShowRoutineForm(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">
                取消
              </button>
            </div>
          </div>
        )}

        {/* 管理全部日程项 */}
        {scheduleItems.length > 0 && (
          <div className="rounded-2xl bg-warm-light shadow-soft border-2 border-corgi-yellow/20 overflow-hidden">
            <button
              onClick={() => setMgmtCollapsed(!mgmtCollapsed)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-warm-cream/60 hover:bg-corgi-yellow/10 transition-colors"
            >
              <span className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                <Settings size={14} /> 管理全部日程项
                <span className="text-xs text-text-secondary font-normal">（共 {scheduleItems.length} 项，点击{mgmtCollapsed ? '展开' : '折叠'}）</span>
              </span>
              {mgmtCollapsed ? <ChevronRight size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
            </button>
            {!mgmtCollapsed && (
              <div className="divide-y divide-corgi-yellow/10">
                {[...scheduleItems]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((item) => {
                    const config = SCHEDULE_TYPE_CONFIG[item.type];
                    return (
                      <div key={item.id} className="flex items-center gap-2 p-2.5">
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0', config.color)}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-text-primary text-xs truncate">{item.title}</p>
                          <p className="text-[10px] text-text-secondary flex items-center gap-1">
                            {item.startTime} - {item.endTime} · 🔁 {getRepeatLabel(item.repeat, item.repeatDays)}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => toggleScheduleImportant(item.id)}
                            className={cn('btn-press p-1 transition-colors', item.important ? 'text-corgi-orange' : 'text-text-light hover:text-corgi-orange')}
                            title={item.important ? '取消重要标记' : '标记为重要'}
                          >
                            <Star size={14} fill={item.important ? 'currentColor' : 'none'} />
                          </button>
                          <button onClick={() => removeSchedule(item.id)} className="text-text-light hover:text-berry-rose p-1 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* 空状态提示 */}
        {scheduleItems.length === 0 && (
          <div className="rounded-2xl bg-warm-light p-8 text-center border-2 border-dashed border-corgi-yellow/30">
            <p className="text-4xl mb-2">📅</p>
            <p className="font-bold text-text-primary">还没有固定日程</p>
            <p className="text-xs text-text-secondary mt-1">添加日程项，或去作息设置页面导入模板</p>
          </div>
        )}
      </div>
    </div>
  );
}
