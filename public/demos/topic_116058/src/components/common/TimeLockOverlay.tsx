import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, BookOpen, Timer } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import type { ScheduleItem } from '@/types';
import SoftButton from './SoftButton';

interface TimeLockOverlayProps {
  currentPath: string;
}

// 学习时段内被锁定的页面（非学习相关功能）
const LOCKED_PATHS = ['/corgi', '/blindbox', '/friends', '/backpack'];

// 获取当前时间字符串 HH:mm
function getCurrentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// 获取今天的日期字符串 YYYY-MM-DD
function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TimeLockOverlay({ currentPath }: TimeLockOverlayProps) {
  const navigate = useNavigate();
  const generateDailySchedule = useScheduleStore((s) => s.generateDailySchedule);
  const [dismissed, setDismissed] = useState(false);

  // 切换到新的被锁定页面时，重置「我知道了」状态，使锁定提示可以重新出现
  useEffect(() => {
    setDismissed(false);
  }, [currentPath]);

  // 获取当天日程，查找当前正在进行的「学习 / 上课」日程项
  const todaySchedule = generateDailySchedule(getTodayStr());
  const nowStr = getCurrentTimeStr();
  const activeStudyItem: ScheduleItem | null =
    todaySchedule.find(
      (item) =>
        (item.type === 'homework' || item.type === 'course') &&
        nowStr >= item.startTime &&
        nowStr <= item.endTime
    ) ?? null;

  // 是否需要显示锁定提示：
  // 1. 当前正处于学习 / 上课时段
  // 2. 用户尝试访问被锁定的页面
  // 3. 用户未点击「我知道了」关闭提示
  const shouldLock =
    !!activeStudyItem && LOCKED_PATHS.includes(currentPath) && !dismissed;

  if (!shouldLock) return null;

  // 跳转到专注页（番茄钟）
  const handleGoFocus = () => {
    navigate('/focus');
  };

  // 关闭提示，但保持在当前页不跳转
  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-black/70" />

      {/* 中心卡片 */}
      <div className="relative bg-warm-light rounded-puffy shadow-puffy p-6 max-w-sm w-full animate-pop-in border-4 border-corgi-yellow/40">
        {/* 大图标 */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-corgi-yellow/20 flex items-center justify-center">
            <Lock size={40} className="text-corgi-orange" />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="font-display text-2xl text-text-primary text-center mb-2">
          学习时段中
        </h3>

        {/* 副标题 */}
        <p className="text-sm text-text-secondary text-center mb-4 leading-relaxed">
          现在是学习时间，专注才能让宠物更开心哦！
        </p>

        {/* 当前正在进行的日程信息 */}
        <div className="bg-corgi-yellow/15 rounded-2xl p-3 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-corgi-orange/20 flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-corgi-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-primary truncate">
              {activeStudyItem?.title}
            </p>
            <p className="text-xs text-text-secondary">
              {activeStudyItem?.startTime} - {activeStudyItem?.endTime}
            </p>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="flex flex-col gap-3">
          <SoftButton variant="accent" size="md" className="w-full" onClick={handleGoFocus}>
            <Timer size={18} />
            去专注
          </SoftButton>
          <SoftButton variant="secondary" size="md" className="w-full" onClick={handleDismiss}>
            我知道了
          </SoftButton>
        </div>
      </div>
    </div>
  );
}
