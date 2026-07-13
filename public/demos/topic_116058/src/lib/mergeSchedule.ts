import type { ScheduleItem, ScheduledBlock } from '@/types';
import { useScheduleStore } from '@/store/scheduleStore';
import { usePlannerStore } from '@/store/plannerStore';

// 合并后的统一日程项：固定日程 + 计划表项目，按 startTime 混合排序
// kind 用于区分来源，便于在 UI 上用不同样式/操作
//   - 'fixed'  : 来自 scheduleStore 的固定日程（上课、起床、吃饭等）
//   - 'project': 来自 plannerStore 的项目块（用户添加的任务）
//   - 'break'  : 来自 plannerStore 的休息块（项目间休息）
export type MergedItem =
  | { kind: 'fixed'; startTime: string; endTime: string; raw: ScheduleItem }
  | { kind: 'project'; startTime: string; endTime: string; raw: ScheduledBlock }
  | { kind: 'break'; startTime: string; endTime: string; raw: ScheduledBlock };

// 合并某日的固定日程 + 计划表项目，按 startTime 升序排列
// includeHidden: 是否包含假期模式隐藏的固定日程（固定日程管理页传 true，其他场景默认 false）
export function mergeDaySchedule(dateStr: string, includeHidden: boolean = false): MergedItem[] {
  // 固定日程：通过 scheduleStore 生成当日项
  const fixedItems = useScheduleStore.getState().generateDailySchedule(dateStr, includeHidden);
  // 计划表项目：plannerStore 中匹配当日日期的块
  const plannerBlocks = usePlannerStore.getState().schedule.filter((b) => b.date === dateStr);

  const merged: MergedItem[] = [];
  fixedItems.forEach((it) => {
    merged.push({ kind: 'fixed', startTime: it.startTime, endTime: it.endTime, raw: it });
  });
  plannerBlocks.forEach((b) => {
    if (b.isBreak) {
      merged.push({ kind: 'break', startTime: b.startTime, endTime: b.endTime, raw: b });
    } else {
      merged.push({ kind: 'project', startTime: b.startTime, endTime: b.endTime, raw: b });
    }
  });

  // 按 startTime 升序排列（同时间则按 endTime 升序，保证稳定排序）
  merged.sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    return a.endTime.localeCompare(b.endTime);
  });
  return merged;
}
