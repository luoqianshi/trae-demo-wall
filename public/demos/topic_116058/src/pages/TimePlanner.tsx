import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Star, Sparkles, Clock, Play, RotateCcw, CheckCircle2, Timer, Zap, Wand2, Pause, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlannerStore, CATEGORY_CONFIG, DIFFICULTY_CONFIG } from '@/store/plannerStore';
import { useSettingsStore, SCHEDULE_PREFERENCES } from '@/store/settingsStore';
import { useBackpackStore } from '@/store/backpackStore';
import { useCorgiStore } from '@/store/corgiStore';
import { useScheduleStore, SCHEDULE_TYPE_CONFIG } from '@/store/scheduleStore';
import { mergeDaySchedule } from '@/lib/mergeSchedule';
import CorgiMascot, { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import { useTourStore } from '@/store/tourStore';
import type { Difficulty, TaskCategory, SchedulePreference } from '@/types';

const CATEGORIES: TaskCategory[] = ['homework', 'homework_outer', 'study', 'hobby', 'chore', 'reading', 'custom'];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TimePlanner() {
  const {
    tasks, freeSlots, schedule, learningStats,
    addTask, removeTask, toggleTaskDone, toggleTaskImportant,
    addFreeSlot, removeFreeSlot,
    calculateWeeklyFreeSlots,
    generateSchedule, reuseYesterdaySchedule, clearSchedule, toggleScheduleDone, recordScheduleActual,
  } = usePlannerStore();
  // 固定日程项变化时需重新合并，订阅 items 作为依赖
  const fixedItems = useScheduleStore((s) => s.items);
  const schedulePreference = useSettingsStore((s) => s.schedulePreference);
  const updateSettings = useSettingsStore((s) => s.update);
  // 计划偏好选择面板：点击「计划偏好」卡片时弹出
  const [showPrefPicker, setShowPrefPicker] = useState(false);
  // 积分 / 宠物：专注完成时给当前宠物 +20 积分奖励
  const { addPoints, checkTitleUnlocks } = useBackpackStore();
  const { corgi, setMood } = useCorgiStore();
  const petLabel = PET_LABEL[corgi.petType];
  // 新手指引：通知 tourStore 专注开始/结束，用于驱动引导阶段切换
  const setFocusActive = useTourStore((s) => s.setFocusActive);

  const [activeTab, setActiveTab] = useState<'slots' | 'tasks' | 'schedule'>('slots');
  const [recordFor, setRecordFor] = useState<string | null>(null);
  const [recordVal, setRecordVal] = useState('');

  // 专注倒计时状态
  // focusBlockId: 正在专注的计划块 id
  // focusRemaining: 剩余秒数（倒计时阶段）
  // focusOvertime: 超时秒数（正计时阶段，倒计时归零后开始累加）
  // focusPaused: 是否暂停
  // focusDone: 倒计时是否已归零（区分倒计时/正计时阶段）
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [focusOvertime, setFocusOvertime] = useState(0);
  const [focusPaused, setFocusPaused] = useState(false);
  const [focusDone, setFocusDone] = useState(false);
  // 专注完成后的结果卡：记录本次实际/预估/差值，并发放积分奖励
  // diff = actual - estimated；负数=省时（绿），正数=超时（红）
  // pointsAwarded: 本次是否发了 +20 积分（同一项目多次专注只发一次）
  const [focusResult, setFocusResult] = useState<{ actual: number; estimated: number; diff: number; pointsAwarded: boolean } | null>(null);

  // 新任务表单
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [fName, setFName] = useState('');
  const [fCategory, setFCategory] = useState<TaskCategory>('homework');
  const [fDifficulty, setFDifficulty] = useState<Difficulty>('medium');
  const [fPreference, setFPreference] = useState(3);
  const [fEstimate, setFEstimate] = useState(30);
  const [fBreak, setFBreak] = useState(10);

  // 新空闲段
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [sDate, setSDate] = useState(todayStr());
  const [sStart, setSStart] = useState('09:00');
  const [sEnd, setSEnd] = useState('11:30');
  const [sLabel, setSLabel] = useState('');

  const submitTask = () => {
    if (!fName.trim()) return;
    addTask({
      name: fName.trim(),
      category: fCategory,
      difficulty: fDifficulty,
      preference: fPreference,
      estimatedMinutes: fEstimate,
      breakAfter: fBreak,
    });
    setFName(''); setShowTaskForm(false);
  };

  const submitSlot = () => {
    if (sStart >= sEnd) return;
    addFreeSlot({ date: sDate, startTime: sStart, endTime: sEnd, label: sLabel.trim() || undefined });
    setShowSlotForm(false); setSLabel('');
  };

  // 启动专注倒计时：以计划块的预估分钟数作为倒计时时长
  const handleStartFocus = (blockId: string, minutes: number) => {
    setFocusBlockId(blockId);
    setFocusRemaining(minutes * 60);
    setFocusOvertime(0);
    setFocusPaused(false);
    setFocusDone(false);
    // 通知新手指引：专注开始
    setFocusActive(true);
  };

  // 倒计时/正计时每秒更新
  // 倒计时阶段：focusRemaining 递减，归零后切换为正计时阶段（focusDone=true）
  // 正计时阶段：focusOvertime 递增
  useEffect(() => {
    if (!focusBlockId || focusPaused) return;
    const timer = setInterval(() => {
      if (!focusDone) {
        // 倒计时阶段
        setFocusRemaining((prev) => {
          if (prev <= 1) {
            setFocusDone(true); // 切换为正计时
            return 0;
          }
          return prev - 1;
        });
      } else {
        // 正计时阶段：超时秒数递增
        setFocusOvertime((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [focusBlockId, focusPaused, focusDone]);

  // 完成专注：基于计时器状态计算实际用时，自动记录到学习统计
  // 正计时阶段（focusDone=true）：实际用时 = 预估时间 + 超时时间
  // 记录后弹出结果卡让用户看到「实际/预估/差值/已自动记录」
  // 首次完成发放 +20 积分给当前宠物，重复专注不再发奖
  const handleFinishFocus = () => {
    if (!focusBlockId) return;
    const block = schedule.find((b) => b.id === focusBlockId);
    if (!block) return;
    const estimatedSec = block.estimatedMinutes * 60;
    const actualSec = estimatedSec + focusOvertime;
    const actualMinutes = Math.max(1, Math.round(actualSec / 60));
    recordScheduleActual(focusBlockId, actualMinutes);
    // 发放积分奖励（同一项目只发一次）
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
    // 通知新手指引：专注结束（正常完成 / 超时完成）
    setFocusActive(false);
  };

  // 提前完成：倒计时未归零时点完成，记录实际用时（小于预估）
  // 倒计时阶段（focusDone=false）：实际用时 = 预估时间 - 剩余时间
  const handleEarlyFinish = () => {
    if (!focusBlockId) return;
    const block = schedule.find((b) => b.id === focusBlockId);
    if (!block) return;
    const estimatedSec = block.estimatedMinutes * 60;
    const actualSec = Math.max(0, estimatedSec - focusRemaining);
    const actualMinutes = Math.max(1, Math.round(actualSec / 60));
    recordScheduleActual(focusBlockId, actualMinutes);
    // 发放积分奖励（同一项目只发一次）
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
    // 通知新手指引：专注结束（提前完成）
    setFocusActive(false);
  };

  // 重置专注状态，关闭弹层
  const resetFocus = () => {
    setFocusBlockId(null);
    setFocusRemaining(0);
    setFocusOvertime(0);
    setFocusPaused(false);
    setFocusDone(false);
  };

  // 退出专注（未完成，不记录）
  const handleExitFocus = () => {
    resetFocus();
    // 通知新手指引：专注结束（用户退出）
    setFocusActive(false);
  };

  // ===== 长按项目唤出手动修正面板 =====
  // 长按 500ms 触发，松手或离开元素则取消（避免点击被误判）
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startLongPress = (blockId: string) => {
    longPressTimer.current = setTimeout(() => {
      setRecordFor(blockId);
      setRecordVal('');
      longPressTimer.current = null;
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 格式化倒计时显示 mm:ss
  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalEst = tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
  // 可支配时间：仅统计当日的空闲时段总和（而非本周 7 天）
  const todayFree = freeSlots
    .filter((slot) => slot.date === todayStr())
    .reduce((s, slot) => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      return s + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);

  // 计划表 tab 展示的数据：合并当日固定日程 + 计划表项目，按时间混合排序
  // 固定日程作为「时间线背景」展示，让用户看到完整的一天安排
  const mergedSchedule = useMemo(
    () => mergeDaySchedule(todayStr()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule, fixedItems]
  );

  // 生成计划并自动跳转至计划表（仅在确有项目与空闲时段时跳转）
  const handleGenerateSchedule = () => {
    // 校验：当日空闲时间段是否足以支撑新增项目
    // 不足时弹窗提醒用户，但仍允许生成（用户可选择调整空闲时段或减少项目）
    if (tasks.length > 0 && freeSlots.length > 0 && totalEst > todayFree) {
      const lack = totalEst - todayFree;
      const h = Math.floor(lack / 60);
      const m = lack % 60;
      const lackStr = h > 0 ? `${h}小时${m > 0 ? `${m}分钟` : ''}` : `${m}分钟`;
      const ok = window.confirm(
        `当日空闲时间不足以安排所有项目：\n\n` +
        `· 项目总预估：${totalEst} 分钟\n` +
        `· 当日可支配：${todayFree} 分钟\n` +
        `· 缺口：${lackStr}\n\n` +
        `建议增加空闲时段，或减少/拆分部分项目。\n是否仍要生成计划？`
      );
      if (!ok) return;
    }
    generateSchedule();
    if (tasks.length > 0 && freeSlots.length > 0) {
      setActiveTab('schedule');
    }
  };

  // 自动计算空闲时间后停留在空闲时段 tab 展示结果
  const handleCalcFree = () => {
    calculateWeeklyFreeSlots();
    setActiveTab('slots');
  };

  // 复用昨日计划：通过 store action 复制昨日时段到今天
  const handleReuseYesterday = () => {
    const ok = reuseYesterdaySchedule();
    if (!ok) {
      alert('昨日没有计划可复用');
      return;
    }
    setActiveTab('schedule');
  };

  return (
    <div className="min-h-screen warm-bg pb-28">
      {/* 顶部 */}
      <header className="sticky top-0 z-20 glass border-b-2 border-corgi-yellow/20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="font-display text-lg text-text-primary">⏱️ 时间规划</p>
            <p className="text-xs text-text-secondary">计算空闲 → 增加项目 → 生成计划</p>
          </div>
        </div>

        {/* 主流程按钮：按步骤顺序排列 */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          <button
            onClick={handleCalcFree}
            data-tour="calc-free-btn"
            className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mint-fresh/20 text-mint-deep font-bold text-sm hover:bg-mint-fresh/30 transition-all shrink-0"
          >
            <Wand2 size={16} />
            ①自动计算空闲时间
          </button>
          <button
            onClick={() => { setShowTaskForm(true); setActiveTab('tasks'); }}
            data-tour="add-task-btn"
            className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-warm-cream text-text-secondary font-bold text-sm hover:bg-corgi-yellow/10 transition-all border border-corgi-yellow/30 shrink-0"
          >
            <Plus size={16} />
            ②增加项目
          </button>
          <button
            onClick={handleGenerateSchedule}
            data-tour="generate-plan-btn"
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-corgi-orange to-berry-rose text-white font-bold text-sm shadow-soft hover:shadow-puffy transition-all shrink-0"
          >
            <Sparkles size={16} />
            ③生成计划
          </button>
          <button
            onClick={handleReuseYesterday}
            className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-warm-cream text-text-secondary font-bold text-sm hover:bg-corgi-yellow/10 transition-all border border-corgi-yellow/30 shrink-0"
          >
            <RotateCcw size={16} />
            复用昨日计划
          </button>
        </div>

        {/* 标签切换 */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-1.5">
          <TabBtn active={activeTab === 'slots'} onClick={() => setActiveTab('slots')} icon={<Clock size={14} />} label="空闲时段" count={freeSlots.length} />
          <TabBtn active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Timer size={14} />} label="项目" count={tasks.length} />
          <TabBtn active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Play size={14} />} label="计划表" count={schedule.length} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {/* 概览统计 + 当前计划偏好 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(() => {
            const h = Math.floor(todayFree / 60);
            const m = todayFree % 60;
            const display = h > 0 ? `${h}小时${m > 0 ? `${m}分` : ''}` : `${m}分`;
            return <StatCard label="可支配时间" value={display} icon="🌈" color="bg-berry-pink/15" />;
          })()}
          {(() => {
            const h = Math.floor(totalEst / 60);
            const m = totalEst % 60;
            const display = h > 0 ? `${h}小时${m > 0 ? `${m}分` : ''}` : `${m}分`;
            return <StatCard label="总预估" value={display} icon="⏰" color="bg-mint-fresh/15" />;
          })()}
          <StatCard
            label="计划偏好"
            value={SCHEDULE_PREFERENCES[schedulePreference].icon}
            icon="⚙️"
            color="bg-corgi-yellow/15"
            onClick={() => setShowPrefPicker(true)}
          />
        </div>

        {/* 计划偏好选择面板：选择项目排序与填充规则（喜好度/困难度优先） */}
        {showPrefPicker && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowPrefPicker(false)}>
            <div
              className="bg-warm-light rounded-[28px] shadow-puffy border-4 border-corgi-yellow/40 p-5 w-[88%] max-w-sm animate-pop-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <p className="font-bold text-text-primary text-sm">计划偏好</p>
                  <p className="text-[11px] text-text-secondary">影响生成计划时项目的排序与填充</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(Object.keys(SCHEDULE_PREFERENCES) as SchedulePreference[]).map((pref) => {
                  const config = SCHEDULE_PREFERENCES[pref];
                  const isActive = schedulePreference === pref;
                  return (
                    <button
                      key={pref}
                      onClick={() => { updateSettings({ schedulePreference: pref }); }}
                      className={cn(
                        'btn-press flex items-center gap-2 p-3 rounded-2xl border-2 transition-all text-left',
                        isActive
                          ? 'border-corgi-orange bg-corgi-orange/10 shadow-soft'
                          : 'border-corgi-yellow/20 bg-warm-cream/50 hover:border-corgi-yellow/40'
                      )}
                    >
                      <span className="text-xl">{config.icon}</span>
                      <span className={cn('text-xs font-bold leading-tight', isActive ? 'text-corgi-dark' : 'text-text-secondary')}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-corgi-yellow/10 border-2 border-corgi-yellow/20 p-2.5 mb-3">
                <p className="text-xs text-text-secondary">
                  <span className="font-bold text-corgi-dark">当前：</span>
                  {SCHEDULE_PREFERENCES[schedulePreference].desc}
                </p>
              </div>
              <button
                onClick={() => setShowPrefPicker(false)}
                className="w-full py-2.5 rounded-2xl bg-mint-deep text-white font-bold text-sm btn-press shadow-soft"
              >
                完成
              </button>
            </div>
          </div>
        )}

        {/* ===== Tab: 空闲时段 ===== */}
        {activeTab === 'slots' && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSlotForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-mint-fresh/40 text-mint-deep font-bold bg-mint-fresh/5 hover:bg-mint-fresh/10 transition-colors"
            >
              <Plus size={18} /> 添加空闲时段
            </button>

            {showSlotForm && (
              <div className="rounded-2xl bg-warm-light p-4 shadow-soft border-2 border-mint-fresh/30 space-y-3 animate-pop-in">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-text-secondary font-bold">日期</label>
                    <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-mint-fresh/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-mint-deep" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary font-bold">开始</label>
                    <input type="time" value={sStart} onChange={(e) => setSStart(e.target.value)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-mint-fresh/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-mint-deep" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary font-bold">结束</label>
                    <input type="time" value={sEnd} onChange={(e) => setSEnd(e.target.value)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-mint-fresh/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-mint-deep" />
                  </div>
                </div>
                <input value={sLabel} onChange={(e) => setSLabel(e.target.value)} placeholder="标签（如：上午 / 暑假下午）"
                  className="w-full px-3 py-2 rounded-xl border-2 border-mint-fresh/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-mint-deep" />
                <div className="flex gap-2">
                  <button onClick={submitSlot} className="flex-1 py-2 rounded-xl bg-mint-deep text-white font-bold text-sm btn-press">添加</button>
                  <button onClick={() => setShowSlotForm(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">取消</button>
                </div>
              </div>
            )}

            {freeSlots.length === 0 ? (
              <div className="rounded-2xl bg-warm-light p-8 text-center border-2 border-dashed border-mint-fresh/30">
                <p className="text-4xl mb-2">🌈</p>
                <p className="font-bold text-text-primary">还没有空闲时段</p>
                <p className="text-xs text-text-secondary mt-1">点击顶部"①自动计算空闲时间"基于固定日程生成，或手动添加</p>
                <button onClick={handleCalcFree} className="mt-3 px-4 py-2 rounded-xl bg-mint-deep text-white font-bold text-sm btn-press flex items-center gap-1 mx-auto">
                  <Wand2 size={14} /> 立即自动计算
                </button>
              </div>
            ) : (
              freeSlots.map((slot) => {
                const [sh, sm] = slot.startTime.split(':').map(Number);
                const [eh, em] = slot.endTime.split(':').map(Number);
                const minutes = (eh * 60 + em) - (sh * 60 + sm);
                return (
                  <div key={slot.id} className="rounded-2xl bg-warm-light p-3 shadow-soft border-2 border-mint-fresh/20 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-mint-fresh/20 flex items-center justify-center text-2xl">📅</div>
                    <div className="flex-1">
                      <p className="font-bold text-text-primary text-sm">{slot.label || '空闲时段'}</p>
                      <p className="text-xs text-text-secondary">{slot.date} · {slot.startTime} - {slot.endTime} · 共 {minutes} 分钟</p>
                    </div>
                    <button onClick={() => removeFreeSlot(slot.id)} className="text-text-light hover:text-berry-rose p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== Tab: 项目 ===== */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <button
              onClick={() => setShowTaskForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-corgi-orange/40 text-corgi-dark font-bold bg-corgi-orange/5 hover:bg-corgi-orange/10 transition-colors"
            >
              <Plus size={18} /> 添加项目
            </button>

            {showTaskForm && (
              <div className="rounded-2xl bg-warm-light p-4 shadow-soft border-2 border-corgi-yellow/30 space-y-3 animate-pop-in">
                <div className="flex items-center gap-2">
                  <input
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="项目名称（如：数学作业第二章）"
                    className="flex-1 px-3 py-2 rounded-xl border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-text-secondary font-bold">类型</label>
                    <select value={fCategory} onChange={(e) => setFCategory(e.target.value as TaskCategory)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_CONFIG[c].icon} {CATEGORY_CONFIG[c].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary font-bold">难度</label>
                    <select value={fDifficulty} onChange={(e) => setFDifficulty(e.target.value as Difficulty)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange">
                      <option value="easy">简单</option>
                      <option value="medium">中等</option>
                      <option value="hard">困难</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary font-bold">预估耗时（分钟）</label>
                    <input type="number" min={5} step={5} value={fEstimate} onChange={(e) => setFEstimate(Number(e.target.value))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary font-bold">间隔休息（分钟）</label>
                    <input type="number" min={0} step={5} value={fBreak} onChange={(e) => setFBreak(Number(e.target.value))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-cream text-sm font-bold focus:outline-none focus:border-corgi-orange" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary font-bold flex items-center gap-1">
                    <Star size={12} className="text-corgi-orange" /> 喜好度（影响生成计划的优先级）
                  </label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setFPreference(s)} className="p-1">
                        <Star size={24} className={cn(s <= fPreference ? 'text-corgi-orange fill-corgi-orange' : 'text-text-light')} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={submitTask} className="flex-1 py-2 rounded-xl bg-corgi-orange text-white font-bold text-sm btn-press">
                    添加
                  </button>
                  <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">
                    取消
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="rounded-2xl bg-warm-light p-8 text-center border-2 border-dashed border-corgi-yellow/30">
                <p className="text-4xl mb-2">📋</p>
                <p className="font-bold text-text-primary">还没有项目</p>
                <p className="text-xs text-text-secondary mt-1">添加项目并设置喜好度后，点击"③生成计划"自动排入空闲时段</p>
              </div>
            ) : (
              tasks.map((task) => {
                const cat = CATEGORY_CONFIG[task.category];
                const diff = DIFFICULTY_CONFIG[task.difficulty];
                const stat = learningStats[task.name];
                const ratio = stat && stat.count > 0 ? stat.totalActual / stat.totalEst : null;
                return (
                  <div key={task.id} className={cn('rounded-2xl bg-warm-light p-3 shadow-soft border-2 border-corgi-yellow/20', task.done && 'opacity-50')}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleTaskDone(task.id)} className="btn-press">
                        {task.done ? <CheckCircle2 size={22} className="text-mint-deep" fill="currentColor" /> : <div className="w-[22px] h-[22px] rounded-full border-2 border-text-light" />}
                      </button>
                      <span className={cn('text-xs font-bold px-2 py-1 rounded-full border', cat.color)}>{cat.icon} {cat.label}</span>
                      <span className={cn('text-xs font-bold px-2 py-1 rounded-full', diff.color)}>{diff.label}</span>
                      <div className="flex-1" />
                      <span className="text-xs font-bold text-text-secondary flex items-center gap-0.5">
                        <Clock size={12} /> {task.estimatedMinutes}分
                      </span>
                      <button
                        onClick={() => toggleTaskImportant(task.id)}
                        className={cn('btn-press p-1 transition-colors', task.important ? 'text-corgi-orange' : 'text-text-light hover:text-corgi-orange')}
                        title={task.important ? '取消重要标记' : '标记为重要'}
                      >
                        <Star size={16} fill={task.important ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={() => removeTask(task.id)} className="text-text-light hover:text-berry-rose p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="mt-2 font-bold text-text-primary text-sm">{task.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} className={cn(s <= task.preference ? 'text-corgi-orange fill-corgi-orange' : 'text-text-light')} />
                        ))}
                        {task.actualMinutes !== undefined && (
                          <span className="ml-2 text-xs text-text-secondary">实际 {task.actualMinutes}分</span>
                        )}
                      </div>
                      {ratio && (
                        <span className="text-xs text-purple-500 font-bold flex items-center gap-1">
                          <Zap size={10} /> 学习率 {ratio.toFixed(2)}x
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== Tab: 计划表 ===== */}
        {/* 计划表合并展示当日固定日程 + 计划表项目，按时间混合排序，呈现完整一天时间线 */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            {mergedSchedule.length === 0 ? (
              <div className="rounded-2xl bg-warm-light p-8 text-center border-2 border-dashed border-corgi-yellow/30">
                <p className="text-4xl mb-2">🪄</p>
                <p className="font-bold text-text-primary">还未生成计划表</p>
                <p className="text-xs text-text-secondary mt-1">添加项目和空闲时段后，点击顶部"③生成计划"</p>
                <button onClick={handleGenerateSchedule} className="mt-3 px-4 py-2 rounded-xl bg-corgi-orange text-white font-bold text-sm btn-press flex items-center gap-1 mx-auto">
                  <Sparkles size={14} /> 立即生成
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-text-primary">今日时间线 · {mergedSchedule.length} 项</p>
                  <div className="flex gap-2">
                    <button onClick={handleGenerateSchedule} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-corgi-yellow/20 text-corgi-dark text-xs font-bold">
                      <RotateCcw size={12} /> 重新生成
                    </button>
                    <button onClick={clearSchedule} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-berry-pink/15 text-berry-rose text-xs font-bold" title="仅清空计划项目，固定日程保留">
                      <Trash2 size={12} /> 清空计划
                    </button>
                  </div>
                </div>

                {mergedSchedule.map((item, idx) => {
                  // 休息块（项目间休息）
                  if (item.kind === 'break') {
                    const block = item.raw;
                    return (
                      <div key={`break-${block.id}-${idx}`} className="rounded-2xl p-3 shadow-soft border-2 flex items-center gap-3 bg-blue-50 border-blue-200">
                        <div className="w-[22px] h-[22px] rounded-full bg-blue-200 flex items-center justify-center text-blue-600 text-xs">☕</div>
                        <div className="w-20 text-center">
                          <p className="text-sm font-bold text-text-primary">{block.startTime}</p>
                          <p className="text-xs text-text-light">{block.endTime}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-blue-600">{block.taskName}</p>
                          <p className="text-xs text-text-secondary mt-0.5">休息一下</p>
                        </div>
                      </div>
                    );
                  }
                  // 固定日程项（上课、起床、吃饭等，只读展示，不可专注/勾选）
                  if (item.kind === 'fixed') {
                    const it = item.raw;
                    const config = SCHEDULE_TYPE_CONFIG[it.type];
                    return (
                      <div key={`fixed-${it.id}-${idx}`} className="rounded-2xl p-3 shadow-soft border-2 flex items-center gap-3 bg-warm-cream/70 border-corgi-yellow/15">
                        <div className="w-[22px] h-[22px] rounded-full bg-warm-light border border-corgi-yellow/30 flex items-center justify-center text-text-light">
                          <Lock size={11} />
                        </div>
                        <div className="w-20 text-center">
                          <p className="text-sm font-bold text-text-primary">{it.startTime}</p>
                          <p className="text-xs text-text-light">{it.endTime}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', config.color)}>{config.icon}</span>
                            <p className="font-bold text-sm truncate text-text-secondary">{it.title}</p>
                            {it.important && <Star size={12} className="text-corgi-orange fill-corgi-orange shrink-0" />}
                          </div>
                          <p className="text-xs text-text-light mt-0.5">固定日程 · {config.label}</p>
                        </div>
                      </div>
                    );
                  }
                  // 项目块（用户添加的任务，支持专注/勾选/长按修正）
                  const block = item.raw;
                  const cat = CATEGORY_CONFIG[block.category];
                  const diff = block.actualMinutes !== undefined ? block.actualMinutes - block.estimatedMinutes : null;
                  const completed = !block.isBreak && block.done;
                  return (
                    <div
                      key={`proj-${block.id}-${idx}`}
                      className={cn(
                        'rounded-2xl p-3 shadow-soft border-2 flex items-center gap-3 transition-all',
                        completed
                          ? 'bg-mint-fresh/15 border-mint-deep/40'
                          : 'bg-warm-light border-corgi-yellow/20',
                        completed && 'opacity-80'
                      )}
                      onPointerDown={() => startLongPress(block.id)}
                      onPointerUp={cancelLongPress}
                      onPointerLeave={cancelLongPress}
                    >
                      <button onClick={() => toggleScheduleDone(block.id)} className="btn-press">
                        {block.done ? (
                          <CheckCircle2 size={22} className="text-mint-deep" fill="currentColor" />
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-full border-2 border-text-light" />
                        )}
                      </button>

                      <div className="w-20 text-center">
                        <p className="text-sm font-bold text-text-primary">{block.startTime}</p>
                        <p className="text-xs text-text-light">{block.endTime}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', cat.color)}>{cat.icon}</span>
                          <p className={cn(
                            'font-bold text-sm truncate text-text-primary',
                            completed && 'line-through text-text-light'
                          )}>
                            {block.taskName}
                          </p>
                          {completed && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-mint-deep/15 text-mint-deep shrink-0">
                              ✓已完成
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>⏱️ 预估 {block.estimatedMinutes} 分钟</span>
                          {block.actualMinutes !== undefined && (
                            <>
                              <span className="text-purple-500">· 实际 {block.actualMinutes} 分</span>
                              {diff !== null && diff !== 0 && (
                                <span className={cn(
                                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                                  diff > 0 ? 'bg-berry-pink/15 text-berry-rose' : 'bg-mint-fresh/20 text-mint-deep'
                                )}>
                                  {diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
                                </span>
                              )}
                              {diff === 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-corgi-yellow/15 text-corgi-dark">准点</span>
                              )}
                            </>
                          )}
                        </p>
                      </div>

                      {/* 专注按钮：已完成的项目隐藏 */}
                      {!completed && (
                        <button
                          onClick={() => handleStartFocus(block.id, block.estimatedMinutes)}
                          data-tour="focus-btn"
                          className="text-xs px-2 py-1 rounded-lg bg-corgi-orange/15 text-corgi-dark font-bold hover:bg-corgi-orange/25 transition-colors flex items-center gap-1"
                        >
                          <Timer size={12} /> 专注
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* 实际时间记录面板（长按项目唤出，专注完成会自动记录，此为手动修正入口） */}
                {recordFor && (
                  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 bg-warm-light rounded-2xl shadow-puffy border-2 border-purple-300 p-3 w-[90%] max-w-md animate-pop-in">
                    <p className="text-sm font-bold text-text-primary mb-2">手动修正实际耗时（分钟）</p>
                    <div className="flex gap-2">
                      <input type="number" min={1} value={recordVal} onChange={(e) => setRecordVal(e.target.value)}
                        placeholder="如 35"
                        className="flex-1 px-3 py-2 rounded-xl border-2 border-purple-200 bg-warm-cream text-sm font-bold focus:outline-none focus:border-purple-400" />
                      <button
                        onClick={() => {
                          const v = Number(recordVal);
                          if (v > 0) {
                            recordScheduleActual(recordFor, v);
                            setRecordFor(null);
                            setRecordVal('');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-sm btn-press"
                      >保存</button>
                      <button onClick={() => setRecordFor(null)} className="px-3 py-2 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">取消</button>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">💡 专注完成会自动记录；此面板用于手动修正。系统会基于实际耗时优化下次同类项目预估</p>
                  </div>
                )}

                {/* 专注倒计时面板 */}
                {focusBlockId && (() => {
                  const focusBlock = schedule.find((b) => b.id === focusBlockId);
                  if (!focusBlock) return null;
                  return (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 animate-fade-in">
                      <div className="bg-warm-light rounded-3xl shadow-puffy border-2 border-corgi-orange/40 p-6 w-[85%] max-w-sm animate-pop-in text-center">
                        <p className="text-xs text-text-secondary font-bold mb-1">
                          {focusDone ? '专注中 · 已超时' : '专注中'}
                        </p>
                        <p className="font-bold text-text-primary text-sm mb-4 truncate">{focusBlock.taskName}</p>

                        {/* 时间显示：倒计时阶段显示剩余，正计时阶段显示超时 */}
                        <div className={cn(
                          'text-5xl font-display mb-2 tabular-nums',
                          focusDone ? 'text-berry-rose' : 'text-corgi-orange'
                        )}>
                          {focusDone ? `+${formatCountdown(focusOvertime)}` : formatCountdown(focusRemaining)}
                        </div>

                        {/* 阶段提示文字 */}
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

                        {/* 按钮区：倒计时阶段（暂停/继续 + 提前完成 + 退出） */}
                        {!focusDone && (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => setFocusPaused(!focusPaused)}
                              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-corgi-orange/15 text-corgi-dark font-bold text-sm"
                            >
                              {focusPaused ? <><Play size={14} /> 继续</> : <><Pause size={14} /> 暂停</>}
                            </button>
                            <button
                              onClick={handleEarlyFinish}
                              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-mint-deep text-white font-bold text-sm btn-press"
                            >
                              <CheckCircle2 size={14} /> 提前完成
                            </button>
                            <button onClick={handleExitFocus} className="px-3 py-2.5 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">
                              退出
                            </button>
                          </div>
                        )}

                        {/* 正计时阶段（完成 + 退出） */}
                        {focusDone && (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={handleFinishFocus}
                              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-mint-deep text-white font-bold text-sm btn-press"
                            >
                              <CheckCircle2 size={16} /> 完成
                            </button>
                            <button onClick={handleExitFocus} className="px-4 py-2.5 rounded-xl bg-gray-100 text-text-secondary font-bold text-sm">
                              退出
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 专注完成结果卡：卡通柔和风格，展示实际/预估/差值 + 积分奖励 + 宠物头像 */}
                {focusResult && (() => {
                  const { actual, estimated, diff, pointsAwarded } = focusResult;
                  const saved = diff < 0;        // 省时
                  const overtime = diff > 0;     // 超时
                  const label = overtime ? '超时' : saved ? '省时' : '准点';
                  const color = overtime ? 'text-berry-rose' : saved ? 'text-mint-deep' : 'text-corgi-dark';
                  return (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 animate-fade-in">
                      <div className="bg-warm-light rounded-[28px] shadow-puffy border-4 border-corgi-yellow/40 p-5 w-[88%] max-w-sm animate-pop-in text-center">
                        {/* 顶部：表情 */}
                        <div className="text-5xl mb-1">🎉</div>
                        <p className="font-bold text-text-primary text-base mb-0.5">专注完成！</p>
                        <p className="text-xs text-text-secondary mb-3">已自动记录实际用时</p>

                        {/* 实际 / 预估 / 差值 三列对比（圆角卡贴纸感） */}
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

                        {/* 积分奖励区域：宠物头像 + 积分泡泡 */}
                        {pointsAwarded ? (
                          <div className="rounded-2xl bg-gradient-to-r from-corgi-yellow/20 to-mint-fresh/20 border-2 border-corgi-yellow/40 p-3 mb-3 flex items-center gap-3">
                            {/* 宠物头像 */}
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
                            {/* 飘动的小星星装饰 */}
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number; }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
        active ? 'bg-corgi-orange text-white shadow-soft' : 'bg-warm-light text-text-secondary hover:bg-corgi-yellow/10'
      )}
    >
      {icon} {label}
      <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-[10px]', active ? 'bg-white/30' : 'bg-corgi-yellow/20')}>{count}</span>
    </button>
  );
}

function StatCard({ label, value, icon, color, onClick }: { label: string; value: string | number; icon: string; color: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-3 text-center border-2 border-corgi-yellow/20',
        color,
        onClick && 'cursor-pointer btn-press transition-all hover:shadow-soft hover:border-corgi-orange/40'
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
