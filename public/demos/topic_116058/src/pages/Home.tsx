import { useState, useMemo, useEffect } from 'react';
import { Sparkles, Timer, Play, TrendingUp, CheckCircle2, CalendarDays, Star, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import CorgiMascot, { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import { useCorgiStore } from '@/store/corgiStore';
import { useBackpackStore } from '@/store/backpackStore';
import { usePlannerStore, CATEGORY_CONFIG } from '@/store/plannerStore';
import { useScheduleStore, SCHEDULE_TYPE_CONFIG } from '@/store/scheduleStore';
import { mergeDaySchedule } from '@/lib/mergeSchedule';
import { cn } from '@/lib/utils';

const moodText: Record<string, string> = {
  happy: '心情超好～',
  sleepy: '有点困困...',
  excited: '超级兴奋！',
  sad: '有点难过',
  normal: '一切都好',
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function Home() {
  const { corgi, setMood } = useCorgiStore();
  const { backpack, addPoints, checkTitleUnlocks } = useBackpackStore();
  const {
    tasks, schedule, learningStats,
    toggleScheduleDone, recordScheduleActual,
  } = usePlannerStore();
  const { generateDailySchedule } = useScheduleStore();
  // 订阅固定日程项变化，用于合并数据重新计算
  const fixedItems = useScheduleStore((s) => s.items);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 ${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}`;
  const todayKey = todayStr();
  // 今日合并时间线：固定日程 + 计划表项目，按 startTime 排序
  const todayMerged = useMemo(
    () => mergeDaySchedule(todayKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule, fixedItems]
  );
  // 今日计划表项目块（不含休息、不含固定日程）：待办 + 已完成 = 今日所有计划项目
  const todayProjectBlocks = schedule.filter((b) => b.date === todayKey && !b.isBreak);
  const pendingBlocks = todayProjectBlocks.filter((b) => !b.done);
  const completedBlocks = todayProjectBlocks.filter((b) => b.done);

  const learnedCount = Object.keys(learningStats).length;
  const petLabel = PET_LABEL[corgi.petType];

  // 待办 / 已完成 内嵌展开状态
  const [expandedPanel, setExpandedPanel] = useState<'pending' | 'completed' | null>(null);

  // ===== 专注倒计时（与 TimePlanner 一致，支持首页直接专注） =====
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [focusOvertime, setFocusOvertime] = useState(0);
  const [focusPaused, setFocusPaused] = useState(false);
  const [focusDone, setFocusDone] = useState(false);
  const [focusResult, setFocusResult] = useState<{ actual: number; estimated: number; diff: number; pointsAwarded: boolean } | null>(null);

  const handleStartFocus = (blockId: string, minutes: number) => {
    setFocusBlockId(blockId);
    setFocusRemaining(minutes * 60);
    setFocusOvertime(0);
    setFocusPaused(false);
    setFocusDone(false);
  };

  useEffect(() => {
    if (!focusBlockId || focusPaused) return;
    const timer = setInterval(() => {
      if (!focusDone) {
        setFocusRemaining((prev) => {
          if (prev <= 1) { setFocusDone(true); return 0; }
          return prev - 1;
        });
      } else {
        setFocusOvertime((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [focusBlockId, focusPaused, focusDone]);

  const resetFocus = () => {
    setFocusBlockId(null);
    setFocusRemaining(0);
    setFocusOvertime(0);
    setFocusPaused(false);
    setFocusDone(false);
  };

  // 完成专注 / 提前完成：记录实际用时 + 发放积分（同一项目只发一次）
  const finishFocus = (isOvertime: boolean) => {
    if (!focusBlockId) return;
    const block = schedule.find((b) => b.id === focusBlockId);
    if (!block) return;
    const estimatedSec = block.estimatedMinutes * 60;
    const actualSec = isOvertime ? estimatedSec + focusOvertime : Math.max(0, estimatedSec - focusRemaining);
    const actualMinutes = Math.max(1, Math.round(actualSec / 60));
    recordScheduleActual(focusBlockId, actualMinutes);
    const shouldAward = !block.pointsAwarded;
    if (shouldAward) {
      addPoints(20);
      setMood('excited');
      checkTitleUnlocks(1, 0);
      usePlannerStore.setState((state) => ({
        schedule: state.schedule.map((b) => (b.id === focusBlockId ? { ...b, pointsAwarded: true, done: true } : b)),
      }));
    }
    setFocusResult({
      actual: actualMinutes,
      estimated: block.estimatedMinutes,
      diff: actualMinutes - block.estimatedMinutes,
      pointsAwarded: shouldAward,
    });
    resetFocus();
  };

  const handleExitFocus = () => resetFocus();

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ===== 今日计划：按当前时间过滤，显示当前时间及之后的合并时间线（固定日程 + 计划项目，含已完成） =====
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const upcomingBlocks = useMemo(() => {
    // 过滤掉已完全过去的（结束时间 <= 当前时间）和休息块
    return todayMerged
      .filter((m) => {
        if (m.kind === 'break') return false; // 今日计划列表不含休息块
        const [eh, em] = m.endTime.split(':').map(Number);
        const endMin = eh * 60 + em;
        return endMin > nowMinutes; // 结束时间在当前之后
      });
  }, [todayMerged, nowMinutes]);

  // ===== 内嵌月历（复用 FixedSchedule 的月历渲染逻辑） =====
  const [monthExpandedDay, setMonthExpandedDay] = useState<string | null>(null);
  const monthNow = useMemo(() => new Date(), []);
  const monthWeeks = useMemo(() => getMonthMatrix(monthNow.getFullYear(), monthNow.getMonth()), [monthNow]);
  const monthSchedules = useMemo(() => {
    const map: Record<string, ReturnType<typeof generateDailySchedule>> = {};
    monthWeeks.forEach((week) => {
      week.forEach((date) => {
        if (date) {
          const ds = formatDate(date);
          map[ds] = generateDailySchedule(ds, true);
        }
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthWeeks, generateDailySchedule]);
  // 月历重要项目（标星），每天最多 3 个
  const monthImportantTasks = useMemo(() => {
    const map: Record<string, { id: string; name: string }[]> = {};
    const push = (date: string, id: string, name: string) => {
      const list = map[date] || (map[date] = []);
      if (list.length < 3) list.push({ id, name });
    };
    Object.entries(monthSchedules).forEach(([date, dayItems]) => {
      dayItems
        .filter((it) => it.important)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .forEach((it) => push(date, it.id, it.title));
    });
    const importantTaskIds = new Set(tasks.filter((t) => t.important).map((t) => t.id));
    schedule.forEach((block) => {
      if (importantTaskIds.has(block.taskId)) {
        push(block.date, block.id, block.taskName);
      }
    });
    return map;
  }, [tasks, schedule, monthSchedules]);
  const currentMonthLabel = `${monthNow.getFullYear()}年${monthNow.getMonth() + 1}月`;

  // 渲染合并时间线中的单项（固定日程只读 / 项目块可操作 / 休息块只读）
  const renderMergedItem = (m: typeof todayMerged[number], idx: number) => {
    // 固定日程项（只读展示，不可专注/勾选）
    if (m.kind === 'fixed') {
      const it = m.raw;
      const config = SCHEDULE_TYPE_CONFIG[it.type];
      return (
        <div
          key={`fixed-${it.id}-${idx}`}
          className="rounded-2xl p-2.5 shadow-soft border-2 flex items-center gap-2 bg-warm-cream/70 border-corgi-yellow/15"
        >
          <div className="w-5 h-5 rounded-full bg-warm-light border border-corgi-yellow/30 flex items-center justify-center shrink-0">
            <Lock size={10} className="text-text-light" />
          </div>
          <div className="w-14 text-center shrink-0">
            <p className="text-xs font-bold text-text-primary">{it.startTime}</p>
            <p className="text-[10px] text-text-light">{it.endTime}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', config.color)}>{config.icon}</span>
              <p className="font-bold text-xs truncate text-text-secondary">{it.title}</p>
              {it.important && <Star size={11} className="text-corgi-orange fill-corgi-orange shrink-0" />}
            </div>
            <p className="text-[10px] text-text-light mt-0.5">固定日程 · {config.label}</p>
          </div>
        </div>
      );
    }
    // 休息块（只读）
    if (m.kind === 'break') {
      const b = m.raw;
      return (
        <div key={`break-${b.id}-${idx}`} className="rounded-2xl p-2.5 shadow-soft border-2 flex items-center gap-2 bg-blue-50 border-blue-200">
          <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 text-[10px] shrink-0">☕</div>
          <div className="w-14 text-center shrink-0">
            <p className="text-xs font-bold text-text-primary">{b.startTime}</p>
            <p className="text-[10px] text-text-light">{b.endTime}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs truncate text-blue-600">{b.taskName}</p>
            <p className="text-[10px] text-text-secondary mt-0.5">休息一下</p>
          </div>
        </div>
      );
    }
    // 项目块（可专注/勾选）
    const b = m.raw;
    const cat = CATEGORY_CONFIG[b.category];
    const diff = b.actualMinutes !== undefined ? b.actualMinutes - b.estimatedMinutes : null;
    const completed = !!b.done;
    return (
      <div
        key={`proj-${b.id}-${idx}`}
        className={cn(
          'rounded-2xl p-2.5 shadow-soft border-2 flex items-center gap-2 transition-all',
          completed
            ? 'bg-mint-fresh/15 border-mint-deep/40 opacity-80'
            : 'bg-warm-light border-corgi-yellow/20'
        )}
      >
        <button onClick={() => toggleScheduleDone(b.id)} className="btn-press shrink-0">
          {completed ? (
            <CheckCircle2 size={20} className="text-mint-deep" fill="currentColor" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-text-light" />
          )}
        </button>
        <div className="w-14 text-center shrink-0">
          <p className="text-xs font-bold text-text-primary">{b.startTime}</p>
          <p className="text-[10px] text-text-light">{b.endTime}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', cat.color)}>{cat.icon}</span>
            <p className={cn('font-bold text-xs truncate', completed && 'line-through text-text-light')}>{b.taskName}</p>
            {completed && <span className="text-[9px] text-mint-deep font-bold">✓</span>}
          </div>
          <p className="text-[10px] text-text-secondary mt-0.5 flex items-center gap-1 flex-wrap">
            <span>⏱️ 预估 {b.estimatedMinutes}分</span>
            {b.actualMinutes !== undefined && (
              <>
                <span className="text-purple-500">· 实际 {b.actualMinutes}分</span>
                {diff !== null && diff !== 0 && (
                  <span className={cn('px-1 py-0.5 rounded-full text-[9px] font-bold', diff > 0 ? 'bg-berry-pink/15 text-berry-rose' : 'bg-mint-fresh/20 text-mint-deep')}>
                    {diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        {!completed && (
          <button
            onClick={() => handleStartFocus(b.id, b.estimatedMinutes)}
            className="text-[10px] px-2 py-1 rounded-lg bg-corgi-orange/15 text-corgi-dark font-bold hover:bg-corgi-orange/25 transition-colors flex items-center gap-0.5 shrink-0"
          >
            <Timer size={10} /> 专注
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen warm-bg pb-28">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-20 glass border-b-2 border-corgi-yellow/20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 text-center">
            <p className="font-display text-lg text-text-primary">⏱️ 时间管理</p>
            <p className="text-xs text-text-secondary">{dateStr} · {moodText[corgi.mood]}</p>
          </div>
          <Link to="/summary" className="flex items-center gap-1.5 bg-corgi-yellow/20 px-3 py-2 rounded-xl hover:bg-corgi-yellow/30 transition-colors">
            <Sparkles size={16} className="text-corgi-orange" />
            <span className="font-bold text-corgi-dark text-sm">{backpack.points}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* 宠物展示区 */}
        <div className="relative flex flex-col items-center mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-corgi-yellow/10 to-transparent rounded-puffy" />
          <div className="relative z-10">
            <CorgiMascot
              furColor={corgi.furColor}
              mood={corgi.mood}
              petType={corgi.petType}
              size={170}
            />
          </div>
          <div className="relative z-10 -mt-4 bg-warm-light px-6 py-2 rounded-full shadow-soft border-2 border-corgi-yellow/30">
            <p className="font-display text-text-primary">
              {corgi.name} · Lv.{corgi.level}
            </p>
          </div>
          <p className="text-xs text-text-secondary mt-2 text-center max-w-xs">
            🎵 {petLabel}陪你专注每一刻
          </p>
        </div>

        {/* 今日数据概览：待办 / 已完成 可点击展开 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard
            label="待办项目"
            value={pendingBlocks.length}
            icon="📋"
            color="bg-corgi-orange/15"
            active={expandedPanel === 'pending'}
            onClick={() => pendingBlocks.length > 0 && setExpandedPanel(expandedPanel === 'pending' ? null : 'pending')}
          />
          <StatCard
            label="已完成"
            value={completedBlocks.length}
            icon="📈"
            color="bg-berry-pink/15"
            active={expandedPanel === 'completed'}
            onClick={() => completedBlocks.length > 0 && setExpandedPanel(expandedPanel === 'completed' ? null : 'completed')}
          />
        </div>

        {/* 待办 / 已完成 内嵌展开列表 */}
        {expandedPanel === 'pending' && pendingBlocks.length > 0 && (
          <div className="rounded-2xl bg-warm-light p-3 shadow-soft border-2 border-corgi-orange/20 mb-4 animate-pop-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📋</span>
              <p className="font-bold text-text-primary text-sm">今日待办 · {pendingBlocks.length} 项</p>
            </div>
            <div className="space-y-1.5">
              {todayMerged.filter((m) => m.kind === 'project' && !m.raw.done).map((m, idx) => renderMergedItem(m, idx))}
            </div>
          </div>
        )}
        {expandedPanel === 'completed' && completedBlocks.length > 0 && (
          <div className="rounded-2xl bg-warm-light p-3 shadow-soft border-2 border-mint-deep/20 mb-4 animate-pop-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">✅</span>
              <p className="font-bold text-text-primary text-sm">今日已完成 · {completedBlocks.length} 项</p>
            </div>
            <div className="space-y-1.5">
              {todayMerged.filter((m) => m.kind === 'project' && m.raw.done).map((m, idx) => renderMergedItem(m, idx))}
            </div>
          </div>
        )}

        {/* 主功能入口 - 时间管理 */}
        <div className="rounded-2xl bg-warm-light p-4 shadow-soft border-2 border-corgi-orange/30 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={18} className="text-corgi-orange" />
            <h2 className="font-display text-corgi-dark">时间规划</h2>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            计算空闲时间 → 增加项目 → 生成计划 → 复用昨日
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Link to="/planner" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-corgi-orange/10 hover:bg-corgi-orange/20 transition-colors border border-corgi-orange/30">
              <Timer size={22} className="text-corgi-orange" />
              <span className="text-xs font-bold text-corgi-dark">时间规划</span>
              <span className="text-[10px] text-text-secondary">项目·喜好·生成</span>
            </Link>
            <Link to="/focus" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-berry-pink/10 hover:bg-berry-pink/20 transition-colors border border-berry-pink/30">
              <Timer size={22} className="text-berry-rose" />
              <span className="text-xs font-bold text-berry-rose">番茄专注</span>
              <span className="text-[10px] text-text-secondary">计时·沉浸</span>
            </Link>
            <Link to="/schedule?view=month" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-corgi-yellow/10 hover:bg-corgi-yellow/20 transition-colors border border-corgi-yellow/30">
              <CalendarDays size={22} className="text-corgi-dark" />
              <span className="text-xs font-bold text-corgi-dark">每月日历</span>
              <span className="text-[10px] text-text-secondary">月历·日程</span>
            </Link>
          </div>
        </div>

        {/* 今日计划：按当前时间过滤，显示当前时间及之后的所有项目（含已完成），不含休息 */}
        <div className="rounded-2xl bg-warm-light p-4 shadow-soft border-2 border-corgi-yellow/20 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Play size={16} className="text-corgi-orange" />
              <h3 className="font-display text-text-primary">今日计划</h3>
            </div>
            <span className="text-[10px] text-text-secondary">
              {upcomingBlocks.length > 0 ? `${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')} 之后 · ${upcomingBlocks.length} 项` : '今日已无待办项目'}
            </span>
          </div>
          {upcomingBlocks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-1">🌙</p>
              <p className="text-xs text-text-secondary">今日剩余时间无安排</p>
              <Link to="/planner" className="inline-block mt-2 text-xs text-corgi-orange font-bold">去生成计划 →</Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcomingBlocks.map((m, idx) => renderMergedItem(m, idx))}
            </div>
          )}
        </div>

        {/* 日历：内嵌当月月历（标星重要项目，点击日期展开详情） */}
        <div className="rounded-2xl bg-warm-light p-4 shadow-soft border-2 border-corgi-yellow/20 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-corgi-orange" />
              <h3 className="font-display text-text-primary">{currentMonthLabel}</h3>
            </div>
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
                  if (!date) return <div key={di} className="min-h-[40px] rounded-lg bg-warm-cream/40" />;
                  const ds = formatDate(date);
                  const isToday = ds === todayKey;
                  const isExpanded = monthExpandedDay === ds;
                  const importantList = (monthImportantTasks[ds] || []).slice(0, 3);
                  return (
                    <div
                      key={di}
                      onClick={() => setMonthExpandedDay(isExpanded ? null : ds)}
                      className={cn(
                        'min-h-[40px] rounded-lg p-1 flex flex-col items-center justify-start transition-colors cursor-pointer',
                        isToday ? 'bg-corgi-orange/20 border border-corgi-orange/40' : 'bg-warm-cream/60 hover:bg-corgi-yellow/10 border border-transparent',
                        isExpanded && 'ring-2 ring-corgi-orange'
                      )}
                    >
                      <span className={cn('text-[10px] font-bold', isToday ? 'text-corgi-orange' : 'text-text-primary')}>{date.getDate()}</span>
                      {importantList.length > 0 && (
                        <div className="w-full mt-0.5 space-y-0.5">
                          {importantList.map((it) => (
                            <div key={it.id} className="flex items-center gap-0.5 px-0.5 rounded bg-corgi-orange/10">
                              <Star size={7} className="text-corgi-orange fill-corgi-orange shrink-0" />
                              <span className="text-[7px] text-corgi-dark font-bold truncate">{it.name}</span>
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
          {/* 月历展开当日详情 */}
          {monthExpandedDay && (
            <div className="mt-3 rounded-xl bg-warm-cream/80 p-3 border border-corgi-yellow/30 animate-pop-in">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-text-primary text-xs">{monthExpandedDay} 日程</span>
                <span className="text-[10px] text-text-secondary">{(monthSchedules[monthExpandedDay] || []).length} 项</span>
              </div>
              {(monthSchedules[monthExpandedDay] || []).length === 0 ? (
                <p className="text-[10px] text-text-secondary text-center py-2">当天暂无日程</p>
              ) : (
                <div className="space-y-1.5">
                  {(monthSchedules[monthExpandedDay] || []).map((item) => {
                    const config = SCHEDULE_TYPE_CONFIG[item.type];
                    return (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <span className="text-text-secondary font-bold whitespace-nowrap text-[10px]">{item.startTime}-{item.endTime}</span>
                        <span className={cn('px-1.5 py-0.5 rounded-full border font-bold text-[10px]', config.color)}>{config.icon} {item.title}</span>
                        {item.important && <Star size={10} className="text-corgi-orange fill-corgi-orange" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 学习曲线提示 */}
        {learnedCount > 0 && (
          <div className="rounded-2xl bg-purple-50 p-3 shadow-soft border-2 border-purple-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-purple-500" />
              <h3 className="font-display text-purple-700 text-sm">学习曲线</h3>
            </div>
            <p className="text-xs text-purple-600">系统已为你记录 {learnedCount} 类项目的实际耗时，将自动优化下次预估</p>
          </div>
        )}
      </div>

      {/* ===== 专注倒计时面板（与 TimePlanner 一致） ===== */}
      {focusBlockId && (() => {
        const focusBlock = schedule.find((b) => b.id === focusBlockId);
        if (!focusBlock) return null;
        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 animate-fade-in">
            <div className="bg-warm-light rounded-[28px] shadow-puffy border-4 border-corgi-yellow/40 p-6 w-[85%] max-w-sm animate-pop-in text-center">
              <p className="text-xs text-text-secondary font-bold mb-1">
                {focusDone ? '专注中 · 已超时' : '专注中'}
              </p>
              <p className="font-bold text-text-primary text-sm mb-4 truncate">{focusBlock.taskName}</p>
              <div className={cn(
                'text-5xl font-display mb-2 tabular-nums',
                focusDone ? 'text-berry-rose' : 'text-corgi-orange'
              )}>
                {focusDone ? `+${formatCountdown(focusOvertime)}` : formatCountdown(focusRemaining)}
              </div>
              {!focusDone && (
                <p className="text-xs text-text-secondary mb-4">
                  预估 {focusBlock.estimatedMinutes} 分钟 · 剩余时间归零后自动转正计时
                </p>
              )}
              {focusDone && (
                <p className="text-xs text-berry-rose font-bold mb-4">
                  ⏰ 已超出预估时间，点击完成记录实际用时
                </p>
              )}
              {!focusDone && (
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setFocusPaused(!focusPaused)}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-corgi-orange/15 text-corgi-dark font-bold text-sm"
                  >
                    {focusPaused ? <><Play size={14} /> 继续</> : <>暂停</>}
                  </button>
                  <button
                    onClick={() => finishFocus(false)}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-mint-deep text-white font-bold text-sm btn-press"
                  >
                    <CheckCircle2 size={14} /> 提前完成
                  </button>
                  <button onClick={handleExitFocus} className="px-3 py-2.5 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">退出</button>
                </div>
              )}
              {focusDone && (
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => finishFocus(true)}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-mint-deep text-white font-bold text-sm btn-press"
                  >
                    <CheckCircle2 size={16} /> 完成
                  </button>
                  <button onClick={handleExitFocus} className="px-4 py-2.5 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">退出</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===== 专注完成结果卡（与 TimePlanner 一致：实际/预估/差值 + 积分奖励 + 宠物头像） ===== */}
      {focusResult && (() => {
        const { actual, estimated, diff, pointsAwarded } = focusResult;
        const saved = diff < 0;
        const overtime = diff > 0;
        const label = overtime ? '超时' : saved ? '省时' : '准点';
        const color = overtime ? 'text-berry-rose' : saved ? 'text-mint-deep' : 'text-corgi-dark';
        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 animate-fade-in">
            <div className="bg-warm-light rounded-[28px] shadow-puffy border-4 border-corgi-yellow/40 p-5 w-[88%] max-w-sm animate-pop-in text-center">
              <div className="text-5xl mb-1">🎉</div>
              <p className="font-bold text-text-primary text-base mb-0.5">专注完成！</p>
              <p className="text-xs text-text-secondary mb-3">已自动记录实际用时</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-2xl bg-purple-50 border-2 border-purple-100 p-2">
                  <p className="text-[10px] text-text-secondary font-bold">实际</p>
                  <p className="font-display text-lg text-purple-500">{actual}<span className="text-xs ml-0.5">分</span></p>
                </div>
                <div className="rounded-2xl bg-corgi-yellow/15 border-2 border-corgi-yellow/30 p-2">
                  <p className="text-[10px] text-text-secondary font-bold">预估</p>
                  <p className="font-display text-lg text-corgi-dark">{estimated}<span className="text-xs ml-0.5">分</span></p>
                </div>
                <div className={cn('rounded-2xl border-2 p-2', overtime ? 'bg-berry-pink/15 border-berry-pink/30' : saved ? 'bg-mint-fresh/20 border-mint-fresh/40' : 'bg-corgi-yellow/15 border-corgi-yellow/30')}>
                  <p className="text-[10px] text-text-secondary font-bold">{label}</p>
                  <p className={cn('font-display text-lg', color)}>
                    {overtime ? `+${diff}` : saved ? `${diff}` : '0'}<span className="text-xs ml-0.5">分</span>
                  </p>
                </div>
              </div>
              {pointsAwarded ? (
                <div className="rounded-2xl bg-gradient-to-r from-corgi-yellow/20 to-mint-fresh/20 border-2 border-corgi-yellow/40 p-3 mb-3 flex items-center gap-3">
                  <CorgiMascot
                    furColor={corgi.furColor}
                    mood="excited"
                    petType={corgi.petType}
                    size={64}
                    floating={false}
                    className="shrink-0"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-xs text-text-secondary font-bold">{petLabel}收到奖励啦～</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-display text-2xl text-corgi-orange">+20</span>
                      <span className="text-xs font-bold text-corgi-dark">积分</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-0.5">可去「养成」喂食 / 抽盲盒</p>
                  </div>
                  <span className="text-2xl animate-bounce">⭐</span>
                </div>
              ) : (
                <div className="rounded-2xl bg-warm-cream border-2 border-corgi-yellow/20 p-2 mb-3">
                  <p className="text-xs text-text-secondary">该项目已完成过，本次未重复发放积分</p>
                </div>
              )}
              <button
                onClick={() => setFocusResult(null)}
                className="w-full py-2.5 rounded-2xl bg-mint-deep text-white font-bold text-sm btn-press shadow-soft"
              >
                知道了 🌟
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick, active }: { label: string; value: number | string; icon: string; color: string; onClick?: () => void; active?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-3 text-center border-2 transition-all',
        color,
        active ? 'border-corgi-orange shadow-soft' : 'border-corgi-yellow/20',
        onClick && 'cursor-pointer btn-press hover:shadow-soft hover:border-corgi-orange/40'
      )}
    >
      <div className="text-2xl">{icon}</div>
      <p className="font-display text-lg text-text-primary mt-1">{value}</p>
      <p className="text-xs text-text-secondary font-bold flex items-center justify-center gap-1">
        {label}
        {onClick && <span className="text-[9px] text-corgi-orange">▾</span>}
      </p>
    </div>
  );
}
