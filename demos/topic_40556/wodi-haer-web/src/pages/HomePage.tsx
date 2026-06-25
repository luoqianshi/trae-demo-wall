import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { stages } from '../data/stages';
import { knowledgeArticles } from '../data/knowledge';
import { useBabyStore, useStageStore } from '../store/index';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { STAGE_LIST, RECORD_FIELDS_CONFIG, type StageKey, type UnifiedRecord } from '../types/global.d';
import { getSmartNews, type SmartNewsItem } from '../services/smartNews';

// 计算月龄（返回详细对象）
function calcAgeDetail(birthDate: string): { months: number; days: number; display: string; totalDays: number } {
  if (!birthDate) return { months: 0, days: 0, display: '未设置生日', totalDays: 0 };
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const days = now.getDate() - birth.getDate();
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  if (months < 0) return { months: 0, days: 0, display: '出生日期无效', totalDays: 0 };
  let display = '';
  if (months >= 12) {
    display = `${Math.floor(months / 12)}岁${months % 12}个月`;
  } else {
    display = `${months}个月${days + 1}天`;
  }
  return { months, days: days + 1, display, totalDays };
}

// 下次疫苗计划表
const VACCINE_REMINDERS: { month: number; name: string; dose: string }[] = [
  { month: 0, name: '卡介苗', dose: '第1针' },
  { month: 0, name: '乙肝疫苗', dose: '第1针' },
  { month: 1, name: '乙肝疫苗', dose: '第2针' },
  { month: 2, name: '脊灰疫苗', dose: '第1针' },
  { month: 2, name: '百白破疫苗', dose: '第1针' },
  { month: 3, name: '脊灰疫苗', dose: '第2针' },
  { month: 3, name: '百白破疫苗', dose: '第2针' },
  { month: 6, name: '乙肝疫苗', dose: '第3针' },
  { month: 8, name: '麻腮风疫苗', dose: '第1针' },
];

// 每周成长建议
const WEEKLY_TIPS: { minMonth: number; maxMonth: number; tip: string }[] = [
  { minMonth: 0, maxMonth: 1, tip: '多和宝宝对视交流，促进视觉发育' },
  { minMonth: 2, maxMonth: 3, tip: '每天趴着练习抬头10-15分钟' },
  { minMonth: 4, maxMonth: 6, tip: '提供安全的环境让宝宝自由探索' },
  { minMonth: 7, maxMonth: 9, tip: '鼓励爬行，锻炼四肢协调能力' },
  { minMonth: 10, maxMonth: 12, tip: '多读绘本，培养语言兴趣' },
  { minMonth: 13, maxMonth: 18, tip: '鼓励独立行走，但不要急于求成' },
  { minMonth: 19, maxMonth: 24, tip: '开始培养生活自理习惯' },
  { minMonth: 25, maxMonth: 36, tip: '多进行户外活动，促进社交发展' },
];

/** 从 localStorage 读取统一记录 */
function getUnifiedRecords(): UnifiedRecord[] {
  try {
    return storage.get<UnifiedRecord[]>('wdhr_unified_records') || [];
  } catch {
    return [];
  }
}

function HomePage() {
  // ===== URL 参数支持 =====
  const [searchParams] = useSearchParams();
  const urlStage = searchParams.get('stage') as StageKey | null;
  const urlCategory = searchParams.get('category') || '';

  // ===== 阶段 Store =====
  const { currentStage, setStage } = useStageStore();

  // 如果URL有stage参数，自动切换阶段
  useEffect(() => {
    if (urlStage && STAGE_LIST.some(s => s.key === urlStage)) {
      setStage(urlStage);
    }
  }, [urlStage, setStage]);

  // 当前阶段信息（从STAGE_LIST取）
  const currentStageInfo = useMemo(
    () => STAGE_LIST.find(s => s.key === currentStage) || STAGE_LIST[3],
    [currentStage]
  );

  // 兼容旧版stages数据（用于概览等区域）
  const [activeStageIndex, setActiveStageIndex] = useState(() => {
    const idx = stages.findIndex(s => s.key === currentStage);
    return idx >= 0 ? idx : 3;
  });
  const legacyCurrentStage = stages[activeStageIndex];

  // 同步：当store的stage变化时更新legacy index
  useEffect(() => {
    const idx = stages.findIndex(s => s.key === currentStage);
    if (idx >= 0) setActiveStageIndex(idx);
  }, [currentStage]);

  const { baby } = useBabyStore();

  // 静态数据作为默认展示
  const [urgentNews, setUrgentNews] = useState<SmartNewsItem | null>(null);
  const displayArticles = knowledgeArticles.slice(0, 4);

  // ===== 统一记录读取 =====
  const [unifiedRecords, setUnifiedRecords] = useState<UnifiedRecord[]>([]);

  // 旧格式本地记录（兼容）
  const [localRecords, setLocalRecords] = useState<Array<{ time: string; content: string; type: string }>>([]);

  // 今日各类型记录计数
  const [todayStats, setTodayStats] = useState<Record<string, number>>({});
  const [lastRecordTime, setLastRecordTime] = useState<string>('');

  useEffect(() => {
    try {
      // 读取统一记录
      const unified = getUnifiedRecords();
      setUnifiedRecords(unified);

      // 读取旧格式记录（向后兼容）
      const oldRecords = storage.get<Array<{ id: string; type: string; time: string; method?: string; duration?: string; amount?: string; diaperType?: string; status?: string; startTime?: string; endTime?: string; quality?: string }>>(STORAGE_KEYS.RECORDS);
      if (oldRecords && oldRecords.length > 0) {
        const displayRecords = oldRecords.slice(0, 3).map(r => {
          let content = '';
          if (r.type === 'feeding') {
            content = `🍼 ${r.method || ''}${r.duration ? ` ${r.duration}分钟` : ''}${r.amount ? ` ${r.amount}ml` : ''}`.trim();
          } else if (r.type === 'sleep') {
            content = `😴 ${r.startTime || ''}-${r.endTime || ''} 质量：${r.quality || ''}`;
          } else {
            content = `💩 ${r.diaperType || ''} 状态：${r.status || ''}`;
          }
          return { time: r.time, content: content.trim(), type: r.type };
        });
        setLocalRecords(displayRecords);
      }

      // 计算今日统计（合并统一记录 + 旧记录）
      const today = new Date().toISOString().split('T')[0];
      const counts: Record<string, number> = {};
      let latestTime = '';

      // 统一记录计数
      unified.forEach(r => {
        if (r.date === today) {
          counts[r.category] = (counts[r.category] || 0) + 1;
        }
        const rt = new Date(r.time).getTime();
        if (rt > new Date(latestTime || 0).getTime()) latestTime = r.time;
      });

      // 旧记录计数
      if (oldRecords) {
        oldRecords.forEach(r => {
          const recordDate = (r.time || r.startTime || '').split('T')[0];
          if (recordDate === today) {
            counts[r.type] = (counts[r.type] || 0) + 1;
          }
          const recordTime = new Date(r.time || r.startTime || '').getTime();
          if (recordTime > new Date(latestTime || 0).getTime()) {
            latestTime = r.time || r.startTime || '';
          }
        });
      }

      setTodayStats(counts);
      setLastRecordTime(latestTime);
    } catch {
      // ignore
    }
  }, []);

  // ======== 宝宝信息计算 ========
  const ageInfo = baby?.birthDate ? calcAgeDetail(baby.birthDate) : null;
  const babyInitial = baby?.name ? baby.name.charAt(0).toUpperCase() : '👶';

  // 获取下次疫苗提醒
  const getNextVaccine = () => {
    if (!ageInfo) return null;
    const currentMonth = ageInfo.months;
    for (const v of VACCINE_REMINDERS) {
      if (v.month > currentMonth) return v;
    }
    return VACCINE_REMINDERS[VACCINE_REMINDERS.length - 1];
  };

  const nextVaccine = getNextVaccine();

  // 获取本周成长建议
  const getWeeklyTip = () => {
    if (!ageInfo) return '设置宝宝生日后获取个性化建议';
    const currentMonth = ageInfo.months;
    const matchedTip = WEEKLY_TIPS.find(t => currentMonth >= t.minMonth && currentMonth <= t.maxMonth);
    return matchedTip?.tip || '宝宝正在健康成长中！';
  };

  const weeklyTip = getWeeklyTip();

  // ======== 今日待办计算 ========
  const getTodoItems = (): Array<{ icon: string; text: string; done: boolean }> => {
    const items: Array<{ icon: string; text: string; done: boolean }> = [];
    const feedingCount = todayStats['feeding'] || 0;
    const sleepCount = todayStats['sleep'] || 0;
    const diaperCount = todayStats['diaper'] || 0;

    if (feedingCount < 6) {
      items.push({ icon: '🍼', text: `今日还需喂奶 ${6 - feedingCount} 次`, done: false });
    }
    if (sleepCount < 3) {
      items.push({ icon: '😴', text: '记录一下宝宝的睡眠吧', done: false });
    }
    if (diaperCount < 2) {
      items.push({ icon: '💩', text: '今天有换尿布吗？', done: false });
    }

    if (items.length === 0) {
      items.push({ icon: '🎉', text: '太棒了！今天的记录很完整', done: true });
    }

    return items;
  };

  const todoItems = getTodoItems();

  // 格式化上次记录时间
  const formatLastRecordTime = (): string => {
    if (!lastRecordTime) return '';
    const now = Date.now();
    const last = new Date(lastRecordTime).getTime();
    const diffMs = now - last;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}小时前`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}天前`;
  };

  // ======== 阶段进度计算 ========
  const stageProgress = useMemo(() => {
    const stageUnifiedRecords = unifiedRecords.filter(r => r.stage === currentStage);

    switch (currentStage) {
      case 'preparing': {
        // 叶酸服用天数 / 目标90天；排卵记录数
        const folicRecords = stageUnifiedRecords.filter(r => r.category === 'folic_acid');
        const folicDays = new Set(folicRecords.map(r => r.date)).size;
        const ovulationRecords = stageUnifiedRecords.filter(r => r.category === 'ovulation').length;
        return {
          label: `叶酸服用 ${folicDays}/90 天`,
          subLabel: `排卵记录 ${ovulationRecords} 次`,
          percent: Math.min(Math.round((folicDays / 90) * 100), 100),
        };
      }
      case 'pregnancy': {
        // 孕周估算（基于末次月经）；胎动累计次数
        const fetalMovementRecords = stageUnifiedRecords.filter(r => r.category === 'fetal_movement');
        const totalFetalMovement = fetalMovementRecords.reduce((sum, r) => sum + Number(r.value || 0), 0);
        // 简单孕周估算：如果有宝宝生日则倒推40周
        let estimatedWeek = 0;
        if (baby?.birthDate) {
          const dueDate = new Date(baby.birthDate);
          const now = new Date();
          const diffMs = dueDate.getTime() - now.getTime();
          estimatedWeek = Math.max(0, Math.round(40 - (diffMs / (7 * 24 * 60 * 60 * 1000))));
        }
        return {
          label: estimatedWeek > 0 ? `约 ${estimatedWeek} 孕周` : '孕期进行中',
          subLabel: `胎动累计 ${totalFetalMovement} 次`,
          percent: Math.min(Math.round((estimatedWeek / 40) * 100), 100),
        };
      }
      case 'birth': {
        // 分娩进程状态
        const laborRecords = stageUnifiedRecords.filter(r => r.category === 'labor_progress');
        const lastLabor = laborRecords[laborRecords.length - 1];
        const laborMap: Record<string, number> = {
          '未开始': 0,
          '潜伏期': 20,
          '活跃期': 50,
          '过渡期': 75,
          '第二产程': 90,
          '已分娩': 100,
        };
        const progressPercent = lastLabor ? (laborMap[String(lastLabor.value)] || 0) : 0;
        return {
          label: lastLabor ? `当前：${lastLabor.value}` : '待产准备中',
          subLabel: laborRecords.length > 0 ? `已记录 ${laborRecords.length} 条进程` : '',
          percent: progressPercent,
        };
      }
      case 'parenting': {
        // 宝宝月龄/36个月；里程碑达成百分比
        const months = ageInfo?.months || 0;
        const milestoneRecords = stageUnifiedRecords.filter(r =>
          ['feeding', 'sleep', 'diaper'].includes(r.category)
        );
        // 简化的里程碑达成率：有记录的分类数 / 总分类数
        const achievedCategories = new Set(milestoneRecords.map(r => r.category)).size;
        const totalCategories = 3; // feeding, sleep, diaper
        const milestonePercent = totalCategories > 0 ? Math.round((achievedCategories / totalCategories) * 100) : 0;
        return {
          label: ageInfo ? ageInfo.display : '未设置生日',
          subLabel: `里程碑达成 ${milestonePercent}%`,
          percent: Math.min(Math.round((months / 36) * 100), 100),
        };
      }
      default:
        return { label: '', subLabel: '', percent: 0 };
    }
  }, [currentStage, unifiedRecords, baby, ageInfo]);

  // 当前阶段的快捷入口字段配置
  const currentFieldsConfig = useMemo(
    () => RECORD_FIELDS_CONFIG[currentStage as StageKey] || [],
    [currentStage]
  );

  // ======== 动态快捷操作入口 ========
  const dynamicQuickActions = useMemo(() => {
    const actions: Array<{
      icon: string;
      label: string;
      path: string;
      color: string;
      key: string;
    }> = [];

    // 取当前阶段前4个字段作为快捷入口
    currentFieldsConfig.slice(0, 4).forEach((field: { key: string; icon: string; name: string }) => {
      const count = todayStats[field.key] || 0;
      actions.push({
        icon: field.icon,
        label: `${field.name} ${count > 0 ? `${count}次` : ''}`,
        path: `/record?stage=${currentStage}&category=${field.key}`,
        color: currentStageInfo.color,
        key: field.key,
      });
    });

    // 养育期额外显示疫苗和里程碑入口
    if (currentStage === 'parenting') {
      actions.push({
        icon: '💉',
        label: '疫苗接种',
        path: '/vaccine',
        color: 'light-yellow',
        key: 'vaccine',
      });
      actions.push({
        icon: '🏆',
        label: '成长里程碑',
        path: '/milestone',
        color: 'mint',
        key: 'milestone',
      });
    }

    return actions;
  }, [currentStage, currentFieldsConfig, todayStats, currentStageInfo.color]);

  // ======== 最近记录（当前阶段） ========
  const stageRecentRecords = useMemo(() => {
    // 优先使用统一记录
    const stageRecords = unifiedRecords
      .filter(r => r.stage === currentStage)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(r => {
        const fieldMeta = currentFieldsConfig.find((f: { key: string }) => f.key === r.category);
        return {
          time: r.time.includes('T') ? r.time.split('T')[1]?.slice(0, 5) || r.time.slice(11, 16) : r.time.slice(11, 16),
          content: `${currentStageInfo.icon} ${fieldMeta?.name || r.category}: ${r.value}${r.note ? ` (${r.note})` : ''}`,
          category: r.category,
          stage: r.stage,
        };
      });

    // 如果没有统一记录，回退到旧格式
    if (stageRecords.length === 0 && localRecords.length > 0) {
      return localRecords.slice(0, 5);
    }

    return stageRecords.length > 0 ? stageRecords : [
      { time: '--:--', content: `${currentStageInfo.icon} 暂无${currentStageInfo.name}记录`, category: '', stage: '' },
    ];
  }, [unifiedRecords, currentStage, localRecords, currentFieldsConfig, currentStageInfo]);

  // 后台静默尝试加载 API 数据
  useEffect(() => {
    const tryLoadApiData = async () => {
      try {
        const result = await getSmartNews({ limit: 5 });
        if (result.urgentItems.length > 0) {
          setUrgentNews(result.urgentItems[0]);
        } else if (result.items.length > 0) {
          setUrgentNews(result.items[0]);
        }
      } catch {
        // 静默失败
      }
    };
    tryLoadApiData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ========== 顶部欢迎区 ========== */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">吾滴孩儿</h1>
            <p className="text-sm text-text-secondary mt-1">从备孕到养育，陪伴每一个成长瞬间</p>
          </div>
          <Link to="/news" className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <span className="text-lg">📰</span>
            <span className="text-xs text-text-secondary">资讯</span>
          </Link>
        </div>

        {/* 宝宝信息卡片 */}
        {baby?.name ? (
          <div className="mt-3 bg-gradient-to-r from-soft-pink/30 to-light-blue/30 rounded-2xl p-4 shadow-md animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-light-blue flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {babyInitial}
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-text-primary">
                  👶 {baby.name} · {ageInfo?.display || '未设置生日'}
                </p>
                {nextVaccine && (
                  <p className="text-xs text-text-secondary mt-1">
                    ⏰ 下次疫苗: {nextVaccine.name}（{nextVaccine.dose}·{nextVaccine.month}月龄）
                  </p>
                )}
                <p className="text-xs text-ice-blue mt-0.5">💡 {weeklyTip}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* 上次记录时间 */}
        {lastRecordTime && (
          <p className="text-xs text-text-light mt-2">上次记录: {formatLastRecordTime()}</p>
        )}
      </div>

      <div className="px-6 py-4 space-y-5">
        {/* ========== 1. 四阶段选择器 ========== */}
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-3">🎯 当前阶段</h2>
          <div className="grid grid-cols-4 gap-2">
            {STAGE_LIST.map(stage => (
              <button
                key={stage.key}
                onClick={() => setStage(stage.key)}
                className={`relative py-3 px-2 rounded-2xl flex flex-col items-center transition-all duration-300 ${
                  currentStage === stage.key
                    ? 'text-white shadow-lg scale-[1.05]'
                    : 'bg-white text-text-secondary border border-gray-200 hover:border-gray-300'
                }`}
                style={currentStage === stage.key ? {
                  background: `linear-gradient(135deg, ${stage.gradientFrom}, ${stage.gradientTo})`,
                } : {}}
              >
                <span className="text-2xl mb-1">{stage.icon}</span>
                <span className={`text-xs ${currentStage === stage.key ? 'font-bold' : ''}`}>{stage.name}</span>
                {currentStage === stage.key && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/50 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-light mt-2 text-center">{currentStageInfo.description}</p>
        </div>

        {/* ========== 2. 阶段进度卡片 ========== */}
        <div
          className="rounded-2xl p-5 text-white shadow-lg animate-slide-up"
          style={{
            background: `linear-gradient(to right, ${currentStageInfo.gradientFrom}, ${currentStageInfo.gradientTo})`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">{currentStageInfo.name} · 进度</h3>
            <span className="text-2xl">{currentStageInfo.icon}</span>
          </div>
          <p className="text-sm font-medium opacity-95">{stageProgress.label}</p>
          {stageProgress.subLabel && (
            <p className="text-xs opacity-80 mt-1">{stageProgress.subLabel}</p>
          )}
          <div className="w-full bg-white/40 rounded-full h-2.5 mt-3">
            <div
              className="bg-white rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${stageProgress.percent}%` }}
            ></div>
          </div>
          <p className="text-right text-xs opacity-80 mt-1">{stageProgress.percent}%</p>
        </div>

        {/* ========== 3. URL参数提示 ========== */}
        {(urlStage || urlCategory) && (
          <div className="bg-light-yellow/50 border border-yellow-300 rounded-xl p-3 flex items-center gap-2 animate-slide-up">
            <span className="text-lg">👆</span>
            <p className="text-sm text-text-primary">
              已为您切换到「{currentStageInfo.name}」阶段
              {urlCategory && `，可前往记录${RECORD_FIELDS_CONFIG[currentStage as StageKey]?.find((f: { key: string }) => f.key === urlCategory)?.name || urlCategory}`}
            </p>
          </div>
        )}

        {/* ========== 4. 今日待办 ========== */}
        <div className="card !p-5 bg-gradient-to-r from-light-yellow/50 to-mint/30">
          <h2 className="text-base font-semibold text-text-primary mb-3">📋 今日待办</h2>
          <div className="space-y-2">
            {todoItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  item.done ? 'bg-green-100/60' : 'bg-white/70'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className={`text-sm ${item.done ? 'text-green-700 font-medium' : 'text-text-primary'}`}>
                  {item.text}
                </span>
                {item.done && <span className="ml-auto text-green-500">✅</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ========== 5. 紧急安全通知（来自官方渠道） ========== */}
        {urgentNews && (
          <Link
            to={`/news/${urgentNews.id}`}
            className="block bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🚨</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full mr-2">
                    {urgentNews.aiAnalysis?.riskLevel === 'critical' ? '严重' : '紧急'}
                  </span>
                  <span className="text-xs text-text-secondary">🏛️ {urgentNews.source}</span>
                </div>
                <p className="text-sm font-medium text-text-primary truncate">{urgentNews.title}</p>
                {urgentNews.aiAnalysis?.aiSummary && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-1">{urgentNews.aiAnalysis.aiSummary}</p>
                )}
              </div>
              <span className="text-text-secondary ml-2 flex-shrink-0">›</span>
            </div>
          </Link>
        )}

        {/* ========== 6. 快捷操作入口 ========== */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">⚡ 快捷操作 · {currentStageInfo.name}</h2>
          <div className="grid grid-cols-4 gap-3">
            {dynamicQuickActions.map(action => (
              <Link
                key={action.key}
                to={action.path}
                className={`flex flex-col items-center justify-center p-3 rounded-xl bg-${action.color} hover:scale-105 transition-all active:scale-[0.95] animate-bounce-in`}
              >
                <span className="text-3xl mb-1">{action.icon}</span>
                <span className="text-xs text-text-secondary truncate w-full text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ========== 7. 最近记录 ========== */}
        <div className="card !p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-text-primary">📝 最近记录 · {currentStageInfo.name}</h2>
            <Link to={`/record?stage=${currentStage}`} className="text-xs text-ice-blue hover:underline">
              全部 ›
            </Link>
          </div>
          <div className="space-y-2">
            {stageRecentRecords.map((record, index) => (
              <Link
                key={index}
                to={`/record?stage=${currentStage}${('category' in record && record.category) ? `&category=${record.category}` : ''}`}
                className={`flex items-center p-3 bg-cream rounded-xl ${stageRecentRecords.length === 1 && record.content.includes('暂无') ? 'opacity-50' : ''} hover:bg-soft-blue/20 transition-colors active:scale-[0.99]`}
              >
                <span className="w-16 text-xs text-text-secondary font-medium flex-shrink-0">{record.time}</span>
                <span className="flex-1 text-sm text-text-primary truncate">{record.content}</span>
                <span className="text-text-light flex-shrink-0 text-xs">›</span>
              </Link>
            ))}
          </div>
          {stageRecentRecords.length === 1 && stageRecentRecords[0].content.includes('暂无') && (
            <p className="text-xs text-center text-text-light mt-2">点击上方快捷按钮添加第一条记录吧~ 🌟</p>
          )}
        </div>

        {/* ========== 8. 知识库推荐 ========== */}
        <div className="card !p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-text-primary">📚 知识库推荐</h2>
            <Link to="/knowledge" className="text-xs text-ice-blue hover:underline">更多 ›</Link>
          </div>
          <div className="space-y-2">
            {displayArticles.map((article) => (
              <Link key={article.id} to={`/knowledge/${article.id}`} className="block p-3 bg-cream rounded-xl hover:bg-soft-blue/20 transition-colors active:scale-[0.99]">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-medium text-text-primary line-clamp-1 pr-2">{article.title}</h3>
                  <span className="text-xs text-text-light whitespace-nowrap flex-shrink-0">{article.readTime}</span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-1">{article.summary}</p>
                <div className="flex items-center gap-2 mt-1">
                  {article.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white rounded text-text-light">#{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ========== 9. 今日小贴士 ========== */}
        <div className="card !p-5 bg-gradient-to-r from-soft-blue to-light-blue">
          <h2 className="text-base font-semibold text-text-primary mb-2">💡 今日小贴士</h2>
          <p className="text-text-secondary text-xs leading-relaxed">{legacyCurrentStage.tips[0]}</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
