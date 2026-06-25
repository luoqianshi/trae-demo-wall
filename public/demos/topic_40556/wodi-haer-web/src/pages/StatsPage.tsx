import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useStageStore } from '../store';
import { storage } from '../utils/storage';
import type {
  StageKey,
  UnifiedRecord,
  RecordFieldMeta,
} from '../types/global.d';
import { STAGE_LIST as _STAGE_LIST, RECORD_FIELDS_CONFIG as _RECORD_FIELDS_CONFIG } from '../types/global.d';

// ==================== 常量 & 类型 ====================

const UNIFIED_RECORDS_KEY = 'wdhr_unified_records';
const OLD_RECORDS_KEY = 'wodi_haer_records'; // storage前缀已由storage工具处理，这里用原始key

// 阶段主题色映射
const STAGE_THEME: Record<StageKey, { bg: string; gradientFrom: string; gradientTo: string; text: string; accent: string }> = {
  preparing:   { bg: 'bg-green-50',   gradientFrom: '#E8F5E9', gradientTo: '#A5D6A7', text: 'text-green-700', accent: 'bg-green-400' },
  pregnancy:   { bg: 'bg-pink-50',    gradientFrom: '#FFE4EC', gradientTo: '#F8BBD0', text: 'text-pink-700',  accent: 'bg-pink-400' },
  birth:       { bg: 'bg-blue-50',    gradientFrom: '#E6F4FF', gradientTo: '#90CAF9', text: 'text-blue-700',  accent: 'bg-blue-400' },
  parenting:   { bg: 'bg-purple-50',  gradientFrom: '#EDE7F6', gradientTo: '#B39DDB', text: 'text-purple-700',accent: 'bg-purple-400' },
};

// 阶段关键指标提示（用于空状态引导）
const STAGE_HINTS: Record<StageKey, { title: string; items: string[] }> = {
  preparing: {
    title: '备孕期统计',
    items: ['叶酸服用记录', '排卵日记录', '体重监测', '基础体温'],
  },
  pregnancy: {
    title: '怀孕期统计',
    items: ['胎动次数统计', '宫高腹围变化', '孕期体重增长', '胎心率监测'],
  },
  birth: {
    title: '生产期统计',
    items: ['宫缩情况记录', '破水状态跟踪', '分娩进程记录', '宝宝出生评分'],
  },
  parenting: {
    title: '养育期统计',
    items: ['喂奶次数/量', '尿布更换次数', '睡眠时长统计'],
  },
};

// ==================== 数据读取层 ====================

/** 从 localStorage 读取新格式统一记录 */
function loadUnifiedRecords(): UnifiedRecord[] {
  try {
    const raw = localStorage.getItem(UNIFIED_RECORDS_KEY);
    if (raw) return JSON.parse(raw) as UnifiedRecord[];
  } catch { /* ignore */ }
  return [];
}

/** 旧格式记录类型（兼容） */
interface OldLocalRecord {
  id: string;
  type: 'feeding' | 'sleep' | 'diaper';
  time?: string;
  startTime?: string;
  endTime?: string;
  method?: string;
  duration?: string;
  amount?: string;
  diaperType?: string;
  status?: string;
  quality?: string;
  note?: string;
  date?: string;
}

/** 将旧格式记录转换为养育期统一记录（仅 feeding/sleep/diaper） */
function convertOldToUnified(oldRecs: OldLocalRecord[]): UnifiedRecord[] {
  const categoryMap: Record<string, 'feeding' | 'sleep' | 'diaper'> = {
    feeding: 'feeding',
    sleep: 'sleep',
    diaper: 'diaper',
  };

  return oldRecs
    .filter(r => categoryMap[r.type])
    .map(r => ({
      id: r.id,
      category: categoryMap[r.type],
      stage: 'parenting' as StageKey,
      value: buildOldValue(r),
      note: r.note || '',
      time: r.time || r.startTime || '',
      date: r.date || extractDateFromTime(r.time || r.startTime || ''),
      createdAt: Date.now(),
    }));
}

function buildOldValue(r: OldLocalRecord): string {
  if (r.type === 'feeding') {
    const parts = [r.method];
    if (r.duration) parts.push(`${r.duration}分钟`);
    if (r.amount) parts.push(`${r.amount}ml`);
    return parts.filter(Boolean).join(' ');
  }
  if (r.type === 'sleep') {
    return `${r.startTime || ''}-${r.endTime || ''} (${r.quality || ''})`;
  }
  // diaper
  const parts = [r.diaperType];
  if (r.status && r.status !== '正常') parts.push(r.status);
  return parts.filter(Boolean).join(' ');
}

function extractDateFromTime(timeStr: string): string {
  if (!timeStr) return new Date().toISOString().slice(0, 10);
  if (timeStr.includes('T')) return timeStr.split('T')[0];
  if (timeStr.includes(' ')) return timeStr.split(' ')[0];
  return new Date().toISOString().slice(0, 10);
}

// ==================== 主组件 ====================

function StatsPage() {
  const { currentStage, setStage } = useStageStore();

  // ===== 数据源 =====
  const [unifiedRecords, setUnifiedRecords] = useState<UnifiedRecord[]>([]);
  const [oldRecords, setOldRecords] = useState<OldLocalRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 合并后的全部记录
  const allRecords = useMemo(() => {
    const convertedOld = convertOldToUnified(oldRecords);
    // 新格式优先：如果某条旧记录的id在新格式中已存在则跳过
    const newIds = new Set(unifiedRecords.map(r => r.id));
    const uniqueOld = convertedOld.filter(r => !newIds.has(r.id));
    return [...unifiedRecords, ...uniqueOld].sort((a, b) =>
      (b.date + b.time).localeCompare(a.date + a.time)
    );
  }, [unifiedRecords, oldRecords]);

  // ===== 加载数据 =====
  useEffect(() => {
    try {
      const unified = loadUnifiedRecords();
      setUnifiedRecords(unified);

      // 尝试读取旧格式
      const oldRaw = localStorage.getItem(OLD_RECORDS_KEY);
      if (oldRaw) {
        setOldRecords(JSON.parse(oldRaw) as OldLocalRecord[]);
      }

      // 也尝试从 storage 工具读取旧 records
      const legacyRecs = storage.get<OldLocalRecord[]>('records');
      if (legacyRecs && legacyRecs.length > 0) {
        setOldRecords(prev => prev.length > 0 ? prev : legacyRecs);
      }
    } catch (e) {
      console.error('加载统计数据失败:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // 当前阶段配置
  const currentStageConfig = _STAGE_LIST.find(s => s.key === currentStage)!;
  const currentFields = (_RECORD_FIELDS_CONFIG as any)[currentStage] ?? [];
  const theme = (STAGE_THEME as any)[currentStage];
  const stageHint = STAGE_HINTS[currentStage];

  // ===== 今日统计 =====
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stageRecords = allRecords.filter(r => r.stage === currentStage && r.date === today);

    return currentFields.map((field: RecordFieldMeta) => {
      const fieldRecords = stageRecords.filter(r => r.category === field.key);

      // 对于 select 类型，计算各选项的次数
      let optionCounts: Record<string, number> | null = null;
      if (field.inputType === 'select' && field.options) {
        optionCounts = {};
        field.options.forEach(opt => optionCounts![opt] = 0);
        fieldRecords.forEach(r => {
          const val = String(r.value);
          if (optionCounts!.hasOwnProperty(val)) optionCounts![val]++;
          else optionCounts![val] = (optionCounts![val] || 0) + 1;
        });
      }

      // 对于 number 类型，累加数值（用于体重、胎动等）
      let totalValue = 0;
      if (field.inputType === 'number') {
        fieldRecords.forEach(r => {
          const num = Number(r.value);
          if (!isNaN(num)) totalValue += num;
        });
      }

      // 获取第一条记录的value作为最新值
      const latestRecord = fieldRecords[0];
      let latestValue: string | number | null = null;
      if (latestRecord) {
        if (field.inputType === 'number') {
          latestValue = Number(latestRecord.value);
        } else {
          latestValue = latestRecord.value;
        }
      }

      return {
        ...field,
        count: fieldRecords.length,
        optionCounts,
        totalValue,
        latestValue,
        hasToday: fieldRecords.length > 0,
        records: fieldRecords,
      };
    });
  }, [currentStage, allRecords, currentFields]);

  // 本阶段总记录数
  const stageTotalCount = useMemo(() =>
    allRecords.filter(r => r.stage === currentStage).length,
    [allRecords, currentStage]
  );

  // ===== 近7天趋势数据 =====
  const trendData = useMemo(() => {
    const days: Array<{ date: string; label: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const count = allRecords.filter(r => r.stage === currentStage && r.date === dateStr).length;
      days.push({ date: dateStr, label, count });
    }
    return days;
  }, [allRecords, currentStage]);

  const maxTrendCount = Math.max(...trendData.map(d => d.count), 1);

  // ===== 各项详细统计 =====
  const detailStats = useMemo(() => {
    const stageRecords = allRecords.filter(r => r.stage === currentStage);

    return currentFields.map((field: RecordFieldMeta) => {
      const catRecords = stageRecords.filter(r => r.category === field.key);
      const total = catRecords.length;

      let avgValue: number | null = null;
      let optionDistribution: Array<{ label: string; count: number; percent: number }> | null = null;

      if (total > 0) {
        if (field.inputType === 'number') {
          const nums = catRecords.map(r => Number(r.value)).filter(n => !isNaN(n));
          if (nums.length > 0) {
            avgValue = nums.reduce((a, b) => a + b, 0) / nums.length;
          }
        }

        if (field.inputType === 'select' && field.options) {
          const counts: Record<string, number> = {};
          field.options.forEach((opt: string) => counts[opt] = 0);
          catRecords.forEach(r => {
            const val = String(r.value);
            if (counts.hasOwnProperty(val)) counts[val]++;
            else counts[val] = (counts[val] || 0) + 1;
          });
          optionDistribution = Object.entries(counts)
            .map(([label, count]) => ({ label, count, percent: total > 0 ? (count / total) * 100 : 0 }))
            .filter(d => d.count > 0)
            .sort((a, b) => b.count - a.count);
        }
      }

      // 计算连续记录天数（针对 select 类型的"正向选项"）
      let streakDays = 0;
      if (field.inputType === 'select' && field.options && field.options.length > 0) {
        const positiveOption = field.options[0]; // 默认第一个为正向
        const dates = [...new Set(catRecords.filter(r => String(r.value) === positiveOption).map(r => r.date))]
          .sort().reverse();
        if (dates.length > 0) {
          streakDays = 1;
          for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) streakDays++;
            else break;
          }
        }
      }

      return {
        ...field,
        total,
        latestValue: catRecords[0]?.value ?? null,
        avgValue,
        optionDistribution,
        streakDays,
      };
    });
  }, [allRecords, currentStage, currentFields]);

  // ===== 时间轴（最近20条） =====
  const timelineRecords = useMemo(() =>
    allRecords
      .filter(r => r.stage === currentStage)
      .slice(0, 20),
    [allRecords, currentStage]
  );

  // 获取字段元信息
  const getFieldMeta = useCallback((category: string): RecordFieldMeta | undefined => {
    for (const fields of Object.values(_RECORD_FIELDS_CONFIG)) {
      const found = fields.find(f => f.key === category);
      if (found) return found;
    }
    return undefined;
  }, []);

  // ===== 导出报告 =====
  const exportReport = useCallback(() => {
    if (allRecords.length === 0) {
      toast.error('没有可导出的数据');
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const stageName = currentStageConfig.name;

    const lines: string[] = [
      `# ${stageName}统计报告`,
      ``,
      `> 导出时间：${now.toLocaleString('zh-CN')}`,
      `> 数据总量：${stageTotalCount} 条记录`,
      `> 阶段：${currentStageConfig.icon} ${stageName}`,
      ``,
      `---`,
      ``,
      `## 今日统计`,
    ];

    if (todayStats.length > 0) {
      todayStats.forEach((s: any) => {
        lines.push(`- ${s.icon} **${s.name}**：${s.count > 0 ? `${s.count}次 · 最新值：${s.latestValue}` : '暂无记录'}`);
      });
    } else {
      lines.push('- 暂无今日记录');
    }

    lines.push('', `## 近7天趋势`, '');
    trendData.forEach((d: any) => {
      lines.push(`| ${d.label} | ${d.count} 条 |`);
    });

    lines.push('', `## 各项详细统计`, '');
    detailStats.forEach((s: any) => {
      lines.push(`### ${s.icon} ${s.name}`, '', `- 总记录数：${s.total}`);
      if (s.latestValue !== null) lines.push(`- 最新值：${s.latestValue}`);
      if (s.avgValue !== null) lines.push(`- 平均值：${s.avgValue.toFixed(2)}${s.unit || ''}`);
      if (s.optionDistribution) {
        lines.push('- 分布情况：');
        s.optionDistribution.forEach((o: any) => {
          lines.push(`  - ${o.label}：${o.count}次 (${o.percent.toFixed(1)}%)`);
        });
      }
      if (s.streakDays > 0) lines.push(`- 最近连续：${s.streakDays}天`);
      lines.push('');
    });

    lines.push(`## 最近记录`, '');
    timelineRecords.slice(0, 30).forEach(r => {
      const meta = getFieldMeta(r.category);
      lines.push(
        `- **[${r.date} ${r.time}]** ${meta?.icon || ''} **${meta?.name || r.category}**：${r.value}${r.note ? ` （${r.note}）` : ''}`
      );
    });

    lines.push('', `---`, '', `_由吾滴孩儿 App 自动生成_`);

    const report = lines.join('\n');
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `吾滴孩儿_${stageName}_统计报告_${today}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('统计报告已导出！');
  }, [allRecords, currentStageConfig, stageTotalCount, todayStats, trendData, detailStats, timelineRecords, getFieldMeta]);

  // ===== 渲染辅助 =====

  const stageBtnClass = (stage: StageKey) =>
    `flex-1 py-3 rounded-xl flex flex-col items-center transition-all duration-300 ${
      currentStage === stage
        ? 'shadow-lg scale-[1.03]'
        : 'opacity-70 hover:opacity-100'
    }`;

  // ==================== JSX ====================

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div
        className="px-6 py-8 text-center shadow-sm"
        style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div></div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>统计分析</h1>
          <button
            onClick={exportReport}
            className="px-3 py-1.5 bg-white/40 backdrop-blur rounded-lg text-xs font-medium hover:bg-white/60 transition-all"
            title="导出统计报告"
          >
            导出
          </button>
        </div>
        <p className="text-sm opacity-80 mt-1">
          {loaded
            ? `基于 ${allRecords.filter(r => r.stage === currentStage).length} 条${currentStageConfig.name}记录分析`
            : '正在加载数据...'}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ========== 阶段选择器 ========== */}
        <div className="flex gap-3 bg-white rounded-2xl p-2 shadow-lg">
          {_STAGE_LIST.map(stage => (
            <button
              key={stage.key}
              onClick={() => setStage(stage.key)}
              className={stageBtnClass(stage.key)}
              style={currentStage === stage.key ? {
                background: `linear-gradient(135deg, ${STAGE_THEME[stage.key].gradientFrom}, ${STAGE_THEME[stage.key].gradientTo})`,
              } : {}}
            >
              <span className="text-2xl mb-1">{stage.icon}</span>
              <span className={`text-xs font-medium ${
                currentStage === stage.key ? STAGE_THEME[stage.key].text : 'text-text-secondary'
              }`}>
                {stage.name}
              </span>
            </button>
          ))}
        </div>

        {/* ========== 今日统计卡片 ========== */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">今日统计</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-secondary">
              本阶段共 {stageTotalCount} 条
            </span>
          </div>
          {todayStats.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {todayStats.map((stat: any, idx: number) => (
                <div
                  key={stat.key}
                  className={`${(STAGE_THEME as any)[currentStage].bg} rounded-2xl p-4 border border-white/60 shadow-sm animate-fadeInUp`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{stat.icon}</span>
                    <span className="text-xs text-text-secondary font-medium truncate">{stat.name}</span>
                    {stat.hasToday && (
                      <span className={`ml-auto w-2 h-2 rounded-full ${(STAGE_THEME as any)[currentStage].accent}`} />
                    )}
                  </div>
                  {stat.hasToday ? (
                    <>
                      <div className="flex items-baseline mb-1">
                        <span className="text-2xl font-bold text-text-primary">{stat.count}</span>
                        <span className="text-xs text-text-secondary ml-1">次</span>
                      </div>
                      {/* Select 类型显示选项分布 */}
                      {stat.optionCounts && Object.values(stat.optionCounts as Record<string, number>).some((v: number) => v > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(stat.optionCounts as Record<string, number>)
                            .filter(([, count]: [string, number]) => count > 0)
                            .map(([opt, count]: [string, number]) => (
                              <span key={opt} className="text-[10px] px-1.5 py-0.5 bg-white/60 rounded-full text-text-secondary">
                                {opt}x{count}
                              </span>
                            ))}
                        </div>
                      )}
                      {/* Number 类型显示累计值 */}
                      {stat.totalValue > 0 && stat.unit && (
                        <p className="text-xs text-text-light">
                          累计：{stat.totalValue}{stat.unit}
                        </p>
                      )}
                      {stat.latestValue != null && !stat.optionCounts && !stat.unit && (
                        <p className="text-xs text-text-light truncate">最新：{String(stat.latestValue)}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-text-light">-</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-3xl mb-2"></p>
              <p className="text-text-light text-sm">当前阶段暂无可记录项</p>
            </div>
          )}
        </div>

        {/* ========== 趋势图表（近7天柱状图）========== */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">阶段趋势（近7天）</h2>
          <div className="flex items-end justify-between h-36 gap-1.5 bg-gray-50/80 rounded-xl p-3">
            {trendData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <span className={`text-[11px] font-medium mb-1 transition-colors ${
                  day.count > 0 ? 'text-text-primary' : 'text-text-light'
                }`}>
                  {day.count}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-500 hover:opacity-80 cursor-default"
                  style={{
                    height: `${Math.max((day.count / maxTrendCount) * 100, day.count > 0 ? 6 : 2)}%`,
                    background: `linear-gradient(to top, ${theme.gradientTo}, ${theme.gradientFrom})`,
                    minHeight: day.count > 0 ? '8px' : '3px',
                  }}
                  title={`${day.label}: ${day.count}条记录`}
                />
                <span className="text-[10px] text-text-light mt-1.5">{day.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary text-center mt-3">
            日均 {trendData.length > 0 ? (trendData.reduce((s, d) => s + d.count, 0) / 7).toFixed(1) : 0} 条记录
          </p>
        </div>

        {/* ========== 各项详细统计 ========== */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">各项详细统计</h2>
          <div className="space-y-4">
            {detailStats.length > 0 ? detailStats.map((stat: any, _idx: number) => (
              <div
                key={stat.key}
                className={`${(STAGE_THEME as any)[currentStage].bg} rounded-2xl p-4 border border-white/60`}
              >
                {/* 标题行 */}
                <div className="flex items-center mb-3">
                  <span className="text-xl mr-2">{stat.icon}</span>
                  <span className={`font-semibold ${theme.text}`}>{stat.name}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 bg-white/60 rounded-full text-text-secondary">
                    共 {stat.total} 条
                  </span>
                </div>

                {/* 数值信息 */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {stat.latestValue != null && (
                    <div className="bg-white/50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-text-secondary">最新值</p>
                      <p className="text-base font-bold text-text-primary truncate">{String(stat.latestValue)}{stat.unit || ''}</p>
                    </div>
                  )}
                  {stat.avgValue != null && (
                    <div className="bg-white/50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-text-secondary">平均值</p>
                      <p className="text-base font-bold text-text-primary">{stat.avgValue.toFixed(2)}<span className="text-[10px] ml-0.5">{stat.unit || ''}</span></p>
                    </div>
                  )}
                  {!stat.latestValue && stat.total > 0 && (
                    <div className="bg-white/50 rounded-xl p-2.5 text-center col-span-2">
                      <p className="text-[10px] text-text-secondary">最新记录</p>
                      <p className="text-sm text-text-primary truncate">文本类记录</p>
                    </div>
                  )}
                  {stat.total === 0 && (
                    <div className="bg-white/30 rounded-xl p-2.5 text-center col-span-2">
                      <p className="text-sm text-text-light">暂无记录</p>
                    </div>
                  )}
                </div>

                {/* Select 类型分布 */}
                {stat.optionDistribution && stat.optionDistribution.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-text-secondary font-medium">分布占比</p>
                    {stat.optionDistribution.map((opt: any, oi: number) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span className="text-[11px] text-text-secondary w-16 flex-shrink-0 truncate">{opt.label}</span>
                        <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${(STAGE_THEME as any)[currentStage].accent}`}
                            style={{ width: `${opt.percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-text-secondary w-16 text-right flex-shrink-0">
                          {opt.count}次 ({opt.percent.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 连续天数 */}
                {stat.streakDays > 1 && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white/60 rounded-lg">
                    <span className="text-xs">最近连续：</span>
                    <span className="text-xs font-bold text-green-600">{stat.streakDays} 天</span>
                    <span className="text-xs"></span>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-text-light text-sm">当前阶段暂无统计项</p>
              </div>
            )}
          </div>
        </div>

        {/* ========== 时间轴 ========== */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">时间轴</h2>
            <span className="text-xs text-text-light">最近 {timelineRecords.length} 条</span>
          </div>
          <div className="space-y-2.5">
            {timelineRecords.length > 0 ? timelineRecords.map((rec: UnifiedRecord, idx: number) => {
              const meta = getFieldMeta(rec.category);
              // 判断是否需要显示日期分隔线（前一条记录日期不同时）
              const prevRec = idx > 0 ? timelineRecords[idx - 1] : null;
              const showDateDivider = !prevRec || prevRec.date !== rec.date;

              return (
                <div key={rec.id}>
                  {showDateDivider && (
                    <div className="flex items-center gap-2 my-3 first:mt-0">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[11px] text-text-light px-2">{rec.date}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div
                    className="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-all animate-fadeInUp"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {/* 时间列 */}
                    <div className="flex-shrink-0 w-14 text-right">
                      <p className="text-[11px] text-text-secondary font-medium">{rec.time || '--:--'}</p>
                    </div>

                    {/* 图标圆点 */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">{meta?.icon || ''}</span>
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {meta?.name || rec.category}
                      </p>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{String(rec.value)}</p>
                      {rec.note && (
                        <p className="text-[11px] text-text-light truncate mt-0.5 italic">{rec.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10">
                <p className="text-4xl mb-3"></p>
                <p className="text-text-light mb-4">当前阶段还没有记录</p>
                {/* 阶段提示信息 */}
                {stageHint && (
                  <div className="bg-gray-50 rounded-xl p-4 text-left">
                    <p className="text-sm font-medium text-text-primary mb-2">{stageHint.title}</p>
                    <ul className="space-y-1">
                      {stageHint.items.map((item, i) => (
                        <li key={i} className="text-xs text-text-secondary">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-text-light mt-4">去记录页面添加第一条吧~</p>
              </div>
            )}
          </div>
        </div>

        {/* ========== 导出按钮（底部固定） ========== */}
        <button
          onClick={exportReport}
          className={`w-full py-4 rounded-2xl text-white font-semibold shadow-lg active:scale-[0.98] transition-all`}
          style={{ background: `linear-gradient(135deg, ${theme.gradientFrom.replace('#', '') ? theme.gradientTo : '#667eea'}, ${theme.gradientFrom})` }}
        >
          导出 {currentStageConfig.name} 统计报告
        </button>
      </div>
    </div>
  );
}

export default StatsPage;
