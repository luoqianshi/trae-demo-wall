import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Sparkles,
  Target,
  CalendarCheck,
  TrendingUp,
  PawPrint,
  Flame,
  Award,
  Heart,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CorgiMascot, { PET_LABEL } from '@/components/Corgi/CorgiMascot';
import { useScheduleStore } from '@/store/scheduleStore';
import { useBackpackStore, TITLES_POOL } from '@/store/backpackStore';
import { useCorgiStore } from '@/store/corgiStore';
import { cn } from '@/lib/utils';

export default function Summary() {
  const { items } = useScheduleStore();
  const { backpack } = useBackpackStore();
  const { corgi } = useCorgiStore();
  const petLabel = PET_LABEL[corgi.petType];

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // 模拟历史数据（基于当前数据生成）
  const stats = useMemo(() => {
    const completedCount = items.filter((i) => i.completed).length;
    const totalSchedule = items.length || 1;
    const completionRate = Math.round((completedCount / totalSchedule) * 100);

    // 基于当月数据生成展示用的统计
    const focusCount = isCurrentMonth
      ? Math.max(0, completedCount + Math.floor(backpack.points / 30))
      : Math.floor(15 + Math.random() * 20);

    const pointsEarned = isCurrentMonth
      ? backpack.points
      : Math.floor(180 + Math.random() * 200);

    // 上月数据用作对比
    const prevFocus = isCurrentMonth ? Math.max(0, focusCount - 5) : Math.floor(10 + Math.random() * 15);
    const prevPoints = Math.max(0, pointsEarned - 30);
    const prevRate = Math.max(0, completionRate - 8);

    return {
      totalSchedules: totalSchedule,
      completedSchedules: completedCount,
      completionRate,
      focusCount,
      pointsEarned,
      corgiLevel: corgi.level,
      corgiSatiety: corgi.satiety,
      unlockedTitles: backpack.titles.filter((t) => t.unlocked).length,
      unlockedExpressions: backpack.expressions.filter((e) => e.unlocked).length,
      prev: {
        focusCount: prevFocus,
        pointsEarned: prevPoints,
        completionRate: prevRate,
      },
    };
  }, [items, backpack, corgi, isCurrentMonth]);

  // 进步幅度
  const focusGrowth = stats.focusCount - stats.prev.focusCount;
  const pointsGrowth = stats.pointsEarned - stats.prev.pointsEarned;
  const rateGrowth = stats.completionRate - stats.prev.completionRate;

  // 鼓励语
  const encouragement = useMemo(() => {
    if (stats.completionRate >= 90) return { text: '完美的一个月！你就是时间管理大师～', emoji: '🏆' };
    if (stats.completionRate >= 70) return { text: '非常棒！继续保持这种节奏～', emoji: '🌟' };
    if (stats.completionRate >= 50) return { text: '不错的进度！再努力一点点就好啦～', emoji: '💪' };
    if (stats.completionRate >= 30) return { text: '已经开始了，继续加油哦～', emoji: '🌱' };
    return { text: '让我们一起开启成长之旅吧～', emoji: '✨' };
  }, [stats.completionRate]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => {
    if (isCurrentMonth) return;
    setViewDate(new Date(year, month + 1, 1));
  };

  // 7天活跃数据（模拟）
  const weekActivity = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days.map((day, i) => ({
      day,
      value: isCurrentMonth ? Math.floor(Math.random() * 60 + 30) : Math.floor(Math.random() * 80 + 20),
    }));
  }, [monthKey]);

  // 类型分布
  const typeDistribution = useMemo(() => {
    const dist = { course: 0, homework: 0, rest: 0, entertainment: 0, custom: 0 };
    items.forEach((i) => {
      if (dist[i.type] !== undefined) dist[i.type] += 1;
    });
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    return [
      { label: '课程', value: dist.course, percent: Math.round((dist.course / total) * 100), color: 'bg-corgi-orange' },
      { label: '作业', value: dist.homework, percent: Math.round((dist.homework / total) * 100), color: 'bg-mint-fresh' },
      { label: '休息', value: dist.rest, percent: Math.round((dist.rest / total) * 100), color: 'bg-berry-pink' },
      { label: '娱乐', value: dist.entertainment, percent: Math.round((dist.entertainment / total) * 100), color: 'bg-purple-400' },
      { label: '其他', value: dist.custom, percent: Math.round((dist.custom / total) * 100), color: 'bg-corgi-yellow' },
    ];
  }, [items]);

  // 最近获得的称号
  const recentTitles = backpack.titles.filter((t) => t.unlocked).slice(0, 3);

  return (
    <div className="min-h-screen warm-bg pb-24">
      <PageHeader
        title="月度总结"
        subtitle="回顾你的成长与进步"
        right={
          <div className="flex items-center gap-1.5 bg-corgi-yellow/20 px-3 py-2 rounded-xl">
            <Sparkles size={16} className="text-corgi-orange" />
            <span className="font-bold text-corgi-dark text-sm">{stats.pointsEarned}</span>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* 月份切换 */}
        <div className="flex items-center justify-between mb-5 bg-warm-light rounded-2xl px-4 py-3 shadow-soft border-2 border-corgi-yellow/20">
          <button
            onClick={prevMonth}
            className="btn-press w-9 h-9 rounded-full bg-corgi-yellow/20 flex items-center justify-center text-corgi-dark hover:bg-corgi-yellow/40 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-display text-xl text-text-primary">
              {year}年{month + 1}月
            </p>
            <p className="text-xs text-text-secondary">
              {isCurrentMonth ? '本月总结' : '历史总结'}
            </p>
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className={cn(
              'btn-press w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isCurrentMonth
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-corgi-yellow/20 text-corgi-dark hover:bg-corgi-yellow/40'
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 鼓励语卡片 */}
        <div className="relative bg-gradient-to-br from-corgi-yellow/30 via-corgi-orange/20 to-berry-pink/20 rounded-puffy p-5 shadow-puffy border-2 border-corgi-yellow/30 mb-5 overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <CorgiMascot mood="excited" size={120} floating={false} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{encouragement.emoji}</span>
              <h2 className="font-display text-lg text-text-primary">成长寄语</h2>
            </div>
            <p className="text-base text-text-primary font-bold mb-3">{encouragement.text}</p>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Heart size={14} className="text-berry-rose fill-berry-rose" />
              <span>{corgi.name} 一直在你身边陪伴～</span>
            </div>
          </div>
        </div>

        {/* 核心数据卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard
            icon={CalendarCheck}
            label="日程完成"
            value={`${stats.completedSchedules}/${stats.totalSchedules}`}
            subValue={`完成率 ${stats.completionRate}%`}
            color="bg-mint-fresh/15 text-mint-deep"
            growth={rateGrowth}
            growthSuffix="%"
          />
          <StatCard
            icon={Target}
            label="番茄钟专注"
            value={`${stats.focusCount}次`}
            subValue="本月专注次数"
            color="bg-corgi-orange/15 text-corgi-dark"
            growth={focusGrowth}
            growthSuffix="次"
          />
          <StatCard
            icon={Sparkles}
            label="获得积分"
            value={`+${stats.pointsEarned}`}
            subValue="通过专注获得"
            color="bg-corgi-yellow/20 text-corgi-dark"
            growth={pointsGrowth}
          />
          <StatCard
            icon={PawPrint}
            label={`${petLabel}等级`}
            value={`Lv.${stats.corgiLevel}`}
            subValue={`饱食 ${stats.corgiSatiety}`}
            color="bg-berry-pink/15 text-berry-rose"
          />
        </div>

        {/* 完成率进度环 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">完成率概览</h3>
          </div>
          <div className="flex items-center gap-6">
            {/* 圆环 */}
            <div className="relative w-32 h-32 shrink-0">
              <svg width="128" height="128" className="-rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="rgba(232, 168, 87, 0.15)"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#FF9F43"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 - (stats.completionRate / 100) * 2 * Math.PI * 56}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display text-corgi-dark">{stats.completionRate}%</span>
                <span className="text-xs text-text-secondary">完成率</span>
              </div>
            </div>
            {/* 详细 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">已完成日程</span>
                <span className="font-bold text-mint-deep">{stats.completedSchedules} 条</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">未完成</span>
                <span className="font-bold text-berry-rose">{stats.totalSchedules - stats.completedSchedules} 条</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">上月完成率</span>
                <span className="font-bold text-text-light">{stats.prev.completionRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-corgi-yellow/20">
                <span className="text-text-secondary font-bold">进步</span>
                <span className={cn(
                  'font-bold flex items-center gap-1',
                  rateGrowth >= 0 ? 'text-mint-deep' : 'text-berry-rose'
                )}>
                  <TrendingUp size={14} className={rateGrowth < 0 && 'rotate-180'} />
                  {Math.abs(rateGrowth)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 周活跃度 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">周活跃度</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {weekActivity.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-corgi-orange to-corgi-yellow rounded-t-lg transition-all duration-700 ease-out hover:opacity-80"
                    style={{ height: `${d.value}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-secondary font-bold">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 日程类型分布 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">日程类型分布</h3>
          </div>
          {/* 堆叠条 */}
          <div className="h-4 rounded-full overflow-hidden flex bg-corgi-yellow/10 mb-4">
            {typeDistribution.map((t, i) => (
              <div
                key={i}
                className={cn('h-full transition-all duration-700', t.color)}
                style={{ width: `${t.percent}%` }}
                title={`${t.label}: ${t.value}条 (${t.percent}%)`}
              />
            ))}
          </div>
          {/* 图例 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {typeDistribution.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className={cn('w-3 h-3 rounded-full', t.color)} />
                <span className="text-text-secondary">{t.label}</span>
                <span className="ml-auto font-bold text-text-primary">{t.value}条</span>
              </div>
            ))}
          </div>
        </div>

        {/* 成就/称号 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">本月成就</h3>
            <span className="ml-auto text-xs text-text-secondary font-bold">
              已解锁 {stats.unlockedTitles}/{TITLES_POOL.length} 称号
            </span>
          </div>

          {/* 进步对比 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <CompareCard label="专注次数" current={stats.focusCount} previous={stats.prev.focusCount} unit="次" />
            <CompareCard label="获得积分" current={stats.pointsEarned} previous={stats.prev.pointsEarned} unit="分" />
            <CompareCard label="完成率" current={stats.completionRate} previous={stats.prev.completionRate} unit="%" />
          </div>

          {/* 称号列表 */}
          {recentTitles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary font-bold mb-2">最近获得的称号</p>
              {recentTitles.map((t) => (
                <div
                  key={t.reward.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-corgi-yellow/10 border border-corgi-yellow/30 animate-pop-in"
                >
                  <div className="w-10 h-10 rounded-full bg-corgi-yellow/30 flex items-center justify-center text-xl">
                    {t.reward.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text-primary text-sm">{t.reward.name}</p>
                    <p className="text-xs text-text-secondary">{t.reward.description}</p>
                  </div>
                  <Trophy size={18} className="text-corgi-orange" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-text-light mb-1">还没获得称号哦～</p>
              <p className="text-xs text-text-light">完成番茄钟专注和日程任务来解锁称号！</p>
            </div>
          )}
        </div>

        {/* 宠物成长 */}
        <div className="bg-warm-light rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/20 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <PawPrint size={20} className="text-corgi-orange" />
            <h3 className="font-display text-lg text-text-primary">{petLabel}成长</h3>
          </div>
          <div className="flex items-center gap-4">
            <CorgiMascot furColor={corgi.furColor} petType={corgi.petType} mood="happy" size={100} floating={false} />
            <div className="flex-1 space-y-3">
              <GrowthBar label="等级" value={`Lv.${stats.corgiLevel}`} percent={Math.min(100, stats.corgiLevel * 20)} color="bg-corgi-orange" />
              <GrowthBar label="饱食度" value={`${stats.corgiSatiety}`} percent={stats.corgiSatiety} color="bg-corgi-yellow" />
            </div>
          </div>
        </div>

        {/* 底部总结 */}
        <div className="bg-gradient-to-r from-corgi-yellow/15 to-berry-pink/15 rounded-puffy p-5 shadow-soft border-2 border-corgi-yellow/30 text-center">
          <Trophy size={28} className="text-corgi-orange mx-auto mb-2" />
          <p className="font-display text-base text-text-primary mb-1">
            {year}年{month + 1}月，你完成了 {stats.completedSchedules} 条日程，{stats.focusCount} 次专注
          </p>
          <p className="text-sm text-text-secondary">
            收获了 {stats.pointsEarned} 积分，{corgi.name} 也成长到了 Lv.{stats.corgiLevel}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  growth,
  growthSuffix,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  subValue: string;
  color: string;
  growth?: number;
  growthSuffix?: string;
}) {
  return (
    <div className="bg-warm-light rounded-2xl p-4 shadow-soft border-2 border-corgi-yellow/20">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', color)}>
          <Icon size={18} />
        </div>
        {growth !== undefined && (
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5',
              growth >= 0 ? 'bg-mint-fresh/20 text-mint-deep' : 'bg-berry-pink/20 text-berry-rose'
            )}
          >
            <TrendingUp size={10} className={growth < 0 && 'rotate-180'} />
            {growth >= 0 ? '+' : ''}{growth}{growthSuffix || ''}
          </span>
        )}
      </div>
      <p className="text-2xl font-display text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary font-bold mt-0.5">{label}</p>
      <p className="text-[11px] text-text-light mt-0.5">{subValue}</p>
    </div>
  );
}

function CompareCard({
  label,
  current,
  previous,
  unit,
}: {
  label: string;
  current: number;
  previous: number;
  unit: string;
}) {
  const diff = current - previous;
  return (
    <div className="bg-warm-cream/50 rounded-2xl p-3 text-center border border-corgi-yellow/20">
      <p className="text-xs text-text-secondary font-bold mb-1">{label}</p>
      <p className="text-lg font-display text-text-primary">{current}{unit}</p>
      <p className="text-[10px] text-text-light">上月 {previous}{unit}</p>
      <p
        className={cn(
          'text-[10px] font-bold mt-1',
          diff >= 0 ? 'text-mint-deep' : 'text-berry-rose'
        )}
      >
        {diff >= 0 ? '+' : ''}{diff}{unit}
      </p>
    </div>
  );
}

function GrowthBar({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary font-bold">{label}</span>
        <span className="text-xs font-bold text-text-primary">{value}</span>
      </div>
      <div className="h-2.5 bg-corgi-yellow/20 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
