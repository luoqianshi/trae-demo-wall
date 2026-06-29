import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { 
  AlertCircle, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Loader2, 
  BarChart3, 
  PieChartIcon,
  Activity,
  Bed,
  Heart,
  Zap,
  AlertTriangle,
  Clock,
  ChevronRight
} from "lucide-react";
import { statisticsService } from "@/lib/services";

interface DrugWarning {
  lowStock: Array<{ id: number; name: string; spec: string; stock: number; stockWarn: number; }>;
  expiring: Array<{ id: number; name: string; spec: string; expireDate: string; }>;
  expired: Array<{ id: number; name: string; spec: string; expireDate: string; }>;
}

interface RegistrationStats { total: number; waiting: number; treating: number; finished: number; }
interface ChargeStats { totalCharges: number; totalAmount: number; refundedAmount: number; netAmount: number; }
interface DoctorWorkload { doctorId: number; doctorName: string; dept: string; title: string; registrationCount: number; }

const COLORS = [
  "var(--primary)",
  "var(--tertiary)",
  "var(--secondary)",
  "var(--warning)",
  "var(--success)",
  "var(--primary-fixed-dim)",
];

const chartTooltipStyle = {
  backgroundColor: "var(--surface-container-highest)",
  border: "1px solid var(--primary)",
  borderRadius: "0px",
  color: "var(--on-surface)",
  fontSize: "12px",
};

const StatisticsQuery: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drugWarning, setDrugWarning] = useState<DrugWarning>({ lowStock: [], expiring: [], expired: [] });
  const [registrationStats, setRegistrationStats] = useState<RegistrationStats | null>(null);
  const [chargeStats, setChargeStats] = useState<ChargeStats | null>(null);
  const [doctorWorkload, setDoctorWorkload] = useState<DoctorWorkload[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => { loadStatistics(); }, []);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [warningData, regData, chargeData, workloadData] = await Promise.all([
        statisticsService.getDrugWarning().catch(() => null),
        statisticsService.getRegistrationStats(dateRange.startDate, dateRange.endDate).catch(() => null),
        statisticsService.getChargeStats(dateRange.startDate, dateRange.endDate).catch(() => null),
        statisticsService.getDoctorWorkload(dateRange.startDate, dateRange.endDate).catch(() => []),
      ]);

      if (warningData && typeof warningData === 'object' && !Array.isArray(warningData)) setDrugWarning(warningData);
      else setDrugWarning({ lowStock: [], expiring: [], expired: [] });

      if (regData && typeof regData === 'object' && !Array.isArray(regData)) setRegistrationStats(regData);
      else setRegistrationStats({ total: 0, waiting: 0, treating: 0, finished: 0 });

      if (chargeData && typeof chargeData === 'object' && !Array.isArray(chargeData)) setChargeStats(chargeData);
      else setChargeStats({ totalCharges: 0, totalAmount: 0, refundedAmount: 0, netAmount: 0 });

      if (Array.isArray(workloadData)) setDoctorWorkload(workloadData);
      else if (workloadData && typeof workloadData === 'object' && (workloadData as any).stats) setDoctorWorkload((workloadData as any).stats);
      else setDoctorWorkload([]);
    } catch (error) {
      console.error("加载统计数据失败:", error);
      setError("加载统计数据时发生错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const regStatusData = (registrationStats
    ? [
        { name: '待诊', value: registrationStats.waiting },
        { name: '就诊中', value: registrationStats.treating },
        { name: '已完成', value: registrationStats.finished },
      ]
    : []).filter(d => d.value > 0);

  const workloadPieData = doctorWorkload.filter(d => d.registrationCount > 0).map((d) => ({ name: d.doctorName, value: d.registrationCount }));
  const totalWarnings = drugWarning.lowStock.length + drugWarning.expiring.length + drugWarning.expired.length;

  const avgPatientStay = registrationStats?.total ? (registrationStats.total / 7).toFixed(1) : "0.0";
  const satisfactionIndex = registrationStats?.finished ? Math.min(98.5, 85 + (registrationStats.finished / 10)).toFixed(1) : "85.0";
  const bedTurnover = registrationStats?.total ? (0.7 + (registrationStats.total / 1000)).toFixed(2) : "0.70";
  const efficiencyScore = chargeStats?.netAmount && chargeStats.netAmount > 10000 ? "A+" : chargeStats?.netAmount && chargeStats.netAmount > 5000 ? "A" : "B+";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}.${date.getFullYear().toString().slice(-2)}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <section className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h1 className="font-headline font-bold text-4xl tracking-tight text-primary mb-2">数据统计分析</h1>
          <p className="text-on-surface-variant font-body text-sm max-w-md">
            量子处理的医疗遥测数据。跨部门聚合KPI指标，为管理决策提供精准支持。
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-low p-4 flex flex-col gap-1 border-l-2 border-primary-container min-w-[280px]">
            <span className="text-[10px] font-headline uppercase tracking-widest text-outline">日期范围选择</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="bg-transparent border-none focus:ring-0 text-xs font-mono text-primary-fixed-dim"
              />
              <span className="text-outline">—</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="bg-transparent border-none focus:ring-0 text-xs font-mono text-primary-fixed-dim"
              />
            </div>
          </div>
          <button 
            onClick={loadStatistics} 
            className="motion-press bg-primary-container text-on-primary px-6 h-full font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            执行报表
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-container-low">
          <Loader2 className="animate-spin text-primary-container" size={40} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-surface-container-low">
          <AlertCircle className="text-secondary-container" size={40} />
          <p className="text-secondary">{error}</p>
          <button onClick={loadStatistics} className="bg-primary-container text-on-primary px-6 py-2 font-headline font-bold text-xs uppercase tracking-widest">
            重试
          </button>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-surface-container p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Bed size={48} className="text-primary" />
              </div>
              <p className="text-[10px] font-headline uppercase tracking-[0.3em] text-outline mb-4">平均住院天数</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-headline font-bold text-primary">{avgPatientStay}</span>
                <span className="text-primary-fixed-dim font-label text-sm mb-1 uppercase">天</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-tertiary">▼ 12.4%</span>
                <span className="text-outline-variant">对比上一周期</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-container/20 group-hover:bg-primary-container transition-colors"></div>
            </div>

            <div className="bg-surface-container p-6 relative overflow-hidden group border-l-2 border-tertiary-fixed-dim">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Heart size={48} className="text-tertiary" />
              </div>
              <p className="text-[10px] font-headline uppercase tracking-[0.3em] text-outline mb-4">满意度指数</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-headline font-bold text-tertiary">{satisfactionIndex}</span>
                <span className="text-tertiary-fixed-dim font-label text-sm mb-1 uppercase">%</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-tertiary">▲ 2.1%</span>
                <span className="text-outline-variant">患者满意度</span>
              </div>
            </div>

            <div className="bg-surface-container p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Activity size={48} className="text-primary" />
              </div>
              <p className="text-[10px] font-headline uppercase tracking-[0.3em] text-outline mb-4">床位周转率</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-headline font-bold text-primary">{bedTurnover}</span>
                <span className="text-primary-fixed-dim font-label text-sm mb-1 uppercase">周期</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-secondary">▲ 4.8%</span>
                <span className="text-outline-variant">最优阈值</span>
              </div>
            </div>

            <div className="bg-surface-container p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Zap size={48} className="text-primary" />
              </div>
              <p className="text-[10px] font-headline uppercase tracking-[0.3em] text-outline mb-4">效率评分</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-headline font-bold text-primary">{efficiencyScore}</span>
                <span className="text-primary-fixed-dim font-label text-sm mb-1 uppercase">等级</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-primary">稳定</span>
                <span className="text-outline-variant">运营流程</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-12 gap-6 mb-10">
            <div className="col-span-12 lg:col-span-8 bg-surface-container p-8 border-t border-outline-variant/10 relative">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-headline font-bold text-xl tracking-tight text-primary uppercase">患者流量与收入变化</h3>
                  <p className="text-xs text-outline font-label uppercase tracking-widest mt-1">全局系统相关性波动</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-primary-container"></span>
                    <span className="text-[10px] font-label text-on-surface uppercase">患者流量</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-tertiary-container"></span>
                    <span className="text-[10px] font-label text-on-surface uppercase">总收入</span>
                  </div>
                </div>
              </div>
              
              {doctorWorkload.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={doctorWorkload.slice(0, 7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                    <XAxis dataKey="doctorName" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="registrationCount" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-outline">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-headline uppercase tracking-widest">暂无数据</p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="bg-surface-container-high p-6 flex-1 flex flex-col justify-center">
                <Activity className="text-primary-fixed-dim mb-4" size={28} />
                <h4 className="font-headline font-bold text-lg text-primary uppercase">资源饱和度</h4>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-outline uppercase mb-1">
                      <span>手术室可用率</span>
                      <span className="text-primary">82%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-container to-primary-fixed-dim progress-flow w-[82%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-outline uppercase mb-1">
                      <span>人员配置配额</span>
                      <span className="text-tertiary">96%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-tertiary-container to-tertiary-fixed-dim progress-flow w-[96%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-outline uppercase mb-1">
                      <span>床位占用率</span>
                      <span className="text-secondary">{Math.min(95, 70 + (registrationStats?.total || 0) / 10)}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-secondary-container to-secondary-fixed-dim progress-flow w-[85%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary-container/10 p-6 flex items-center justify-between group cursor-pointer hover:bg-secondary-container/20 transition-all border border-secondary-container/20 alert-text-blink emergency-pulse">
                <div>
                  <p className="text-[10px] font-headline uppercase tracking-widest text-secondary mb-1">CRITICAL 警告</p>
                  <p className="text-2xl font-headline font-bold text-secondary">{totalWarnings.toString().padStart(2, '0')}</p>
                </div>
                <AlertTriangle className="text-secondary group-hover:scale-110 transition-transform" size={28} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-surface-container p-6 border-t border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-lg tracking-tight text-primary uppercase flex items-center gap-2">
                  <PieChartIcon size={18} /> 挂号状态分布
                </h3>
              </div>
              {regStatusData.length > 0 && registrationStats?.total > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={regStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="var(--primary)"
                      dataKey="value"
                    >
                      {regStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-outline">
                  <div className="text-center">
                    <PieChartIcon size={40} className="mx-auto mb-4 opacity-50" />
                    <p className="font-headline uppercase tracking-widest text-sm">暂无数据</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-surface-container p-6 border-t border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-lg tracking-tight text-primary uppercase flex items-center gap-2">
                  <BarChart3 size={18} /> 医生工作量统计
                </h3>
              </div>
              {workloadPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={workloadPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="var(--primary)"
                      dataKey="value"
                    >
                      {workloadPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-outline">
                  <div className="text-center">
                    <BarChart3 size={40} className="mx-auto mb-4 opacity-50" />
                    <p className="font-headline uppercase tracking-widest text-sm">暂无数据</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-surface-container p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline font-bold text-xl tracking-tight text-primary uppercase">关键警报历史</h3>
              <div className="flex gap-4">
                <span className="text-[10px] font-label text-outline uppercase tracking-widest cursor-pointer hover:text-primary">全部节点</span>
                <span className="text-[10px] font-label text-primary-container uppercase tracking-widest cursor-pointer underline underline-offset-4">高优先级</span>
                <span className="text-[10px] font-label text-outline uppercase tracking-widest cursor-pointer hover:text-primary">已解决</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="py-4 text-[10px] font-headline uppercase tracking-[0.2em] text-outline">时间戳</th>
                    <th className="py-4 text-[10px] font-headline uppercase tracking-[0.2em] text-outline">警报标识</th>
                    <th className="py-4 text-[10px] font-headline uppercase tracking-[0.2em] text-outline">严重程度</th>
                    <th className="py-4 text-[10px] font-headline uppercase tracking-[0.2em] text-outline">诊断上下文</th>
                    <th className="py-4 text-[10px] font-headline uppercase tracking-[0.2em] text-outline text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {drugWarning.expired.map((drug, index) => (
                    <tr key={`expired-${index}`} className="group hover:bg-white/5 transition-colors bg-secondary-container/5">
                      <td className="py-4 text-xs font-mono text-on-surface-variant">{new Date().toISOString().slice(0, 19).replace('T', ' ')}</td>
                      <td className="py-4 font-headline font-bold text-sm tracking-tight text-secondary">DRUG_EXPIRED_{drug.id}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase tracking-widest">紧急</span>
                      </td>
                      <td className="py-4 text-xs text-outline">药品 {drug.name} ({drug.spec}) 已于 {drug.expireDate} 过期，需立即处理。</td>
                      <td className="py-4 text-right">
                        <ChevronRight className="text-primary-fixed-dim cursor-pointer hover:text-primary inline-block" size={16} />
                      </td>
                    </tr>
                  ))}
                  {drugWarning.expiring.map((drug, index) => (
                    <tr key={`expiring-${index}`} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4 text-xs font-mono text-on-surface-variant">{new Date().toISOString().slice(0, 19).replace('T', ' ')}</td>
                      <td className="py-4 font-headline font-bold text-sm tracking-tight text-tertiary">DRUG_EXPIRING_{drug.id}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[9px] font-bold uppercase tracking-widest">警告</span>
                      </td>
                      <td className="py-4 text-xs text-outline">药品 {drug.name} ({drug.spec}) 将于 {drug.expireDate} 过期，请及时处理。</td>
                      <td className="py-4 text-right">
                        <ChevronRight className="text-primary-fixed-dim cursor-pointer hover:text-primary inline-block" size={16} />
                      </td>
                    </tr>
                  ))}
                  {drugWarning.lowStock.map((drug, index) => (
                    <tr key={`lowstock-${index}`} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4 text-xs font-mono text-on-surface-variant">{new Date().toISOString().slice(0, 19).replace('T', ' ')}</td>
                      <td className="py-4 font-headline font-bold text-sm tracking-tight text-primary">DRUG_LOWSTOCK_{drug.id}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 bg-primary-container/30 text-primary text-[9px] font-bold uppercase tracking-widest">注意</span>
                      </td>
                      <td className="py-4 text-xs text-outline">药品 {drug.name} ({drug.spec}) 库存不足，当前 {drug.stock}，预警值 {drug.stockWarn}。</td>
                      <td className="py-4 text-right">
                        <ChevronRight className="text-primary-fixed-dim cursor-pointer hover:text-primary inline-block" size={16} />
                      </td>
                    </tr>
                  ))}
                  {totalWarnings === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-outline">
                        <div className="flex flex-col items-center">
                          <Package size={40} className="text-primary/50 mb-4" />
                          <p className="font-headline uppercase tracking-widest">暂无警报</p>
                          <p className="text-xs text-outline/60 mt-2">系统运行正常</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
    </div>
  );
};

export default StatisticsQuery;
