import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Bell, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { familyMembers, todayReminders } from "@/data/mock";

export default function MemberDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const memberId = parseInt(id || "1");
  const member = familyMembers.find((m) => m.id === memberId) || familyMembers[0];

  const memberReminders = todayReminders.filter((r) => r.owner === member.name);
  const takenCount = memberReminders.filter((r) => r.status === "taken").length;
  const adherenceRate = memberReminders.length > 0
    ? Math.round((takenCount / memberReminders.length) * 100)
    : 100;

  // 本周数据（模拟）
  const weeklyData = [
    { day: "一", rate: 100, taken: 5, total: 5 },
    { day: "二", rate: 80, taken: 4, total: 5 },
    { day: "三", rate: 100, taken: 5, total: 5 },
    { day: "四", rate: 60, taken: 3, total: 5 },
    { day: "五", rate: 100, taken: 5, total: 5 },
    { day: "六", rate: 80, taken: 4, total: 5 },
    { day: "今", rate: adherenceRate, taken: takenCount, total: memberReminders.length },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/family")} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-bold font-serif">成员详情</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
            {member.avatar}
          </div>
          <div>
            <h2 className="text-white text-xl font-bold font-serif">{member.name}</h2>
            <p className="text-white/70 text-sm">{member.role}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-2 h-2 rounded-full ${member.status === "online" ? "bg-mint" : "bg-gray-400"}`} />
              <span className="text-white/70 text-xs">{member.status === "online" ? "在线" : "离线"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 今日概览 */}
      <div className="px-5 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 card-shadow text-center">
            <p className="text-2xl font-bold text-teal font-serif">{memberReminders.length}</p>
            <p className="text-xs text-ink-light mt-0.5">今日提醒</p>
          </div>
          <div className="bg-white rounded-2xl p-4 card-shadow text-center">
            <p className="text-2xl font-bold text-mint font-serif">{takenCount}</p>
            <p className="text-xs text-ink-light mt-0.5">已服药</p>
          </div>
          <div className="bg-white rounded-2xl p-4 card-shadow text-center">
            <p className="text-2xl font-bold text-warn font-serif">{member.missedCount}</p>
            <p className="text-xs text-ink-light mt-0.5">漏服次数</p>
          </div>
        </div>
      </div>

      {/* 今日用药时间轴 */}
      <div className="px-5 mt-6">
        <h3 className="font-serif font-bold text-ink mb-3">今日用药</h3>
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
          {memberReminders.length === 0 ? (
            <p className="text-center text-sm text-ink-light py-4">今日无用药提醒</p>
          ) : (
            memberReminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    r.status === "taken" ? "bg-mint text-white" : "bg-cream text-teal"
                  }`}
                >
                  {r.status === "taken" ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${r.status === "taken" ? "text-ink-light line-through" : "text-ink"}`}>
                    {r.medicineName}
                  </p>
                  <p className="text-xs text-ink-light">{r.dosage}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">{r.time}</p>
                  <p className={`text-[10px] ${r.status === "taken" ? "text-mint" : "text-warn"}`}>
                    {r.status === "taken" ? "已服" : "待服"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 本周用药报告 */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-ink">本周用药报告</h3>
          <TrendingUp size={18} className="text-teal" />
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((d) => (
              <div key={d.day} className="text-center">
                <div className="text-xs text-ink-light mb-1">{d.day}</div>
                <div className="h-20 bg-cream rounded-lg flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-lg transition-all ${
                      d.rate >= 80 ? "bg-mint" : d.rate >= 50 ? "bg-warn" : "bg-danger"
                    }`}
                    style={{ height: `${d.rate}%` }}
                  />
                </div>
                <div className="text-[10px] text-ink-light mt-1">{d.rate}%</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ink-light">本周依从性</p>
              <p className="text-lg font-bold text-teal font-serif">
                {Math.round(weeklyData.reduce((sum, d) => sum + d.rate, 0) / 7)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-light">漏服次数</p>
              <p className="text-lg font-bold text-warn font-serif">2 次</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近事件 */}
      <div className="px-5 mt-6">
        <h3 className="font-serif font-bold text-ink mb-3">最近事件</h3>
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
          <EventItem type="success" time="09:02" title="已服药" desc="阿司匹林肠溶片 1片" />
          <EventItem type="success" time="08:05" title="已服药" desc="苯磺酸氨氯地平片 1片" />
          {member.missedCount > 0 && (
            <EventItem type="warning" time="昨天 21:15" title="漏服提醒" desc="阿托伐他汀钙片 · 已通知家属" />
          )}
        </div>
      </div>

      {/* 监护设置 */}
      <div className="px-5 mt-6">
        <div className="bg-teal-pale rounded-2xl p-4 flex items-center gap-3">
          <Bell size={20} className="text-teal flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-teal">异常通知已开启</p>
            <p className="text-xs text-ink-mid mt-0.5">漏服/误服风险将即时推送给您</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventItem({
  type,
  time,
  title,
  desc,
}: {
  type: "success" | "warning" | "danger";
  time: string;
  title: string;
  desc: string;
}) {
  const config = {
    success: { dot: "bg-mint" },
    warning: { dot: "bg-warn" },
    danger: { dot: "bg-danger" },
  };
  const c = config[type];

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">{title}</p>
          <span className="text-xs text-ink-light">{time}</span>
        </div>
        <p className="text-xs text-ink-light mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
