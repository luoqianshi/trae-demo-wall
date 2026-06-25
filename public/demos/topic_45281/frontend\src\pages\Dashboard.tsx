import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Bed,
  ClipboardCheck,
  Clock,
  DollarSign,
  Pill,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  registrationService,
  patientService,
  doctorService,
  prescriptionService,
  drugService,
  chargeService,
} from "@/lib/services";
import type { Registration, Drug, Charge } from "@/lib/types";
import { useTheme } from "@/contexts/ThemeContext";
import { AnimatedNumber } from "@/components/ui/AnimatedComponents";
import { FullPageLoader } from "@/components/ui/LoadingSkeleton";
import { MotionCard } from "@/components/ui/motion";

interface DeptStats {
  dept: string;
  total: number;
  seen: number;
  waiting: number;
}

interface RevenueDay {
  day: string;
  revenue: number;
  count: number;
}

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const isCinnamoroll = theme === "cinnamoroll";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRegistrations: 0,
    waitingPatients: 0,
    todayRevenue: 0,
    pendingPrescriptions: 0,
  });
  const [deptStats, setDeptStats] = useState<DeptStats[]>([]);
  const [lowStockDrugs, setLowStockDrugs] = useState<Drug[]>([]);
  const [dailyData, setDailyData] = useState<RevenueDay[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("zh-CN", { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [registrations, patients, doctors, prescriptions, drugs, charges] = await Promise.all([
        registrationService.getAll(),
        patientService.getAll(),
        doctorService.getAll(),
        prescriptionService.getAll(),
        drugService.getAll(),
        chargeService.getAll(),
      ]);

      const todayStr = new Date().toISOString().split("T")[0];
      const todayRegs = registrations.filter((r: Registration) => r.createTime?.startsWith(todayStr));
      const waitingRegs = registrations.filter((r: Registration) => r.regStatus === "waiting");
      const todayCharges = charges.filter((c: Charge) => c.createTime?.startsWith(todayStr));
      const revenue = todayCharges.reduce((sum: number, c: Charge) => sum + (c.totalFee || 0), 0);
      const pendingPres = prescriptions.filter((p: any) => p.status === "pending" || p.status === "paid");

      setStats({
        todayRegistrations: todayRegs.length,
        waitingPatients: waitingRegs.length,
        todayRevenue: revenue,
        pendingPrescriptions: pendingPres.length,
      });

      const revData: RevenueDay[] = [];
      const today = new Date();
      const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayRegs = registrations.filter((r: Registration) => r.createTime?.startsWith(dateStr));
        const dayCharges = charges.filter((c: Charge) => c.createTime?.startsWith(dateStr));
        const dayRevenue = dayCharges.reduce((sum: number, c: Charge) => sum + (c.totalFee || 0), 0);
        revData.push({
          day: i === 0 ? "今天" : dayNames[d.getDay()],
          revenue: dayRevenue,
          count: dayRegs.length,
        });
      }
      setDailyData(revData);

      const deptMap = new Map<string, DeptStats>();
      doctors.forEach((d: any) => {
        if (!deptMap.has(d.dept)) {
          deptMap.set(d.dept, { dept: d.dept, total: 0, seen: 0, waiting: 0 });
        }
      });
      todayRegs.forEach((reg: Registration) => {
        const ds = deptMap.get(reg.dept);
        if (ds) {
          ds.total++;
          if (reg.regStatus === "completed") ds.seen++;
          else if (reg.regStatus === "waiting") ds.waiting++;
        }
      });
      setDeptStats(Array.from(deptMap.values()).filter((d) => d.total > 0));
      setLowStockDrugs(drugs.filter((d: Drug) => d.stock <= d.stockWarn));
      setRecentRegistrations(
        registrations
          .filter((r: Registration) => r.regStatus === "waiting" || r.regStatus === "in_progress")
          .slice(0, 6)
      );
    } catch (error) {
      console.error("加载仪表盘数据失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const primaryStroke = isCinnamoroll ? "#4a9fc7" : "#e91e63";
  const secondaryStroke = isCinnamoroll ? "#7ec8e3" : "#ff69b4";
  const chartGrid = isCinnamoroll ? "#dbeafe" : "#f8bbd0";
  const pieColors = isCinnamoroll
    ? ["#4a9fc7", "#7ec8e3", "#3b82f6", "#14b8a6", "#60a5fa", "#38bdf8"]
    : ["#e91e63", "#ff69b4", "#d81b60", "#14b8a6", "#f59e0b", "#ef4444"];
  const pieData = deptStats.map((d) => ({ name: d.dept, value: d.total }));

  if (loading) {
    return <FullPageLoader message="正在加载系统总览..." />;
  }

  const statCards = [
    { icon: Users, label: "今日挂号", value: stats.todayRegistrations, suffix: "人次" },
    { icon: Clock, label: "待诊患者", value: stats.waitingPatients, suffix: "人" },
    { icon: DollarSign, label: "今日收入", value: stats.todayRevenue, prefix: "¥" },
    { icon: ClipboardCheck, label: "待处理处方", value: stats.pendingPrescriptions, suffix: "张" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">管理中枢</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            医院业务运行总览 · 实时数据监测
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-on-surface-variant font-mono">
            <div className="text-primary">{liveTime}</div>
            <div className="text-[10px] opacity-70">实时时钟</div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-success bg-success/10 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            系统运行正常
          </span>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <MotionCard
            key={card.label}
            index={i}
            className="motion-hover-lift bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-on-surface-variant font-medium">{card.label}</span>
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <card.icon className="text-primary" size={17} />
              </div>
            </div>
            <p className="text-2xl font-bold text-on-surface">
              {card.prefix}
              <AnimatedNumber
                value={card.value}
                format={card.prefix ? (n) => n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : undefined}
              />
            </p>
            {card.suffix && <p className="text-[11px] text-on-surface-variant mt-2">{card.suffix}</p>}
          </MotionCard>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MotionCard index={4} className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">患者流量趋势</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">近 7 天挂号量与收入统计</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-1">
              <Activity size={14} className="text-primary" />
              <span className="text-[11px] text-primary">本周</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryStroke} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryStroke} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={secondaryStroke} stopOpacity={0.26} />
                  <stop offset="95%" stopColor={secondaryStroke} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: primaryStroke }} />
              <YAxis tick={{ fontSize: 10, fill: primaryStroke }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={primaryStroke}
                strokeWidth={2.5}
                fill="url(#colorReg)"
                name="挂号量"
                dot={{ r: 3, fill: primaryStroke }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={secondaryStroke}
                strokeWidth={2}
                fill="url(#colorRev)"
                name="收入(元)"
                dot={{ r: 3, fill: secondaryStroke }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </MotionCard>

        <MotionCard index={5} className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-bold text-on-surface mb-3">科室就诊分布</h3>
          {pieData.length === 0 ? (
            <div className="text-center text-on-surface-variant py-12 text-xs">暂无科室数据</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                    paddingAngle={3}
                    animationBegin={0}
                    animationDuration={260}
                    animationEasing="ease-out"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} stroke="white" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-28 overflow-auto">
                {pieData.map((d, i) => (
                  <span
                    key={d.name}
                    className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 border"
                    style={{
                      background: `${pieColors[i]}18`,
                      color: pieColors[i],
                      borderColor: `${pieColors[i]}33`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pieColors[i] }} />
                    {d.name} {d.value}
                  </span>
                ))}
              </div>
            </>
          )}
        </MotionCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MotionCard index={6} className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-on-surface">实时候诊队列</h3>
            <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              实时更新
            </span>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-auto">
            {recentRegistrations.length === 0 ? (
              <div className="text-center text-on-surface-variant py-8 text-xs">暂无待诊患者</div>
            ) : (
              recentRegistrations.map((reg, i) => (
                <div
                  key={reg.id}
                  className="motion-row flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 transition-colors"
                  style={{ animationDelay: `${Math.min(i * 24, 120)}ms` }}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">{reg.patientName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">候诊</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      {reg.dept} · {reg.createTime ? new Date(reg.createTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-on-surface">{reg.doctorName || "待分配"}</div>
                    <div className="text-[10px] text-on-surface-variant">接诊医生</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </MotionCard>

        <div className="space-y-3">
          {lowStockDrugs.length > 0 && (
            <MotionCard index={7} className="bg-card rounded-xl border border-warning/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-warning flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    库存告警
                  </p>
                  <p className="text-2xl font-bold text-warning mt-1">{lowStockDrugs.length}</p>
                  <p className="text-[10px] text-on-surface-variant">种药品库存不足</p>
                </div>
                <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                  <Pill className="text-warning" size={20} />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {lowStockDrugs.slice(0, 3).map((d) => (
                  <div key={d.id} className="text-[10px] text-warning flex justify-between">
                    <span>{d.name}</span>
                    <span className="font-bold">{d.stock}/{d.stockWarn}</span>
                  </div>
                ))}
              </div>
            </MotionCard>
          )}

          <MotionCard index={8} className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-xs font-bold text-on-surface mb-3">快捷入口</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/outpatient-management", icon: UserPlus, label: "门诊挂号" },
                { href: "/doctor-workstation", icon: Stethoscope, label: "医生工作站" },
                { href: "/pharmacy-dispense", icon: Pill, label: "药房发药" },
                { href: "/inpatient-management", icon: Bed, label: "住院管理" },
              ].map((link, i) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="motion-press motion-row flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5"
                    style={{ animationDelay: `${Math.min(i * 24, 120)}ms` }}
                  >
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Icon className="text-primary" size={18} />
                    </div>
                    <span className="text-[11px] font-medium text-on-surface">{link.label}</span>
                  </a>
                );
              })}
            </div>
          </MotionCard>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
