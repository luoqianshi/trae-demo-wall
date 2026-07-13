import { create } from 'zustand';

// 新手指引阶段标识
// 完整流程：固定作息设置引导 → 时间规划引导 → 专注体验 → 完成
export type TourStageId =
  // ===== 固定作息设置引导（/routine）=====
  | 'routine-intro'      // 介绍卡片：固定作息设置概览
  | 'routine-mode'       // 高亮「工作日/周末/假期」模式切换
  | 'routine-sleep'      // 高亮「睡眠时段」设置卡片
  | 'routine-item'       // 高亮第一个作息项（教调整时间/标星/删除/重复日）
  | 'routine-add'        // 高亮「添加作息项」按钮
  | 'routine-complete'   // 高亮「完成设置」按钮（点击后进入计划制定环节）
  // ===== 时间规划引导（/planner）=====
  | 'planner-intro'      // 介绍卡片：作息设置完成，接下来制定计划
  | 'planner-calc'       // 高亮「①自动计算空闲时间」
  | 'planner-add-task'   // 高亮「②增加项目」
  | 'planner-generate'   // 高亮「③生成计划」
  | 'planner-focus'      // 高亮「专注」按钮（点击后进入专注，引导隐藏）
  // ===== 专注体验 =====
  | 'focus-running'      // 专注进行中（引导隐藏）
  | 'focus-done';        // 专注结束 → 引导完成

// 按顺序排列的阶段列表
export const TOUR_STAGES: TourStageId[] = [
  'routine-intro',
  'routine-mode',
  'routine-sleep',
  'routine-item',
  'routine-add',
  'routine-complete',
  'planner-intro',
  'planner-calc',
  'planner-add-task',
  'planner-generate',
  'planner-focus',
  'focus-running',
  'focus-done',
];

interface TourState {
  // 是否处于引导活跃状态（引导覆盖层是否展示）
  isActive: boolean;
  // 当前阶段索引
  stageIndex: number;
  // 专注是否正在进行（由 TimePlanner 在启动/结束专注时通知）
  focusActive: boolean;
  // 启动引导（从 routine-intro 开始）
  startTour: () => void;
  // 进入下一阶段
  nextStage: () => void;
  // 返回上一阶段
  prevStage: () => void;
  // 完成引导（关闭并重置）
  completeTour: () => void;
  // 跳过引导（与完成同样关闭，但语义不同）
  skipTour: () => void;
  // 通知专注状态变化（TimePlanner 调用）
  setFocusActive: (active: boolean) => void;
}

export const useTourStore = create<TourState>((set) => ({
  isActive: false,
  stageIndex: 0,
  focusActive: false,
  startTour: () => set({ isActive: true, stageIndex: 0, focusActive: false }),
  nextStage: () =>
    set((s) => ({
      stageIndex: Math.min(s.stageIndex + 1, TOUR_STAGES.length - 1),
    })),
  prevStage: () => set((s) => ({ stageIndex: Math.max(s.stageIndex - 1, 0) })),
  completeTour: () => set({ isActive: false, stageIndex: 0, focusActive: false }),
  skipTour: () => set({ isActive: false, stageIndex: 0, focusActive: false }),
  setFocusActive: (active) => set({ focusActive: active }),
}));
