import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBabyStore } from '../store';
import { storage } from '../utils/storage';

// ==================== 类型定义 ====================

interface VaccineRecord {
  vaccineId: string;
  name: string;
  dose: number;
  scheduledMonth: number;
  actualDate?: string;
  status: 'done' | 'pending' | 'overdue';
  notes?: string;
}

interface VaccineSchedule {
  id: string;
  name: string;
  abbr: string;
  month: number;
  dose: number;
  totalDoses: number;
  preventDiseases: string[];
  precautions: string[];
  sideEffects: string[];
  nextDoseMonth?: number;
}

// ==================== 内置疫苗数据 ====================

const VACCINE_SCHEDULES: VaccineSchedule[] = [
  // 出生
  { id: 'bcg_1', name: '卡介苗', abbr: 'BCG', month: 0, dose: 1, totalDoses: 1, preventDiseases: ['结核病'], precautions: ['出生后尽快接种', '接种部位左上臂'], sideEffects: ['局部红肿', '脓疱形成（正常现象）'] },
  { id: 'hepb_1', name: '乙肝疫苗', abbr: 'HepB', month: 0, dose: 1, totalDoses: 3, preventDiseases: ['乙型肝炎'], precautions: ['出生后24小时内接种'], sideEffects: ['注射部位疼痛', '轻度发热'] },
  // 1月龄
  { id: 'hepb_2', name: '乙肝疫苗', abbr: 'HepB', month: 1, dose: 2, totalDoses: 3, preventDiseases: ['乙型肝炎'], precautions: ['间隔1个月'], sideEffects: ['注射部位疼痛', '轻度发热'], nextDoseMonth: 6 },
  // 2月龄
  { id: 'ipv_1', name: '脊灰疫苗', abbr: 'IPV', month: 2, dose: 1, totalDoses: 4, preventDiseases: ['脊髓灰质炎（小儿麻痹症）'], precautions: ['注射型脊灰疫苗'], sideEffects: ['注射部位红肿', '低热'], nextDoseMonth: 3 },
  { id: 'dtap_1', name: '百白破疫苗', abbr: 'DTaP', month: 2, dose: 1, totalDoses: 4, preventDiseases: ['百日咳', '白喉', '破伤风'], precautions: ['如有发热应推迟接种'], sideEffects: ['发热', '注射部位硬结', '烦躁哭闹'], nextDoseMonth: 3 },
  // 3月龄
  { id: 'ipv_2', name: '脊灰疫苗', abbr: 'IPV', month: 3, dose: 2, totalDoses: 4, preventDiseases: ['脊髓灰质炎'], precautions: ['间隔1个月'], sideEffects: ['注射部位红肿', '低热'], nextDoseMonth: 4 },
  { id: 'dtap_2', name: '百白破疫苗', abbr: 'DTaP', month: 3, dose: 2, totalDoses: 4, preventDiseases: ['百日咳', '白喉', '破伤风'], precautions: ['间隔1个月'], sideEffects: ['发热', '注射部位硬结'], nextDoseMonth: 4 },
  { id: 'pcv13_1', name: '肺炎疫苗', abbr: 'PCV13', month: 3, dose: 1, totalDoses: 4, preventDiseases: ['肺炎球菌感染（肺炎、脑膜炎、中耳炎）'], precautions: ['自费疫苗，建议接种'], sideEffects: ['发热', '注射部位红肿', '嗜睡'], nextDoseMonth: 4 },
  // 4月龄
  { id: 'ipv_3', name: '脊灰疫苗', abbr: 'IPV', month: 4, dose: 3, totalDoses: 4, preventDiseases: ['脊髓灰质炎'], precautions: ['第3剂基础免疫'], sideEffects: ['注射部位红肿', '低热'], nextDoseMonth: 18 },
  { id: 'dtap_3', name: '百白破疫苗', abbr: 'DTaP', month: 4, dose: 3, totalDoses: 4, preventDiseases: ['百日咳', '白喉', '破伤风'], precautions: ['第3剂基础免疫'], sideEffects: ['发热', '注射部位硬结'], nextDoseMonth: 5 },
  { id: 'pcv13_2', name: '肺炎疫苗', abbr: 'PCV13', month: 4, dose: 2, totalDoses: 4, preventDiseases: ['肺炎球菌感染'], precautions: ['间隔1个月'], sideEffects: ['发热', '注射部位红肿'], nextDoseMonth: 5 },
  // 5月龄
  { id: 'dtap_4', name: '百白破疫苗', abbr: 'DTaP', month: 5, dose: 4, totalDoses: 4, preventDiseases: ['百日咳', '白喉', '破伤风'], precautions: ['基础免疫最后一针'], sideEffects: ['发热', '注射部位硬结'], nextDoseMonth: 18 },
  { id: 'pcv13_3', name: '肺炎疫苗', abbr: 'PCV13', month: 5, dose: 3, totalDoses: 4, preventDiseases: ['肺炎球菌感染'], precautions: ['第3剂基础免疫'], sideEffects: ['发热', '注射部位红肿'], nextDoseMonth: 12 },
  // 6月龄
  { id: 'hepb_3', name: '乙肝疫苗', abbr: 'HepB', month: 6, dose: 3, totalDoses: 3, preventDiseases: ['乙型肝炎'], precautions: ['完成全程免疫'], sideEffects: ['注射部位疼痛', '轻度发热'] },
  { id: 'mena_1', name: '流脑A群疫苗', abbr: 'MenA', month: 6, dose: 1, totalDoses: 2, preventDiseases: ['流行性脑脊髓膜炎（A群）'], precautions: ['免费疫苗'], sideEffects: ['注射部位红肿', '低热'], nextDoseMonth: 9 },
  { id: 'rota', name: '轮状病毒疫苗', abbr: 'RV', month: 6, dose: 1, totalDoses: 3, preventDiseases: ['轮状病毒腹泻'], precautions: ['自费疫苗，口服', '6-32周龄内完成首剂'], sideEffects: ['轻度腹泻', '呕吐', '发热'], nextDoseMonth: 8 },
  // 8月龄
  { id: 'mmr_1', name: '麻腮风疫苗', abbr: 'MMR', month: 8, dose: 1, totalDoses: 2, preventDiseases: ['麻疹', '流行性腮腺炎', '风疹'], precautions: ['接种后避免剧烈运动', '8个月后可接种'], sideEffects: ['发热', '皮疹（轻微）', '腮腺肿大'], nextDoseMonth: 18 },
  { id: 'je_1', name: '乙脑疫苗(减毒活)', abbr: 'JE-L', month: 8, dose: 1, totalDoses: 2, preventDiseases: ['流行性乙型脑炎'], precautions: ['减毒活疫苗，免费'], sideEffects: ['注射部位红肿', '低热'], nextDoseMonth: 24 },
  // 9月龄
  { id: 'mena_2', name: '流脑A群疫苗', abbr: 'MenA', month: 9, dose: 2, totalDoses: 2, preventDiseases: ['流行性脑脊髓膜炎（A群）'], precautions: ['间隔3个月'], sideEffects: ['注射部位红肿', '低热'] },
  // 12月龄
  { id: 'vzv', name: '水痘疫苗', abbr: 'VZV', month: 12, dose: 1, totalDoses: 2, preventDiseases: ['水痘'], precautions: ['自费疫苗，强烈推荐'], sideEffects: ['发热', '皮疹（少数）', '注射部位疼痛'], nextDoseMonth: 48 },
  { id: 'pcv13_4', name: '肺炎疫苗(加强)', abbr: 'PCV13', month: 12, dose: 4, totalDoses: 4, preventDiseases: ['肺炎球菌感染'], precautions: ['加强免疫'], sideEffects: ['发热', '注射部位红肿'] },
  // 18月龄
  { id: 'dtap_boost', name: '百白破疫苗(加强)', abbr: 'DTaP', month: 18, dose: 5, totalDoses: 4, preventDiseases: ['百日咳', '白喉', '破伤风'], precautions: ['加强免疫'], sideEffects: ['发热', '注射部位硬结'] },
  { id: 'mmr_2', name: '麻腮风疫苗(加强)', abbr: 'MMR', month: 18, dose: 2, totalDoses: 2, preventDiseases: ['麻疹', '流行性腮腺炎', '风疹'], precautions: ['加强免疫'], sideEffects: ['发热', '皮疹（轻微）'] },
  { id: 'hepa', name: '甲肝疫苗', abbr: 'HepA', month: 18, dose: 1, totalDoses: 2, preventDiseases: ['甲型肝炎'], precautions: ['减毒活疫苗或灭活疫苗均可'], sideEffects: ['注射部位疼痛', '轻度发热'], nextDoseMonth: 24 },
  // 2岁 (24月)
  { id: 'je_2', name: '乙脑疫苗(加强)', abbr: 'JE-L', month: 24, dose: 2, totalDoses: 2, preventDiseases: ['流行性乙型脑炎'], precautions: ['加强免疫，2周岁时接种'], sideEffects: ['注射部位红肿', '低热'] },
  { id: 'menac', name: '流脑AC结合疫苗', abbr: 'MenAC', month: 24, dose: 1, totalDoses: 1, preventDiseases: ['流行性脑脊髓膜炎（A+C群）'], precautions: ['自费疫苗，推荐接种'], sideEffects: ['注射部位红肿', '低热'] },
  { id: 'hepa_2', name: '甲肝疫苗(加强)', abbr: 'HepA', month: 24, dose: 2, totalDoses: 2, preventDiseases: ['甲型肝炎'], precautions: ['如使用灭活疫苗需接种2剂'], sideEffects: ['注射部位疼痛', '轻度发热'] },
  // 3岁 (36月)
  { id: 'menac_boost', name: '流脑AC加强疫苗', abbr: 'MenAC', month: 36, dose: 2, totalDoses: 2, preventDiseases: ['流行性脑脊髓膜炎（A+C群）'], precautions: ['3岁时加强接种'], sideEffects: ['注射部位红肿', '低热'] },
];

const VACCINES_KEY = 'wdhr_vaccines';

// ==================== 工具函数 ====================

function getBabyMonthAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function loadVaccineRecords(): VaccineRecord[] {
  try {
    return storage.get<VaccineRecord[]>(VACCINES_KEY) || [];
  } catch {
    return [];
  }
}

function saveVaccineRecords(records: VaccineRecord[]) {
  storage.set(VACCINES_KEY, records);
}

// ==================== 主组件 ====================

function VaccinePage() {
  const { baby } = useBabyStore();
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [records, setRecords] = useState<VaccineRecord[]>(() => loadVaccineRecords());
  const [showDetail, setShowDetail] = useState<VaccineSchedule | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [confirmVaccine, setConfirmVaccine] = useState<VaccineSchedule | null>(null);

  // 计算宝宝当前月龄
  const babyMonthAge = useMemo(() => {
    if (!baby?.birthDate) return -1;
    return getBabyMonthAge(baby.birthDate);
  }, [baby?.birthDate]);

  // 获取当前选中月份的疫苗列表
  const vaccinesAtSelectedMonth = useMemo(() => {
    return VACCINE_SCHEDULES.filter(v => v.month === selectedMonth);
  }, [selectedMonth]);

  // 获取疫苗状态
  const getVaccineStatus = useCallback((vaccine: VaccineSchedule): VaccineRecord['status'] => {
    const record = records.find(r => r.vaccineId === vaccine.id);
    if (record) return record.status;

    if (babyMonthAge < 0) return 'pending';
    if (babyMonthAge >= vaccine.month + 2) return 'overdue'; // 超过推荐月龄2个月视为过期
    return 'pending';
  }, [records, babyMonthAge]);

  // 统计数据
  const stats = useMemo(() => {
    const doneCount = records.filter(r => r.status === 'done').length;
    const overdueCount = records.filter(r => r.status === 'overdue').length;
    const pendingCount = VACCINE_SCHEDULES.length - doneCount - overdueCount;
    const rate = VACCINE_SCHEDULES.length > 0 ? Math.round((doneCount / VACCINE_SCHEDULES.length) * 100) : 0;
    return { done: doneCount, pending: pendingCount, overdue: overdueCount, rate };
  }, [records]);

  // 标记已接种
  const markAsDone = useCallback((vaccine: VaccineSchedule) => {
    const today = new Date().toISOString().split('T')[0];
    setRecords(prev => {
      const existing = prev.findIndex(r => r.vaccineId === vaccine.id);
      let updated: VaccineRecord[];

      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          status: 'done',
          actualDate: today,
        };
      } else {
        updated = [
          ...prev,
          {
            vaccineId: vaccine.id,
            name: vaccine.name,
            dose: vaccine.dose,
            scheduledMonth: vaccine.month,
            actualDate: today,
            status: 'done',
          },
        ];
      }

      saveVaccineRecords(updated);
      return updated;
    });

    toast.success(`✅ ${vaccine.name} 第${vaccine.dose}针 已标记为已接种！`);
    setConfirmVaccine(null);
  }, []);

  // 月龄选项 (0-36月)
  const monthOptions = useMemo(() => {
    const options: { value: number; label: string }[] = [{ value: -1, label: '全部' }];
    for (let i = 0; i <= 36; i++) {
      options.push({ value: i, label: `${i}月龄` });
    }
    return options;
  }, []);

  // 按月分组的完整计划表
  const scheduleByMonth = useMemo(() => {
    const grouped: Record<number, VaccineSchedule[]> = {};
    VACCINE_SCHEDULES.forEach(v => {
      if (!grouped[v.month]) grouped[v.month] = [];
      grouped[v.month].push(v);
    });
    return grouped;
  }, []);

  useEffect(() => {
    // 如果有宝宝信息，默认显示当前月龄附近的疫苗
    if (babyMonthAge >= 0 && selectedMonth === 0) {
      setSelectedMonth(Math.min(babyMonthAge, 36));
    }
  }, [babyMonthAge]); // eslint-disable-line react-hooks/exhaustive-deps

  // 渲染状态标签
  const renderStatusBadge = (status: VaccineRecord['status']) => {
    switch (status) {
      case 'done':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">已接种 ✅</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">已过期 ❌</span>;
      default:
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">待接种 ⏳</span>;
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-soft-blue to-light-blue px-6 py-8 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">💉 疫苗接种日历</h1>
        <p className="text-sm opacity-90">
          {baby ? `👶 ${baby.name} · 当前 ${babyMonthAge >= 0 ? babyMonthAge : '?'} 月龄` : '请先添加宝宝信息'}
        </p>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.done}</p>
            <p className="text-xs opacity-80">已接种</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs opacity-80">待接种</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.rate}%</p>
            <p className="text-xs opacity-80">接种率</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 月龄选择器 */}
        <div className="card p-4">
          <label className="block text-sm font-semibold text-text-secondary mb-3">📅 选择查看月龄</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {monthOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedMonth(opt.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedMonth === opt.value
                    ? 'bg-ice-blue text-white shadow-md'
                    : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 疫苗列表 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            📋 {selectedMonth === -1 ? '全部疫苗' : `${selectedMonth}月龄`} 接种计划
            <span className="text-sm font-normal text-text-light">({vaccinesAtSelectedMonth.length} 针)</span>
          </h2>

          {(selectedMonth === -1 ? VACCINE_SCHEDULES : vaccinesAtSelectedMonth).length > 0 ? (
            (selectedMonth === -1 ? VACCINE_SCHEDULES : vaccinesAtSelectedMonth).map(vaccine => {
              const status = getVaccineStatus(vaccine);
              const isDone = status === 'done';

              return (
                <div
                  key={vaccine.id}
                  onClick={() => setShowDetail(vaccine)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                    isDone
                      ? 'bg-green-50 border-2 border-green-200'
                      : status === 'overdue'
                        ? 'bg-gray-50 border-2 border-gray-200'
                        : 'bg-white border-2 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary">{vaccine.name}</h3>
                        <span className="text-xs text-text-light bg-cream px-2 py-0.5 rounded">{vaccine.abbr}</span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        📅 {vaccine.month}月龄 · 第{vaccine.dose}针 / 共{vaccine.totalDoses}针
                      </p>
                      <p className="text-xs text-text-light mt-1">
                        预防：{vaccine.preventDiseases.join('、')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {renderStatusBadge(status)}
                      {!isDone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmVaccine(vaccine);
                          }}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors active:scale-95"
                        >
                          ✓ 标记已接种
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 card">
              <p className="text-5xl mb-3">💉</p>
              <p className="text-text-secondary font-medium">该月龄无需接种疫苗</p>
              <p className="text-xs text-text-light mt-1">太棒了！这个月可以轻松一下~</p>
            </div>
          )}
        </div>

        {/* 完整计划表折叠面板 */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowPlan(!showPlan)}
            className="w-full p-4 flex items-center justify-between hover:bg-cream transition-colors"
          >
            <span className="font-semibold text-text-primary">📖 完整疫苗接种计划表 (0-36月)</span>
            <span className={`transform transition-transform ${showPlan ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showPlan && (
            <div className="px-4 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {Object.entries(scheduleByMonth).sort(([a], [b]) => Number(a) - Number(b)).map(([month, vaccines]) => (
                <div key={month}>
                  <h4 className="text-sm font-semibold text-ice-blue mb-2 sticky top-0 bg-white py-1">
                    📅 {month === '0' ? '出生' : `${month}月龄`}
                  </h4>
                  <div className="space-y-2 pl-2">
                    {vaccines.map(v => {
                      const s = getVaccineStatus(v);
                      return (
                        <div key={v.id} className="flex items-center justify-between py-2 border-b border-dashed border-cream last:border-0">
                          <div>
                            <span className="text-sm font-medium text-text-primary">{v.name}</span>
                            <span className="text-xs text-text-light ml-2">第{v.dose}针</span>
                          </div>
                          {renderStatusBadge(s)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 疫苗详情弹窗 */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(null)}>
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto animate-fadeInUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{showDetail.name}</h2>
                  <p className="text-sm text-text-light mt-1">{showDetail.abbr} · 第{showDetail.dose}针</p>
                </div>
                <button onClick={() => setShowDetail(null)} className="text-2xl text-text-light hover:text-red-400">×</button>
              </div>

              <div className="space-y-3">
                <div className="bg-cream rounded-xl p-3">
                  <p className="text-sm font-semibold text-text-secondary mb-1">🛡️ 预防疾病</p>
                  <p className="text-sm text-text-primary">{showDetail.preventDiseases.join('、')}</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-sm font-semibold text-blue-700 mb-1">⚠️ 注意事项</p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    {showDetail.precautions.map((p, i) => <li key={i}>• {p}</li>)}
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-sm font-semibold text-yellow-700 mb-1">💊 可能不良反应</p>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    {showDetail.sideEffects.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>

                {showDetail.nextDoseMonth && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-green-700 mb-1">📅 下次接种时间</p>
                    <p className="text-sm text-green-600">{showDetail.nextDoseMonth}月龄</p>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-xs text-text-light text-center">
                    💡 以上信息仅供参考，具体以当地疾控中心通知为准
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (getVaccineStatus(showDetail) !== 'done') {
                    setConfirmVaccine(showDetail);
                    setShowDetail(null);
                  } else {
                    toast.success('该疫苗已标记为已接种！');
                  }
                }}
                className={`w-full py-3 rounded-xl font-medium transition-all active:scale-[0.98] ${
                  getVaccineStatus(showDetail) === 'done'
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {getVaccineStatus(showDetail) === 'done' ? '✓ 已完成接种' : '✓ 标记为已接种'}
              </button>
            </div>
          </div>
        </div>
      )}

      /* 确认弹窗 */
      {confirmVaccine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmVaccine(null)}>
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 animate-fadeInUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="text-5xl">💉</div>
              <h3 className="text-lg font-bold text-text-primary">确认接种记录？</h3>
              <p className="text-sm text-text-secondary">
                将 <strong>{confirmVaccine.name}</strong> 第{confirmVaccine.dose}针<br />
                标记为<span className="text-green-600 font-semibold"> 已接种</span>
              </p>
              <p className="text-xs text-text-light">
                接种日期：{new Date().toLocaleDateString('zh-CN')}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmVaccine(null)}
                  className="flex-1 py-3 bg-gray-100 text-text-secondary rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => markAsDone(confirmVaccine)}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all active:scale-[0.98]"
                >
                  确认已接种
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VaccinePage;
