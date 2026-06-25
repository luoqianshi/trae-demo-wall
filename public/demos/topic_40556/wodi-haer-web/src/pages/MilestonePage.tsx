import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBabyStore } from '../store';
import { storage } from '../utils/storage';

// ==================== 类型定义 ====================

interface MilestoneRecord {
  milestoneId: string;
  domain: string;
  achieved: boolean;
  achievedDate?: string;
}

interface Milestone {
  id: string;
  name: string;
  domain: 'motor' | 'fine' | 'language' | 'social' | 'cognitive' | 'physical' | 'self_care' | 'visual';
  monthRange: [number, number];
  description?: string;
}

interface MilestoneGroup {
  range: string;
  months: [number, number];
  milestones: Milestone[];
}

const MILESTONES_KEY = 'wdhr_milestones';

// ==================== 内置里程碑数据 ====================

const MILESTONE_GROUPS: MilestoneGroup[] = [
  {
    range: '0-1月',
    months: [0, 1],
    milestones: [
      { id: 'lift_head_45', name: '俯卧抬头45°', domain: 'motor', monthRange: [0, 1], description: '趴着时能短暂抬起头' },
      { id: 'follow_gaze', name: '视线跟随', domain: 'visual', monthRange: [0, 1], description: '眼睛能跟随移动的物体' },
      { id: 'spontaneous_smile', name: '自发微笑', domain: 'social', monthRange: [0, 1], description: '会自发地微笑' },
      { id: 'grasp_reflex', name: '握拳反射', domain: 'fine', monthRange: [0, 1], description: '手会自动握拳' },
    ],
  },
  {
    range: '2-3月',
    months: [2, 3],
    milestones: [
      { id: 'lift_head_90', name: '俯卧抬头90°', domain: 'motor', monthRange: [2, 3], description: '趴着时能抬起头胸部离开床面' },
      { id: 'roll_side', name: '翻身(仰→侧)', domain: 'motor', monthRange: [2, 3], description: '能从仰卧翻到侧卧' },
      { id: 'cooing', name: '咿呀发声', domain: 'language', monthRange: [2, 3], description: '会发出"咿呀"的声音' },
      { id: 'grasp_object', name: '抓握物体', domain: 'fine', monthRange: [2, 3], description: '手能主动抓握物品' },
    ],
  },
  {
    range: '4-6月',
    months: [4, 6],
    milestones: [
      { id: 'sit_alone', name: '独坐', domain: 'motor', monthRange: [5, 6], description: '不需要支撑能独立坐稳' },
      { id: 'roll_over', name: '翻身(仰→俯)', domain: 'motor', monthRange: [4, 5], description: '能从仰卧翻到俯卧' },
      { id: 'stranger_anxiety', name: '认生', domain: 'social', monthRange: [5, 6], description: '开始认生，对陌生人表现出不安' },
      { id: 'reach_grab', name: '伸手抓物', domain: 'fine', monthRange: [4, 5], description: '看到物品会伸手去抓' },
      { id: 'teething', name: '出牙', domain: 'physical', monthRange: [5, 7], description: '开始萌出第一颗乳牙' },
    ],
  },
  {
    range: '7-9月',
    months: [7, 9],
    milestones: [
      { id: 'crawling', name: '爬行', domain: 'motor', monthRange: [7, 9], description: '用手和膝盖爬行' },
      { id: 'stand_support', name: '扶站', domain: 'motor', monthRange: [8, 9], description: '扶着家具或大人能站立' },
      { id: 'mama_dada', name: '叫"妈妈""爸爸"', domain: 'language', monthRange: [8, 10], description: '有意识地叫"妈妈"或"爸爸"' },
      { id: 'pincer_grasp', name: '拇指食指捏取', domain: 'fine', monthRange: [9, 11], description: '能用拇指和食指捏起小物品' },
    ],
  },
  {
    range: '10-12月',
    months: [10, 12],
    milestones: [
      { id: 'stand_alone', name: '独站片刻', domain: 'motor', monthRange: [11, 12], description: '不扶东西能独自站立几秒' },
      { id: 'walk_support', name: '扶走', domain: 'motor', monthRange: [11, 13], description: '扶着家具或大人手走路' },
      { id: 'call_intentionally', name: '有意识叫人', domain: 'language', monthRange: [11, 13], description: '有目的地叫特定的人' },
      { id: 'place_cup', name: '放杯子不洒', domain: 'fine', monthRange: [12, 14], description: '能把杯子放在桌上而不洒出' },
    ],
  },
  {
    range: '13-18月',
    months: [13, 18],
    milestones: [
      { id: 'walk_alone', name: '独走', domain: 'motor', monthRange: [12, 15], description: '能独立行走' },
      { id: 'run_unsteady', name: '跑不稳', domain: 'motor', monthRange: [16, 18], description: '尝试跑步但不太稳' },
      { id: 'say_words', name: '说10个词以上', domain: 'language', monthRange: [15, 18], description: '能说10个以上的单词' },
      { id: 'stack_blocks', name: '叠积木2-6块', domain: 'fine', monthRange: [15, 18], description: '能叠起2-6块积木' },
    ],
  },
  {
    range: '19-24月',
    months: [19, 24],
    milestones: [
      { id: 'jump_two_feet', name: '双脚跳', domain: 'motor', monthRange: [22, 24], description: '能双脚同时跳离地面' },
      { id: 'run_steady', name: '跑步稳', domain: 'motor', monthRange: [20, 24], description: '跑得比较稳定了' },
      { id: 'say_sentences', name: '说短句', domain: 'language', monthRange: [20, 24], description: '能说2-3个词组成的短句' },
      { id: 'draw_lines', name: '画线条', domain: 'fine', monthRange: [20, 24], description: '能用笔在纸上画线条' },
      { id: 'eat_self', name: '自己吃饭', domain: 'self_care', monthRange: [18, 24], description: '能自己用勺子吃饭' },
    ],
  },
  {
    range: '25-30月',
    months: [25, 30],
    milestones: [
      { id: 'stand_one_foot', name: '单脚站立', domain: 'motor', monthRange: [28, 30], description: '能单脚站立2秒以上' },
      { id: 'catch_ball', name: '接球', domain: 'motor', monthRange: [26, 30], description: '能接住大球' },
      { id: 'long_sentences', name: '说长句', domain: 'language', monthRange: [26, 30], description: '能说出较长的句子' },
      { id: 'know_colors', name: '认识颜色形状', domain: 'cognitive', monthRange: [27, 30], description: '能认识基本的颜色和形状' },
    ],
  },
  {
    range: '31-36月',
    months: [31, 36],
    milestones: [
      { id: 'ride_tricycle', name: '骑三轮车', domain: 'motor', monthRange: [32, 36], description: '能骑三轮车' },
      { id: 'count_1_10', name: '数数1-10', domain: 'cognitive', monthRange: [33, 36], description: '能从1数到10' },
      { id: 'conversation', name: '简单对话', domain: 'language', monthRange: [33, 36], description: '能进行简单的对话交流' },
      { id: 'dress_self', name: '独立穿衣', domain: 'self_care', monthRange: [34, 36], description: '能在帮助下自己穿脱衣服' },
    ],
  },
];

// 领域配置
const DOMAIN_CONFIG = {
  motor: { label: '大运动', icon: '🏃', color: 'blue' },
  fine: { label: '精细动作', icon: '✋', color: 'purple' },
  language: { label: '语言能力', icon: '💬', color: 'green' },
  social: { label: '社交认知', icon: '👶', color: 'pink' },
  visual: { label: '视觉发育', icon: '👀', color: 'yellow' },
  physical: { label: '身体发育', icon: '💪', color: 'orange' },
  cognitive: { label: '认知能力', icon: '🧠', color: 'indigo' },
  self_care: { label: '生活自理', icon: '🍽️', color: 'teal' },
};

// 育儿建议
const PARENTING_TIPS: Record<string, string[]> = {
  '0-3': [
    '多与宝宝进行眼神交流和说话',
    '每天安排适量的tummy time（俯卧时间）',
    '提供色彩鲜艳的玩具刺激视觉发育',
    '保持规律的作息时间',
  ],
  '4-6': [
    '鼓励宝宝翻身和练习坐',
    '提供安全的探索环境',
    '开始添加辅食，注意食物过敏',
    '多读绘本，培养阅读习惯',
  ],
  '7-9': [
    '创造安全的空间让宝宝爬行',
    '教宝宝挥手再见、拍手等社交动作',
    '提供不同材质的玩具促进触觉发展',
    '开始建立规律的睡眠习惯',
  ],
  '10-12': [
    '鼓励宝宝扶站和学步',
    '使用简单清晰的语言和宝宝对话',
    '让宝宝尝试自己拿勺子吃饭',
    '读绘本时让宝宝参与指认',
  ],
  '13-18': [
    '为宝宝创造安全的活动空间',
    '鼓励宝宝用语言表达需求',
    '一起玩积木、拼图等益智玩具',
    '建立规律的一日作息',
  ],
  '19-24': [
    '鼓励宝宝跑跳等大运动发展',
    '多问开放性问题激发语言表达',
    '让宝宝参与简单的家务活动',
    '培养如厕训练的意识',
  ],
  '25-36': [
    '鼓励宝宝参加集体游戏活动',
    '培养宝宝的独立性',
    '通过角色扮演游戏促进社交能力',
    '建立良好的生活习惯和规则意识',
  ],
};

// 发育预警信号
const WARNING_SIGNALS = [
  { signal: '3个月不会抬头', severity: 'high', action: '及时就医检查' },
  { signal: '6个月不会翻身', severity: 'high', action: '咨询儿科医生' },
  { signal: '8个月不会独坐', severity: 'medium', action: '关注大运动发育' },
  { signal: '12个月还不会爬', severity: 'medium', action: '评估运动发育' },
  { signal: '18个月不会走', severity: 'high', action: '尽快就医检查' },
  { signal: '2岁不会说短语', severity: 'high', action: '评估语言发育' },
  { signal: '3岁不能简单对话', severity: 'high', action: '寻求专业帮助' },
  { signal: '任何年龄出现技能倒退', severity: 'urgent', action: '立即就医' },
];

// ==================== 工具函数 ====================

function getBabyMonthAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function loadMilestoneRecords(): MilestoneRecord[] {
  try {
    return storage.get<MilestoneRecord[]>(MILESTONES_KEY) || [];
  } catch {
    return [];
  }
}

function saveMilestoneRecords(records: MilestoneRecord[]) {
  storage.set(MILESTONES_KEY, records);
}

// ==================== 主组件 ====================

function MilestonePage() {
  const { baby } = useBabyStore();
  const [records, setRecords] = useState<MilestoneRecord[]>(() => loadMilestoneRecords());
  const [showWarnings, setShowWarnings] = useState(false);

  // 计算宝宝当前月龄
  const babyMonthAge = useMemo(() => {
    if (!baby?.birthDate) return -1;
    return getBabyMonthAge(baby.birthDate);
  }, [baby?.birthDate]);

  // 获取当前月龄对应的育儿建议
  const currentTips = useMemo(() => {
    if (babyMonthAge < 0) return [];
    if (babyMonthAge <= 3) return PARENTING_TIPS['0-3'];
    if (babyMonthAge <= 6) return PARENTING_TIPS['4-6'];
    if (babyMonthAge <= 9) return PARENTING_TIPS['7-9'];
    if (babyMonthAge <= 12) return PARENTING_TIPS['10-12'];
    if (babyMonthAge <= 18) return PARENTING_TIPS['13-18'];
    if (babyMonthAge <= 24) return PARENTING_TIPS['19-24'];
    return PARENTING_TIPS['25-36'];
  }, [babyMonthAge]);

  // 切换里程碑状态
  const toggleMilestone = useCallback((milestoneId: string, domain: string) => {
    setRecords(prev => {
      const existing = prev.findIndex(r => r.milestoneId === milestoneId);
      let updated: MilestoneRecord[];

      if (existing >= 0) {
        updated = [...prev];
        const current = updated[existing].achieved;
        updated[existing] = {
          ...updated[existing],
          achieved: !current,
          achievedDate: !current ? new Date().toISOString().split('T')[0] : undefined,
        };
      } else {
        updated = [
          ...prev,
          {
            milestoneId,
            domain,
            achieved: true,
            achievedDate: new Date().toISOString().split('T')[0],
          },
        ];
      }

      saveMilestoneRecords(updated);

      // 显示toast提示
      const isAchieved = existing >= 0 ? !prev[existing].achieved : true;
      if (isAchieved) {
        toast.success('🎉 太棒了！新技能达成！');
      }

      return updated;
    });
  }, []);

  // 检查里程碑是否已达成
  const isAchieved = useCallback((milestoneId: string): boolean => {
    return records.some(r => r.milestoneId === milestoneId && r.achieved);
  }, [records]);

  // 计算各领域进度
  const domainProgress = useMemo(() => {
    const progress: Record<string, { total: number; achieved: number; percentage: number }> = {};

    MILESTONE_GROUPS.forEach(group => {
      group.milestones.forEach(m => {
        const domain = m.domain;
        if (!progress[domain]) {
          progress[domain] = { total: 0, achieved: 0, percentage: 0 };
        }
        progress[domain].total++;
        if (isAchieved(m.id)) {
          progress[domain].achieved++;
        }
      });
    });

    Object.keys(progress).forEach(domain => {
      const p = progress[domain];
      p.percentage = p.total > 0 ? Math.round((p.achieved / p.total) * 100) : 0;
    });

    return progress;
  }, [isAchieved]);

  // 总体统计
  const overallStats = useMemo(() => {
    let total = 0;
    let achieved = 0;

    MILESTONE_GROUPS.forEach(group => {
      group.milestones.forEach(m => {
        total++;
        if (isAchieved(m.id)) achieved++;
      });
    });

    return {
      total,
      achieved,
      percentage: total > 0 ? Math.round((achieved / total) * 100) : 0,
    };
  }, [isAchieved]);

  // 渲染领域图标和颜色
  const getDomainStyle = (domain: string) => {
    const config = DOMAIN_CONFIG[domain as keyof typeof DOMAIN_CONFIG] || { icon: '⭐', color: 'gray' };
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    return {
      ...config,
      className: colorMap[config.color] || colorMap.gray,
    };
  };

  // 判断是否在当前月龄范围内
  const isInCurrentRange = (months: [number, number]) => {
    if (babyMonthAge < 0) return false;
    return babyMonthAge >= months[0] && babyMonthAge <= months[1];
  };

  // 判断是否已过该阶段
  const isPastStage = (months: [number, number]) => {
    if (babyMonthAge < 0) return false;
    return babyMonthAge > months[1];
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-8 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">🏆 成长里程碑</h1>
        <p className="text-sm opacity-90">
          {baby ? `👶 ${baby.name} · 当前 ${babyMonthAge >= 0 ? babyMonthAge : '?'} 月龄` : '请先添加宝宝信息'}
        </p>

        {/* 月龄大卡片 */}
        <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
          <div className="text-6xl font-bold mb-2">{babyMonthAge >= 0 ? babyMonthAge : '?'}</div>
          <div className="text-lg opacity-90">月龄</div>
          <div className="mt-3 flex justify-center gap-6 text-sm">
            <div>
              <span className="text-2xl font-bold">{overallStats.achieved}</span>
              <span className="opacity-80 ml-1">/ {overallStats.total} 达成</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{overallStats.percentage}%</span>
              <span className="opacity-80 ml-1">完成</span>
            </div>
          </div>

          {/* 总体进度条 */}
          <div className="mt-4 bg-white/30 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${overallStats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 各领域进度 */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">📊 各领域发育进度</h2>
          <div className="space-y-3">
            {Object.entries(domainProgress).map(([domain, stats]) => {
              const style = getDomainStyle(domain);
              return (
                <div key={domain}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full border ${style.className}`}>
                      {style.icon} {style.label}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {stats.achieved}/{stats.total} ({stats.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.percentage === 100 ? 'bg-green-500' :
                        stats.percentage >= 50 ? 'bg-blue-500' : 'bg-orange-400'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 育儿建议 */}
        {currentTips.length > 0 && (
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">💡 {babyMonthAge}月龄育儿建议</h2>
            <ul className="space-y-2">
              {currentTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 里程碑列表 */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">📋 发育里程碑清单</h2>

          {MILESTONE_GROUPS.map(group => {
            const isCurrent = isInCurrentRange(group.months);
            const isPast = isPastStage(group.months);

            return (
              <div key={group.range} className={`card p-4 transition-all ${isCurrent ? 'ring-2 ring-ice-blue shadow-lg' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    📅 {group.range}
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full animate-pulse">
                        当前阶段
                      </span>
                    )}
                    {isPast && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        已过
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-text-light">
                    {group.milestones.filter(m => isAchieved(m.id)).length}/{group.milestones.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.milestones.map(milestone => {
                    const achieved = isAchieved(milestone.id);
                    const domainStyle = getDomainStyle(milestone.domain);

                    return (
                      <button
                        key={milestone.id}
                        onClick={() => toggleMilestone(milestone.id, milestone.domain)}
                        className={`w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                          achieved
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-white border-2 border-gray-200 hover:border-ice-blue hover:bg-soft-blue/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            achieved ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {achieved ? '✓' : (isInCurrentRange(group.months) ? '🔄' : '⬜')}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${achieved ? 'text-green-700 line-through' : 'text-text-primary'}`}>
                                {milestone.name}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${domainStyle.className}`}>
                                {domainStyle.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-text-light">
                                达成月龄：{milestone.monthRange[0]}-{milestone.monthRange[1]}月
                              </span>
                              {milestone.description && (
                                <span className="text-xs text-text-light">· {milestone.description}</span>
                              )}
                            </div>

                            {achieved && records.find(r => r.milestoneId === milestone.id)?.achievedDate && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ 达成于 {records.find(r => r.milestoneId === milestone.id)!.achievedDate!}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 发育预警信号 */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors"
          >
            <span className="font-semibold text-red-600 flex items-center gap-2">
              ⚠️ 发育预警信号
            </span>
            <span className={`transform transition-transform ${showWarnings ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showWarnings && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-red-500 mb-3">
                💗 如果宝宝出现以下情况，请及时咨询医生或专业机构
              </p>
              {WARNING_SIGNALS.map((warning, i) => (
                <div key={i} className={`p-3 rounded-lg border-l-4 ${
                  warning.severity === 'urgent' ? 'bg-red-50 border-red-500' :
                  warning.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                  'bg-yellow-50 border-yellow-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-text-primary">{warning.signal}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      warning.severity === 'urgent' ? 'bg-red-500 text-white' :
                      warning.severity === 'high' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {warning.severity === 'urgent' ? '紧急' : warning.severity === 'high' ? '重要' : '关注'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">建议：{warning.action}</p>
                </div>
              ))}

              <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                <p className="text-xs text-text-light text-center">
                  📞 如有疑虑，请咨询当地妇幼保健院或儿童发育专科医生<br/>
                  早发现、早干预是关键！
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MilestonePage;
